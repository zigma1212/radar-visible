"use client";
import Link from "next/link";
import { useState } from "react";
import { llamar } from "./api";
import { ErrorNote, SemaforoPill } from "./ui";
import { SEMAFORO_LABEL, fechaHora, n } from "./format";
import type { Semaforo } from "@/lib/tipos";

interface Cambio { cuenta_id: string; empresa: string; antes: Semaforo; despues: Semaforo }
interface Resumen {
  filas_leidas: number;
  filas_validas: number;
  invalidas: { linea: number; motivo: string }[];
  anuladas: number;
  facturas_importadas: number;
  emparejadas: { cliente_csv: string; cuenta_id: string; empresa: string; facturas: number }[];
  no_emparejadas: { cliente_csv: string; filas: number }[];
  cambios_semaforo: Cambio[];
  archivo: string;
}
export interface ImportacionActiva { importada_en: string; archivo: string; filas_leidas: number; facturas: number; cuentas: number }

export function ImportarFacturas({ activa: inicial }: { activa: ImportacionActiva | null }) {
  const [activa, setActiva] = useState<ImportacionActiva | null>(inicial);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [deshecho, setDeshecho] = useState<Cambio[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function subir(archivo: File | undefined) {
    if (!archivo) return;
    setBusy(true); setError(null); setResumen(null); setDeshecho(null);
    const csv = await archivo.text();
    const r = await llamar<Resumen>("/api/importar", { method: "POST", json: { csv, archivo: archivo.name } });
    if (r.ok) {
      setResumen(r.data);
      const est = await llamar<{ importacion: ImportacionActiva | null }>("/api/importar");
      if (est.ok) setActiva(est.data.importacion);
    } else setError(r.error);
    setBusy(false);
  }

  async function deshacer() {
    setBusy(true); setError(null); setResumen(null);
    const r = await llamar<{ deshecha: boolean; cambios_semaforo: Cambio[] }>("/api/importar", { method: "DELETE" });
    if (r.ok) { setActiva(null); setDeshecho(r.data.cambios_semaforo); } else setError(r.error);
    setBusy(false);
  }

  return (
    <div className="grid gap-4">
      {activa ? (
        <div className="card grid gap-2" role="status">
          <p className="eyebrow">Fuente real activa</p>
          <p>
            Siigo está leyendo <strong>{n(activa.facturas)} facturas</strong> de <strong>{n(activa.cuentas)} cuentas</strong> desde <em>{activa.archivo}</em> (importado {fechaHora(activa.importada_en)}). Las demás cuentas siguen simuladas.
          </p>
          <div><button className="btn btn-danger btn-sm" onClick={deshacer} disabled={busy}>Deshacer importación</button></div>
        </div>
      ) : (
        <div className="note note-info">No hay ninguna importación activa: Siigo se muestra con datos simulados.</div>
      )}

      <div className="card grid gap-3">
        <h2 className="h2">Subir facturas</h2>
        <p className="muted small">
          Un CSV exportado de tu programa contable con las columnas <code>cliente, numero, emitida, vence, valor, estado</code>. También sirven los encabezados de Siigo (Cliente, Número, Fecha, Vencimiento, Total, Estado). Los nombres de cliente se emparejan con las cuentas sin importar tildes ni mayúsculas. Si hay filas inválidas, se rechaza el archivo completo y se conservan los datos anteriores.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="btn btn-primary" style={{ cursor: busy ? "wait" : "pointer" }}>
            {busy ? <><span className="spinner" aria-hidden="true" /> Procesando…</> : "Elegir archivo CSV"}
            <input type="file" accept=".csv,text/csv" className="sr-only" disabled={busy} onChange={(e) => { subir(e.target.files?.[0]); e.target.value = ""; }} />
          </label>
          <a className="btn btn-ghost" href="/api/importar/ejemplo" download>Descargar ejemplo</a>
        </div>
        {error ? <ErrorNote>{error}</ErrorNote> : null}
      </div>

      {deshecho ? (
        <div className="note note-ok" role="status">
          Importación deshecha: Siigo vuelve a los datos simulados.{" "}
          {deshecho.length ? <>Cambios de semáforo: {deshecho.map((c) => `${c.empresa} (${SEMAFORO_LABEL[c.antes]} → ${SEMAFORO_LABEL[c.despues]})`).join("; ")}.</> : <>El semáforo de las cuentas no cambió.</>}
        </div>
      ) : null}

      {resumen ? (
        <section className="card grid gap-4 rise" aria-labelledby="res-h">
          <h2 id="res-h" className="h2">Resultado de la importación</h2>
          <dl className="grid gap-3 sm:grid-cols-4" style={{ margin: 0 }}>
            <Dato v={resumen.filas_leidas} l="filas leídas" />
            <Dato v={resumen.emparejadas.length} l="clientes emparejados" />
            <Dato v={resumen.no_emparejadas.length} l="sin emparejar" />
            <Dato v={resumen.cambios_semaforo.length} l="cambios de semáforo" />
          </dl>

          <div>
            <p className="eyebrow">Cambios de semáforo</p>
            {resumen.cambios_semaforo.length ? (
              <ul className="grid gap-2" style={{ listStyle: "none", padding: 0, margin: "8px 0 0" }}>
                {resumen.cambios_semaforo.map((c) => (
                  <li key={c.cuenta_id} className="flex flex-wrap items-center gap-2">
                    <Link className="chip" href={`/cuentas/${c.cuenta_id}`}>{c.empresa} →</Link>
                    <SemaforoPill s={c.antes} /> <span aria-hidden="true">→</span> <SemaforoPill s={c.despues} />
                  </li>
                ))}
              </ul>
            ) : <p className="muted small">Ninguna cuenta cambió de color.</p>}
          </div>

          <div>
            <p className="eyebrow">Cuentas emparejadas</p>
            <ul className="grid gap-1 small" style={{ paddingLeft: 18, margin: "8px 0 0" }}>
              {resumen.emparejadas.map((e) => <li key={e.cliente_csv}>«{e.cliente_csv}» → <strong>{e.empresa}</strong> ({n(e.facturas)} {e.facturas === 1 ? "factura" : "facturas"})</li>)}
            </ul>
          </div>

          {resumen.no_emparejadas.length ? (
            <div className="note note-info">
              <strong>No emparejadas (se ignoraron):</strong> {resumen.no_emparejadas.map((x) => `«${x.cliente_csv}» (${x.filas})`).join(", ")}. Revisa que el nombre se parezca al de la empresa o al del cliente en el radar.
            </div>
          ) : null}
          {resumen.invalidas.length ? (
            <div className="note note-err">
              <strong>Filas con problemas ({resumen.invalidas.length}):</strong> {resumen.invalidas.slice(0, 5).map((x) => `línea ${x.linea}: ${x.motivo}`).join("; ")}
            </div>
          ) : null}
          <p className="small muted">Fuente Siigo ahora en modo «real (CSV)». <Link href="/fuentes" style={{ textDecoration: "underline" }}>Ver Fuentes</Link> · <Link href="/cuentas" style={{ textDecoration: "underline" }}>Ver cuentas</Link></p>
        </section>
      ) : null}
    </div>
  );
}

function Dato({ v, l }: { v: number; l: string }) {
  return (
    <div className="card-flat" style={{ padding: 12 }}>
      <dd className="display tnum" style={{ fontSize: 28, margin: 0, lineHeight: 1 }}>{n(v)}</dd>
      <dt className="muted small" style={{ marginTop: 4 }}>{l}</dt>
    </div>
  );
}

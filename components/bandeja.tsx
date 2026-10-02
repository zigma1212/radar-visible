"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { llamar } from "./api";
import { ErrorNote, ModoTag } from "./ui";
import type { PersistenciaEstado } from "@/lib/estado";
import { fechaHora } from "./format";

interface Nota {
  id: string; cuenta_id: string; empresa: string; brand_manager: string; borrador: string;
  evidencia_disponible?: boolean; persistencia?: PersistenciaEstado;
  texto_final?: string | null; estado: string; modo: string; creada_en: string; actualizada_en?: string;
}
type Estado = "borrador" | "bloqueada" | "aprobada" | "descartada";
const norm = (e?: string): Estado => {
  const x = (e ?? "").toLowerCase();
  return x.startsWith("aprob") ? "aprobada" : x.startsWith("descart") ? "descartada" : x === "bloqueada" ? "bloqueada" : "borrador";
};
const ETIQUETA: Record<Estado, string> = { bloqueada: "Sin evidencia · bloqueada", borrador: "Pendiente de revisión", aprobada: "Aprobada", descartada: "Descartada" };
const CHIP: Record<Estado, string> = { bloqueada: "p-sin_lectura", borrador: "p-ambar", aprobada: "p-verde", descartada: "p-sin_lectura" };

export function Bandeja({ inicial, persistenciaInicial }: { inicial?: Nota[]; persistenciaInicial?: PersistenciaEstado }) {
  const [persistencia, setPersistencia] = useState(persistenciaInicial);
  const [notas, setNotas] = useState<Nota[] | null>(inicial ?? null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (inicial) return;
    llamar<{ notas: Nota[]; persistencia: PersistenciaEstado }>("/api/notas").then((r) => {
      if (r.ok) { setNotas(r.data.notas); setPersistencia(r.data.persistencia); } else { setError(r.error); setNotas([]); }
    });
  }, [inicial]);

  if (notas === null) return (
    <div className="grid gap-4" role="status" aria-label="Cargando la bandeja">
      <div className="card grid gap-3" aria-hidden="true">
        <div className="skeleton" style={{ height: 22, width: "40%" }} />
        <div className="skeleton" style={{ height: 150 }} />
        <div className="skeleton" style={{ height: 38, width: "50%" }} />
      </div>
    </div>
  );

  const visibles = [...notas].sort((a, b) => (norm(a.estado) === "borrador" ? 0 : 1) - (norm(b.estado) === "borrador" ? 0 : 1) || b.creada_en.localeCompare(a.creada_en));

  return (
    <div className="grid gap-4">
      {persistencia !== "archivo" ? <div className="note note-info" role="status">Almacenamiento {persistencia === "memoria" ? "solo en memoria" : "temporal"}: las notas y su auditoría pueden perderse al reiniciar. Copia lo necesario; esta demo no garantiza historial duradero.</div> : null}
      {error ? <ErrorNote>{error}</ErrorNote> : null}
      {!error && visibles.length === 0 ? (
        <div className="card empty">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--purple-2)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 13l3-8h12l3 8v6H3zM3 13h5l1 3h6l1-3h5" /></svg>
          <h2 className="h2">No hay notas por revisar</h2>
          <p className="muted" style={{ maxWidth: 380 }}>Las notas de avance nacen en una cuenta. Empieza por una que sea prioridad esta semana y genera el borrador desde su ficha.</p>
          <Link href="/cuentas?f=rojas" className="btn btn-primary">Ver cuentas prioritarias</Link>
        </div>
      ) : null}
      {visibles.map((n) => (
        <NotaCard key={n.id} nota={n} temporal={persistencia !== "archivo"} onCambio={(u) => { if (u.persistencia) setPersistencia(u.persistencia); setNotas((p) => (p ?? []).map((x) => (x.id === u.id ? u : x))); }} />
      ))}
    </div>
  );
}

function NotaCard({ nota, onCambio, temporal }: { nota: Nota; onCambio: (n: Nota) => void; temporal: boolean }) {
  const original = norm(nota.estado);
  const estado = original === "borrador" && nota.evidencia_disponible !== true ? "bloqueada" : original;
  const [texto, setTexto] = useState(nota.texto_final || nota.borrador);
  const [busy, setBusy] = useState<"aprobar" | "descartar" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const editado = texto !== nota.borrador;

  async function accion(a: "aprobar" | "descartar") {
    setBusy(a); setError(null);
    const r = await llamar<Partial<Nota> & { nota?: Partial<Nota> }>(`/api/notas/${nota.id}`, { method: "PATCH", json: a === "aprobar" ? { accion: a, texto } : { accion: a } });
    if (r.ok) {
      const u = r.data.nota ?? r.data;
      onCambio({ ...nota, ...u, estado: u.estado ?? (a === "aprobar" ? "aprobada" : "descartada"), texto_final: a === "aprobar" ? (u.texto_final ?? texto) : nota.texto_final });
    } else setError(r.error);
    setBusy(null);
  }

  async function copiar() {
    try { await navigator.clipboard.writeText(texto); setCopiado(true); setTimeout(() => setCopiado(false), 2500); }
    catch { setError("No pudimos copiar automáticamente. Selecciona el texto y cópialo a mano."); }
  }

  return (
    <article className="card grid gap-3" style={estado === "descartada" ? { opacity: 0.7 } : undefined}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="h2"><Link href={`/cuentas/${nota.cuenta_id}`} style={{ textDecoration: "underline", textDecorationColor: "var(--line)", textUnderlineOffset: 4 }}>{nota.empresa}</Link></h2>
          <p className="small muted">Para revisar: {nota.brand_manager} · creada {fechaHora(nota.creada_en)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ModoTag modo={nota.modo} />
          <span className={`pill ${CHIP[estado]}`}><i aria-hidden="true" />{ETIQUETA[estado]}</span>
        </div>
      </div>

      <label className="grid gap-1">
        <span className="eyebrow">Nota de avance para el cliente {editado && estado === "borrador" ? "· editada" : ""}</span>
        <textarea className="field" value={texto} onChange={(e) => setTexto(e.target.value)} readOnly={estado !== "borrador"} rows={9} />
      </label>

      {error ? <ErrorNote>{error}</ErrorNote> : null}

      {estado === "borrador" ? <p className="small muted">Los cambios solo se guardan al aprobar. Copia el borrador si necesitas salir sin aprobarlo.</p> : null}

      {estado === "bloqueada" ? <div className="note note-err" role="status">No se puede aprobar esta nota: falta evidencia verificada. Revisa los datos y genera una nueva desde la ficha de la cuenta.</div> : null}

      {estado === "borrador" || estado === "bloqueada" ? (
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-primary" onClick={() => accion("aprobar")} disabled={estado === "bloqueada" || busy !== null || texto.trim().length === 0}>
            {busy === "aprobar" ? <><span className="spinner" aria-hidden="true" /> Aprobando…</> : "Aprobar"}
          </button>
          <button className="btn btn-danger" onClick={() => accion("descartar")} disabled={busy !== null}>
            {busy === "descartar" ? "Descartando…" : "Descartar"}
          </button>
        </div>
      ) : null}

      {estado === "aprobada" ? (
        <div className="note note-ok grid gap-2" role="status">
          <strong>Lista para enviar al cliente</strong>
          <span>{temporal ? "La aprobó una persona y quedó registrada en esta sesión temporal. Copia la nota y su registro antes de reiniciar." : "La aprobó una persona y quedó en la auditoría local. Cópiala y envíala por el canal que use el cliente."}</span>
          <button className="btn btn-primary btn-sm" onClick={copiar} style={{ justifySelf: "start" }}>{copiado ? "Copiado" : "Copiar nota"}</button>
        </div>
      ) : null}
    </article>
  );
}

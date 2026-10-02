import Link from "next/link";
import { notFound } from "next/navigation";
import { cargarCuenta } from "@/components/datos";
import { Curva } from "@/components/curva";
import { MagnettuChart } from "@/components/magnettu-chart";
import { GenerarNota } from "@/components/generar-nota";
import { FuenteIcon, FuenteLectura, SEVERIDAD_LABEL, SemaforoPill } from "@/components/ui";
import { cop, fechaCorta, fechaLarga } from "@/components/format";
import { diasEntre } from "@/lib/fecha";
import { UMBRALES } from "@/config/umbrales";
import type { Senal } from "@/lib/tipos";

export const dynamic = "force-dynamic";

interface Evento { fecha: string; clase: string; fuente: string; titulo: string; detalle?: React.ReactNode }

const esDuda = (f: string) => UMBRALES.frases.palabrasDuda.some((p) => f.toLowerCase().includes(p));
const ZONA = { onboarding: "Onboarding", "parte plana": "Parte plana", "tracción": "Tracción" } as const;

export default async function DetalleCuenta({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await cargarCuenta(id);
  if (!d) notFound();
  const { cuenta: c, hoy, metricas, reuniones, aprobaciones, facturas, deal, leido_en } = d;

  const eventos: Evento[] = [];
  for (const a of aprobaciones.slice(0, 5)) {
    if (a.estado === "aprobado" && a.aprobado_en) eventos.push({ fecha: a.aprobado_en, clase: "t-ok", fuente: "notion", titulo: `Aprobó «${a.titulo}»` });
    else if (a.estado === "rechazado") eventos.push({ fecha: a.enviado_a_cliente, clase: "t-riesgo", fuente: "notion", titulo: `Rechazó «${a.titulo}»` });
    else eventos.push({ fecha: a.enviado_a_cliente, clase: diasEntre(a.enviado_a_cliente, hoy) > 12 ? "t-riesgo" : "", fuente: "notion", titulo: `«${a.titulo}» espera su aprobación`, detalle: `Enviado hace ${diasEntre(a.enviado_a_cliente, hoy)} días, sin respuesta.` });
  }
  for (const r of reuniones.slice(0, 3)) {
    eventos.push({
      fecha: r.fecha, clase: r.frases_clave.some(esDuda) ? "t-riesgo" : "", fuente: "circleback", titulo: `Reunión: ${r.tipo}`,
      detalle: (
        <>
          <span>{r.resumen}</span>
          <div>{r.frases_clave.map((f, i) => (esDuda(f) ? <mark key={i} className="duda frase">“{f}”</mark> : <span key={i} className="frase">“{f}”</span>))}</div>
        </>
      ),
    });
  }
  for (const f of facturas.slice(0, 3)) {
    eventos.push({
      fecha: f.vence, clase: f.estado === "vencida" ? "t-riesgo" : f.estado === "pagada" ? "t-ok" : "", fuente: "siigo",
      titulo: `Factura ${f.numero} · ${cop(f.valor_cop)} · ${f.estado}`,
      detalle: f.estado === "vencida" ? `Vencida hace ${diasEntre(f.vence, hoy)} días.` : f.estado === "pagada" ? "Pagada." : `Vence el ${fechaCorta(f.vence)}.`,
    });
  }
  if (deal) {
    const dias = diasEntre(hoy, deal.fecha_renovacion);
    eventos.push({ fecha: deal.fecha_renovacion, clase: dias < 25 ? "t-riesgo" : "", fuente: "pipedrive", titulo: `Renovación · ${deal.etapa}`, detalle: dias >= 0 ? `Faltan ${dias} días · ${cop(deal.valor_cop)}.` : `Pasó hace ${-dias} días.` });
  }
  eventos.sort((a, b) => b.fecha.localeCompare(a.fecha));

  const faltan = (["notion", "circleback", "siigo", "pipedrive"] as const).filter((k) => !leido_en[k]);
  const enPlana = c.zona === "parte plana";

  return (
    <div className="page">
      <nav aria-label="Ruta" className="small"><Link href="/cuentas" className="chip chip-line">← Cuentas</Link></nav>

      <header className={`card acc-${c.semaforo} rise`} style={{ display: "grid", gap: 8 }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow">{c.plan} · {cop(c.fee_mensual_cop)}/mes</p>
            <h1 className="h1">{c.empresa}</h1>
            <p className="muted">{c.cliente} · {c.cargo}</p>
          </div>
          <SemaforoPill s={c.semaforo} />
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="chip">Mes {c.mes_programa}</span>
          <span className={`chip ${enPlana ? "chip-lime" : ""}`}>{ZONA[c.zona]}</span>
          <span className="chip chip-line">Brand manager: {c.brand_manager.nombre}</span>
        </div>
        {c.accion ? (
          <div className="note note-info">
            <strong>{c.accion.titulo}</strong> · dueño: {c.accion.dueno_nombre}
            <div className="small" style={{ marginTop: 2 }}>{c.accion.motivo}</div>
          </div>
        ) : null}
      </header>

      <div className="grid gap-5 md:grid-cols-2 md:items-start">
        <div className="grid gap-5">
          <section className="card grid gap-2" aria-labelledby="donde">
            <h2 id="donde" className="h2">Dónde está en la curva</h2>
            <Curva puntos={[{ id: c.id, etiqueta: c.empresa, mes: c.mes_programa, semaforo: c.semaforo }]} destacado={c.id} />
            <p className="small muted">Empezó el {fechaLarga(d.empresaCliente.fecha_inicio)}. {enPlana ? "Su mes de programa cae en la parte plana de esta curva ilustrativa. Eso no demuestra falta de resultados ni dudas del cliente; revisa las señales." : "Fuera de la parte plana."}</p>
          </section>

          <section className="card" aria-labelledby="senales">
            <h2 id="senales" className="h2">Señales</h2>
            <p className="small muted">Cada una con su fuente y la fecha en que se leyó.</p>
            <div>{c.senales.map((s) => <FilaSenal key={s.id} s={s} />)}</div>
          </section>
        </div>

        <div className="grid gap-5">
          <section className="card grid gap-3" aria-labelledby="accion">
            <h2 id="accion" className="h2">Nota de avance</h2>
            <p className="muted small">La IA arma un borrador con los datos disponibles de la cuenta (simulados en esta demo). El brand manager lo edita y decide; nada se envía solo.</p>
            <GenerarNota cuentaId={c.id} empresa={c.empresa} />
          </section>

          <section className="card grid gap-3" aria-labelledby="mag">
            <h2 id="mag" className="h2">Lo que está pasando en LinkedIn</h2>
            {metricas ? (
              <>
                <MagnettuChart m={metricas} />
                <p className="small muted"><FuenteLectura fuente="magnettu" leido_en={metricas.leido_en} /></p>
              </>
            ) : (
              <div className="note" style={{ background: "var(--nolectura-bg)", color: "var(--nolectura)", border: "1.5px dashed #9a9aac" }}>
                <strong>Sin lectura de Magnettü.</strong> No tenemos publicaciones de esta cuenta, así que no mostramos ceros ni la damos por sana. Revisa el conector en <Link href="/fuentes" style={{ textDecoration: "underline" }}>Fuentes</Link>.
              </div>
            )}
          </section>

          <section className="card" aria-labelledby="tl">
            <h2 id="tl" className="h2" style={{ marginBottom: 14 }}>Movimientos y próximas fechas</h2>
            {faltan.length > 0 ? (
              <div className="note" style={{ background: "var(--nolectura-bg)", color: "var(--nolectura)", border: "1.5px dashed #9a9aac", marginBottom: 14 }}>
                Sin lectura de {faltan.join(", ")}: puede faltar historial.
              </div>
            ) : null}
            {eventos.length === 0 ? <p className="muted">Sin eventos registrados.</p> : null}
            <ol className="tl">
              {eventos.slice(0, 10).map((e, i) => (
                <li key={i} className={e.clase}>
                  <div className="small muted flex items-center gap-2"><FuenteIcon fuente={e.fuente} size={14} />{fechaCorta(e.fecha)} · {e.fuente}</div>
                  <div style={{ fontWeight: 700 }}>{e.titulo}</div>
                  {e.detalle ? <div className="small" style={{ marginTop: 2 }}>{e.detalle}</div> : null}
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}

function FilaSenal({ s }: { s: Senal }) {
  return (
    <div className={`sig sev-${s.severidad}`}>
      <div className="sig-ico"><FuenteIcon fuente={s.fuente} /></div>
      <div className="grid gap-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <strong>{s.nombre}</strong>
          <SemaforoPill s={s.severidad} texto={SEVERIDAD_LABEL[s.severidad]} />
        </div>
        <div style={{ fontSize: 14.5 }}>{s.explicacion}</div>
        <div className="meta">
          <span>Valor: <strong className="tnum">{s.valor === null ? "sin dato" : String(s.valor)}</strong></span>
          <span>Umbral: {s.umbral}</span>
        </div>
        <div className="meta"><FuenteLectura fuente={s.fuente} leido_en={s.leido_en} /></div>
      </div>
    </div>
  );
}

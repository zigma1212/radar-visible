import { cargarPanorama } from "@/components/datos";
import { BriefPanel } from "@/components/brief-panel";
import { Curva, LeyendaCurva } from "@/components/curva";
import { Calculadora } from "@/components/calculadora";
import { Kpi } from "@/components/ui";
import { cop, fechaLarga, n } from "@/components/format";
import type { Semaforo } from "@/lib/tipos";

export const dynamic = "force-dynamic";

export default async function Brief() {
  const { panorama } = await cargarPanorama();
  const { resumen: r, hoy, cuentas } = panorama;
  const conteo: Record<Semaforo, number> = { rojo: 0, ambar: 0, verde: 0, sin_lectura: 0 };
  for (const c of cuentas) conteo[c.semaforo]++;
  const fecha = fechaLarga(hoy);
  const corta = fecha.replace(/^\S+,?\s/, "");

  return (
    <div className="page">
      <section className="hero on-dark rise" aria-labelledby="saludo">
        <p className="eyebrow" style={{ color: "var(--lime)" }}>{fecha}</p>
        <h1 id="saludo" className="h1" style={{ marginTop: 6 }}>Buen lunes, Pedro</h1>
        <p style={{ marginTop: 8, maxWidth: 520, fontSize: 17 }}>
          {r.en_parte_plana} de {r.cuentas} cuentas están en la parte plana de la curva.{" "}
          {r.rojas > 0 ? <>{r.rojas} son prioridad esta semana: hay que mostrar lo acumulado.</> : <>Ninguna es prioridad esta semana.</>}{" "}
          <span style={{ color: "var(--lime)", fontWeight: 700, whiteSpace: "nowrap" }}>(datos de demostración)</span>
        </p>
      </section>

      <section className="kpis rise" aria-label="Resumen">
        <Kpi valor={n(r.en_parte_plana)} etiqueta="en la parte plana (meses 2 a 5)" clase="k-plana" sub={`de ${n(r.cuentas)} cuentas`} />
        <Kpi valor={n(r.rojas)} etiqueta="prioridad esta semana" clase="k-rojo" sub={`y ${n(r.ambar)} para mirar de cerca`} />
        <Kpi valor={n(r.sin_lectura)} etiqueta="sin lectura" clase="k-nolectura" sub="no las damos por sanas" />
        <Kpi valor={cop(r.mensualidad_en_riesgo_cop)} etiqueta="en cuentas prioritarias" clase="k-plata" sub={`+ ${cop(r.mensualidad_ambar_cop)} en cuentas para mirar de cerca`} />
      </section>

      <div className="grid gap-5 md:grid-cols-2 md:items-start">
        <section className="card grid gap-3 rise" aria-labelledby="curva-h">
          <div>
            <p className="eyebrow">La tesis, con tus cuentas</p>
            <h2 id="curva-h" className="h2">El interés compuesto a la vista</h2>
            <p className="muted small" style={{ marginTop: 4 }}>
              Cada publicación deja un rastro de confianza que ninguna métrica registra. — Pedro Mejía
            </p>
          </div>
          <Curva
            puntos={cuentas.map((c) => ({ id: c.id, etiqueta: c.empresa, mes: c.mes_programa, semaforo: c.semaforo, href: `/cuentas/${c.id}` }))}
          />
          <LeyendaCurva conteo={conteo} />
        </section>
        <BriefPanel fechaTexto={corta} />
      </div>

      <section className="card grid gap-3 rise" aria-labelledby="distinto-h">
        <h2 id="distinto-h" className="h2">Qué hace distinto a un tablero</h2>
        <ul className="grid gap-2 small" style={{ paddingLeft: 20, listStyle: "disc" }}>
          <li><strong>Propone la acción con dueño:</strong> no solo muestra números, dice quién hace qué esta semana.</li>
          <li><strong>Redacta la nota con los números del cliente:</strong> el borrador sale de sus propias métricas, y una persona lo aprueba.</li>
          <li><strong>Dice &quot;sin lectura&quot; en vez de verde:</strong> si una fuente crítica no leyó, no da la cuenta por buena.</li>
          <li><strong>Umbrales calibrables:</strong> las reglas viven en un solo archivo y se ajustan con tus cuentas.</li>
        </ul>
      </section>

      <Calculadora />
    </div>
  );
}

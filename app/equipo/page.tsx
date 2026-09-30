import Link from "next/link";
import { cargarPanorama, cargaPorBM } from "@/components/datos";
import { cop } from "@/components/format";
import { SemaforoPill } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function Equipo() {
  const { datos, panorama } = await cargarPanorama();
  const bms = cargaPorBM(datos.brand_managers, panorama.cuentas);
  const conHolgura = bms.filter((b) => b.con_holgura);
  const porId = new Map(panorama.cuentas.map((c) => [c.id, c]));

  return (
    <div className="page">
      <header>
        <p className="eyebrow">Carga del equipo</p>
        <h1 className="h1">Equipo</h1>
        <p className="muted" style={{ marginTop: 6 }}>Cuántas cuentas lleva cada brand manager frente a su capacidad, y en cuántas hay que mostrar lo acumulado esta semana.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {bms.map((b) => {
          const total = Math.max(b.capacidad_max, b.cuentas);
          const seg = (v: number) => `${(v / total) * 100}%`;
          const propias = b.cuentas_ids.map((id) => porId.get(id)).filter((c) => c && (c.semaforo === "rojo" || c.semaforo === "ambar"));
          const destino = conHolgura.find((x) => x.id !== b.id);
          return (
            <article key={b.id} className="card grid gap-3" style={b.sobrecargado ? { borderColor: "var(--rojo)", borderWidth: 2 } : undefined}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="h2">{b.nombre}</h2>
                  <p className="small muted">{b.email}</p>
                </div>
                {b.sobrecargado ? <span className="pill p-rojo"><i aria-hidden="true" />Sobrecargado</span> : b.con_holgura ? <span className="pill p-verde"><i aria-hidden="true" />Con holgura</span> : null}
              </div>

              <div>
                <div className="flex items-baseline justify-between">
                  <span><strong className="display tnum" style={{ fontSize: 28 }}>{b.cuentas}</strong> <span className="muted">cuentas (puede llevar {b.capacidad_max})</span></span>
                  <span className="small muted tnum">{Math.round((b.cuentas / b.capacidad_max) * 100)} % de su capacidad</span>
                </div>
                <div className="bar" style={{ marginTop: 8, position: "relative" }} role="img" aria-label={`${b.rojas} prioridad esta semana, ${b.ambar} para mirar de cerca, ${b.sin_lectura} sin lectura, ${b.verdes} avanzando, de una capacidad de ${b.capacidad_max}`}>
                  <span style={{ width: seg(b.rojas), background: "var(--rojo)" }} />
                  <span style={{ width: seg(b.ambar), background: "var(--ambar-fill)" }} />
                  <span style={{ width: seg(b.sin_lectura), background: "repeating-linear-gradient(45deg,#9a9aac,#9a9aac 3px,#ecebf0 3px,#ecebf0 6px)" }} />
                  <span style={{ width: seg(b.verdes), background: "var(--verde)" }} />
                </div>
                {b.cuentas > b.capacidad_max ? (
                  <div className="small" style={{ color: "var(--rojo)", marginTop: 4, fontWeight: 700 }}>Lleva {b.cuentas - b.capacidad_max} {b.cuentas - b.capacidad_max === 1 ? "cuenta" : "cuentas"} más de las que puede atender bien.</div>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="pill p-rojo"><i aria-hidden="true" />{b.rojas} prioridad</span>
                <span className="pill p-ambar"><i aria-hidden="true" />{b.ambar} para mirar de cerca</span>
                {b.sin_lectura ? <span className="pill p-sin_lectura"><i aria-hidden="true" />{b.sin_lectura} sin lectura</span> : null}
              </div>

              <dl className="grid gap-1 small" style={{ gridTemplateColumns: "1fr auto" }}>
                <dt className="muted">Mensualidad que maneja</dt><dd className="tnum" style={{ fontWeight: 700 }}>{cop(b.mensualidad_cop)}</dd>
                <dt className="muted">De esa, en cuentas prioritarias</dt><dd className="tnum" style={{ fontWeight: 700, color: b.mensualidad_en_riesgo_cop ? "var(--rojo)" : undefined }}>{cop(b.mensualidad_en_riesgo_cop)}</dd>
              </dl>

              {b.sobrecargado || b.accion ? (
                <details className="note note-info">
                  <summary style={{ cursor: "pointer", fontWeight: 800, minHeight: 32, display: "flex", alignItems: "center" }}>{b.accion?.titulo ?? "Redistribuir cuentas"}</summary>
                  <div className="grid gap-2" style={{ marginTop: 8 }}>
                    <p>{b.accion?.motivo ?? "Está por encima de su capacidad."} Dueño de la decisión: {b.accion?.dueno_nombre ?? "Pedro"}.</p>
                    {destino ? <p><strong>Sugerencia:</strong> mover parte de estas cuentas a {destino.nombre}, que tiene espacio ({destino.capacidad_max - destino.cuentas} libres).</p> : null}
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }} className="grid gap-1">
                      {propias.map((c) => c && (
                        <li key={c.id} className="flex items-center justify-between gap-2">
                          <Link href={`/cuentas/${c.id}`} style={{ textDecoration: "underline" }}>{c.empresa}</Link>
                          <SemaforoPill s={c.semaforo} />
                        </li>
                      ))}
                    </ul>
                  </div>
                </details>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}

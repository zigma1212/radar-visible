import Link from "next/link";
import { leerFuentes } from "@/components/datos";
import { IaEstado } from "@/components/ia-estado";
import { FuenteIcon } from "@/components/ui";
import { fechaHora } from "@/components/format";

export const dynamic = "force-dynamic";

const INFO: Record<string, { senal: string; como: string }> = {
  notion: { senal: "Si el cliente aprueba contenido, cuántos posts esperan respuesta y la lista de cuentas con su brand manager.", como: "Crear una integración interna en Notion, compartirle las bases Clientes y Calendario, y guardar el token en las variables del servidor." },
  circleback: { senal: "Cuándo fue la última reunión y si el cliente dijo frases de duda (\"no veo resultados\", \"pausar\").", como: "Generar una clave de API de Circleback y leer las reuniones con sus resúmenes y frases clave." },
  magnettu: { senal: "Cuánto se publica frente a lo pactado, impresiones, alcance fuera de su red y conversaciones.", como: "Pedir a Magnettü acceso a su API o una exportación programada; mientras tanto, una cuenta sin datos queda \"sin lectura\"." },
  siigo: { senal: "Facturas emitidas, pagadas, pendientes y vencidas por cliente.", como: "Solicitar credenciales de API de Siigo (usuario y clave de acceso) con permiso de solo lectura." },
  pipedrive: { senal: "Etapa del negocio y fecha de renovación de cada cuenta.", como: "Crear un token de API en Pipedrive y leer los negocios con su fecha de renovación." },
  slack: { senal: "No aporta señales: es el canal por donde llega el brief del lunes.", como: "Crear un webhook entrante en Slack para el canal del brief y guardarlo como SLACK_WEBHOOK_URL. Sin él, la app muestra una vista previa." },
};

export default async function Fuentes() {
  const { fuentes } = await leerFuentes();
  return (
    <div className="page">
      <header>
        <p className="eyebrow">Conectores</p>
        <h1 className="h1">Fuentes</h1>
        <p className="muted" style={{ marginTop: 6 }}>De dónde sale cada dato. Hoy casi todo está simulado; cada conector tiene su guía para pasar a datos reales, y las facturas ya se pueden traer de un CSV.</p>
      </header>
      <div className="note note-info" style={{ fontSize: 15 }}>
        <strong>El radar funciona con lo mínimo (Siigo + Pipedrive) y gana precisión con cada fuente.</strong> Las que están «a confirmar» dependen de cómo trabaja hoy Visible; la primera semana se valida cada una.
      </div>
      <IaEstado />
      <div className="grid gap-4 md:grid-cols-2">
        {fuentes.map((f) => {
          const i = INFO[f.id];
          const real = f.modo === "real";
          const csv = f.modo === "real_csv";
          return (
            <article key={f.id} className="card grid gap-3">
              <div className="flex items-center gap-3">
                <div className="sig-ico" style={{ width: 44, height: 44 }}><FuenteIcon fuente={f.id} size={22} /></div>
                <div className="grid">
                  <h2 className="h2">{f.nombre}</h2>
                  <span className="small muted">Última lectura: {f.ultima_lectura ? fechaHora(f.ultima_lectura) : "sin lectura"}</span>
                </div>
                <span className={`pill ${real || csv ? "p-verde" : "p-ambar"}`} style={{ marginLeft: "auto" }}><i aria-hidden="true" />{csv ? "Real (CSV)" : real ? "Real" : "Simulado"}</span>
              </div>
              {i ? <div><p className="eyebrow">Qué señal aporta</p><p style={{ fontSize: 15 }}>{i.senal}</p></div> : null}
              {i ? <div><p className="eyebrow">Cómo conectarlo</p><p style={{ fontSize: 15 }}>{i.como}</p></div> : null}
              {f.id !== "slack" ? (
                <div className={`note ${f.disponibilidad === "a_confirmar" ? "note-info" : "note-ok"}`}>
                  <strong>{f.disponibilidad === "a_confirmar" ? "Disponibilidad: a confirmar" : "Disponibilidad: probable"}</strong>
                  {f.pregunta_validacion ? <> · Pregunta para validar con Visible: <em>{f.pregunta_validacion}</em></> : null}
                </div>
              ) : null}
              {f.id === "siigo" ? <p className="small"><Link href="/importar" style={{ textDecoration: "underline" }}>Importar un CSV de facturas</Link> para usar datos reales sin conectar nada.</p> : null}
              {f.notas ? <p className="small muted">{f.notas}</p> : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}

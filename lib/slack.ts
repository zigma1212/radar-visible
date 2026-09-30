// La URL del webhook se lee de la variable SLACK_WEBHOOK_URL (ver radar/.env.example) y nunca se registra.
import { fechaLarga } from "./ia/util";
import type { Brief } from "./ia/brief";

export interface ResultadoEnvio {
  enviado: boolean;
  destino: "slack" | "vista_previa";
  vista_previa?: string;
  error?: string;
}

const PIE = "Radar · Interés compuesto a la vista · datos simulados · fuentes: Notion, Circleback, Magnettü, Siigo, Pipedrive";

type Datos = Pick<Brief, "texto" | "acciones" | "hechos">;

/** El texto del brief (IA o plantilla) ya trae prioridades y acciones; solo se quita un título repetido al inicio. */
function cuerpo(b: Datos): string {
  return b.texto.replace(/^\s*brief del lunes[^\n]*\n+/i, "").trim();
}

export function textoPlano(b: Datos): string {
  return [`Brief del lunes · ${fechaLarga(b.hechos.hoy)} (esto podría llegarte cada lunes)`, "", cuerpo(b), "", PIE].join("\n").trim();
}

export function bloquesSlack(b: Datos) {
  return [
    { type: "header", text: { type: "plain_text", text: `Brief del lunes · ${fechaLarga(b.hechos.hoy)}` } },
    { type: "section", text: { type: "mrkdwn", text: cuerpo(b) } },
    { type: "context", elements: [{ type: "mrkdwn", text: PIE }] },
  ];
}

/** Envía el brief a Slack si hay webhook; si no (o si falla), devuelve la vista previa en texto plano. */
export async function enviarBrief(b: Datos): Promise<ResultadoEnvio> {
  const vista = textoPlano(b);
  const url = process["env"].SLACK_WEBHOOK_URL;
  if (!url) return { enviado: false, destino: "vista_previa", vista_previa: vista };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Brief del lunes", blocks: bloquesSlack(b) }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return { enviado: false, destino: "vista_previa", vista_previa: vista, error: `Slack respondió ${res.status}` };
    return { enviado: true, destino: "slack" };
  } catch {
    return { enviado: false, destino: "vista_previa", vista_previa: vista, error: "No se pudo contactar a Slack" };
  }
}

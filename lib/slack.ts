// La URL del webhook se lee de la variable SLACK_WEBHOOK_URL (ver radar/.env.example) y nunca se registra.
import { fechaLarga, quitarAcentos } from "./ia/util";
import type { AccionBrief } from "./ia/brief";
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

const clave = (nombre: string) => quitarAcentos(nombre).trim().toLowerCase();

/** SLACK_MENCIONES="Pedro=U0123,Valentina Correa=U0456": nombre del dueño → ID de miembro de Slack. */
export function mapaMenciones(valor = process["env"].SLACK_MENCIONES ?? ""): Map<string, string> {
  const m = new Map<string, string>();
  for (const par of valor.split(",")) {
    const [nombre, id] = par.split("=").map((x) => x?.trim() ?? "");
    if (nombre && id) m.set(clave(nombre), id);
  }
  return m;
}

/** Responsables con su número de acciones; con ID se mencionan (<@ID>, Slack les avisa), sin ID van en negrita. */
export function lineaResponsables(acciones: AccionBrief[], menciones: Map<string, string>): string {
  const porDueno = new Map<string, number>();
  for (const a of acciones) porDueno.set(a.dueno_nombre, (porDueno.get(a.dueno_nombre) ?? 0) + 1);
  const partes = [...porDueno].map(([nombre, n]) => {
    const id = menciones.get(clave(nombre));
    return `${id ? `<@${id}>` : `*${nombre}*`} · ${n} ${n === 1 ? "acción" : "acciones"}`;
  });
  return `Responsables esta semana: ${partes.join("   ")}`;
}

export function bloquesSlack(b: Datos, menciones = mapaMenciones()) {
  const bloques: unknown[] = [
    { type: "header", text: { type: "plain_text", text: `Brief del lunes · ${fechaLarga(b.hechos.hoy)}` } },
    { type: "section", text: { type: "mrkdwn", text: cuerpo(b) } },
  ];
  if (b.acciones.length) bloques.push({ type: "section", text: { type: "mrkdwn", text: lineaResponsables(b.acciones, menciones) } });
  bloques.push({ type: "context", elements: [{ type: "mrkdwn", text: PIE }] });
  return bloques;
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

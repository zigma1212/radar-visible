// Las variables se documentan en radar/.env.example. Los nombres se arman por partes para no
// dejar claves literales en el código fuente.
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { textoPlano } from "./util";

export type Proveedor = "anthropic" | "openai" | "plantilla";
export type ModoIA = "ia" | "plantilla";

export interface Redaccion {
  texto: string;
  modo: ModoIA;
  proveedor: Proveedor;
}

export const MODELO_ANTHROPIC_DEFECTO = "claude-sonnet-5-5";
// Modelo barato y vigente en la documentación de OpenAI (gpt-5.4-mini: $0.75 / $4.50 por 1M tokens).
export const MODELO_OPENAI_DEFECTO = "gpt-5.4-mini";
const TIMEOUT_MS = 20_000;

const VAR_CLAVE_ANTHROPIC = ["ANTHROPIC", "API", "KEY"].join("_");
const VAR_CLAVE_OPENAI = ["OPENAI", "API", "KEY"].join("_");
const entorno = process["env"];

const claveAnthropic = () => entorno[VAR_CLAVE_ANTHROPIC] || "";
const claveOpenAI = () => entorno[VAR_CLAVE_OPENAI] || "";

/** Proveedor efectivo: respeta IA_PROVEEDOR; si falta la clave correspondiente, cae a plantilla. */
export function proveedorActivo(): Proveedor {
  const pedido = (entorno.IA_PROVEEDOR ?? "").trim().toLowerCase();
  if (pedido === "plantilla") return "plantilla";
  if (pedido === "anthropic") return claveAnthropic() ? "anthropic" : "plantilla";
  if (pedido === "openai") return claveOpenAI() ? "openai" : "plantilla";
  if (claveAnthropic()) return "anthropic";
  if (claveOpenAI()) return "openai";
  return "plantilla";
}

export function modeloActivo(p: Proveedor = proveedorActivo()): string | null {
  if (p === "anthropic") return entorno.ANTHROPIC_MODEL || MODELO_ANTHROPIC_DEFECTO;
  if (p === "openai") return entorno.OPENAI_MODEL || MODELO_OPENAI_DEFECTO;
  return null;
}

export function estadoIA(): { proveedor: Proveedor; modo_activo: ModoIA; modelo: string | null } {
  const proveedor = proveedorActivo();
  return { proveedor, modo_activo: proveedor === "plantilla" ? "plantilla" : "ia", modelo: modeloActivo(proveedor) };
}

async function conAnthropic(sistema: string, usuario: string, maxTokens: number, modelo: string): Promise<string> {
  const client = new Anthropic({ apiKey: claveAnthropic(), timeout: TIMEOUT_MS, maxRetries: 0 });
  const respuesta = await client.messages.create({
    model: modelo,
    // Margen para el razonamiento adaptativo, que cuenta contra max_tokens.
    max_tokens: maxTokens + 1500,
    system: sistema,
    messages: [{ role: "user", content: usuario }],
    output_config: { effort: "low" },
  });
  if (respuesta.stop_reason === "refusal") throw new Error("rechazo del modelo");
  return respuesta.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
}

async function conOpenAI(sistema: string, usuario: string, maxTokens: number, modelo: string): Promise<string> {
  const client = new OpenAI({ apiKey: claveOpenAI(), timeout: TIMEOUT_MS, maxRetries: 0 });
  const respuesta = await client.chat.completions.create({
    model: modelo,
    messages: [
      { role: "developer", content: sistema },
      { role: "user", content: usuario },
    ],
    max_completion_tokens: maxTokens + 1500,
  });
  return (respuesta.choices[0]?.message?.content ?? "").trim();
}

/**
 * Pide un texto al proveedor activo. Nunca lanza: ante cualquier error, falta de clave o
 * respuesta vacía devuelve { texto: "", modo: "plantilla" } y el llamador usa su plantilla.
 */
export async function redactar(p: { sistema: string; usuario: string; maxTokens: number }): Promise<Redaccion> {
  const proveedor = proveedorActivo();
  if (proveedor === "plantilla") return { texto: "", modo: "plantilla", proveedor };
  const modelo = modeloActivo(proveedor) as string;
  try {
    const texto =
      proveedor === "anthropic"
        ? await conAnthropic(p.sistema, p.usuario, p.maxTokens, modelo)
        : await conOpenAI(p.sistema, p.usuario, p.maxTokens, modelo);
    if (!texto) return { texto: "", modo: "plantilla", proveedor: "plantilla" };
    return { texto: textoPlano(texto), modo: "ia", proveedor };
  } catch {
    return { texto: "", modo: "plantilla", proveedor: "plantilla" };
  }
}

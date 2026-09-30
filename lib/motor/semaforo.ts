import { UMBRALES } from "../../config/umbrales";
import { esAdministrativa, faltaFuenteCritica } from "./senales";
import type { Semaforo, Senal, Zona } from "../tipos";

/**
 * Semáforo de la cuenta (spec §4):
 * - rojo: >= 2 señales en riesgo, o 1 en riesgo estando en parte plana, siempre con al menos
 *   una señal de riesgo que NO sea administrativa (la factura vencida sola nunca hace rojo).
 * - ámbar: >= 1 en riesgo o >= 2 en atención.
 * - sin_lectura: falta una fuente crítica (Notion, Magnettü, Siigo).
 * - verde: el resto. NUNCA verde con una fuente crítica sin leer.
 * Orden de evaluación: rojo, ámbar, sin_lectura, verde (un ámbar real no se esconde tras un dato faltante).
 */
export function calcularSemaforo(senales: Senal[], zona: Zona): Semaforo {
  const S = UMBRALES.semaforo;
  const riesgos = senales.filter((s) => s.severidad === "riesgo").length;
  const atenciones = senales.filter((s) => s.severidad === "atencion").length;
  const riesgosNoAdmin = senales.filter((s) => s.severidad === "riesgo" && !esAdministrativa(s)).length;
  if (riesgosNoAdmin >= 1 && (riesgos >= S.riesgosParaRojo || zona === "parte plana")) return "rojo";
  if (riesgos >= S.riesgosParaAmbar || atenciones >= S.atencionesParaAmbar) return "ambar";
  if (faltaFuenteCritica(senales)) return "sin_lectura";
  return "verde";
}

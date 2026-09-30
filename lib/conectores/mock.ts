import { hoy, lecturaSimulada } from "../fecha";
import type { Lectura } from "../tipos";

/** Envuelve datos simulados con el formato común de lectura. */
export function lecturaMock<T>(datos: T): Lectura<T> {
  return { datos, leido_en: lecturaSimulada(hoy()), modo: "simulado" };
}

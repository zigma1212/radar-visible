import publicaciones from "../../data/mock/publicaciones.json";
import { lecturaMock } from "./mock";
import type { Lectura, Publicacion } from "../tipos";

/** Magnettü: métricas por publicación (impresiones, alcance fuera de red, conversaciones). */
export async function leer(): Promise<Lectura<Publicacion[]>> {
  return lecturaMock(publicaciones as Publicacion[]);
}

/* ============================================================================
 * CONEXIÓN REAL (pendiente) - NO implementada en esta demo.
 * Vía prevista: exportación de métricas de Magnettü (CSV/JSON por publicación) cargada
 * de forma periódica; si Magnettü ofrece API, consultar las publicaciones por cuenta.
 * Una cuenta sin registros debe quedar como "sin lectura", nunca como cero.
 * TODO: confirmar con Magnettü qué exportación o API está disponible.
 * ========================================================================== */

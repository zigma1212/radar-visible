import reuniones from "../../data/mock/reuniones.json";
import { lecturaMock } from "./mock";
import type { Lectura, Reunion } from "../tipos";

/** Circleback: resúmenes de reuniones con el cliente y frases clave. */
export async function leer(): Promise<Lectura<Reunion[]>> {
  return lecturaMock(reuniones as Reunion[]);
}

/* ============================================================================
 * CONEXIÓN REAL (pendiente) - NO implementada en esta demo.
 * Circleback entrega reuniones por webhook (al terminar una reunión envía el resumen y los
 * puntos de acción) o por exportación. Se necesitaría un endpoint receptor
 * (p. ej. POST /api/webhooks/circleback) que guarde cada reunión asociada a una cuenta.
 * Las frases clave de duda se extraerían del resumen/transcripción.
 * TODO: verificar el formato del payload del webhook y la firma antes de implementarlo.
 * ========================================================================== */

import deals from "../../data/mock/deals.json";
import { lecturaMock } from "./mock";
import type { Deal, Lectura } from "../tipos";

/** Pipedrive: deals de renovación (etapa y fecha de renovación). */
export async function leer(): Promise<Lectura<Deal[]>> {
  return lecturaMock(deals as Deal[]);
}

/* ============================================================================
 * CONEXIÓN REAL (pendiente) - NO implementada en esta demo.
 * API de Pipedrive: GET https://api.pipedrive.com/v1/deals (o /api/v2/deals) con api_token / OAuth.
 * La fecha de renovación vendría de un campo personalizado del deal; la etapa, de stage_id.
 * Variables previstas: PIPEDRIVE_API_TOKEN, PIPEDRIVE_DOMINIO.
 * TODO: definir el campo personalizado de renovación y mapear deals a cuentas.
 * ========================================================================== */

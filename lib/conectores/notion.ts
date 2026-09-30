import brandManagers from "../../data/mock/brand_managers.json";
import cuentas from "../../data/mock/cuentas.json";
import aprobaciones from "../../data/mock/aprobaciones.json";
import { lecturaMock } from "./mock";
import type { Aprobacion, BrandManager, Cuenta, Lectura } from "../tipos";

export interface DatosNotion {
  brand_managers: BrandManager[];
  cuentas: Cuenta[];
  aprobaciones: Aprobacion[];
}

/** Notion: base "Clientes" (cuentas) y base "Calendario" (aprobaciones de contenido). */
export async function leer(): Promise<Lectura<DatosNotion>> {
  return lecturaMock({
    brand_managers: brandManagers as BrandManager[],
    cuentas: cuentas as Cuenta[],
    aprobaciones: aprobaciones as Aprobacion[],
  });
}

/* ============================================================================
 * CONEXIÓN REAL (pendiente) - NO implementada en esta demo.
 * API: Notion API, "Query a database":
 *   POST https://api.notion.com/v1/databases/{database_id}/query
 *   Headers: Authorization: Bearer $NOTION_TOKEN, Notion-Version: 2022-06-28
 * Se consultarían dos bases: "Clientes" (-> Cuenta) y "Calendario" (-> Aprobacion),
 * paginando con start_cursor / has_more, y mapeando las propiedades a los tipos de lib/tipos.ts.
 * Variables previstas: NOTION_TOKEN, NOTION_DB_CLIENTES, NOTION_DB_CALENDARIO.
 * TODO: implementar leerReal() y elegirla cuando exista NOTION_TOKEN; devolver modo: "real".
 * ========================================================================== */

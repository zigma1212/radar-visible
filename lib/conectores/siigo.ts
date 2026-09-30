import facturas from "../../data/mock/facturas.json";
import { lecturaMock } from "./mock";
import { estado } from "../estado";
import type { Factura, Lectura } from "../tipos";

/** Siigo: facturas de venta por cliente (estado y vencimiento). Prefiere las importadas por CSV (/importar). */
export async function leer(): Promise<Lectura<Factura[]>> {
  const imp = estado().obtenerImportacion();
  if (!imp) return lecturaMock(facturas as Factura[]);
  // Fuente real (CSV): las facturas importadas mandan para las cuentas emparejadas; el resto sigue simulado.
  const cubiertas = new Set(imp.facturas.map((f) => f.cuenta_id));
  const datos = [...(facturas as Factura[]).filter((f) => !cubiertas.has(f.cuenta_id)), ...imp.facturas];
  return { datos, leido_en: imp.importada_en, modo: "real_csv" };
}

/* ============================================================================
 * CONEXIÓN REAL (pendiente) - NO implementada en esta demo.
 * API de Siigo: autenticación (POST /auth con usuario y access key) y luego
 *   GET https://api.siigo.com/v1/invoices  (facturas de venta, con paginación)
 * Mapear cliente -> cuenta, fecha de vencimiento y saldo pendiente -> estado (pagada/pendiente/vencida).
 * Variables previstas: SIIGO_USER, SIIGO_ACCESS_KEY.
 * TODO: implementar la lectura real y el mapeo de clientes de Siigo a cuentas del radar.
 * ========================================================================== */

import { estado } from "../estado";
import { cargarPanorama } from "../radar";
import { marcaDeTiempo } from "../fecha";
import { ErrorImportacion, prepararImportacion, type ResultadoLectura } from "./facturas";
import type { Semaforo } from "../tipos";

export interface CambioSemaforo { cuenta_id: string; empresa: string; antes: Semaforo; despues: Semaforo }
export interface ResumenImportacion extends Omit<ResultadoLectura, "facturas"> {
  facturas_importadas: number;
  importada_en: string;
  archivo: string;
  cambios_semaforo: CambioSemaforo[];
}

function cambios(antes: Awaited<ReturnType<typeof cargarPanorama>>, despues: Awaited<ReturnType<typeof cargarPanorama>>): CambioSemaforo[] {
  const previo = new Map(antes.panorama.cuentas.map((c) => [c.id, c.semaforo]));
  return despues.panorama.cuentas
    .filter((c) => previo.get(c.id) !== c.semaforo)
    .map((c) => ({ cuenta_id: c.id, empresa: c.empresa, antes: previo.get(c.id) as Semaforo, despues: c.semaforo }));
}

/** Lee el CSV, guarda las facturas importadas y compara el semáforo antes y después. Lanza ErrorImportacion si el archivo no sirve. */
export async function importarFacturas(texto: string, archivo: string): Promise<ResumenImportacion> {
  const antes = await cargarPanorama();
  const r = prepararImportacion(texto, antes.datos.cuentas, antes.panorama.hoy);
  if (r.invalidas.length) {
    const detalle = r.invalidas.map((x) => `línea ${x.linea} — ${x.motivo}`).join("; ");
    throw new ErrorImportacion(`No se importó el archivo: ${detalle}`);
  }
  const { facturas, ...resto } = r;
  const importada_en = marcaDeTiempo();
  if (facturas.length) estado().guardarImportacion({ importada_en, archivo, filas_leidas: r.filas_leidas, facturas });
  const despues = facturas.length ? await cargarPanorama() : antes;
  return { ...resto, facturas_importadas: facturas.length, importada_en, archivo, cambios_semaforo: cambios(antes, despues) };
}

/** Deshace la importación y devuelve los cambios de semáforo que eso produce. */
export async function deshacerImportacion(): Promise<{ deshecha: boolean; cambios_semaforo: CambioSemaforo[] }> {
  const antes = await cargarPanorama();
  const deshecha = estado().deshacerImportacion();
  if (!deshecha) return { deshecha, cambios_semaforo: [] };
  return { deshecha, cambios_semaforo: cambios(antes, await cargarPanorama()) };
}

/** Estado actual de la importación (para la página). */
export function estadoImportacion() {
  const imp = estado().obtenerImportacion();
  if (!imp) return null;
  return {
    importada_en: imp.importada_en,
    archivo: imp.archivo,
    filas_leidas: imp.filas_leidas,
    facturas: imp.facturas.length,
    cuentas: new Set(imp.facturas.map((f) => f.cuenta_id)).size,
  };
}

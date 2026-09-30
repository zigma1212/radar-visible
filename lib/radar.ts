import { leerTodo } from "./conectores";
import { evaluarCuentas } from "./motor/evaluar";
import { hoy } from "./fecha";
import type { DatosRadar, Panorama } from "./tipos";

/** Lee las fuentes y evalúa todas las cuentas (uso de las rutas de API y páginas). */
export async function cargarPanorama(): Promise<{ datos: DatosRadar; panorama: Panorama }> {
  const datos = await leerTodo();
  return { datos, panorama: evaluarCuentas(datos, hoy()) };
}

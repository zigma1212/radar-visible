import { cargarPanorama } from "../radar";
import { detalleDeCuenta } from "../ia/contexto";
import { notaDeAvance } from "../ia/nota";
import type { AlmacenEstado, Nota } from "./index";

/** Cuenta de la demo para la nota precargada: Agroexport Cumbres. */
export const CUENTA_PRECARGA = "c03";

let en_curso: Promise<void> | null = null;

/**
 * Si el almacén no tiene ninguna nota, siembra un borrador para Agroexport Cumbres con el proveedor actual
 * (plantilla si no hay clave de IA). Así la Bandeja nunca aparece vacía en la demo.
 * No hace nada si ya hay notas (aunque estén aprobadas o descartadas). Nunca lanza.
 */
export async function precargarBandeja(almacen: AlmacenEstado): Promise<Nota[]> {
  if (almacen.listarNotas().length > 0) return almacen.listarNotas();
  if (!en_curso) {
    en_curso = (async () => {
      try {
        if (almacen.listarNotas().length > 0) return;
        const { datos, panorama } = await cargarPanorama();
        const detalle = detalleDeCuenta(CUENTA_PRECARGA, datos, panorama);
        if (!detalle) return;
        const n = await notaDeAvance(detalle);
        if (almacen.listarNotas().length > 0) return;
        almacen.crearNota({
          cuenta_id: detalle.id,
          empresa: detalle.empresa,
          brand_manager: detalle.brand_manager.nombre,
          borrador: n.borrador,
          evidencia_disponible: n.evidencia !== null,
          modo: n.modo,
        });
      } catch {
        // la Bandeja se muestra vacía con su mensaje; no rompe la página
      }
    })().finally(() => {
      en_curso = null;
    });
  }
  await en_curso;
  return almacen.listarNotas();
}

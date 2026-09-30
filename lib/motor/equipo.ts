import { accionDeEquipo } from "./acciones";
import type { BrandManager, CargaBM, CuentaEvaluada } from "../tipos";

/** Carga por brand manager: cuentas, riesgos, mensualidad y si está sobrecargado o con holgura. */
export function cargaPorBM(bms: BrandManager[], cuentas: CuentaEvaluada[]): CargaBM[] {
  return bms.map((bm) => {
    const mias = cuentas.filter((c) => c.brand_manager.id === bm.id);
    const rojas = mias.filter((c) => c.semaforo === "rojo");
    return {
      id: bm.id,
      nombre: bm.nombre,
      email: bm.email,
      capacidad_max: bm.capacidad_max,
      cuentas: mias.length,
      rojas: rojas.length,
      ambar: mias.filter((c) => c.semaforo === "ambar").length,
      sin_lectura: mias.filter((c) => c.semaforo === "sin_lectura").length,
      verdes: mias.filter((c) => c.semaforo === "verde").length,
      mensualidad_cop: mias.reduce((a, c) => a + c.fee_mensual_cop, 0),
      mensualidad_en_riesgo_cop: rojas.reduce((a, c) => a + c.fee_mensual_cop, 0),
      sobrecargado: mias.length > bm.capacidad_max,
      con_holgura: mias.length <= bm.capacidad_max * 0.6,
      cuentas_ids: mias.map((c) => c.id),
      accion: accionDeEquipo(bm, rojas.length, mias.length),
    };
  });
}

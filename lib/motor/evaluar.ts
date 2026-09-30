import { hoy as hoyPorDefecto } from "../fecha";
import { accionDeCuenta } from "./acciones";
import { calcularSemaforo } from "./semaforo";
import { calcularSenales } from "./senales";
import { mesPrograma, zonaDeMes } from "./zona";
import type { CuentaEvaluada, DatosRadar, Panorama, Semaforo } from "../tipos";

const ORDEN: Record<Semaforo, number> = { rojo: 0, ambar: 1, sin_lectura: 2, verde: 3 };

/** Evalúa todas las cuentas de forma determinista. Función pura: no lee archivos ni red. */
export function evaluarCuentas(datos: DatosRadar, hoyStr: string = hoyPorDefecto()): Panorama {
  const cuentas: CuentaEvaluada[] = datos.cuentas.map((c) => {
    const bm = datos.brand_managers.find((b) => b.id === c.brand_manager_id) ?? {
      id: c.brand_manager_id,
      nombre: "Sin asignar",
      email: "",
      capacidad_max: 0,
    };
    const mes = mesPrograma(c.fecha_inicio, hoyStr);
    const zona = zonaDeMes(mes);
    const senales = calcularSenales(c, datos, hoyStr);
    return {
      id: c.id,
      cliente: c.cliente,
      cargo: c.cargo,
      empresa: c.empresa,
      plan: c.plan,
      fee_mensual_cop: c.fee_mensual_cop,
      brand_manager: { id: bm.id, nombre: bm.nombre },
      mes_programa: mes,
      zona,
      semaforo: calcularSemaforo(senales, zona),
      senales,
      accion: accionDeCuenta(senales, zona, bm),
    };
  });

  cuentas.sort((a, b) => ORDEN[a.semaforo] - ORDEN[b.semaforo] || b.fee_mensual_cop - a.fee_mensual_cop || a.id.localeCompare(b.id));

  const suma = (s: Semaforo) => cuentas.filter((c) => c.semaforo === s).reduce((a, c) => a + c.fee_mensual_cop, 0);
  return {
    hoy: hoyStr,
    resumen: {
      cuentas: cuentas.length,
      en_parte_plana: cuentas.filter((c) => c.zona === "parte plana").length,
      rojas: cuentas.filter((c) => c.semaforo === "rojo").length,
      ambar: cuentas.filter((c) => c.semaforo === "ambar").length,
      sin_lectura: cuentas.filter((c) => c.semaforo === "sin_lectura").length,
      mensualidad_en_riesgo_cop: suma("rojo"),
      mensualidad_ambar_cop: suma("ambar"),
    },
    cuentas,
  };
}

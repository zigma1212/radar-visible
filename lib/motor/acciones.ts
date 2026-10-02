import { UMBRALES } from "../../config/umbrales";
import { faltaFuenteCritica } from "./senales";
import type { AccionSugerida, BrandManager, Senal, Zona } from "../tipos";

const sev = (s: Senal[], id: string) => s.find((x) => x.id === id)?.severidad;
const val = (s: Senal[], id: string) => s.find((x) => x.id === id)?.valor;
const alerta = (x?: string) => x === "atencion" || x === "riesgo";

/**
 * Acción sugerida de una cuenta: la primera regla que aplique (spec §4).
 * La regla 4 (redistribuir cuentas) es de equipo: ver equipo.ts.
 */
export function accionDeCuenta(senales: Senal[], zona: Zona, bm: BrandManager): AccionSugerida | null {
  // 1. Frases de duda + renovación cercana -> llamada del CEO
  const dias = val(senales, "renovacion");
  if (
    alerta(sev(senales, "frases_duda")) &&
    typeof dias === "number" &&
    dias < UMBRALES.accion.llamadaCeoRenovacionDias
  ) {
    return {
      titulo: "Llamada de Pedro esta semana",
      dueno: "CEO",
      dueno_nombre: "Pedro",
      motivo: `El cliente mostró dudas en la última reunión y la renovación es en ${dias} días.`,
    };
  }
  // 2. Parte plana + aprobaciones o cadencia en riesgo -> nota de avance
  if (zona === "parte plana" && (sev(senales, "aprobacion_dias") === "riesgo" || sev(senales, "cadencia") === "riesgo")) {
    return {
      titulo: "Enviar nota de avance",
      dueno: "BM",
      dueno_nombre: bm.nombre,
      motivo: "La cuenta está en la parte plana y tiene señales de atención: conviene revisar lo acumulado con el cliente antes de renovar.",
    };
  }
  // 3. Factura vencida sin otras señales -> recordatorio de pago
  const otras = senales.some((s) => s.id !== "factura_vencida" && alerta(s.severidad));
  if (alerta(sev(senales, "factura_vencida")) && !otras) {
    return {
      titulo: "Recordatorio amable de pago",
      dueno: "administracion",
      dueno_nombre: "Administración",
      motivo: "Tema administrativo: la factura está vencida y no hay otras señales que mirar.",
    };
  }
  // 5. Sin lectura -> revisar conector
  if (faltaFuenteCritica(senales)) {
    const fuentes = [...new Set(senales.filter((s) => s.severidad === "sin_lectura" && (UMBRALES.fuentesCriticas as readonly string[]).includes(s.fuente)).map((s) => s.fuente))];
    return {
      titulo: "Revisar conector",
      dueno: "operaciones",
      dueno_nombre: "Operaciones",
      motivo: `No hay lectura de ${fuentes.join(", ")} para esta cuenta; hasta entonces no se puede declarar sana.`,
    };
  }
  return null;
}

/** Regla 4: brand manager con >= 3 cuentas rojas -> redistribuir. */
export function accionDeEquipo(bm: BrandManager, rojas: number, cuentas: number): AccionSugerida | null {
  if (rojas >= UMBRALES.equipo.rojasParaRedistribuir) {
    return {
      titulo: "Redistribuir cuentas",
      dueno: "CEO",
      dueno_nombre: "Pedro",
      motivo: `${bm.nombre} tiene ${rojas} cuentas prioritarias de ${cuentas} (capacidad ${bm.capacidad_max}).`,
    };
  }
  return null;
}

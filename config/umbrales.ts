// ============================================================================
// UMBRALES DEL RADAR - único lugar donde se cambian las reglas del motor.
// Si algo se siente muy sensible (o muy dormido), se ajusta aquí y nada más.
// Referencia: spec §4 (docs/spec/2026-09-29-radar-parte-plana.md).
// ============================================================================

export const UMBRALES = {
  // Zona del programa según el mes de programa (mes 1 = primer mes desde fecha_inicio).
  zona: {
    onboardingHasta: 1, // mes 1 -> "onboarding"
    partePlanaHasta: 5, // meses 2 a 5 -> "parte plana"; desde el mes 6 -> "tracción"
  },

  // Días desde la última aprobación de contenido por parte del cliente (Notion).
  // Se alerta cuando el valor es MAYOR que el umbral.
  aprobacion: { atencionDias: 7, riesgoDias: 12 },

  // Posts enviados al cliente y aún pendientes de aprobación (Notion).
  // Se alerta cuando el valor es MAYOR O IGUAL al umbral.
  pendientes: { atencion: 3, riesgo: 5 },

  // Cadencia publicada vs pactada en la ventana (Magnettü), en porcentaje.
  // Se alerta cuando el valor es MENOR que el umbral.
  cadencia: { atencionPct: 70, riesgoPct: 50, ventanaDias: 30 },

  // Días desde la última reunión (Circleback). Alerta cuando es MAYOR que el umbral.
  reunion: { atencionDias: 21, riesgoDias: 35 },

  // Frases de duda en la última reunión (Circleback).
  frases: {
    palabrasDuda: ["no veo resultados", "pausar", "presupuesto", "cancelar", "no tengo tiempo"],
    // Frases explícitas: con una sola ya es riesgo.
    palabrasCriticas: ["pausar", "cancelar", "no veo resultados"],
    // "presupuesto" y "no tengo tiempo" (las demás de palabrasDuda) solas son atención, nunca riesgo.
    atencion: 1, // número de frases de duda para atención
    riesgo: 2, // número de frases de duda para riesgo (dos frases de duda cualesquiera)
  },

  // Días de factura vencida (Siigo). Alerta cuando el valor es MAYOR que el umbral.
  factura: { atencionDias: 0, riesgoDias: 15 },

  // Días a la renovación (Pipedrive). Alerta cuando el valor es MENOR que el umbral.
  // El riesgo exige además otra señal en atención o riesgo; si no, queda en atención.
  renovacion: { atencionDias: 45, riesgoDias: 25 },

  // Reglas del semáforo de la cuenta.
  // La factura vencida (Siigo) es un tema administrativo: cuenta como riesgo/atención, pero
  // para estar en rojo se necesita al menos un riesgo que NO sea de facturación.
  semaforo: {
    riesgosParaRojo: 2, // o 1 riesgo estando en parte plana
    riesgosParaAmbar: 1,
    atencionesParaAmbar: 2,
  },

  // Fuentes sin las cuales nunca se muestra verde (regla de honestidad).
  fuentesCriticas: ["notion", "magnettu", "siigo"] as const,

  // Regla de equipo: brand manager con estas cuentas rojas -> "Redistribuir cuentas".
  equipo: { rojasParaRedistribuir: 3 },

  // Regla de acción: renovación a menos de estos días + frases de duda -> llamada del CEO.
  accion: { llamadaCeoRenovacionDias: 45 },
} as const;

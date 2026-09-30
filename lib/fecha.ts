// Utilidades de fecha. Todas las fechas del radar son cadenas "YYYY-MM-DD" (o ISO, se toma la parte de fecha).
// La "fecha de hoy" de la demo se fija con DEMO_TODAY (por defecto lunes 2026-10-05).

const MS_DIA = 86_400_000;

export function hoy(): string {
  // "||" y no "??": la línea "DEMO_TODAY=" del archivo local llega como cadena vacía.
  return process["env"].DEMO_TODAY?.trim() || "2026-10-05";
}

function aMs(f: string): number {
  const [y, m, d] = f.slice(0, 10).split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Días completos entre dos fechas (hasta - desde). Negativo si hasta es anterior. */
export function diasEntre(desde: string, hasta: string): number {
  return Math.round((aMs(hasta) - aMs(desde)) / MS_DIA);
}

export function sumarDias(fecha: string, n: number): string {
  return new Date(aMs(fecha) + n * MS_DIA).toISOString().slice(0, 10);
}

/** Meses calendario completos transcurridos entre dos fechas. */
export function mesesCompletos(desde: string, hasta: string): number {
  const [y1, m1, d1] = desde.slice(0, 10).split("-").map(Number);
  const [y2, m2, d2] = hasta.slice(0, 10).split("-").map(Number);
  return (y2 - y1) * 12 + (m2 - m1) - (d2 < d1 ? 1 : 0);
}

/** Marca de tiempo de la última lectura simulada: hoy 06:00 hora Colombia. */
export function lecturaSimulada(fecha: string = hoy()): string {
  return `${fecha}T06:00:00-05:00`;
}

/** Marca de tiempo ISO con el día de la demo y la hora real, para que borradores e importaciones cuadren con "hoy". */
export function marcaDeTiempo(): string {
  return `${hoy()}T${new Date().toISOString().slice(11)}`;
}

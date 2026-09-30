// Formato es-CO para cifras y fechas (la fecha de hoy de la demo viene del servidor).
const num = new Intl.NumberFormat("es-CO");
export const n = (v: number) => num.format(v);
export const pct = (v: number) => `${num.format(Math.round(v * 100))} %`;

/** "$30 M", "$27,5 M", "$850 mil". */
export function cop(v: number): string {
  if (v >= 1_000_000) {
    const m = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 }).format(v / 1_000_000);
    return `$${m} M`;
  }
  if (v >= 1000) return `$${num.format(Math.round(v / 1000))} mil`;
  return `$${num.format(v)}`;
}

const TZ = "America/Bogota";
const toDate = (s: string) => new Date(s.length <= 10 ? `${s}T12:00:00Z` : s);
export const fechaLarga = (s: string) =>
  new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: TZ }).format(toDate(s));
export const fechaCorta = (s: string) =>
  new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", timeZone: TZ }).format(toDate(s)).replace(".", "");
export const fechaHora = (s: string) =>
  new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true, timeZone: TZ })
    .format(toDate(s))
    .replace(".", "");

export const SEMAFORO_LABEL = { rojo: "Prioridad esta semana", ambar: "Mirar de cerca", verde: "Avanzando", sin_lectura: "Sin lectura" } as const;
export const ORDEN_SEMAFORO = { rojo: 0, ambar: 1, sin_lectura: 2, verde: 3 } as const;
export const FUENTE_NOMBRE: Record<string, string> = {
  notion: "Notion",
  circleback: "Circleback",
  magnettu: "Magnettü",
  siigo: "Siigo",
  pipedrive: "Pipedrive",
  slack: "Slack",
};

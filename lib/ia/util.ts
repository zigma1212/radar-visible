import type { FuenteId } from "../tipos";

export const NOMBRE_FUENTE: Record<FuenteId, string> = {
  notion: "Notion",
  circleback: "Circleback",
  magnettu: "Magnettü",
  siigo: "Siigo",
  pipedrive: "Pipedrive",
  slack: "Slack",
};

export function quitarAcentos(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** 12345 -> "12.345" (determinista, sin depender de ICU). */
export function fmtNum(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** 27500000 -> "$27,5 millones". */
export function fmtCOP(n: number): string {
  if (n >= 1_000_000) {
    const m = Math.round((n / 1_000_000) * 10) / 10;
    return `$${String(m).replace(".", ",")} ${m === 1 ? "millón" : "millones"}`;
  }
  return `$${fmtNum(n)}`;
}

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

/** "2026-10-05" -> "lunes 5 de octubre". */
export function fechaLarga(f: string): string {
  const [y, m, d] = f.slice(0, 10).split("-").map(Number);
  const dia = DIAS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${dia} ${d} de ${MESES[m - 1]}`;
}

export function primerNombre(nombre: string): string {
  return nombre.trim().split(/\s+/)[0] ?? nombre;
}

export function contarPalabras(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

export function fechaDe(iso: string | null | undefined): string | null {
  return iso ? iso.slice(0, 10) : null;
}

/** La pantalla y Slack muestran texto tal cual: quita negritas, cursivas y encabezados markdown que a veces agrega la IA. */
export function textoPlano(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/(^|[^*\w])\*(?!\s)([^*\n]+?)\*(?!\w)/g, "$1$2")
    .replace(/^#{1,6}\s+/gm, "")
    .trim();
}

// Importación de facturas desde un CSV exportado de la herramienta contable (la "fuente real" de la demo).
// Columnas: cliente,numero,emitida,vence,valor,estado. También acepta encabezados tipo Siigo
// ("Cliente","Número","Fecha","Vencimiento","Total","Estado") sin importar mayúsculas ni acentos.
// Funciones puras: no leen archivos ni red.
import { quitarAcentos } from "../ia/util";
import type { Cuenta, Factura } from "../tipos";

export class ErrorImportacion extends Error {}

export type Campo = "cliente" | "numero" | "emitida" | "vence" | "valor" | "estado";

const SINONIMOS: Record<Campo, string[]> = {
  cliente: ["cliente", "nombre cliente", "nombre del cliente", "razon social", "tercero", "empresa"],
  numero: ["numero", "no", "nro", "factura", "numero factura", "numero de factura", "consecutivo", "documento"],
  emitida: ["emitida", "fecha", "fecha emision", "fecha de emision", "fecha elaboracion", "fecha de elaboracion", "fecha factura"],
  vence: ["vence", "vencimiento", "fecha vencimiento", "fecha de vencimiento", "fecha vence"],
  valor: ["valor", "total", "valor total", "monto", "importe", "saldo"],
  estado: ["estado", "estado factura", "estado de la factura"],
};
const OBLIGATORIAS: Campo[] = ["cliente", "vence", "valor"];

const claveEncabezado = (s: string) => quitarAcentos(s).replace(/[^a-z0-9]+/g, " ").trim();

/** Separa el texto CSV en filas de celdas. Detecta coma, punto y coma o tabulador; respeta comillas. */
export function parsearCSV(texto: string): string[][] {
  const t = texto.replace(/^﻿/, "");
  const primera = t.split(/\r?\n/, 1)[0] ?? "";
  const cuenta = (c: string) => primera.split(c).length - 1;
  const delim = [",", ";", "\t"].sort((a, b) => cuenta(b) - cuenta(a))[0];
  const filas: string[][] = [];
  let fila: string[] = [];
  let celda = "";
  let entre = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (entre) {
      if (ch === '"') {
        if (t[i + 1] === '"') { celda += '"'; i++; } else entre = false;
      } else celda += ch;
    } else if (ch === '"') entre = true;
    else if (ch === delim) { fila.push(celda); celda = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && t[i + 1] === "\n") i++;
      fila.push(celda); celda = "";
      filas.push(fila); fila = [];
    } else celda += ch;
  }
  if (celda !== "" || fila.length) { fila.push(celda); filas.push(fila); }
  return filas.filter((f) => f.some((c) => c.trim() !== ""));
}

/** Convierte "3.500.000", "$3,500,000", "3500000.00" o "3.500.000,50" en pesos enteros; null si no es número. */
export function parsearValor(s: string): number | null {
  const t = s.replace(/[^\d.,-]/g, "");
  if (!/\d/.test(t)) return null;
  const c = t.lastIndexOf(",");
  const p = t.lastIndexOf(".");
  let limpio: string;
  if (c >= 0 && p >= 0) {
    const dec = c > p ? "," : ".";
    const mil = dec === "," ? "." : ",";
    limpio = t.split(mil).join("").replace(dec, ".");
  } else if (c >= 0 || p >= 0) {
    const sep = c >= 0 ? "," : ".";
    const partes = t.split(sep);
    const esMiles = partes.length > 2 || partes[partes.length - 1].length === 3;
    limpio = esMiles ? partes.join("") : t.replace(sep, ".");
  } else limpio = t;
  const n = Number(limpio);
  return Number.isFinite(n) ? Math.round(n) : null;
}

/** Acepta AAAA-MM-DD (o ISO) y DD/MM/AAAA. Devuelve AAAA-MM-DD o null. */
export function parsearFecha(s: string): string | null {
  const v = s.trim();
  let y: number, m: number, d: number;
  let r = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(v);
  if (r) { y = +r[1]; m = +r[2]; d = +r[3]; }
  else if ((r = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(v))) { d = +r[1]; m = +r[2]; y = +r[3]; }
  else return null;
  const f = new Date(Date.UTC(y, m - 1, d));
  if (f.getUTCFullYear() !== y || f.getUTCMonth() !== m - 1 || f.getUTCDate() !== d) return null;
  return f.toISOString().slice(0, 10);
}

/** "pagada" | "pendiente" | "vencida"; "anulada" si hay que saltar la fila; null si no se entiende. */
export function parsearEstado(s: string): Factura["estado"] | "anulada" | null {
  const t = quitarAcentos(s).trim();
  if (/anulad/.test(t)) return "anulada";
  if (/(pagad|paga$|cobrad|paid)/.test(t)) return "pagada";
  if (/vencid|mora/.test(t)) return "vencida";
  if (/(pendiente|abierta|emitida|por cobrar|sin pagar|parcial)/.test(t)) return "pendiente";
  return null;
}

export interface FilaFactura {
  linea: number;
  cliente: string;
  numero: string;
  emitida: string;
  vence: string;
  valor_cop: number;
  estado: Factura["estado"];
}
export interface FilaInvalida { linea: number; motivo: string }
export interface Leido { filas_leidas: number; filas: FilaFactura[]; invalidas: FilaInvalida[]; anuladas: number }

/** Lee el CSV: mapea encabezados, valida cada fila y descarta las inválidas con su motivo. */
export function leerFacturasCSV(texto: string, hoyStr: string): Leido {
  const tabla = parsearCSV(texto);
  if (tabla.length < 2) throw new ErrorImportacion("El archivo no tiene filas de facturas. Debe traer un encabezado y al menos una factura.");
  const enc = tabla[0].map(claveEncabezado);
  const col = {} as Record<Campo, number>;
  for (const campo of Object.keys(SINONIMOS) as Campo[]) {
    col[campo] = enc.findIndex((h) => SINONIMOS[campo].includes(h));
  }
  const faltan = OBLIGATORIAS.filter((c) => col[c] < 0);
  if (faltan.length) throw new ErrorImportacion(`Faltan columnas obligatorias: ${faltan.join(", ")}. Se esperan: cliente, numero, emitida, vence, valor, estado.`);

  const filas: FilaFactura[] = [];
  const invalidas: FilaInvalida[] = [];
  let anuladas = 0;
  const celda = (r: string[], c: Campo) => (col[c] >= 0 ? (r[col[c]] ?? "").trim() : "");
  tabla.slice(1).forEach((r, i) => {
    const linea = i + 2;
    const cliente = celda(r, "cliente");
    if (!cliente) return void invalidas.push({ linea, motivo: "Sin nombre de cliente" });
    const vence = parsearFecha(celda(r, "vence"));
    if (!vence) return void invalidas.push({ linea, motivo: `Fecha de vencimiento no válida ("${celda(r, "vence")}")` });
    const emitidaTxt = celda(r, "emitida");
    const emitida = emitidaTxt ? parsearFecha(emitidaTxt) : vence;
    if (!emitida) return void invalidas.push({ linea, motivo: `Fecha de emisión no válida ("${emitidaTxt}")` });
    const valor = parsearValor(celda(r, "valor"));
    if (valor === null || valor < 0) return void invalidas.push({ linea, motivo: `Valor no válido ("${celda(r, "valor")}")` });
    const estadoTxt = celda(r, "estado");
    const estado = estadoTxt ? parsearEstado(estadoTxt) : vence < hoyStr ? "vencida" : "pendiente";
    if (estado === null) return void invalidas.push({ linea, motivo: `Estado no reconocido ("${estadoTxt}")` });
    if (estado === "anulada") { anuladas++; return; }
    filas.push({ linea, cliente, numero: celda(r, "numero") || `CSV-${linea}`, emitida, vence, valor_cop: valor, estado });
  });
  return { filas_leidas: tabla.length - 1, filas, invalidas, anuladas };
}

// ---------------------------------------------------------------------------
// Emparejar el nombre del CSV con las cuentas del radar

const SUFIJOS = new Set(["sas", "sa", "ltda", "lts", "cia", "eu", "sca", "de", "la", "el", "los", "las", "y", "e", "del"]);

/** Minúsculas, sin acentos ni puntuación, sin sufijos societarios (S.A.S., Ltda). */
export function normalizarNombre(s: string): string {
  const t = quitarAcentos(s).replace(/s\.\s?a\.\s?s\.?/g, " sas ").replace(/[^a-z0-9ñ]+/g, " ").trim();
  return t.split(/\s+/).filter((w) => w && !SUFIJOS.has(w)).join(" ");
}

function similitud(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const menor = a.length <= b.length ? a : b;
  const mayor = a.length <= b.length ? b : a;
  if (menor.length >= 5 && ` ${mayor} `.includes(` ${menor} `)) return 0.9;
  const ta = new Set(a.split(" ").filter((w) => w.length >= 3));
  const tb = new Set(b.split(" ").filter((w) => w.length >= 3));
  if (!ta.size || !tb.size) return 0;
  let comunes = 0;
  for (const w of ta) if (tb.has(w)) comunes++;
  return comunes / (ta.size + tb.size - comunes);
}

/** Cuenta que mejor corresponde al nombre (por empresa o por nombre del cliente). null si no hay una única buena. */
export function emparejarCuenta(nombre: string, cuentas: Pick<Cuenta, "id" | "empresa" | "cliente">[], umbral = 0.6): string | null {
  const n = normalizarNombre(nombre);
  if (!n) return null;
  const puntos = cuentas.map((c) => ({ id: c.id, p: Math.max(similitud(n, normalizarNombre(c.empresa)), similitud(n, normalizarNombre(c.cliente))) }));
  const max = Math.max(0, ...puntos.map((x) => x.p));
  if (max < umbral) return null;
  const mejores = puntos.filter((x) => x.p === max);
  return mejores.length === 1 ? mejores[0].id : null; // empate = ambiguo, no se adivina
}

export interface ResultadoLectura {
  filas_leidas: number;
  filas_validas: number;
  invalidas: FilaInvalida[];
  anuladas: number;
  facturas: Factura[];
  emparejadas: { cliente_csv: string; cuenta_id: string; empresa: string; facturas: number }[];
  no_emparejadas: { cliente_csv: string; filas: number }[];
}

/** Lee el CSV y lo cruza con las cuentas. Las facturas resultantes reemplazan las de esas cuentas. */
export function prepararImportacion(texto: string, cuentas: Pick<Cuenta, "id" | "empresa" | "cliente">[], hoyStr: string): ResultadoLectura {
  const leido = leerFacturasCSV(texto, hoyStr);
  const porNombre = new Map<string, string | null>();
  const facturas = new Map<string, Factura>();
  const emp = new Map<string, { cliente_csv: string; cuenta_id: string; facturas: number }>();
  const sin = new Map<string, number>();
  for (const f of leido.filas) {
    if (!porNombre.has(f.cliente)) porNombre.set(f.cliente, emparejarCuenta(f.cliente, cuentas));
    const id = porNombre.get(f.cliente) ?? null;
    if (!id) { sin.set(f.cliente, (sin.get(f.cliente) ?? 0) + 1); continue; }
    facturas.set(`${id}|${f.numero}`, { cuenta_id: id, numero: f.numero, emitida: f.emitida, vence: f.vence, valor_cop: f.valor_cop, estado: f.estado });
    const e = emp.get(f.cliente) ?? { cliente_csv: f.cliente, cuenta_id: id, facturas: 0 };
    e.facturas++;
    emp.set(f.cliente, e);
  }
  return {
    filas_leidas: leido.filas_leidas,
    filas_validas: leido.filas.length,
    invalidas: leido.invalidas,
    anuladas: leido.anuladas,
    facturas: [...facturas.values()],
    emparejadas: [...emp.values()].map((e) => ({ ...e, empresa: cuentas.find((c) => c.id === e.cuenta_id)?.empresa ?? e.cuenta_id })),
    no_emparejadas: [...sin.entries()].map(([cliente_csv, filas]) => ({ cliente_csv, filas })),
  };
}

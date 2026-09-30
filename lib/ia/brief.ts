import { redactar, type ModoIA } from "./proveedor";
import { SISTEMA_BRIEF } from "./prompts";
import { contarPalabras, fechaLarga, fmtCOP } from "./util";
import type { CuentaEvaluada, Dueno, Panorama, Semaforo } from "../tipos";

export interface AccionBrief {
  titulo: string;
  cuenta_id: string;
  empresa: string;
  dueno: Dueno;
  dueno_nombre: string;
}

export interface HechosBrief {
  hoy: string;
  cuentas: number;
  en_parte_plana: number;
  rojas: { cuenta_id: string; empresa: string; brand_manager: string; fee_mensual_cop: number; motivos: string[] }[];
  ambar: number;
  sin_lectura: number;
  mensualidad_en_riesgo_cop: number;
  mensualidad_ambar_cop: number;
  acciones: AccionBrief[];
}

export interface Brief {
  texto: string;
  acciones: AccionBrief[];
  hechos: HechosBrief;
  modo: ModoIA;
  proveedor: string;
}

const PRIORIDAD: Record<Dueno, number> = { CEO: 0, BM: 1, administracion: 2, operaciones: 3 };
// Primero la cuenta más urgente; entre cuentas igual de urgentes, el dueño y la mensualidad.
const URGENCIA: Record<Semaforo, number> = { rojo: 0, ambar: 1, sin_lectura: 2, verde: 3 };

function motivosDe(c: CuentaEvaluada): string[] {
  const riesgo = c.senales.filter((s) => s.severidad === "riesgo").map((s) => s.explicacion);
  return riesgo.length ? riesgo : c.senales.filter((s) => s.severidad === "atencion").map((s) => s.explicacion);
}

/** Hechos del brief, calculados sin IA. */
export function hechosDelBrief(panorama: Panorama): HechosBrief {
  const rojas = panorama.cuentas.filter((c) => c.semaforo === "rojo");
  const acciones: AccionBrief[] = panorama.cuentas
    .filter((c) => c.accion)
    .sort(
      (a, b) =>
        URGENCIA[a.semaforo] - URGENCIA[b.semaforo] ||
        PRIORIDAD[a.accion!.dueno] - PRIORIDAD[b.accion!.dueno] ||
        b.fee_mensual_cop - a.fee_mensual_cop,
    )
    .slice(0, 3)
    .map((c) => ({
      titulo: c.accion!.titulo,
      cuenta_id: c.id,
      empresa: c.empresa,
      dueno: c.accion!.dueno,
      dueno_nombre: c.accion!.dueno_nombre,
    }));
  return {
    hoy: panorama.hoy,
    cuentas: panorama.resumen.cuentas,
    en_parte_plana: panorama.resumen.en_parte_plana,
    rojas: rojas.map((c) => ({
      cuenta_id: c.id,
      empresa: c.empresa,
      brand_manager: c.brand_manager.nombre,
      fee_mensual_cop: c.fee_mensual_cop,
      motivos: motivosDe(c),
    })),
    ambar: panorama.resumen.ambar,
    sin_lectura: panorama.resumen.sin_lectura,
    mensualidad_en_riesgo_cop: panorama.resumen.mensualidad_en_riesgo_cop,
    mensualidad_ambar_cop: panorama.resumen.mensualidad_ambar_cop ?? 0,
    acciones,
  };
}

const mayus = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function lista(xs: string[]): string {
  if (xs.length <= 1) return xs.join("");
  return `${xs.slice(0, -1).join(", ")} y ${xs[xs.length - 1]}`;
}

function quien(a: AccionBrief): string {
  return a.dueno === "CEO" ? "Pedro" : a.dueno_nombre;
}

/** Versión plantilla del brief (voz de Pedro, sin IA). */
export function briefPlantilla(h: HechosBrief): string {
  const partes: string[] = [];
  partes.push(`${mayus(fechaLarga(h.hoy))}. De ${h.cuentas} cuentas, ${h.en_parte_plana} están en la parte plana.`);
  if (h.rojas.length) {
    partes.push(
      `${h.rojas.length === 1 ? "Hay 1 prioridad esta semana" : `Hay ${h.rojas.length} prioridades esta semana`}: ${lista(h.rojas.map((r) => r.empresa))}. ` +
        `Son ${fmtCOP(h.mensualidad_en_riesgo_cop)} en cuentas prioritarias, donde hay que mostrar lo acumulado` +
        (h.mensualidad_ambar_cop ? `, más ${fmtCOP(h.mensualidad_ambar_cop)} en cuentas para mirar de cerca.` : "."),
    );
  } else {
    partes.push("Ninguna es prioridad esta semana.");
  }
  if (h.sin_lectura) partes.push(h.sin_lectura === 1 ? "Una cuenta sin lectura: no la damos por sana." : `${h.sin_lectura} cuentas sin lectura: no las damos por sanas.`);
  if (h.acciones.length) {
    partes.push("Esta semana:");
    h.acciones.forEach((a, i) => partes.push(`${i + 1}. ${a.titulo}, ${a.empresa} (${quien(a)}).`));
  }
  return partes.join(" ");
}

/** Brief del lunes: hechos deterministas + redacción con IA (o plantilla). */
export async function briefLunes(panorama: Panorama): Promise<Brief> {
  const hechos = hechosDelBrief(panorama);
  const plantilla = briefPlantilla(hechos);
  const r = await redactar({
    sistema: SISTEMA_BRIEF,
    usuario: `Hechos (JSON):\n${JSON.stringify(hechos, null, 2)}\n\nEscribe el Brief del lunes.`,
    maxTokens: 400,
  });
  const usaIA = r.modo === "ia" && contarPalabras(r.texto) > 0;
  return {
    texto: usaIA ? r.texto : plantilla,
    acciones: hechos.acciones,
    hechos,
    modo: usaIA ? "ia" : "plantilla",
    proveedor: usaIA ? r.proveedor : "plantilla",
  };
}

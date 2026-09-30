import { redactar, type ModoIA } from "./proveedor";
import { SISTEMA_PREGUNTAR } from "./prompts";
import { NOMBRE_FUENTE, fechaDe, fmtCOP, quitarAcentos } from "./util";
import type { CuentaDetalle } from "./contexto";
import type { CargaBM, CuentaEvaluada, Panorama } from "../tipos";

export interface Cita {
  fuente: string;
  fecha: string;
}

export interface Respuesta {
  respuesta: string;
  citas: Cita[];
  cuentas: string[];
  modo: ModoIA;
  proveedor: string;
}

const VACIAS = new Set([
  "como", "cual", "cuales", "cuenta", "cuentas", "esta", "estan", "va", "van", "que", "quien", "quienes", "con", "del", "los", "las",
  "una", "uno", "por", "para", "hay", "tiene", "tienen", "seguros", "grupo", "empresa", "empresas", "industrias", "sas", "hoteles",
  "laboratorios", "alimentos", "salud", "integral", "textiles", "logistica", "cliente", "clientes", "riesgo", "rojo", "rojas",
]);

function tokens(s: string): string[] {
  return quitarAcentos(s).split(/[^a-z0-9ñ]+/).filter((t) => t.length >= 4);
}

/** Cuentas mencionadas en la pregunta (coincidencia difusa por empresa o cliente, sin acentos). */
export function cuentasMencionadas(pregunta: string, cuentas: CuentaEvaluada[]): CuentaEvaluada[] {
  const q = quitarAcentos(pregunta);
  const qTokens = new Set(tokens(pregunta));
  const nombres = cuentas.map((c) => ({ c, empresa: quitarAcentos(c.empresa), cliente: quitarAcentos(c.cliente), toks: new Set([...tokens(c.empresa), ...tokens(c.cliente)]) }));
  const frecuencia = new Map<string, number>();
  for (const n of nombres) for (const t of n.toks) frecuencia.set(t, (frecuencia.get(t) ?? 0) + 1);
  const puntuadas = nombres.map((n) => {
    let score = 0;
    if (q.includes(n.empresa)) score += 10;
    if (q.includes(n.cliente)) score += 10;
    for (const t of n.toks) if (qTokens.has(t) && !VACIAS.has(t)) score += 1 / (frecuencia.get(t) ?? 1);
    return { c: n.c, score };
  });
  const max = Math.max(0, ...puntuadas.map((p) => p.score));
  if (max <= 0) return [];
  return puntuadas.filter((p) => p.score === max).map((p) => p.c);
}

function citasDe(d: CuentaDetalle): Cita[] {
  const vistos = new Set<string>();
  const out: Cita[] = [];
  for (const s of d.senales) {
    const fecha = fechaDe(s.leido_en);
    if (!fecha) continue;
    const fuente = NOMBRE_FUENTE[s.fuente];
    if (vistos.has(fuente + fecha)) continue;
    vistos.add(fuente + fecha);
    out.push({ fuente, fecha });
  }
  return out;
}

const ETIQUETA = { verde: "en «Avanzando»", ambar: "en «Mirar de cerca»", rojo: "en «Prioridad esta semana»", sin_lectura: "en «Sin lectura»" } as const;

function refSenal(s: CuentaDetalle["senales"][number]): string {
  const f = fechaDe(s.leido_en);
  return f ? ` [${NOMBRE_FUENTE[s.fuente]}, ${f}]` : "";
}

function respuestaCuentaPlantilla(d: CuentaDetalle): string {
  const alertas = d.senales.filter((s) => s.severidad === "riesgo" || s.severidad === "atencion" || s.severidad === "sin_lectura");
  alertas.sort((a, b) => (a.severidad === "riesgo" ? 0 : 1) - (b.severidad === "riesgo" ? 0 : 1));
  const partes = [`${d.empresa} está ${ETIQUETA[d.semaforo]} (mes ${d.mes_programa}, ${d.zona}, ${fmtCOP(d.fee_mensual_cop)} al mes).`];
  if (alertas.length) partes.push(...alertas.slice(0, 3).map((s) => s.explicacion + refSenal(s)));
  else partes.push("No hay señales de alerta en las fuentes leídas.");
  if (d.accion) partes.push(`Acción: ${d.accion.titulo} (${d.accion.dueno_nombre}).`);
  const otras = citasDe(d).filter((c) => !partes.join(" ").includes(`[${c.fuente}, ${c.fecha}]`));
  if (otras.length) partes.push(`También leído: ${otras.map((c) => `[${c.fuente}, ${c.fecha}]`).join(" ")}.`);
  return partes.join(" ");
}

type Tema = "riesgo" | "carga" | "plata" | null;
function temaGeneral(pregunta: string): Tema {
  const q = quitarAcentos(pregunta);
  if (/(sobrecarg|carga|brand manager|\bbm\b|equipo|redistribu|holgura|capacidad)/.test(q)) return "carga";
  if (/(mensualidad|plata|dinero|facturacion|cuanto.*(riesgo|juego|prioritari))/.test(q)) return "plata";
  if (/(riesgo|rojo|rojas|prioridad|prioritari|parte plana|cancel|se van|peligro|enfri|critic|acumulad|se vea|avance)/.test(q)) return "riesgo";
  return null;
}

function fechaHoyCita(panorama: Panorama): string {
  return panorama.hoy;
}

/** Respuesta determinista a preguntas generales. Cita la lectura simulada de cada fuente por cuenta. */
function generalPlantilla(tema: Exclude<Tema, null>, panorama: Panorama, equipo: CargaBM[]): { texto: string; citas: Cita[]; cuentas: string[] } {
  const rojas = panorama.cuentas.filter((c) => c.semaforo === "rojo");
  const fecha = fechaHoyCita(panorama);
  if (tema === "carga") {
    if (!equipo.length) return { texto: "No tengo datos de carga por brand manager en este momento.", citas: [], cuentas: [] };
    const orden = [...equipo].sort((a, b) => b.rojas - a.rojas || b.cuentas - a.cuentas);
    const top = orden[0];
    const holgura = equipo.filter((e) => e.con_holgura);
    const partes = [
      top.sobrecargado || top.rojas >= 3
        ? `${top.nombre} tiene sobrecarga: ${top.cuentas} cuentas (capacidad ${top.capacidad_max}), ${top.rojas} prioritarias esta semana.`
        : `Nadie supera su capacidad; la más cargada es ${top.nombre} con ${top.cuentas} cuentas y ${top.rojas} prioritarias esta semana.`,
    ];
    if (holgura.length) partes.push(`Con holgura: ${holgura.map((h) => `${h.nombre} (${h.cuentas} cuentas)`).join(", ")}.`);
    if (top.accion) partes.push(`Acción: ${top.accion.titulo} (${top.accion.dueno_nombre}).`);
    partes.push(`[Notion, ${fecha}] [Siigo, ${fecha}]`);
    return { texto: partes.join(" "), citas: [{ fuente: "Notion", fecha }, { fuente: "Siigo", fecha }], cuentas: top.cuentas_ids.filter((id) => rojas.some((r) => r.id === id)) };
  }
  if (tema === "plata") {
    return {
      texto: `${fmtCOP(panorama.resumen.mensualidad_en_riesgo_cop)} en cuentas prioritarias (${rojas.length} esta semana), más ${fmtCOP(panorama.resumen.mensualidad_ambar_cop ?? 0)} en cuentas para mirar de cerca. [Notion, ${fecha}] [Siigo, ${fecha}]`,
      citas: [{ fuente: "Notion", fecha }, { fuente: "Siigo", fecha }],
      cuentas: rojas.map((r) => r.id),
    };
  }
  if (!rojas.length) return { texto: `Ninguna cuenta es prioridad esta semana. [Notion, ${fecha}]`, citas: [{ fuente: "Notion", fecha }], cuentas: [] };
  const lineas = rojas.map((r) => {
    const motivo = r.senales.find((s) => s.severidad === "riesgo");
    return `${r.empresa}${motivo ? ` (${motivo.explicacion.replace(/\.$/, "")})` : ""}`;
  });
  return {
    texto: `${rojas.length} cuentas son prioridad esta semana, ${fmtCOP(panorama.resumen.mensualidad_en_riesgo_cop)} al mes en cuentas prioritarias: ${lineas.join("; ")}. [Notion, ${fecha}] [Circleback, ${fecha}]`,
    citas: [{ fuente: "Notion", fecha }, { fuente: "Circleback", fecha }],
    cuentas: rojas.map((r) => r.id),
  };
}

const RE_CITA = /\[([^\],\]]+),\s*(\d{4}-\d{2}-\d{2})\]/g;
function extraerCitas(texto: string): Cita[] {
  const out: Cita[] = [];
  const vistos = new Set<string>();
  for (const m of texto.matchAll(RE_CITA)) {
    const k = m[1] + m[2];
    if (!vistos.has(k)) {
      vistos.add(k);
      out.push({ fuente: m[1].trim(), fecha: m[2] });
    }
  }
  return out;
}

function contextoCuenta(d: CuentaDetalle) {
  return {
    cuenta_id: d.id,
    empresa: d.empresa,
    cliente: d.cliente,
    brand_manager: d.brand_manager.nombre,
    semaforo: d.semaforo,
    zona: d.zona,
    mes_programa: d.mes_programa,
    fee_mensual_cop: d.fee_mensual_cop,
    accion: d.accion,
    senales: d.senales.map((s) => ({ fuente: NOMBRE_FUENTE[s.fuente], leido_en: fechaDe(s.leido_en), severidad: s.severidad, explicacion: s.explicacion })),
    ultima_reunion: d.reuniones[0] ? { fecha: d.reuniones[0].fecha, resumen: d.reuniones[0].resumen, frases_clave: d.reuniones[0].frases_clave } : null,
  };
}

/**
 * Responde una pregunta libre. Con cuentas mencionadas contesta sobre ellas; con preguntas generales
 * (riesgo, carga, dinero) usa el panorama; si no hay de qué agarrarse, dice que no sabe.
 */
export async function responder(
  pregunta: string,
  panorama: Panorama,
  detalles: Record<string, CuentaDetalle>,
  equipo: CargaBM[] = [],
): Promise<Respuesta> {
  const mencionadas = cuentasMencionadas(pregunta, panorama.cuentas).slice(0, 3);
  const tema = mencionadas.length ? null : temaGeneral(pregunta);

  if (!mencionadas.length && !tema) {
    return {
      respuesta: "No sé responder eso con los datos que tengo. Pregúntame por una cuenta (por ejemplo, \"¿cómo va Andina Seguros?\") o por cuentas prioritarias, carga del equipo o mensualidad en cuentas prioritarias.",
      citas: [],
      cuentas: [],
      modo: "plantilla",
      proveedor: "plantilla",
    };
  }

  let plantilla: string;
  let citasBase: Cita[];
  let ids: string[];
  let contexto: unknown;
  if (mencionadas.length) {
    const ds = mencionadas.map((m) => detalles[m.id]).filter(Boolean);
    plantilla = ds.map(respuestaCuentaPlantilla).join("\n");
    citasBase = ds.flatMap(citasDe);
    ids = mencionadas.map((m) => m.id);
    contexto = { hoy: panorama.hoy, cuentas: ds.map(contextoCuenta) };
  } else {
    const g = generalPlantilla(tema as Exclude<Tema, null>, panorama, equipo);
    plantilla = g.texto;
    citasBase = g.citas;
    ids = g.cuentas;
    contexto = {
      hoy: panorama.hoy,
      resumen: panorama.resumen,
      fecha_lectura_fuentes: panorama.hoy,
      cuentas_en_rojo: panorama.cuentas.filter((c) => c.semaforo === "rojo").map((c) => contextoCuenta(detalles[c.id] ?? ({ ...c, reuniones: [] } as unknown as CuentaDetalle))),
      equipo: equipo.map((e) => ({ nombre: e.nombre, cuentas: e.cuentas, capacidad_max: e.capacidad_max, rojas: e.rojas, sobrecargado: e.sobrecargado, con_holgura: e.con_holgura })),
    };
  }

  const r = await redactar({
    sistema: SISTEMA_PREGUNTAR,
    usuario: `Pregunta: ${pregunta}\n\nContexto (JSON):\n${JSON.stringify(contexto, null, 2)}`,
    maxTokens: 300,
  });
  if (r.modo === "ia" && r.texto) {
    const citas = extraerCitas(r.texto);
    return { respuesta: r.texto, citas: citas.length ? citas : citasBase, cuentas: ids, modo: "ia", proveedor: r.proveedor };
  }
  return { respuesta: plantilla, citas: citasBase, cuentas: ids, modo: "plantilla", proveedor: "plantilla" };
}

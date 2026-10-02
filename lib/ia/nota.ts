import { diasEntre, hoy } from "../fecha";
import { redactar, type ModoIA } from "./proveedor";
import { SISTEMA_NOTA } from "./prompts";
import { contarPalabras, fmtNum, primerNombre } from "./util";
import type { CuentaDetalle } from "./contexto";

export interface EvidenciaNota {
  toques_acumulados: number;
  primer_mes: { impresiones: number; pct_fuera_de_red: number; conversaciones: number; nuevos_seguidores: number; guardados: number };
  ultimos_90_dias_por_mes: { impresiones: number; pct_fuera_de_red: number; conversaciones: number; nuevos_seguidores: number; guardados: number };
  publicaciones_totales: number;
  /** Mismas cifras que la ficha de la cuenta: primeros 30 días vs últimos 30, y vistas fuera de su red. */
  fuera_de_red: { pct_inicial: number; pct_actual: number; impresiones_total: number };
}

export interface NotaBorrador {
  borrador: string;
  modo: ModoIA;
  proveedor: string;
  evidencia: EvidenciaNota | null;
}

const suma = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const pct = (x: number) => Math.round(x * 100);

/** Evidencia de Magnettü: primeros 30 días vs últimos 90 (en promedio mensual para comparar parejo). */
export function evidenciaDe(d: CuentaDetalle, hoyStr: string = hoy()): EvidenciaNota | null {
  const pubs = d.metricas?.publicaciones;
  if (!pubs || pubs.length === 0) return null;
  const orden = pubs.filter((p) => p.fecha <= hoyStr).sort((a, b) => a.fecha.localeCompare(b.fecha));
  if (orden.length === 0) return null;
  const primera = orden[0].fecha;
  const prim = orden.filter((p) => diasEntre(primera, p.fecha) < 30);
  const ult = orden.filter((p) => diasEntre(p.fecha, hoyStr) < 90);
  const meses = Math.min(3, Math.max(1, diasEntre(primera, hoyStr) / 30));
  const resumen = (xs: typeof orden, div: number) => {
    const imp = suma(xs.map((p) => p.impresiones));
    return {
      impresiones: Math.round(imp / div),
      pct_fuera_de_red: imp ? suma(xs.map((p) => p.impresiones * p.pct_fuera_de_red)) / imp : 0,
      conversaciones: Math.round(suma(xs.map((p) => p.conversaciones_iniciadas)) / div),
      nuevos_seguidores: Math.round(suma(xs.map((p) => p.nuevos_seguidores)) / div),
      guardados: Math.round(suma(xs.map((p) => p.guardados)) / div),
    };
  };
  return {
    toques_acumulados: suma(orden.map((p) => p.impresiones)),
    primer_mes: resumen(prim, 1),
    ultimos_90_dias_por_mes: resumen(ult, meses),
    publicaciones_totales: orden.length,
    fuera_de_red: {
      pct_inicial: d.metricas!.pct_fuera_de_red_inicial,
      pct_actual: d.metricas!.pct_fuera_de_red_actual,
      impresiones_total: d.metricas!.alcance_fuera_de_red_total,
    },
  };
}

export function notaPlantilla(d: CuentaDetalle, ev: EvidenciaNota): string {
  const a = ev.primer_mes;
  const b = ev.ultimos_90_dias_por_mes;
  const mejoras: string[] = [];
  const fr = ev.fuera_de_red;
  if (fr.pct_actual > fr.pct_inicial)
    mejoras.push(
      `la parte de tu alcance que llega a personas fuera de tu red pasó de ${pct(fr.pct_inicial)}% a ${pct(fr.pct_actual)}% (${fmtNum(fr.impresiones_total)} vistas fuera de tu red hasta hoy)`,
    );
  if (b.conversaciones > a.conversaciones)
    mejoras.push(`las conversaciones iniciadas subieron de ${fmtNum(a.conversaciones)} a ${fmtNum(b.conversaciones)} al mes`);
  if (b.nuevos_seguidores > a.nuevos_seguidores)
    mejoras.push(`los nuevos seguidores pasaron de ${fmtNum(a.nuevos_seguidores)} a ${fmtNum(b.nuevos_seguidores)} al mes`);
  if (b.guardados > a.guardados) mejoras.push(`los guardados pasaron de ${fmtNum(a.guardados)} a ${fmtNum(b.guardados)} al mes`);
  const lineas = [
    `Hola ${primerNombre(d.cliente)},`,
    "",
    `Quiero mostrarte con tus propios números cómo va ${d.empresa}. Hasta hoy tu contenido suma ${fmtNum(ev.toques_acumulados)} impresiones acumuladas en ${ev.publicaciones_totales} publicaciones.`,
    `En tu primer mes tuviste ${fmtNum(a.impresiones)} impresiones; en los últimos 90 días, en promedio, ${fmtNum(b.impresiones)} al mes. Miramos el periodo completo: una publicación aislada no cuenta toda la historia. La constancia no garantiza resultados.`,
  ];
  if (mejoras.length) lineas.push(`Lo que ya se mueve por debajo de esa línea: ${mejoras.slice(0, 3).join("; ")}.`);
  lineas.push(
    "Lo que se construye ahora no se ve en un solo post; se ve en la suma.",
    "¿Te parece si nos sentamos 20 minutos esta semana para revisarlo juntos?",
    "",
    "Un abrazo,",
    d.brand_manager.nombre,
  );
  return lineas.join("\n");
}

export function notaSinDatos(d: CuentaDetalle): string {
  return [
    `Hola ${primerNombre(d.cliente)},`,
    "",
    "[Borrador pendiente] Todavía no tenemos datos de Magnettü para esta cuenta, así que no hay números propios para mostrar.",
    "Revisa la conexión del conector y los datos del cliente antes de escribirle, y no envíes esta nota tal cual.",
    "",
    d.brand_manager.nombre,
  ].join("\n");
}

/** Borrador de Nota de avance para el cliente, con sus números de Magnettü. Nada sale sin aprobación humana. */
export async function notaDeAvance(d: CuentaDetalle): Promise<NotaBorrador> {
  const ev = evidenciaDe(d);
  if (!ev) return { borrador: notaSinDatos(d), modo: "plantilla", proveedor: "plantilla", evidencia: null };
  const plantilla = notaPlantilla(d, ev);
  const r = await redactar({
    sistema: SISTEMA_NOTA,
    usuario:
      `Cliente: ${d.cliente} (${d.cargo}, ${d.empresa})\nBrand manager (firma): ${d.brand_manager.nombre}\n` +
      `Mes del programa: ${d.mes_programa}\nEvidencia de Magnettü (JSON):\n${JSON.stringify(ev, null, 2)}\n\nEscribe la nota.`,
    maxTokens: 450,
  });
  const usaIA = r.modo === "ia" && contarPalabras(r.texto) > 0;
  return { borrador: usaIA ? r.texto : plantilla, modo: usaIA ? "ia" : "plantilla", proveedor: usaIA ? r.proveedor : "plantilla", evidencia: ev };
}

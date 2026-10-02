import { diasEntre } from "../fecha";
import type { Metricas, Publicacion } from "../tipos";

const suma = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/** Resume las publicaciones de Magnettü de una cuenta. Devuelve null si no hay datos (sin lectura, nunca ceros). */
export function calcularMetricas(
  pubs: Publicacion[],
  postsPactados: number,
  hoyStr: string,
  leidoEn: string | null,
): Metricas | null {
  const orden = pubs.filter((p) => p.fecha <= hoyStr).sort((a, b) => a.fecha.localeCompare(b.fecha));
  if (orden.length === 0) return null;
  const primera = orden[0].fecha;
  const ult = orden.filter((p) => diasEntre(p.fecha, hoyStr) < 30);
  const prim = orden.filter((p) => diasEntre(primera, p.fecha) < 30);
  const pctPond = (xs: Publicacion[]) => {
    const imp = suma(xs.map((p) => p.impresiones));
    return imp ? suma(xs.map((p) => p.impresiones * p.pct_fuera_de_red)) / imp : 0;
  };
  const semanas = new Map<string, Publicacion[]>();
  for (const p of orden) {
    const idx = Math.floor(diasEntre(p.fecha, hoyStr) / 7);
    const clave = String(idx);
    semanas.set(clave, [...(semanas.get(clave) ?? []), p]);
  }
  const serie = [...semanas.entries()]
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .map(([, xs]) => ({
      semana: xs[0].fecha,
      publicaciones: xs.length,
      impresiones: suma(xs.map((p) => p.impresiones)),
      pct_fuera_de_red: Math.round(pctPond(xs) * 1000) / 1000,
      conversaciones: suma(xs.map((p) => p.conversaciones_iniciadas)),
    }));
  return {
    leido_en: leidoEn,
    toques_acumulados: orden.length,
    publicaciones_30d: ult.length,
    cadencia_pct: postsPactados > 0 ? Math.round((ult.length / postsPactados) * 1000) / 10 : null,
    impresiones_30d: suma(ult.map((p) => p.impresiones)),
    impresiones_primeros_30d: suma(prim.map((p) => p.impresiones)),
    alcance_fuera_de_red_total: Math.round(suma(orden.map((p) => p.impresiones * p.pct_fuera_de_red))),
    pct_fuera_de_red_actual: Math.round(pctPond(ult) * 1000) / 1000,
    pct_fuera_de_red_inicial: Math.round(pctPond(prim) * 1000) / 1000,
    conversaciones_30d: suma(ult.map((p) => p.conversaciones_iniciadas)),
    conversaciones_primeras_30d: suma(prim.map((p) => p.conversaciones_iniciadas)),
    conversaciones_total: suma(orden.map((p) => p.conversaciones_iniciadas)),
    nuevos_seguidores_total: suma(orden.map((p) => p.nuevos_seguidores)),
    serie_semanal: serie,
    publicaciones: orden,
  };
}

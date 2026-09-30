import { UMBRALES } from "../../config/umbrales";
import { diasEntre } from "../fecha";
import type { Cuenta, DatosRadar, FuenteId, Senal, Severidad } from "../tipos";

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Severidad cuando el valor debe ser MAYOR que el umbral para alertar. */
export function sevMayorQue(valor: number, atencion: number, riesgo: number): Severidad {
  if (valor > riesgo) return "riesgo";
  if (valor > atencion) return "atencion";
  return "ok";
}
/** Severidad cuando el valor debe ser MAYOR O IGUAL al umbral. */
export function sevMayorIgual(valor: number, atencion: number, riesgo: number): Severidad {
  if (valor >= riesgo) return "riesgo";
  if (valor >= atencion) return "atencion";
  return "ok";
}
/** Severidad cuando el valor debe ser MENOR que el umbral. */
export function sevMenorQue(valor: number, atencion: number, riesgo: number): Severidad {
  if (valor < riesgo) return "riesgo";
  if (valor < atencion) return "atencion";
  return "ok";
}

/** La factura vencida es un tema administrativo (Siigo): nunca decide sola que una cuenta esté en rojo. */
export function esAdministrativa(s: Pick<Senal, "id" | "fuente">): boolean {
  return s.id === "factura_vencida" || s.fuente === "siigo";
}

/** Cuenta cuántas frases clave contienen una palabra de duda, y si alguna es crítica. */
export function frasesDeDuda(frases: string[]): { duda: string[]; critica: boolean } {
  const duda = frases.filter((f) => UMBRALES.frases.palabrasDuda.some((p) => norm(f).includes(norm(p))));
  const critica = duda.some((f) => UMBRALES.frases.palabrasCriticas.some((p) => norm(f).includes(norm(p))));
  return { duda, critica };
}

function sinLectura(
  id: string,
  nombre: string,
  fuente: FuenteId,
  umbral: string,
  motivo: string,
): Senal {
  return {
    id,
    nombre,
    fuente,
    valor: null,
    umbral,
    severidad: "sin_lectura",
    leido_en: null,
    explicacion: motivo,
  };
}

const plural = (n: number, s: string, p: string) => `${n} ${n === 1 ? s : p}`;

/** Calcula las 7 señales de una cuenta. Un dato que falta produce "sin_lectura", nunca ok ni cero. */
export function calcularSenales(cuenta: Cuenta, datos: DatosRadar, hoyStr: string): Senal[] {
  const U = UMBRALES;
  const senales: Senal[] = [];
  const L = datos.leido_en;

  // 1) Días desde la última aprobación (Notion)
  const aprs = datos.aprobaciones?.filter((a) => a.cuenta_id === cuenta.id) ?? [];
  if (!datos.aprobaciones || aprs.length === 0) {
    const m = "No hay lectura del calendario de Notion para esta cuenta.";
    senales.push(sinLectura("aprobacion_dias", "Días sin aprobar contenido", "notion", `> ${U.aprobacion.atencionDias} atención, > ${U.aprobacion.riesgoDias} riesgo`, m));
    senales.push(sinLectura("posts_pendientes", "Posts pendientes de aprobación", "notion", `>= ${U.pendientes.atencion} atención, >= ${U.pendientes.riesgo} riesgo`, m));
  } else {
    const aprobadas = aprs.filter((a) => a.estado === "aprobado" && a.aprobado_en).map((a) => a.aprobado_en as string).sort();
    const referencia = aprobadas.length ? aprobadas[aprobadas.length - 1] : aprs.map((a) => a.enviado_a_cliente).sort()[0];
    const dias = diasEntre(referencia, hoyStr);
    senales.push({
      id: "aprobacion_dias",
      nombre: "Días sin aprobar contenido",
      fuente: "notion",
      valor: dias,
      umbral: `> ${U.aprobacion.atencionDias} atención, > ${U.aprobacion.riesgoDias} riesgo`,
      severidad: sevMayorQue(dias, U.aprobacion.atencionDias, U.aprobacion.riesgoDias),
      leido_en: L.notion ?? null,
      explicacion: aprobadas.length
        ? `El cliente no aprueba contenido hace ${plural(dias, "día", "días")}.`
        : `El cliente aún no aprueba ningún contenido; el primero se envió hace ${plural(dias, "día", "días")}.`,
    });
    const pend = aprs.filter((a) => a.estado === "pendiente").length;
    senales.push({
      id: "posts_pendientes",
      nombre: "Posts pendientes de aprobación",
      fuente: "notion",
      valor: pend,
      umbral: `>= ${U.pendientes.atencion} atención, >= ${U.pendientes.riesgo} riesgo`,
      severidad: sevMayorIgual(pend, U.pendientes.atencion, U.pendientes.riesgo),
      leido_en: L.notion ?? null,
      explicacion: `Hay ${plural(pend, "post pendiente", "posts pendientes")} de aprobación del cliente.`,
    });
  }

  // 2) Cadencia publicada vs pactada (Magnettü)
  const pubs = datos.publicaciones?.filter((p) => p.cuenta_id === cuenta.id) ?? [];
  const umbralCad = `< ${U.cadencia.atencionPct}% atención, < ${U.cadencia.riesgoPct}% riesgo`;
  if (!datos.publicaciones || pubs.length === 0) {
    senales.push(sinLectura("cadencia", "Cadencia publicada vs pactada", "magnettu", umbralCad, "Magnettü no tiene datos de esta cuenta: no se puede medir la cadencia."));
  } else {
    const n = pubs.filter((p) => {
      const d = diasEntre(p.fecha, hoyStr);
      return d >= 0 && d < U.cadencia.ventanaDias;
    }).length;
    const pct = cuenta.posts_pactados_mes > 0 ? (n / cuenta.posts_pactados_mes) * 100 : 100;
    senales.push({
      id: "cadencia",
      nombre: "Cadencia publicada vs pactada",
      fuente: "magnettu",
      valor: Math.round(pct * 100) / 100,
      umbral: umbralCad,
      severidad: sevMenorQue(pct, U.cadencia.atencionPct, U.cadencia.riesgoPct),
      leido_en: L.magnettu ?? null,
      explicacion: `En los últimos ${U.cadencia.ventanaDias} días se publicaron ${n} de ${cuenta.posts_pactados_mes} posts pactados (${Math.round(pct)} %).`,
    });
  }

  // 3) Reunión (Circleback): días y frases de duda
  const reus = (datos.reuniones?.filter((r) => r.cuenta_id === cuenta.id) ?? []).sort((a, b) => a.fecha.localeCompare(b.fecha));
  const umbralReu = `> ${U.reunion.atencionDias} atención, > ${U.reunion.riesgoDias} riesgo`;
  const umbralFra = `${U.frases.atencion} frase atención, >= ${U.frases.riesgo} frases o una explícita (${U.frases.palabrasCriticas.join("/")}) riesgo`;
  if (!datos.reuniones || reus.length === 0) {
    const m = "Circleback no tiene reuniones registradas de esta cuenta.";
    senales.push(sinLectura("reunion_dias", "Días desde la última reunión", "circleback", umbralReu, m));
    senales.push(sinLectura("frases_duda", "Frases de duda en la última reunión", "circleback", umbralFra, m));
  } else {
    const ultima = reus[reus.length - 1];
    const dias = diasEntre(ultima.fecha, hoyStr);
    senales.push({
      id: "reunion_dias",
      nombre: "Días desde la última reunión",
      fuente: "circleback",
      valor: dias,
      umbral: umbralReu,
      severidad: sevMayorQue(dias, U.reunion.atencionDias, U.reunion.riesgoDias),
      leido_en: L.circleback ?? null,
      explicacion: `La última reunión con el cliente fue hace ${plural(dias, "día", "días")}.`,
    });
    const { duda, critica } = frasesDeDuda(ultima.frases_clave);
    let sev: Severidad = "ok";
    // Riesgo solo con una frase explícita (pausar, cancelar, no veo resultados) o con 2 o más frases de duda.
    // "presupuesto" o "no tengo tiempo" solas quedan en atención.
    if (duda.length >= U.frases.riesgo || critica) sev = "riesgo";
    else if (duda.length >= U.frases.atencion) sev = "atencion";
    senales.push({
      id: "frases_duda",
      nombre: "Frases de duda en la última reunión",
      fuente: "circleback",
      valor: duda.length,
      umbral: umbralFra,
      severidad: sev,
      leido_en: L.circleback ?? null,
      explicacion: duda.length
        ? `En la última reunión el cliente dijo: ${duda.map((f) => `"${f}"`).join(" y ")}.`
        : "En la última reunión no aparecieron frases de duda.",
    });
  }

  // 4) Factura vencida (Siigo)
  const facs = datos.facturas?.filter((f) => f.cuenta_id === cuenta.id) ?? [];
  const umbralFac = `> ${U.factura.atencionDias} atención, > ${U.factura.riesgoDias} riesgo`;
  if (!datos.facturas || facs.length === 0) {
    senales.push(sinLectura("factura_vencida", "Tema administrativo: días de factura vencida", "siigo", umbralFac, "Siigo no tiene facturas de esta cuenta: no se sabe si está al día."));
  } else {
    const vencidas = facs
      .filter((f) => f.estado === "vencida" || (f.estado === "pendiente" && diasEntre(f.vence, hoyStr) > 0))
      .map((f) => diasEntre(f.vence, hoyStr));
    const dias = vencidas.length ? Math.max(...vencidas) : 0;
    senales.push({
      id: "factura_vencida",
      nombre: "Tema administrativo: días de factura vencida",
      fuente: "siigo",
      valor: dias,
      umbral: umbralFac,
      severidad: sevMayorQue(dias, U.factura.atencionDias, U.factura.riesgoDias),
      leido_en: L.siigo ?? null,
      explicacion: dias > 0 ? `Tema administrativo: tiene una factura vencida hace ${plural(dias, "día", "días")}.` : "Tema administrativo: no tiene facturas vencidas.",
    });
  }

  // 5) Renovación (Pipedrive) - el riesgo depende de otra señal en atención/riesgo
  const deal = datos.deals?.find((d) => d.cuenta_id === cuenta.id);
  const umbralRen = `< ${U.renovacion.atencionDias} días atención, < ${U.renovacion.riesgoDias} días y otra señal riesgo`;
  if (!datos.deals || !deal) {
    senales.push(sinLectura("renovacion", "Días a la renovación", "pipedrive", umbralRen, "Pipedrive no tiene un deal de renovación para esta cuenta."));
  } else {
    const dias = diasEntre(hoyStr, deal.fecha_renovacion);
    // La factura vencida (tema administrativo) no cuenta como "otra señal" para escalar la renovación.
    const otras = senales.some((s) => !esAdministrativa(s) && (s.severidad === "atencion" || s.severidad === "riesgo"));
    let sev: Severidad = "ok";
    if (dias < U.renovacion.riesgoDias && otras) sev = "riesgo";
    else if (dias < U.renovacion.atencionDias) sev = "atencion";
    senales.push({
      id: "renovacion",
      nombre: "Días a la renovación",
      fuente: "pipedrive",
      valor: dias,
      umbral: umbralRen,
      severidad: sev,
      leido_en: L.pipedrive ?? null,
      explicacion:
        sev === "riesgo"
          ? `La renovación es en ${plural(dias, "día", "días")} y la cuenta ya muestra otras señales que mirar.`
          : `La renovación es en ${plural(dias, "día", "días")}.`,
    });
  }

  return senales;
}

/** ¿Falta alguna fuente crítica (Notion, Magnettü, Siigo) para esta cuenta? */
export function faltaFuenteCritica(senales: Senal[]): boolean {
  return senales.some(
    (s) => s.severidad === "sin_lectura" && (UMBRALES.fuentesCriticas as readonly string[]).includes(s.fuente),
  );
}

import { describe, expect, it } from "vitest";
import { UMBRALES } from "../../../config/umbrales";
import { mesPrograma, zona } from "../zona";
import { calcularSenales, sevMayorIgual, sevMayorQue, sevMenorQue } from "../senales";
import { calcularSemaforo } from "../semaforo";
import { accionDeCuenta } from "../acciones";
import { cargaPorBM } from "../equipo";
import { evaluarCuentas } from "../evaluar";
import { leerTodo } from "../../conectores";
import { calcularMetricas } from "../metricas";
import type { Cuenta, DatosRadar, Senal } from "../../tipos";

const HOY = "2026-10-05";
const bm = { id: "bm1", nombre: "Valentina Correa", email: "v@ejemplo.co", capacidad_max: 6 };

function cuentaBase(over: Partial<Cuenta> = {}): Cuenta {
  return { id: "x1", cliente: "Test", cargo: "CEO", empresa: "Empresa Test", sector: "t", plan: "Pro", fee_mensual_cop: 6_000_000, fecha_inicio: "2026-07-01", brand_manager_id: "bm1", posts_pactados_mes: 8, ...over };
}
/** Datos sanos para una cuenta; se pueden sobreescribir partes. */
function datosSanos(over: Partial<DatosRadar> = {}, cuenta = cuentaBase()): DatosRadar {
  return {
    brand_managers: [bm],
    cuentas: [cuenta],
    aprobaciones: [{ cuenta_id: cuenta.id, post_id: "p1", titulo: "t", enviado_a_cliente: "2026-10-01", aprobado_en: "2026-10-02", estado: "aprobado" }],
    reuniones: [{ cuenta_id: cuenta.id, fecha: "2026-09-25", tipo: "Seguimiento", resumen: "ok", frases_clave: ["vamos bien"] }],
    publicaciones: Array.from({ length: 8 }, (_, i) => ({ cuenta_id: cuenta.id, fecha: `2026-09-${String(10 + i * 2).padStart(2, "0")}`, impresiones: 1000, pct_fuera_de_red: 0.2, reacciones: 10, comentarios: 1, guardados: 1, nuevos_seguidores: 3, conversaciones_iniciadas: 1 })),
    facturas: [{ cuenta_id: cuenta.id, numero: "F1", emitida: "2026-09-20", vence: "2026-10-20", valor_cop: 1, estado: "pendiente" }],
    deals: [{ cuenta_id: cuenta.id, etapa: "Cliente activo", fecha_renovacion: "2027-03-01", valor_cop: 1 }],
    leido_en: { notion: "t", circleback: "t", magnettu: "t", siigo: "t", pipedrive: "t" },
    ...over,
  };
}
const sen = (d: DatosRadar, id: string) => calcularSenales(d.cuentas[0], d, HOY).find((s) => s.id === id)!;

describe("zona", () => {
  it("límites de mes de programa", () => {
    expect(mesPrograma("2026-10-05", HOY)).toBe(1);
    expect(zona("2026-10-05", HOY)).toBe("onboarding");
    expect(zona("2026-09-06", HOY)).toBe("onboarding"); // 29 días
    expect(zona("2026-09-05", HOY)).toBe("parte plana"); // mes 2
    expect(zona("2026-05-06", HOY)).toBe("parte plana"); // mes 5
    expect(zona("2026-05-05", HOY)).toBe("tracción"); // mes 6
    expect(zona("2025-01-01", HOY)).toBe("tracción");
  });
});

describe("umbrales por señal", () => {
  it("funciones de severidad respetan los límites exactos", () => {
    expect(sevMayorQue(7, 7, 12)).toBe("ok");
    expect(sevMayorQue(8, 7, 12)).toBe("atencion");
    expect(sevMayorQue(12, 7, 12)).toBe("atencion");
    expect(sevMayorQue(13, 7, 12)).toBe("riesgo");
    expect(sevMayorIgual(2, 3, 5)).toBe("ok");
    expect(sevMayorIgual(3, 3, 5)).toBe("atencion");
    expect(sevMayorIgual(5, 3, 5)).toBe("riesgo");
    expect(sevMenorQue(70, 70, 50)).toBe("ok");
    expect(sevMenorQue(69, 70, 50)).toBe("atencion");
    expect(sevMenorQue(50, 70, 50)).toBe("atencion");
    expect(sevMenorQue(49, 70, 50)).toBe("riesgo");
  });

  it("días sin aprobar (Notion)", () => {
    const mk = (dias: number) => datosSanos({ aprobaciones: [{ cuenta_id: "x1", post_id: "p", titulo: "t", enviado_a_cliente: "2026-09-01", aprobado_en: `2026-${dias > 5 ? "09" : "10"}-${String(dias > 5 ? 35 - dias : 5 - dias).padStart(2, "0")}`, estado: "aprobado" }] });
    expect(sen(mk(7), "aprobacion_dias").severidad).toBe("ok"); // 7 días: no alerta
    expect(sen(mk(8), "aprobacion_dias").severidad).toBe("atencion");
    expect(sen(mk(12), "aprobacion_dias").severidad).toBe("atencion");
    const r = sen(mk(13), "aprobacion_dias");
    expect(r.severidad).toBe("riesgo");
    expect(r.valor).toBe(13);
    expect(r.explicacion).toContain("no aprueba contenido hace 13 días");
  });

  it("posts pendientes (Notion)", () => {
    const pend = (n: number) => datosSanos().aprobaciones!.concat(Array.from({ length: n }, (_, i) => ({ cuenta_id: "x1", post_id: `q${i}`, titulo: "t", enviado_a_cliente: "2026-10-03", aprobado_en: null, estado: "pendiente" as const })));
    expect(sen(datosSanos({ aprobaciones: pend(2) }), "posts_pendientes").severidad).toBe("ok");
    expect(sen(datosSanos({ aprobaciones: pend(3) }), "posts_pendientes").severidad).toBe("atencion");
    expect(sen(datosSanos({ aprobaciones: pend(5) }), "posts_pendientes").severidad).toBe("riesgo");
  });

  it("cadencia (Magnettü)", () => {
    const base = datosSanos().publicaciones!;
    const con = (n: number) => datosSanos({ publicaciones: base.slice(0, n) }); // pactados 8
    expect(sen(con(6), "cadencia").severidad).toBe("ok"); // 75 %
    expect(sen(con(5), "cadencia").severidad).toBe("atencion"); // 62,5 %
    expect(sen(con(4), "cadencia").severidad).toBe("atencion"); // 50 % exacto
    expect(sen(con(3), "cadencia").severidad).toBe("riesgo"); // 37,5 %
  });

  it("días desde la última reunión (Circleback)", () => {
    const mk = (fecha: string) => datosSanos({ reuniones: [{ cuenta_id: "x1", fecha, tipo: "t", resumen: "", frases_clave: [] }] });
    expect(sen(mk("2026-09-14"), "reunion_dias").severidad).toBe("ok"); // 21 días
    expect(sen(mk("2026-09-13"), "reunion_dias").severidad).toBe("atencion"); // 22
    expect(sen(mk("2026-08-31"), "reunion_dias").severidad).toBe("atencion"); // 35
    expect(sen(mk("2026-08-30"), "reunion_dias").severidad).toBe("riesgo"); // 36
  });

  it("frases de duda (Circleback)", () => {
    const mk = (frases: string[]) => datosSanos({ reuniones: [{ cuenta_id: "x1", fecha: "2026-10-01", tipo: "t", resumen: "", frases_clave: frases }] });
    expect(sen(mk(["vamos bien"]), "frases_duda").severidad).toBe("ok");
    expect(sen(mk(["el presupuesto está apretado"]), "frases_duda").severidad).toBe("atencion");
    expect(sen(mk(["no tengo tiempo", "presupuesto"]), "frases_duda").severidad).toBe("riesgo");
    expect(sen(mk(["quiero pausar"]), "frases_duda").severidad).toBe("riesgo");
    expect(sen(mk(["voy a cancelar"]), "frases_duda").severidad).toBe("riesgo");
  });

  it("factura vencida (Siigo)", () => {
    const mk = (vence: string) => datosSanos({ facturas: [{ cuenta_id: "x1", numero: "F", emitida: "2026-08-01", vence, valor_cop: 1, estado: "vencida" }] });
    expect(sen(datosSanos(), "factura_vencida").severidad).toBe("ok");
    expect(sen(mk("2026-10-04"), "factura_vencida").severidad).toBe("atencion"); // 1 día
    expect(sen(mk("2026-09-20"), "factura_vencida").severidad).toBe("atencion"); // 15
    expect(sen(mk("2026-09-19"), "factura_vencida").severidad).toBe("riesgo"); // 16
  });

  it("renovación (Pipedrive): el riesgo exige otra señal en alerta", () => {
    const deal = (f: string) => [{ cuenta_id: "x1", etapa: "e", fecha_renovacion: f, valor_cop: 1 }];
    expect(sen(datosSanos({ deals: deal("2026-11-19") }), "renovacion").severidad).toBe("ok"); // 45 días
    expect(sen(datosSanos({ deals: deal("2026-11-18") }), "renovacion").severidad).toBe("atencion"); // 44
    expect(sen(datosSanos({ deals: deal("2026-10-20") }), "renovacion").severidad).toBe("atencion"); // 15 días pero sin otra señal
    const conOtra = datosSanos({ deals: deal("2026-10-20"), publicaciones: datosSanos().publicaciones!.slice(0, 3) });
    expect(sen(conOtra, "renovacion").severidad).toBe("riesgo");
  });
});

const s = (id: string, severidad: Senal["severidad"], fuente: Senal["fuente"] = "notion"): Senal => ({ id, nombre: id, fuente, valor: 1, umbral: "", severidad, leido_en: "t", explicacion: "" });

describe("semáforo", () => {
  it("rojo con 2 riesgos, o 1 riesgo en parte plana", () => {
    expect(calcularSemaforo([s("a", "riesgo"), s("b", "riesgo")], "tracción")).toBe("rojo");
    expect(calcularSemaforo([s("a", "riesgo")], "parte plana")).toBe("rojo");
    expect(calcularSemaforo([s("a", "riesgo")], "tracción")).toBe("ambar");
    expect(calcularSemaforo([s("a", "riesgo")], "onboarding")).toBe("ambar");
  });
  it("ámbar con 2 atenciones; una sola atención es verde", () => {
    expect(calcularSemaforo([s("a", "atencion"), s("b", "atencion")], "tracción")).toBe("ambar");
    expect(calcularSemaforo([s("a", "atencion"), s("b", "ok")], "tracción")).toBe("verde");
  });
  it("sin lectura de fuente crítica nunca es verde", () => {
    for (const f of UMBRALES.fuentesCriticas) {
      expect(calcularSemaforo([s("a", "sin_lectura", f), s("b", "ok")], "tracción")).toBe("sin_lectura");
    }
    // Fuente no crítica sin lectura no impide el verde
    expect(calcularSemaforo([s("a", "sin_lectura", "circleback"), s("b", "ok")], "tracción")).toBe("verde");
    // Un rojo sigue siendo rojo aunque falte una fuente
    expect(calcularSemaforo([s("a", "riesgo"), s("b", "sin_lectura", "magnettu")], "parte plana")).toBe("rojo");
  });
});

describe("honestidad: fuente crítica sin lectura", () => {
  const casos: [string, Partial<DatosRadar>][] = [
    ["Notion", { aprobaciones: null }],
    ["Magnettü", { publicaciones: null }],
    ["Siigo", { facturas: null }],
    ["Magnettü sin filas de la cuenta", { publicaciones: [] }],
  ];
  it.each(casos)("%s sin lectura -> la cuenta no es verde", (_n, over) => {
    const r = evaluarCuentas(datosSanos(over), HOY);
    expect(r.cuentas[0].semaforo).not.toBe("verde");
    expect(r.cuentas[0].semaforo).toBe("sin_lectura");
    expect(r.cuentas[0].senales.some((x) => x.severidad === "sin_lectura" && x.valor === null)).toBe(true);
    expect(r.cuentas[0].accion?.titulo).toBe("Revisar conector");
    expect(r.resumen.sin_lectura).toBe(1);
  });
  it("la cuenta sana con todo leído es verde", () => {
    expect(evaluarCuentas(datosSanos(), HOY).cuentas[0].semaforo).toBe("verde");
  });
});

describe("acciones", () => {
  const ev = (over: Partial<DatosRadar>, cuenta?: Partial<Cuenta>) => evaluarCuentas(datosSanos(over, cuentaBase(cuenta)), HOY).cuentas[0];
  it("regla 1: frases de duda + renovación < 45 días -> llamada de Pedro", () => {
    const c = ev({
      reuniones: [{ cuenta_id: "x1", fecha: "2026-10-01", tipo: "t", resumen: "", frases_clave: ["no veo resultados", "pausar"] }],
      deals: [{ cuenta_id: "x1", etapa: "e", fecha_renovacion: "2026-11-12", valor_cop: 1 }],
    });
    expect(c.accion).toMatchObject({ titulo: "Llamada de Pedro esta semana", dueno: "CEO" });
  });
  it("regla 2: parte plana + aprobaciones en riesgo -> nota de avance del BM", () => {
    const c = ev({ aprobaciones: [{ cuenta_id: "x1", post_id: "p", titulo: "t", enviado_a_cliente: "2026-09-01", aprobado_en: "2026-09-10", estado: "aprobado" }] }, { fecha_inicio: "2026-08-01" });
    expect(c.zona).toBe("parte plana");
    expect(c.accion).toMatchObject({ titulo: "Enviar nota de avance", dueno: "BM", dueno_nombre: "Valentina Correa" });
  });
  it("regla 3: factura vencida sola -> recordatorio de pago", () => {
    const c = ev({ facturas: [{ cuenta_id: "x1", numero: "F", emitida: "2026-09-01", vence: "2026-09-30", valor_cop: 1, estado: "vencida" }] });
    expect(c.semaforo).toBe("verde");
    expect(c.accion).toMatchObject({ titulo: "Recordatorio amable de pago", dueno: "administracion" });
  });
  it("cuenta sana no tiene acción", () => {
    expect(ev({}).accion).toBeNull();
  });
  it("accionDeCuenta con frases pero renovación lejana no llama a Pedro", () => {
    const a = accionDeCuenta([s("frases_duda", "atencion"), { ...s("renovacion", "ok", "pipedrive"), valor: 120 }], "tracción", bm);
    expect(a).toBeNull();
  });
});

describe("datos simulados (seed)", () => {
  it("los 3 escenarios rojos, ámbar, sin lectura y sobrecarga", async () => {
    const datos = await leerTodo();
    const p = evaluarCuentas(datos, HOY);
    const emp = (n: string) => p.cuentas.find((c) => c.empresa === n)!;

    const a = emp("Andina Seguros"); // historia 1
    expect(a.semaforo).toBe("rojo");
    expect(a.zona).toBe("parte plana");
    expect(a.senales.filter((x) => x.severidad === "riesgo").map((x) => x.id).sort()).toEqual(["aprobacion_dias", "factura_vencida", "reunion_dias"]);
    expect(a.accion?.titulo).toBe("Enviar nota de avance");
    expect(a.accion?.dueno).toBe("BM");

    const b = emp("Logística Ríoseco"); // historia 2
    expect(b.semaforo).toBe("rojo");
    expect(b.senales.find((x) => x.id === "frases_duda")?.severidad).toBe("riesgo");
    expect(b.accion?.titulo).toBe("Llamada de Pedro esta semana");
    expect(b.accion?.dueno).toBe("CEO");

    const c = emp("Agroexport Cumbres"); // historia 3
    expect(c.semaforo).toBe("rojo");
    const ren = c.senales.find((x) => x.id === "renovacion")!;
    expect(ren.valor).toBe(20);
    expect(ren.severidad).toBe("riesgo");
    expect(Math.round(Number(c.senales.find((x) => x.id === "cadencia")!.valor))).toBe(45);
    expect(c.accion?.titulo).toBe("Enviar nota de avance");

    expect(p.resumen.rojas).toBe(3);
    expect(p.resumen.ambar).toBe(4);
    expect(p.resumen.sin_lectura).toBe(1);
    expect(p.resumen.cuentas).toBe(24);
    expect(p.resumen.mensualidad_en_riesgo_cop).toBe(a.fee_mensual_cop + b.fee_mensual_cop + c.fee_mensual_cop);

    const sl = emp("Salud Integral Pacífico");
    expect(sl.semaforo).toBe("sin_lectura");
    expect(sl.accion?.titulo).toBe("Revisar conector");
    expect(sl.senales.find((x) => x.id === "cadencia")?.valor).toBeNull();

    // Nadie con fuente crítica sin leer es verde
    for (const cu of p.cuentas.filter((x) => x.senales.some((y) => y.severidad === "sin_lectura" && ["notion", "magnettu", "siigo"].includes(y.fuente)))) {
      expect(cu.semaforo).not.toBe("verde");
    }

    // Recordatorio de pago para el verde con factura vencida
    expect(emp("Educa Horizonte").accion?.titulo).toBe("Recordatorio amable de pago");
  });

  it("BM sobrecargado -> Redistribuir cuentas; otro con holgura", async () => {
    const datos = await leerTodo();
    const p = evaluarCuentas(datos, HOY);
    const carga = cargaPorBM(datos.brand_managers, p.cuentas);
    const sobre = carga.filter((x) => x.sobrecargado);
    expect(sobre).toHaveLength(1);
    expect(sobre[0].cuentas).toBe(8);
    expect(sobre[0].rojas).toBe(3);
    expect(sobre[0].accion).toMatchObject({ titulo: "Redistribuir cuentas", dueno: "CEO" });
    expect(carga.filter((x) => x.accion)).toHaveLength(1);
    expect(carga.some((x) => x.con_holgura)).toBe(true);
  });

  it("métricas: parte plana con impresiones bajas y % fuera de red creciendo", async () => {
    const datos = await leerTodo();
    const m = calcularMetricas(datos.publicaciones!.filter((x) => x.cuenta_id === "c02"), 12, HOY, null)!;
    expect(m.pct_fuera_de_red_actual).toBeGreaterThan(m.pct_fuera_de_red_inicial);
    expect(m.conversaciones_30d).toBeGreaterThanOrEqual(m.conversaciones_primeras_30d);
    expect(calcularMetricas([], 8, HOY, null)).toBeNull();
  });
});

describe("ronda 2: facturación aparte del mensaje principal", () => {
  it("la factura vencida sola (aunque sea riesgo) nunca hace rojo, ni en parte plana", () => {
    expect(calcularSemaforo([s("factura_vencida", "riesgo", "siigo")], "parte plana")).toBe("ambar");
    expect(calcularSemaforo([s("factura_vencida", "riesgo", "siigo"), s("x", "atencion")], "parte plana")).toBe("ambar");
  });
  it("rojo exige al menos un riesgo que no sea de facturación", () => {
    expect(calcularSemaforo([s("factura_vencida", "riesgo", "siigo"), s("a", "riesgo")], "tracción")).toBe("rojo");
    expect(calcularSemaforo([s("factura_vencida", "riesgo", "siigo"), s("a", "riesgo", "notion")], "parte plana")).toBe("rojo");
  });
  it("una cuenta en parte plana con factura vencida 60 días y todo lo demás sano queda ámbar", () => {
    const d = datosSanos({ facturas: [{ cuenta_id: "x1", numero: "F", emitida: "2026-07-01", vence: "2026-08-05", valor_cop: 1, estado: "vencida" }] });
    const c = evaluarCuentas(d, HOY).cuentas[0];
    expect(c.zona).toBe("parte plana");
    expect(c.semaforo).toBe("ambar");
  });
  it("la explicación de la factura se enmarca como tema administrativo", () => {
    const d = datosSanos({ facturas: [{ cuenta_id: "x1", numero: "F", emitida: "2026-08-01", vence: "2026-09-19", valor_cop: 1, estado: "vencida" }] });
    expect(sen(d, "factura_vencida").explicacion).toMatch(/^Tema administrativo/);
  });
  it("la factura vencida no escala la renovación a riesgo", () => {
    const d = datosSanos({
      facturas: [{ cuenta_id: "x1", numero: "F", emitida: "2026-08-01", vence: "2026-09-19", valor_cop: 1, estado: "vencida" }],
      deals: [{ cuenta_id: "x1", etapa: "e", fecha_renovacion: "2026-10-20", valor_cop: 1 }],
    });
    expect(sen(d, "renovacion").severidad).toBe("atencion");
  });
});

describe("ronda 2: frases de duda", () => {
  const conFrases = (frases: string[]) =>
    datosSanos({ reuniones: [{ cuenta_id: "x1", fecha: "2026-09-25", tipo: "Seguimiento", resumen: "", frases_clave: frases }] });
  it("'presupuesto' o 'no tengo tiempo' solas son atención, nunca riesgo", () => {
    expect(sen(conFrases(["el presupuesto está apretado"]), "frases_duda").severidad).toBe("atencion");
    expect(sen(conFrases(["ahorita no tengo tiempo"]), "frases_duda").severidad).toBe("atencion");
  });
  it("una frase explícita (pausar, cancelar, no veo resultados) es riesgo", () => {
    expect(sen(conFrases(["quiero pausar"]), "frases_duda").severidad).toBe("riesgo");
    expect(sen(conFrases(["voy a cancelar"]), "frases_duda").severidad).toBe("riesgo");
    expect(sen(conFrases(["no veo resultados"]), "frases_duda").severidad).toBe("riesgo");
  });
  it("dos frases de duda, aunque sean leves, son riesgo", () => {
    expect(sen(conFrases(["el presupuesto está apretado", "no tengo tiempo"]), "frases_duda").severidad).toBe("riesgo");
  });
});

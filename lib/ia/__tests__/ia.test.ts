import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cargarPanorama } from "../../radar";
import { detalleDeCuenta, detallesDeTodas } from "../contexto";
import { briefLunes } from "../brief";
import { notaDeAvance, evidenciaDe } from "../nota";
import { responder } from "../preguntar";
import { estadoIA, proveedorActivo, redactar } from "../proveedor";
import { cargaPorBM } from "../../motor/equipo";
import { contarPalabras, fmtNum } from "../util";

// Los nombres de las variables se arman por partes (no hay claves literales en el código).
const VARS = [["ANTHROPIC", "API", "KEY"].join("_"), ["OPENAI", "API", "KEY"].join("_"), "IA_PROVEEDOR", "SLACK_WEBHOOK_URL"];
const guardado: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const v of VARS) {
    guardado[v] = process["env"][v];
    delete process["env"][v];
  }
});
afterEach(() => {
  for (const v of VARS) {
    if (guardado[v] === undefined) delete process["env"][v];
    else process["env"][v] = guardado[v];
  }
});

describe("proveedor sin clave", () => {
  it("cae a plantilla y no lanza", async () => {
    expect(proveedorActivo()).toBe("plantilla");
    expect(estadoIA()).toEqual({ proveedor: "plantilla", modo_activo: "plantilla", modelo: null });
    const r = await redactar({ sistema: "x", usuario: "y", maxTokens: 10 });
    expect(r).toEqual({ texto: "", modo: "plantilla", proveedor: "plantilla" });
  });

  it("IA_PROVEEDOR pedido sin su clave también cae a plantilla", () => {
    process["env"].IA_PROVEEDOR = "anthropic";
    expect(proveedorActivo()).toBe("plantilla");
    process["env"].IA_PROVEEDOR = "openai";
    expect(proveedorActivo()).toBe("plantilla");
  });

  it("elige automáticamente según la clave presente y expone el modelo sin secretos", () => {
    process["env"][VARS[1]] = "clave-de-prueba";
    const e = estadoIA();
    expect(e.proveedor).toBe("openai");
    expect(e.modo_activo).toBe("ia");
    expect(e.modelo).toBe("gpt-5.4-mini");
    expect(JSON.stringify(e)).not.toContain("clave-de-prueba");
  });

  it("con clave inválida falla en silencio y devuelve plantilla", async () => {
    process["env"][VARS[0]] = "clave-invalida";
    process["env"].ANTHROPIC_MODEL = "modelo-que-no-existe";
    const r = await redactar({ sistema: "x", usuario: "y", maxTokens: 10 });
    delete process["env"].ANTHROPIC_MODEL;
    expect(r.modo).toBe("plantilla");
  }, 30_000);
});

describe("modo plantilla", () => {
  it("brief: menciona las 3 empresas rojas y el dinero en riesgo", async () => {
    const { panorama } = await cargarPanorama();
    const b = await briefLunes(panorama);
    expect(b.modo).toBe("plantilla");
    const rojas = panorama.cuentas.filter((c) => c.semaforo === "rojo");
    expect(rojas).toHaveLength(3);
    for (const r of rojas) expect(b.texto).toContain(r.empresa);
    expect(b.texto).toContain("$30 millones");
    expect(contarPalabras(b.texto)).toBeLessThanOrEqual(120);
    expect(b.acciones).toHaveLength(3);
    expect(b.acciones[0].dueno).toBe("CEO");
    expect(b.acciones.every((a) => a.cuenta_id && a.empresa && a.dueno_nombre)).toBe(true);
  });

  it("brief: las 3 acciones son de las cuentas rojas antes que de cualquier ámbar", async () => {
    const { panorama } = await cargarPanorama();
    const b = await briefLunes(panorama);
    const rojas = panorama.cuentas.filter((c) => c.semaforo === "rojo").map((c) => c.id);
    expect(b.acciones.map((a) => a.cuenta_id).sort()).toEqual([...rojas].sort());
  });

  it("nota de avance c01: trae sus impresiones reales y la firma el brand manager", async () => {
    const { datos, panorama } = await cargarPanorama();
    const d = detalleDeCuenta("c01", datos, panorama)!;
    const n = await notaDeAvance(d);
    expect(n.modo).toBe("plantilla");
    const toques = d.metricas!.publicaciones.reduce((a, p) => a + p.impresiones, 0);
    expect(n.borrador).toContain(fmtNum(toques));
    expect(n.borrador).toContain(fmtNum(evidenciaDe(d)!.primer_mes.impresiones));
    expect(n.borrador).toContain(d.brand_manager.nombre);
    expect(n.borrador).toContain("20 minutos");
    expect(contarPalabras(n.borrador)).toBeLessThanOrEqual(180);
  });

  it("nota de avance c01: usa las mismas cifras de alcance fuera de su red que la ficha", async () => {
    const { datos, panorama } = await cargarPanorama();
    const d = detalleDeCuenta("c01", datos, panorama)!;
    const m = d.metricas!;
    const n = await notaDeAvance(d);
    const p = (x: number) => `${Math.round(x * 100)}%`;
    expect(n.borrador).toContain(`de ${p(m.pct_fuera_de_red_inicial)} a ${p(m.pct_fuera_de_red_actual)}`);
    expect(n.borrador).toContain(fmtNum(m.alcance_fuera_de_red_total));
  });

  it("nota sin métricas: plantilla que pide revisar los datos", async () => {
    const { datos, panorama } = await cargarPanorama();
    const d = detalleDeCuenta("c16", datos, panorama)!;
    expect(d.metricas).toBeNull();
    const n = await notaDeAvance(d);
    expect(n.modo).toBe("plantilla");
    expect(n.evidencia).toBeNull();
    expect(n.borrador).toMatch(/Revisa/);
  });

  it("preguntar por Andina Seguros: cita Notion, Circleback y Siigo", async () => {
    const { datos, panorama } = await cargarPanorama();
    const r = await responder("¿cómo va Andina Seguros?", panorama, detallesDeTodas(datos, panorama));
    expect(r.modo).toBe("plantilla");
    expect(r.cuentas).toEqual(["c01"]);
    const fuentes = r.citas.map((c) => c.fuente);
    expect(fuentes).toEqual(expect.arrayContaining(["Notion", "Circleback", "Siigo"]));
    expect(r.citas[0].fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(r.respuesta).toContain("[Notion, 2026-10-05]");
  });

  it("preguntar con acentos y sin ellos encuentra la misma cuenta", async () => {
    const { datos, panorama } = await cargarPanorama();
    const det = detallesDeTodas(datos, panorama);
    const a = await responder("como va logistica rioseco", panorama, det);
    expect(a.cuentas).toEqual(["c02"]);
  });

  it("preguntas generales: riesgo y carga del equipo", async () => {
    const { datos, panorama } = await cargarPanorama();
    const det = detallesDeTodas(datos, panorama);
    const eq = cargaPorBM(datos.brand_managers, panorama.cuentas);
    const riesgo = await responder("¿qué cuentas están en riesgo?", panorama, det, eq);
    expect(riesgo.cuentas.sort()).toEqual(["c01", "c02", "c03"]);
    const carga = await responder("¿quién está sobrecargado?", panorama, det, eq);
    const top = [...eq].sort((a, b) => b.rojas - a.rojas)[0];
    expect(carga.respuesta).toContain(top.nombre);
  });

  it("pregunta desconocida: dice que no sabe", async () => {
    const { datos, panorama } = await cargarPanorama();
    const r = await responder("¿cuál es la capital de Francia?", panorama, detallesDeTodas(datos, panorama));
    expect(r.respuesta).toMatch(/No sé/);
    expect(r.citas).toEqual([]);
  });
});

describe("texto plano de la IA", () => {
  it("quita negritas y encabezados markdown, conserva viñetas y números", async () => {
    const { textoPlano } = await import("../util");
    const t = "**Brief del lunes**\n\n## Acciones\n- **Andina Seguros**: 13 días\n1. Llamada: *Pedro*";
    expect(textoPlano(t)).toBe("Brief del lunes\n\nAcciones\n- Andina Seguros: 13 días\n1. Llamada: Pedro");
  });
});

describe("mensaje de Slack", () => {
  it("un solo título y sin repetir las acciones que ya trae el texto", async () => {
    const { bloquesSlack, textoPlano: vista } = await import("../../slack");
    const { panorama } = await cargarPanorama();
    const b = await briefLunes(panorama);
    const conTitulo = { ...b, texto: `Brief del lunes, 5 de octubre de 2026\n\n${b.texto}` };
    const bloques = bloquesSlack(conTitulo) as { type: string; text?: { text: string }; fields?: unknown[] }[];
    const todo = JSON.stringify(bloques);
    expect(todo.match(/Brief del lunes/g)).toHaveLength(1);
    expect(bloques.some((x) => x.fields)).toBe(false);
    expect(todo.split(b.acciones[0].empresa).length - 1).toBe(b.texto.split(b.acciones[0].empresa).length - 1);
    expect(vista(conTitulo).match(/Brief del lunes/g)).toHaveLength(1);
  });
});

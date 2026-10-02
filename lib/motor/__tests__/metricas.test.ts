import { describe, expect, it } from "vitest";
import { calcularMetricas } from "../metricas";
import type { Publicacion } from "../../tipos";

const publicacion = (fecha: string, impresiones: number): Publicacion => ({
  cuenta_id: "c01",
  fecha,
  impresiones,
  pct_fuera_de_red: 0.5,
  reacciones: 0,
  comentarios: 0,
  guardados: 0,
  nuevos_seguidores: 0,
  conversaciones_iniciadas: 1,
});

describe("métricas de publicaciones", () => {
  it("excluye publicaciones futuras de acumulados, ventanas y serie semanal", () => {
    const m = calcularMetricas(
      [publicacion("2026-10-01", 100), publicacion("2026-10-06", 900)],
      8,
      "2026-10-05",
      null,
    )!;

    expect(m.toques_acumulados).toBe(1);
    expect(m.publicaciones_30d).toBe(1);
    expect(m.impresiones_30d).toBe(100);
    expect(m.impresiones_primeros_30d).toBe(100);
    expect(m.conversaciones_total).toBe(1);
    expect(m.publicaciones).toHaveLength(1);
    expect(m.serie_semanal).toHaveLength(1);
  });
});

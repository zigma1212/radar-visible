import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { AlmacenEstado } from "../index";
import { precargarBandeja } from "../precarga";

const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});
const almacen = () => {
  const d = mkdtempSync(join(tmpdir(), "radar-precarga-"));
  dirs.push(d);
  return new AlmacenEstado(d);
};

describe("bandeja precargada", () => {
  it("siembra un borrador para Agroexport Cumbres cuando no hay notas", async () => {
    const a = almacen();
    const notas = await precargarBandeja(a);
    expect(notas).toHaveLength(1);
    expect(notas[0]).toMatchObject({ cuenta_id: "c03", empresa: "Agroexport Cumbres", estado: "borrador" });
  });
  it("no vuelve a sembrar si ya hay notas, ni en llamadas repetidas", async () => {
    const a = almacen();
    await Promise.all([precargarBandeja(a), precargarBandeja(a)]);
    await precargarBandeja(a);
    expect(a.listarNotas()).toHaveLength(1);
  });
});

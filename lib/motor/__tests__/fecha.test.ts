import { afterEach, describe, expect, it } from "vitest";
import { hoy } from "../../fecha";

const entorno = process["env"];
const original = entorno.DEMO_TODAY;
afterEach(() => {
  if (original === undefined) delete entorno.DEMO_TODAY;
  else entorno.DEMO_TODAY = original;
});

describe("hoy()", () => {
  it("DEMO_TODAY vacío (línea 'DEMO_TODAY=' en el archivo local) usa la fecha por defecto", () => {
    entorno.DEMO_TODAY = "";
    expect(hoy()).toBe("2026-10-05");
  });
  it("DEMO_TODAY con valor se respeta", () => {
    entorno.DEMO_TODAY = "2026-10-12";
    expect(hoy()).toBe("2026-10-12");
  });
});

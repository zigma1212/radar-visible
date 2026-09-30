import { describe, expect, it } from "vitest";
import { accesoPermitido } from "../acceso";

const basic = (u: string, c: string) => "Basic " + btoa(`${u}:${c}`);

describe("acceso con usuario y clave", () => {
  it("sin credenciales configuradas deja pasar (uso local)", () => {
    expect(accesoPermitido(null, "", "")).toBe(true);
  });
  it("con credenciales configuradas exige la cabecera correcta", () => {
    expect(accesoPermitido(null, "visible", "s3creta")).toBe(false);
    expect(accesoPermitido(basic("visible", "otra"), "visible", "s3creta")).toBe(false);
    expect(accesoPermitido(basic("visible", "s3creta"), "visible", "s3creta")).toBe(true);
  });
  it("tolera basura en la cabecera sin romperse", () => {
    expect(accesoPermitido("Basic %%%", "visible", "s3creta")).toBe(false);
    expect(accesoPermitido("Bearer x", "visible", "s3creta")).toBe(false);
  });
  it("la clave puede contener dos puntos", () => {
    expect(accesoPermitido(basic("visible", "a:b"), "visible", "a:b")).toBe(true);
  });
});

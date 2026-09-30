import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { emparejarCuenta, leerFacturasCSV, normalizarNombre, parsearCSV, parsearFecha, parsearValor, prepararImportacion, ErrorImportacion } from "../facturas";
import { deshacerImportacion, importarFacturas } from "../servicio";
import { cargarPanorama } from "../../radar";
import { leerFuentes } from "../../conectores";

const HOY = "2026-10-05";
const cuentas = [
  { id: "c05", empresa: "Fintec Aurora", cliente: "Camilo Hidalgo Mora" },
  { id: "c08", empresa: "Energía Solaris Andes", cliente: "Lucía Fernanda Montoya" },
  { id: "c12", empresa: "Educa Horizonte", cliente: "Adriana Salcedo Vega" },
  { id: "c19", empresa: "Escudo Andino Ciberseguridad", cliente: "Otra Persona" },
];
const ejemplo = readFileSync(join(__dirname, "..", "..", "..", "data", "ejemplos", "facturas-ejemplo.csv"), "utf8");

describe("parser CSV", () => {
  it("respeta comillas, punto y coma y BOM", () => {
    const t = '﻿Cliente;Número;Total\r\n"Educa; Horizonte";F-1;"3.500.000"\r\n';
    expect(parsearCSV(t)).toEqual([["Cliente", "Número", "Total"], ["Educa; Horizonte", "F-1", "3.500.000"]]);
  });
  it("valores en formatos colombianos y de exportación", () => {
    expect(parsearValor("3.500.000")).toBe(3500000);
    expect(parsearValor("$3,500,000")).toBe(3500000);
    expect(parsearValor("3500000.00")).toBe(3500000);
    expect(parsearValor("3.500.000,50")).toBe(3500001);
    expect(parsearValor("abc")).toBeNull();
  });
  it("fechas ISO y DD/MM/AAAA; rechaza inválidas", () => {
    expect(parsearFecha("2026-09-03")).toBe("2026-09-03");
    expect(parsearFecha("03/09/2026")).toBe("2026-09-03");
    expect(parsearFecha("31/02/2026")).toBeNull();
    expect(parsearFecha("ayer")).toBeNull();
  });
  it("acepta encabezados tipo Siigo en cualquier caja", () => {
    const csv = "CLIENTE,Número,Fecha,VENCIMIENTO,Total,Estado\nEduca Horizonte,F-9,01/08/2026,15/08/2026,\"$1.000.000\",Pendiente";
    const r = leerFacturasCSV(csv, HOY);
    expect(r.filas).toHaveLength(1);
    expect(r.filas[0]).toMatchObject({ numero: "F-9", emitida: "2026-08-01", vence: "2026-08-15", valor_cop: 1000000, estado: "pendiente" });
  });
  it("faltan columnas obligatorias -> error claro; filas malas se descartan con motivo", () => {
    expect(() => leerFacturasCSV("cliente,numero\nA,1", HOY)).toThrow(ErrorImportacion);
    const r = leerFacturasCSV("cliente,numero,emitida,vence,valor,estado\nA,1,2026-01-01,no-fecha,10,pagada\n,2,2026-01-01,2026-02-01,10,pagada\nB,3,2026-01-01,2026-02-01,10,anulada", HOY);
    expect(r.filas).toHaveLength(0);
    expect(r.invalidas.map((x) => x.linea)).toEqual([2, 3]);
    expect(r.anuladas).toBe(1);
  });
});

describe("emparejar clientes con cuentas", () => {
  it("ignora acentos, mayúsculas y sufijos societarios", () => {
    expect(normalizarNombre("ENERGÍA Solaris Andes S.A.S.")).toBe("energia solaris andes");
    expect(emparejarCuenta("energia solaris andes sas", cuentas)).toBe("c08");
    expect(emparejarCuenta("EDUCA HORIZONTE", cuentas)).toBe("c12");
  });
  it("también por nombre del cliente y por contención", () => {
    expect(emparejarCuenta("Camilo Hidalgo Mora", cuentas)).toBe("c05");
    expect(emparejarCuenta("Escudo Andino Ciberseguridad SAS", cuentas)).toBe("c19");
  });
  it("no adivina: desconocidos y ambiguos quedan sin emparejar", () => {
    expect(emparejarCuenta("Distribuidora El Faro Ltda", cuentas)).toBeNull();
    expect(emparejarCuenta("Andina", [{ id: "a", empresa: "Andina Uno", cliente: "x" }, { id: "b", empresa: "Andina Dos", cliente: "y" }])).toBeNull();
  });
  it("prepararImportacion agrupa por cuenta y reporta las no emparejadas", () => {
    const r = prepararImportacion(ejemplo, cuentas, HOY);
    expect(r.filas_leidas).toBe(7);
    expect(r.emparejadas.map((e) => e.cuenta_id).sort()).toEqual(["c05", "c08", "c12"]);
    expect(r.no_emparejadas.map((x) => x.cliente_csv)).toContain("Distribuidora El Faro Ltda");
  });
});

describe("importación real: cambia el semáforo y se puede deshacer", () => {
  let dir: string;
  beforeEach(() => { dir = mkdtempSync(join(tmpdir(), "radar-imp-")); process["env"].RADAR_DATA_DIR = dir; });
  afterEach(() => { delete process["env"].RADAR_DATA_DIR; rmSync(dir, { recursive: true, force: true }); });

  it("una factura vencida importada vuelve ámbar a una cuenta verde, y deshacer lo revierte", async () => {
    const base = await cargarPanorama();
    expect(base.panorama.cuentas.find((c) => c.id === "c12")?.semaforo).toBe("verde");

    const res = await importarFacturas(ejemplo, "facturas-ejemplo.csv");
    expect(res.filas_leidas).toBe(7);
    expect(res.emparejadas.length).toBe(4); // Educa, Fintec, Energía Solaris y Natalia Bermúdez (Software Quilla)
    expect(res.no_emparejadas).toHaveLength(1);
    expect(res.cambios_semaforo).toEqual([{ cuenta_id: "c12", empresa: "Educa Horizonte", antes: "verde", despues: "ambar" }]);

    const { panorama, datos } = await cargarPanorama();
    expect(panorama.cuentas.find((c) => c.id === "c12")?.semaforo).toBe("ambar");
    expect(datos.leido_en.siigo).toBe(res.importada_en);
    const fuentes = await leerFuentes();
    expect(fuentes.fuentes.find((f) => f.id === "siigo")?.modo).toBe("real_csv");

    const undo = await deshacerImportacion();
    expect(undo.deshecha).toBe(true);
    expect(undo.cambios_semaforo[0]).toMatchObject({ cuenta_id: "c12", antes: "ambar", despues: "verde" });
    expect((await cargarPanorama()).panorama.cuentas.find((c) => c.id === "c12")?.semaforo).toBe("verde");
    expect((await leerFuentes()).fuentes.find((f) => f.id === "siigo")?.modo).toBe("simulado");
    expect((await deshacerImportacion()).deshecha).toBe(false);
  });
});

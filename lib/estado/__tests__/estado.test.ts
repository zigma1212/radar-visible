import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { AlmacenEstado, ErrorEstado } from "../index";

const dirs: string[] = [];
const tmp = () => {
  const d = mkdtempSync(join(tmpdir(), "radar-estado-"));
  dirs.push(d);
  return d;
};
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

const nueva = { cuenta_id: "c01", empresa: "Andina Seguros", brand_manager: "Valentina", borrador: "Hola", modo: "plantilla" as const };

describe("almacén de estado", () => {
  it("aprobar persiste tras recargar y queda en auditoría", () => {
    const dir = tmp();
    const a = new AlmacenEstado(dir);
    const n = a.crearNota(nueva);
    const aprobada = a.resolverNota(n.id, "aprobar", "Hola editado");
    expect(aprobada.estado).toBe("aprobada");

    const b = new AlmacenEstado(dir); // "recarga"
    const leida = b.obtenerNota(n.id)!;
    expect(leida.estado).toBe("aprobada");
    expect(leida.texto_final).toBe("Hola editado");
    expect(leida.borrador).toBe("Hola");
    const acciones = b.listarAuditoria().map((x) => x.accion);
    expect(acciones).toEqual(expect.arrayContaining(["nota_creada", "nota_aprobada_editada"]));
    expect(b.solo_memoria).toBe(false);
  });

  it("descartar, y no se puede resolver dos veces", () => {
    const a = new AlmacenEstado(tmp());
    const n = a.crearNota(nueva);
    expect(a.resolverNota(n.id, "descartar").estado).toBe("descartada");
    expect(() => a.resolverNota(n.id, "aprobar")).toThrow(ErrorEstado);
    expect(() => a.resolverNota("no-existe", "aprobar")).toThrow(/no encontrada/);
  });

  it("registra envíos del brief", () => {
    const a = new AlmacenEstado(tmp());
    a.registrar("brief_vista_previa", "Pedro");
    expect(new AlmacenEstado((a as unknown as { dir: string }).dir).listarAuditoria()[0]).toMatchObject({ accion: "brief_vista_previa", actor: "Pedro", nota_id: null });
  });

  it("si no se puede escribir, sigue en memoria con la bandera activa", () => {
    const dir = tmp();
    const archivoBloqueador = join(dir, "es-un-archivo");
    writeFileSync(archivoBloqueador, "x");
    const a = new AlmacenEstado(join(archivoBloqueador, "sub")); // mkdir falla: el padre es un archivo
    const n = a.crearNota(nueva);
    expect(a.solo_memoria).toBe(true);
    a.resolverNota(n.id, "aprobar");
    expect(a.obtenerNota(n.id)!.estado).toBe("aprobada");
  });
});

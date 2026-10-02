import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { marcaDeTiempo } from "../fecha";

import type { Factura } from "../tipos";

export type PersistenciaEstado = "archivo" | "efimera" | "memoria";

export type EstadoNota = "borrador" | "bloqueada" | "aprobada" | "descartada";

export interface Nota {
  id: string;
  cuenta_id: string;
  empresa: string;
  brand_manager: string;
  borrador: string;
  evidencia_disponible?: boolean;
  texto_final: string | null;
  estado: EstadoNota;
  modo: "ia" | "plantilla";
  creada_en: string;
  actualizada_en: string;
}

export interface Auditoria {
  en: string;
  actor: string;
  accion: string;
  nota_id: string | null;
}

/** Facturas importadas desde un CSV (reemplazan a las simuladas de las cuentas emparejadas). */
export interface ImportacionFacturas {
  importada_en: string;
  archivo: string;
  filas_leidas: number;
  facturas: Factura[];
}

interface Contenido {
  notas: Nota[];
  auditoria: Auditoria[];
  importacion?: ImportacionFacturas | null;
}

export interface NuevaNota {
  cuenta_id: string;
  empresa: string;
  brand_manager: string;
  borrador: string;
  evidencia_disponible: boolean;
  modo: "ia" | "plantilla";
}

export class ErrorEstado extends Error {
  constructor(
    mensaje: string,
    public codigo: "no_encontrada" | "ya_resuelta" | "sin_evidencia",
  ) {
    super(mensaje);
  }
}

/**
 * Almacén de notas y auditoría en un archivo JSON (interfaz reemplazable por una base de datos).
 * Si el sistema de archivos es de solo lectura, pasa a memoria y `solo_memoria` queda en true.
 */
export class AlmacenEstado {
  private archivo: string;
  private dir: string;
  private memoria: Contenido | null = null;
  solo_memoria = false;

  get persistencia(): PersistenciaEstado {
    return this.solo_memoria ? "memoria" : process["env"].VERCEL ? "efimera" : "archivo";
  }

  constructor(dir: string) {
    this.dir = dir;
    this.archivo = join(dir, "estado.json");
  }

  private leer(): Contenido {
    if (this.solo_memoria && this.memoria) return this.memoria;
    try {
      const c = JSON.parse(readFileSync(this.archivo, "utf8")) as Contenido;
      return { notas: c.notas ?? [], auditoria: c.auditoria ?? [], importacion: c.importacion ?? null };
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return this.memoria ?? { notas: [], auditoria: [] };
      // archivo ilegible: no lo pisamos en silencio, seguimos en memoria
      this.solo_memoria = true;
      return this.memoria ?? { notas: [], auditoria: [] };
    }
  }

  private guardar(c: Contenido): void {
    this.memoria = c;
    if (this.solo_memoria) return;
    try {
      mkdirSync(this.dir, { recursive: true });
      const tmp = `${this.archivo}.tmp`;
      writeFileSync(tmp, JSON.stringify(c, null, 2), "utf8");
      renameSync(tmp, this.archivo);
    } catch {
      this.solo_memoria = true;
    }
  }

  listarNotas(): Nota[] {
    return [...this.leer().notas].sort((a, b) => b.creada_en.localeCompare(a.creada_en));
  }

  obtenerNota(id: string): Nota | null {
    return this.leer().notas.find((n) => n.id === id) ?? null;
  }

  listarAuditoria(): Auditoria[] {
    return [...this.leer().auditoria].sort((a, b) => b.en.localeCompare(a.en));
  }

  obtenerImportacion(): ImportacionFacturas | null {
    return this.leer().importacion ?? null;
  }

  /** Guarda (reemplazando la anterior) la importación de facturas. */
  guardarImportacion(imp: ImportacionFacturas): void {
    const c = this.leer();
    c.importacion = imp;
    c.auditoria.push({ en: imp.importada_en, actor: "Administración", accion: "importacion_facturas_csv", nota_id: null });
    this.guardar(c);
  }

  /** Quita la importación y el radar vuelve a los datos simulados. Devuelve true si había algo que deshacer. */
  deshacerImportacion(): boolean {
    const c = this.leer();
    if (!c.importacion) return false;
    c.importacion = null;
    c.auditoria.push({ en: marcaDeTiempo(), actor: "Administración", accion: "importacion_facturas_deshecha", nota_id: null });
    this.guardar(c);
    return true;
  }

  registrar(accion: string, actor: string, nota_id: string | null = null): Auditoria {
    const c = this.leer();
    const entrada: Auditoria = { en: marcaDeTiempo(), actor, accion, nota_id };
    c.auditoria.push(entrada);
    this.guardar(c);
    return entrada;
  }

  crearNota(n: NuevaNota): Nota {
    const c = this.leer();
    const ahora = marcaDeTiempo();
    const nota: Nota = {
      id: `n_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      ...n,
      texto_final: null,
      estado: n.evidencia_disponible ? "borrador" : "bloqueada",
      creada_en: ahora,
      actualizada_en: ahora,
    };
    c.notas.push(nota);
    c.auditoria.push({ en: ahora, actor: "Radar", accion: "nota_creada", nota_id: nota.id });
    this.guardar(c);
    return nota;
  }

  resolverNota(id: string, accion: "aprobar" | "descartar", texto?: string): Nota {
    const c = this.leer();
    const nota = c.notas.find((n) => n.id === id);
    if (!nota) throw new ErrorEstado("Nota no encontrada", "no_encontrada");
    if (nota.estado !== "borrador" && nota.estado !== "bloqueada") throw new ErrorEstado(`La nota ya está ${nota.estado}`, "ya_resuelta");
    if (accion === "aprobar" && nota.evidencia_disponible !== true)
      throw new ErrorEstado("No se puede aprobar sin evidencia. Revisa los datos y genera una nueva nota desde la cuenta.", "sin_evidencia");
    const ahora = marcaDeTiempo();
    nota.estado = accion === "aprobar" ? "aprobada" : "descartada";
    nota.texto_final = accion === "aprobar" ? (texto?.trim() ? texto : nota.borrador) : null;
    nota.actualizada_en = ahora;
    const editada = accion === "aprobar" && nota.texto_final !== nota.borrador;
    c.auditoria.push({ en: ahora, actor: nota.brand_manager, accion: accion === "aprobar" ? (editada ? "nota_aprobada_editada" : "nota_aprobada") : "nota_descartada", nota_id: id });
    this.guardar(c);
    return nota;
  }
}

/** Almacén por defecto: radar/.data, o RADAR_DATA_DIR. En Vercel el disco es de solo lectura: usa /tmp (estado efímero). */
let porDefecto: AlmacenEstado | null = null;
export function estado(): AlmacenEstado {
  const env = process["env"];
  const dir = env.RADAR_DATA_DIR || (env.VERCEL ? "/tmp/radar-data" : join(process.cwd(), ".data"));
  if (!porDefecto || (porDefecto as unknown as { dir: string }).dir !== dir) porDefecto = new AlmacenEstado(dir);
  return porDefecto;
}

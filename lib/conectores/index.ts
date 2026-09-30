import fuentes from "../../data/mock/fuentes.json";
import { hoy } from "../fecha";
import { estado } from "../estado";
import * as notion from "./notion";
import * as circleback from "./circleback";
import * as magnettu from "./magnettu";
import * as siigo from "./siigo";
import * as pipedrive from "./pipedrive";
import type { DatosRadar, Fuente, FuenteId, Lectura } from "../tipos";

/** Interfaz común de todos los conectores. */
export interface Conector<T> {
  id: FuenteId;
  leer(): Promise<Lectura<T>>;
}

export const conectores = {
  notion: { id: "notion", leer: notion.leer } as Conector<notion.DatosNotion>,
  circleback: { id: "circleback", leer: circleback.leer } as Conector<Awaited<ReturnType<typeof circleback.leer>>["datos"]>,
  magnettu: { id: "magnettu", leer: magnettu.leer } as Conector<Awaited<ReturnType<typeof magnettu.leer>>["datos"]>,
  siigo: { id: "siigo", leer: siigo.leer } as Conector<Awaited<ReturnType<typeof siigo.leer>>["datos"]>,
  pipedrive: { id: "pipedrive", leer: pipedrive.leer } as Conector<Awaited<ReturnType<typeof pipedrive.leer>>["datos"]>,
};

async function intentar<T>(c: Conector<T>): Promise<Lectura<T> | null> {
  try {
    return await c.leer();
  } catch {
    return null; // fuente caída: el motor la trata como "sin lectura"
  }
}

/** Lee todas las fuentes. Si una falla, queda en null y el motor la marca "sin lectura". */
export async function leerTodo(): Promise<DatosRadar> {
  const [n, c, m, s, p] = await Promise.all([
    intentar(conectores.notion),
    intentar(conectores.circleback),
    intentar(conectores.magnettu),
    intentar(conectores.siigo),
    intentar(conectores.pipedrive),
  ]);
  return {
    brand_managers: n?.datos.brand_managers ?? [],
    cuentas: n?.datos.cuentas ?? [],
    aprobaciones: n?.datos.aprobaciones ?? null,
    reuniones: c?.datos ?? null,
    publicaciones: m?.datos ?? null,
    facturas: s?.datos ?? null,
    deals: p?.datos ?? null,
    leido_en: {
      notion: n?.leido_en ?? null,
      circleback: c?.leido_en ?? null,
      magnettu: m?.leido_en ?? null,
      siigo: s?.leido_en ?? null,
      pipedrive: p?.leido_en ?? null,
    },
  };
}

/** Estado de los conectores (simulado / real, última lectura). */
export async function leerFuentes(): Promise<{ hoy: string; fuentes: Fuente[] }> {
  const imp = estado().obtenerImportacion();
  const lista = (fuentes as Fuente[]).map((f) => {
    if (f.id !== "siigo" || !imp) return f;
    const cuentas = new Set(imp.facturas.map((x) => x.cuenta_id)).size;
    return {
      ...f,
      modo: "real_csv" as const,
      ultima_lectura: imp.importada_en,
      notas: `Real (CSV): ${imp.facturas.length} facturas de ${cuentas} cuentas importadas desde "${imp.archivo}". Las demás cuentas siguen con datos simulados. Se quita desde Importar facturas.`,
    };
  });
  return { hoy: hoy(), fuentes: lista };
}

import { NextResponse } from "next/server";
import { ErrorImportacion } from "@/lib/importar/facturas";
import { deshacerImportacion, estadoImportacion, importarFacturas } from "@/lib/importar/servicio";

export const dynamic = "force-dynamic";

const MAX_BYTES = 2_000_000;

// GET -> { importacion: {importada_en, archivo, filas_leidas, facturas, cuentas} | null }
export async function GET() {
  return NextResponse.json({ importacion: estadoImportacion() });
}

// POST: JSON { csv, archivo? } o el CSV crudo (text/csv). Respuesta: ResumenImportacion.
export async function POST(req: Request) {
  const tipo = req.headers.get("content-type") ?? "";
  let csv = "";
  let archivo = "facturas.csv";
  try {
    if (tipo.includes("json")) {
      const c = await req.json();
      csv = typeof c?.csv === "string" ? c.csv : "";
      if (typeof c?.archivo === "string" && c.archivo.trim()) archivo = c.archivo.trim().slice(0, 120);
    } else {
      csv = await req.text();
    }
  } catch {
    return NextResponse.json({ error: "No se pudo leer el archivo enviado." }, { status: 400 });
  }
  if (!csv.trim()) return NextResponse.json({ error: "El archivo está vacío. Sube un CSV con las columnas cliente, numero, emitida, vence, valor y estado." }, { status: 400 });
  if (csv.length > MAX_BYTES) return NextResponse.json({ error: "El archivo es muy grande (máximo 2 MB)." }, { status: 413 });
  try {
    return NextResponse.json(await importarFacturas(csv, archivo));
  } catch (e) {
    if (e instanceof ErrorImportacion) return NextResponse.json({ error: e.message }, { status: 422 });
    return NextResponse.json({ error: "No se pudo importar el archivo. Revisa que sea un CSV de facturas." }, { status: 500 });
  }
}

// DELETE: deshace la importación -> { deshecha, cambios_semaforo }
export async function DELETE() {
  return NextResponse.json(await deshacerImportacion());
}

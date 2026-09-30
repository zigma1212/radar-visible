import { NextResponse } from "next/server";
import { cargarPanorama } from "@/lib/radar";
import { detalleDeCuenta } from "@/lib/ia/contexto";
import { notaDeAvance } from "@/lib/ia/nota";
import { estado } from "@/lib/estado";

export const dynamic = "force-dynamic";

// GET -> { notas: Nota[], auditoria: Auditoria[], solo_memoria: boolean }
export async function GET() {
  const e = estado();
  const notas = e.listarNotas();
  return NextResponse.json({ notas, auditoria: e.listarAuditoria(), solo_memoria: e.solo_memoria });
}

// POST { cuenta_id } -> { id, borrador, modo, proveedor, nota }
export async function POST(req: Request) {
  const cuerpo = await req.json().catch(() => null);
  const cuentaId = typeof cuerpo?.cuenta_id === "string" ? cuerpo.cuenta_id : "";
  if (!cuentaId) return NextResponse.json({ error: "Falta cuenta_id" }, { status: 400 });
  const { datos, panorama } = await cargarPanorama();
  const detalle = detalleDeCuenta(cuentaId, datos, panorama);
  if (!detalle) return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
  const n = await notaDeAvance(detalle);
  const nota = estado().crearNota({
    cuenta_id: detalle.id,
    empresa: detalle.empresa,
    brand_manager: detalle.brand_manager.nombre,
    borrador: n.borrador,
    modo: n.modo,
  });
  return NextResponse.json({ id: nota.id, borrador: nota.borrador, modo: nota.modo, proveedor: n.proveedor, nota });
}

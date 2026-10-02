import { NextResponse } from "next/server";
import { ErrorEstado, estado } from "@/lib/estado";

export const dynamic = "force-dynamic";

// PATCH { accion: "aprobar"|"descartar", texto? } -> Nota actualizada
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const cuerpo = await req.json().catch(() => null);
  const accion = cuerpo?.accion;
  if (accion !== "aprobar" && accion !== "descartar") {
    return NextResponse.json({ error: 'accion debe ser "aprobar" o "descartar"' }, { status: 400 });
  }
  try {
    const nota = estado().resolverNota(id, accion, typeof cuerpo.texto === "string" ? cuerpo.texto : undefined);
    return NextResponse.json({ ...nota, persistencia: estado().persistencia });
  } catch (e) {
    if (e instanceof ErrorEstado) return NextResponse.json({ error: e.message }, { status: e.codigo === "no_encontrada" ? 404 : 409 });
    throw e;
  }
}

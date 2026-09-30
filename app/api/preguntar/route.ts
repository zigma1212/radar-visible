import { NextResponse } from "next/server";
import { cargarPanorama } from "@/lib/radar";
import { detallesDeTodas } from "@/lib/ia/contexto";
import { responder } from "@/lib/ia/preguntar";
import { cargaPorBM } from "@/lib/motor/equipo";

export const dynamic = "force-dynamic";

// POST { pregunta } -> { respuesta, citas: {fuente, fecha}[], cuentas: {id, empresa}[], modo, proveedor }
export async function POST(req: Request) {
  const cuerpo = await req.json().catch(() => null);
  const pregunta = typeof cuerpo?.pregunta === "string" ? cuerpo.pregunta.trim() : "";
  if (!pregunta) return NextResponse.json({ error: "Falta la pregunta" }, { status: 400 });
  const { datos, panorama } = await cargarPanorama();
  const r = await responder(pregunta.slice(0, 500), panorama, detallesDeTodas(datos, panorama), cargaPorBM(datos.brand_managers, panorama.cuentas));
  // Los enlaces del chat muestran el nombre de la empresa, no el id.
  const cuentas = r.cuentas.map((id) => ({ id, empresa: panorama.cuentas.find((c) => c.id === id)?.empresa ?? id }));
  return NextResponse.json({ ...r, cuentas });
}

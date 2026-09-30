import { NextResponse } from "next/server";
import { cargarPanorama } from "@/lib/radar";
import { briefLunes, type Brief } from "@/lib/ia/brief";
import { enviarBrief } from "@/lib/slack";
import { estado } from "@/lib/estado";

export const dynamic = "force-dynamic";

// Cuerpo opcional: el brief que se vio en pantalla ({texto, acciones, hechos}); si falta, se genera uno nuevo.
// Respuesta: { enviado, destino: "slack"|"vista_previa", vista_previa?, error? }
export async function POST(req: Request) {
  let brief: Brief | null = null;
  try {
    const cuerpo = await req.json();
    if (cuerpo && typeof cuerpo.texto === "string" && Array.isArray(cuerpo.acciones) && cuerpo.hechos?.rojas) brief = cuerpo as Brief;
  } catch {
    // sin cuerpo: se genera el brief
  }
  if (!brief) brief = await briefLunes((await cargarPanorama()).panorama);
  const resultado = await enviarBrief(brief);
  estado().registrar(resultado.enviado ? "brief_enviado_slack" : "brief_vista_previa", "Pedro");
  return NextResponse.json(resultado);
}

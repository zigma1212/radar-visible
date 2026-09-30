import { NextResponse } from "next/server";
import { cargarPanorama } from "@/lib/radar";
import { briefLunes } from "@/lib/ia/brief";

export const dynamic = "force-dynamic";

// Respuesta: { texto, acciones: {titulo, cuenta_id, empresa, dueno, dueno_nombre}[], hechos, modo: "ia"|"plantilla", proveedor }
export async function POST() {
  const { panorama } = await cargarPanorama();
  return NextResponse.json(await briefLunes(panorama));
}

import { NextResponse } from "next/server";
import { leerFuentes } from "@/lib/conectores";

export const dynamic = "force-dynamic";

// Respuesta: { hoy, fuentes: Fuente[] }
export async function GET() {
  return NextResponse.json(await leerFuentes());
}

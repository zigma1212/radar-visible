import { NextResponse } from "next/server";
import { estadoIA } from "@/lib/ia/proveedor";

export const dynamic = "force-dynamic";

// { proveedor: "anthropic"|"openai"|"plantilla", modo_activo: "ia"|"plantilla", modelo: string|null } (sin secretos)
export async function GET() {
  return NextResponse.json(estadoIA());
}

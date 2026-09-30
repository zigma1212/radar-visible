import { NextResponse } from "next/server";
import { cargarPanorama } from "@/lib/radar";

export const dynamic = "force-dynamic";

export async function GET() {
  const { panorama } = await cargarPanorama();
  return NextResponse.json(panorama);
}

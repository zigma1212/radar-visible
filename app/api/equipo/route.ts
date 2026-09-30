import { NextResponse } from "next/server";
import { cargarPanorama } from "@/lib/radar";
import { cargaPorBM } from "@/lib/motor/equipo";

export const dynamic = "force-dynamic";

// Respuesta: { hoy, brand_managers: CargaBM[] } - cada BM con cuentas, rojas, ámbar, mensualidad, sobrecarga y acción de equipo.
export async function GET() {
  const { datos, panorama } = await cargarPanorama();
  return NextResponse.json({ hoy: panorama.hoy, brand_managers: cargaPorBM(datos.brand_managers, panorama.cuentas) });
}

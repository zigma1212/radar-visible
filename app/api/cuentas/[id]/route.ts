import { NextResponse } from "next/server";
import { cargarPanorama } from "@/lib/radar";
import { calcularMetricas } from "@/lib/motor/metricas";

export const dynamic = "force-dynamic";

// Respuesta: CuentaEvaluada & { metricas, reuniones, aprobaciones, facturas, deal }
// metricas es null cuando Magnettü no tiene datos de la cuenta (sin lectura, nunca ceros).
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { datos, panorama } = await cargarPanorama();
  const evaluada = panorama.cuentas.find((c) => c.id === id);
  const cuenta = datos.cuentas.find((c) => c.id === id);
  if (!evaluada || !cuenta) return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
  const pubs = (datos.publicaciones ?? []).filter((p) => p.cuenta_id === id);
  return NextResponse.json({
    ...evaluada,
    metricas: datos.publicaciones ? calcularMetricas(pubs, cuenta.posts_pactados_mes, panorama.hoy, datos.leido_en.magnettu ?? null) : null,
    reuniones: (datos.reuniones ?? []).filter((r) => r.cuenta_id === id).sort((a, b) => b.fecha.localeCompare(a.fecha)),
    aprobaciones: (datos.aprobaciones ?? []).filter((a) => a.cuenta_id === id).sort((a, b) => b.enviado_a_cliente.localeCompare(a.enviado_a_cliente)),
    facturas: (datos.facturas ?? []).filter((f) => f.cuenta_id === id).sort((a, b) => b.vence.localeCompare(a.vence)),
    deal: (datos.deals ?? []).find((d) => d.cuenta_id === id) ?? null,
  });
}

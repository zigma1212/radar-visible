import { cargarPanorama } from "@/lib/radar";
import { calcularMetricas } from "@/lib/motor/metricas";
import { cargaPorBM } from "@/lib/motor/equipo";
import { leerFuentes } from "@/lib/conectores";

export { cargarPanorama, cargaPorBM, leerFuentes };

/** Igual que GET /api/cuentas/[id], pero directo desde el servidor. */
export async function cargarCuenta(id: string) {
  const { datos, panorama } = await cargarPanorama();
  const evaluada = panorama.cuentas.find((c) => c.id === id);
  const cuenta = datos.cuentas.find((c) => c.id === id);
  if (!evaluada || !cuenta) return null;
  const pubs = (datos.publicaciones ?? []).filter((p) => p.cuenta_id === id);
  return {
    hoy: panorama.hoy,
    cuenta: evaluada,
    empresaCliente: cuenta,
    metricas: datos.publicaciones ? calcularMetricas(pubs, cuenta.posts_pactados_mes, panorama.hoy, datos.leido_en.magnettu ?? null) : null,
    reuniones: (datos.reuniones ?? []).filter((r) => r.cuenta_id === id).sort((a, b) => b.fecha.localeCompare(a.fecha)),
    aprobaciones: (datos.aprobaciones ?? []).filter((a) => a.cuenta_id === id).sort((a, b) => b.enviado_a_cliente.localeCompare(a.enviado_a_cliente)),
    facturas: (datos.facturas ?? []).filter((f) => f.cuenta_id === id).sort((a, b) => b.vence.localeCompare(a.vence)),
    deal: (datos.deals ?? []).find((d) => d.cuenta_id === id) ?? null,
    leido_en: datos.leido_en,
    panorama,
    datos,
  };
}

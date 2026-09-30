import { calcularMetricas } from "../motor/metricas";
import type { Aprobacion, CuentaEvaluada, DatosRadar, Deal, Factura, Metricas, Panorama, Reunion } from "../tipos";

/** Forma de GET /api/cuentas/[id]. `metricas` es null si Magnettü no tiene datos (sin lectura). */
export interface CuentaDetalle extends CuentaEvaluada {
  metricas: Metricas | null;
  reuniones: Reunion[];
  aprobaciones: Aprobacion[];
  facturas: Factura[];
  deal: Deal | null;
}

export function detalleDeCuenta(id: string, datos: DatosRadar, panorama: Panorama): CuentaDetalle | null {
  const evaluada = panorama.cuentas.find((c) => c.id === id);
  const cuenta = datos.cuentas.find((c) => c.id === id);
  if (!evaluada || !cuenta) return null;
  const pubs = (datos.publicaciones ?? []).filter((p) => p.cuenta_id === id);
  return {
    ...evaluada,
    metricas: datos.publicaciones ? calcularMetricas(pubs, cuenta.posts_pactados_mes, panorama.hoy, datos.leido_en.magnettu ?? null) : null,
    reuniones: (datos.reuniones ?? []).filter((r) => r.cuenta_id === id).sort((a, b) => b.fecha.localeCompare(a.fecha)),
    aprobaciones: (datos.aprobaciones ?? []).filter((a) => a.cuenta_id === id).sort((a, b) => b.enviado_a_cliente.localeCompare(a.enviado_a_cliente)),
    facturas: (datos.facturas ?? []).filter((f) => f.cuenta_id === id).sort((a, b) => b.vence.localeCompare(a.vence)),
    deal: (datos.deals ?? []).find((d) => d.cuenta_id === id) ?? null,
  };
}

export function detallesDeTodas(datos: DatosRadar, panorama: Panorama): Record<string, CuentaDetalle> {
  const out: Record<string, CuentaDetalle> = {};
  for (const c of panorama.cuentas) {
    const d = detalleDeCuenta(c.id, datos, panorama);
    if (d) out[c.id] = d;
  }
  return out;
}

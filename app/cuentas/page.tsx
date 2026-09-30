import { cargarPanorama } from "@/components/datos";
import { ListaCuentas } from "@/components/lista-cuentas";

export const dynamic = "force-dynamic";
const VALIDOS = ["todas", "rojas", "ambar", "sin_lectura", "plana"] as const;

export default async function Cuentas({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const { f } = await searchParams;
  const inicial = (VALIDOS as readonly string[]).includes(f ?? "") ? (f as (typeof VALIDOS)[number]) : "todas";
  const { panorama } = await cargarPanorama();
  return (
    <div className="page">
      <header>
        <p className="eyebrow">Semáforo por cuenta</p>
        <h1 className="h1">Cuentas</h1>
        <p className="muted" style={{ marginTop: 6 }}>Ordenadas de más a menos urgente. &quot;Sin lectura&quot; significa que falta una fuente clave: no es verde ni cero.</p>
      </header>
      <ListaCuentas cuentas={panorama.cuentas} inicial={inicial} />
    </div>
  );
}

import { Bandeja } from "@/components/bandeja";
import { estado } from "@/lib/estado";
import { precargarBandeja } from "@/lib/estado/precarga";

export const dynamic = "force-dynamic";

export default async function BandejaPage() {
  // Server-side: si no hay notas, se siembra un borrador para Agroexport Cumbres antes de pintar (sin parpadeo de carga).
  const notas = await precargarBandeja(estado());
  return (
    <div className="page">
      <header>
        <p className="eyebrow">Brand manager</p>
        <h1 className="h1">Bandeja de notas</h1>
        <p className="muted" style={{ marginTop: 6 }}>Cada borrador usa datos reales de la cuenta. Edita lo que quieras, luego aprueba o descarta: nada sale sin una persona. Puedes generar más desde la ficha de cada cuenta.</p>
      </header>
      <Bandeja inicial={notas} />
    </div>
  );
}

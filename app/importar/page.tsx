import { ImportarFacturas } from "@/components/importar-facturas";
import { estadoImportacion } from "@/lib/importar/servicio";

export const dynamic = "force-dynamic";

export default function Importar() {
  return (
    <div className="page" style={{ maxWidth: 760 }}>
      <header>
        <p className="eyebrow">Fuente real · sin cuentas ni claves</p>
        <h1 className="h1">Importar facturas</h1>
        <p className="muted" style={{ marginTop: 6 }}>
          Sube el CSV de facturas de tu programa contable y el radar lo usa en lugar de los datos simulados de Siigo, solo para las cuentas que reconozca. Puedes deshacerlo cuando quieras.
        </p>
      </header>
      <ImportarFacturas activa={estadoImportacion()} />
    </div>
  );
}

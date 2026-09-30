import { readFileSync } from "node:fs";
import { join } from "node:path";

export const dynamic = "force-dynamic";

// Descarga el CSV de ejemplo (data/ejemplos/facturas-ejemplo.csv).
export async function GET() {
  const cuerpo = readFileSync(join(process.cwd(), "data", "ejemplos", "facturas-ejemplo.csv"), "utf8");
  return new Response(cuerpo, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="facturas-ejemplo.csv"',
    },
  });
}

import { NextResponse, type NextRequest } from "next/server";
import { accesoPermitido } from "@/lib/acceso";

// Pide usuario y clave en la demo publicada (variables DEMO_USUARIO y DEMO_CLAVE en Vercel).
export function proxy(request: NextRequest) {
  const entorno = process["env"];
  if (accesoPermitido(request.headers.get("authorization"), entorno.DEMO_USUARIO ?? "", entorno.DEMO_CLAVE ?? "")) {
    return NextResponse.next();
  }
  return new NextResponse("Esta demo requiere usuario y clave.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Radar Visible", charset="UTF-8"' },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};

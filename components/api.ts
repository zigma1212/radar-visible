// Cliente mínimo para las rutas de API. Nunca lanza: devuelve { ok, data, error } con un mensaje amable.
export type Resp<T> = { ok: true; data: T } | { ok: false; error: string };

export async function llamar<T>(url: string, init?: RequestInit & { json?: unknown }): Promise<Resp<T>> {
  try {
    const { json, ...rest } = init ?? {};
    const res = await fetch(url, {
      ...rest,
      headers: json !== undefined ? { "content-type": "application/json" } : undefined,
      body: json !== undefined ? JSON.stringify(json) : undefined,
      cache: "no-store",
    });
    const tipo = res.headers.get("content-type") ?? "";
    if (!tipo.includes("json")) {
      return { ok: false, error: "Esta función todavía no está disponible. Intenta de nuevo en un momento." };
    }
    const data = await res.json();
    if (!res.ok) return { ok: false, error: typeof data?.error === "string" ? data.error : "No pudimos completar la acción. Intenta de nuevo." };
    return { ok: true, data: data as T };
  } catch {
    return { ok: false, error: "No hay conexión con el servidor. Revisa que la app esté corriendo e intenta otra vez." };
  }
}

// Acceso con usuario y clave (autenticación básica) para la demo publicada.
// Solo se activa si existen DEMO_USUARIO y DEMO_CLAVE; en local, sin ellas, todo queda abierto.

/** true si no hay credenciales configuradas o si la cabecera Authorization trae las correctas. */
export function accesoPermitido(cabecera: string | null, usuario: string, clave: string): boolean {
  if (!usuario || !clave) return true;
  if (!cabecera?.startsWith("Basic ")) return false;
  let decodificado: string;
  try {
    decodificado = atob(cabecera.slice(6).trim());
  } catch {
    return false;
  }
  const i = decodificado.indexOf(":");
  if (i < 0) return false;
  // El usuario no distingue mayúsculas ("Visible" = "visible"); la clave sí.
  return iguales(decodificado.slice(0, i).trim().toLowerCase(), usuario.toLowerCase()) && iguales(decodificado.slice(i + 1), clave);
}

/** Comparación que no se corta en el primer carácter distinto. */
function iguales(a: string, b: string): boolean {
  let diferencia = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diferencia |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diferencia === 0;
}

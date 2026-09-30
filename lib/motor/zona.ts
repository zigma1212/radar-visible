import { UMBRALES } from "../../config/umbrales";
import { mesesCompletos } from "../fecha";
import type { Zona } from "../tipos";

/** Mes de programa: 1 durante el primer mes desde fecha_inicio, 2 el siguiente, etc. */
export function mesPrograma(fechaInicio: string, hoyStr: string): number {
  return Math.max(1, mesesCompletos(fechaInicio, hoyStr) + 1);
}

/** 1 -> onboarding; 2-5 -> parte plana; >=6 -> tracción. */
export function zonaDeMes(mes: number): Zona {
  if (mes <= UMBRALES.zona.onboardingHasta) return "onboarding";
  if (mes <= UMBRALES.zona.partePlanaHasta) return "parte plana";
  return "tracción";
}

export function zona(fechaInicio: string, hoyStr: string): Zona {
  return zonaDeMes(mesPrograma(fechaInicio, hoyStr));
}

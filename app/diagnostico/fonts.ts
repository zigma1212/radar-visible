import { Instrument_Serif, Raleway } from "next/font/google";

/** Fuentes de Visible, solo para /diagnostico. */
export const serif = Instrument_Serif({ variable: "--f-serif", subsets: ["latin"], weight: "400", style: "italic", display: "swap" });
export const raleway = Raleway({ variable: "--f-raleway", subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], display: "swap" });

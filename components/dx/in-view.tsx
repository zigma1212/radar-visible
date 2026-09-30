"use client";
import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from "react";

/** Marca `is-in` cuando el elemento entra en vista (una sola vez). El CSS hace el resto. */
export function InView({ as: Tag = "div", className, style, children, threshold = 0.15 }: {
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  threshold?: number;
}) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (quieto || typeof IntersectionObserver === "undefined") {
      el.classList.add("is-in");
      return;
    }
    const io = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting)) {
          el.classList.add("is-in");
          io.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return (
    <Tag ref={ref} className={className} style={style}>
      {children}
    </Tag>
  );
}

/** Bloque que aparece con blur a nítido + fade. `d` = retardo en ms. */
export function Reveal({ as, className = "", d = 0, children }: { as?: ElementType; className?: string; d?: number; children: ReactNode }) {
  return (
    <InView as={as} className={`rv ${className}`.trim()} style={{ "--d": `${d}ms` } as CSSProperties}>
      {children}
    </InView>
  );
}

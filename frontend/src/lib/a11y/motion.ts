"use client";

import { useEffect, useState } from "react";

export function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return prefersReduced;
}

export function usePrefersReducedTransparency(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-transparency: reduce)");
    setPrefersReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return prefersReduced;
}

export function usePrefersContrast(): "no-preference" | "more" | "less" {
  const [contrast, setContrast] = useState<"no-preference" | "more" | "less">("no-preference");

  useEffect(() => {
    const more = window.matchMedia("(prefers-contrast: more)");
    const less = window.matchMedia("(prefers-contrast: less)");
    const update = () => {
      if (more.matches) setContrast("more");
      else if (less.matches) setContrast("less");
      else setContrast("no-preference");
    };
    update();
    more.addEventListener("change", update);
    less.addEventListener("change", update);
    return () => {
      more.removeEventListener("change", update);
      less.removeEventListener("change", update);
    };
  }, []);

  return contrast;
}

export function shouldReduceMotion(prefersReduced: boolean): object {
  return prefersReduced
    ? { style: { animation: "none", transition: "none" } }
    : {};
}

export function useReducedMotionClass(base: string, reducedClass: string): string {
  const prefersReduced = usePrefersReducedMotion();
  return prefersReduced ? reducedClass : base;
}

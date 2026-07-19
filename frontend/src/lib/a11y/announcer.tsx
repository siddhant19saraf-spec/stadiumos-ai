// @ts-nocheck
"use client";

import { useEffect, useRef, useCallback, createContext, useContext, type ReactNode } from "react";

type Assertiveness = "polite" | "assertive";

interface Announcement {
  message: string;
  assertiveness: Assertiveness;
  id: number;
}

interface AnnouncerContextValue {
  announce: (message: string, assertiveness?: Assertiveness) => void;
}

const AnnouncerContext = createContext<AnnouncerContextValue>({
  announce: () => {},
});

export function useAnnouncer(): AnnouncerContextValue {
  return useContext(AnnouncerContext);
}

export function AnnouncerProvider({ children }: { children: ReactNode }) {
  const politeRef = useRef<HTMLDivElement>(null);
  const assertiveRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef(0);

  const announce = useCallback((message: string, assertiveness: Assertiveness = "polite") => {
    counterRef.current++;
    const el = assertiveness === "assertive" ? assertiveRef.current : politeRef.current;
    if (!el) return;
    el.textContent = "";
    requestAnimationFrame(() => {
      el.textContent = message;
    });
  }, []);

  return (
    <AnnouncerContext value={{ announce }}>
      {children}
      <div
        ref={politeRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      <div
        ref={assertiveRef}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      />
    </AnnouncerContext>
  );
}

export function useLiveRegion() {
  const announcer = useAnnouncer();
  const announcePolite = useCallback(
    (message: string) => announcer.announce(message, "polite"),
    [announcer],
  );
  const announceAssertive = useCallback(
    (message: string) => announcer.announce(message, "assertive"),
    [announcer],
  );
  return { announcePolite, announceAssertive };
}

export function AriaLiveRegion({ message, assertiveness = "polite" }: { message: string; assertiveness?: Assertiveness }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current || !message) return;
    ref.current.textContent = "";
    requestAnimationFrame(() => {
      if (ref.current) ref.current.textContent = message;
    });
  }, [message]);
  return (
    <div
      ref={ref}
      role={assertiveness === "assertive" ? "alert" : "status"}
      aria-live={assertiveness}
      aria-atomic="true"
      className="sr-only"
    />
  );
}


"use client";

import { useRef, useEffect, useCallback, type ReactNode } from "react";
import { createFocusScope } from "@/lib/a11y/focus-manager";
import { useEscape } from "@/lib/a11y/keyboard-nav";

interface AccessibleDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}

export function AccessibleDialog({ open, onClose, title, description, children }: AccessibleDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEscape(onClose, [onClose]);

  useEffect(() => {
    if (open) {
      previousFocus.current = document.activeElement as HTMLElement;
      const scope = createFocusScope(dialogRef);
      scope.activate();
      return () => {
        scope.deactivate();
        previousFocus.current?.focus();
      };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="a11y-dialog-title"
        aria-describedby={description ? "a11y-dialog-desc" : undefined}
        className="relative max-w-lg w-full mx-4 rounded-xl border border-white/10 bg-background p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="a11y-dialog-title" className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-white/10 transition-colors"
            aria-label="Close dialog"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" /></svg>
          </button>
        </div>
        {description && <p id="a11y-dialog-desc" className="text-sm text-white/60 mb-4">{description}</p>}
        {children}
      </div>
    </div>
  );
}

export function useDialogControls() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const show = useCallback(() => dialogRef.current?.showModal(), []);
  const close = useCallback(() => dialogRef.current?.close(), []);
  return { dialogRef, show, close };
}

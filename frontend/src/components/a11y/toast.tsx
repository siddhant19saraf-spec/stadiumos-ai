"use client";

import { useEffect, useState, useCallback } from "react";

interface ToastItem {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
}

let toastCounter = 0;
let addToastFn: ((t: Omit<ToastItem, "id">) => void) | null = null;

export function showToast(message: string, type: ToastItem["type"] = "info") {
  addToastFn?.({ message, type });
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((t: Omit<ToastItem, "id">) => {
    const id = `toast-${++toastCounter}`;
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 5000);
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    return () => { addToastFn = null; };
  }, [addToast]);

  const typeStyles: Record<ToastItem["type"], string> = {
    success: "border-green-500/30 bg-green-500/10 text-green-400",
    error: "border-red-500/30 bg-red-500/10 text-red-400",
    info: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
    warning: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
  };

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`rounded-lg border px-4 py-3 text-sm shadow-lg backdrop-blur-sm animate-in slide-in-from-bottom-2 ${typeStyles[t.type]}`}
        >
          <div className="flex items-center gap-2">
            <span aria-hidden="true">
              {t.type === "success" ? "✓" : t.type === "error" ? "✕" : t.type === "warning" ? "!" : "ℹ"}
            </span>
            <span>{t.message}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

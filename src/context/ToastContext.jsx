// src/context/ToastContext.jsx
import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(({ type = "info", message, title = "", duration = 4000, action = null }) => {
    const id = crypto.randomUUID();
    const newToast = { id, type, message, title, action };

    setToasts((prev) => [...prev.slice(-2), newToast]); // Max 3 toasts

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, [removeToast]);

  const toast = {
    success: (message, title, action) => addToast({ type: "success", message, title, action }),
    error: (message, title, action) => addToast({ type: "danger", message, title, action }),
    info: (message, title, action) => addToast({ type: "info", message, title, action }),
    dismiss: removeToast
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast container (bottom-right) */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-pop transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${
              t.type === "success"
                ? "bg-surface border-success/30 text-ink"
                : t.type === "danger"
                ? "bg-surface border-danger/30 text-ink"
                : "bg-surface border-primary/30 text-ink"
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {t.type === "success" && <CheckCircle2 className="w-5 h-5 text-success" />}
              {t.type === "danger" && <AlertCircle className="w-5 h-5 text-danger" />}
              {t.type === "info" && <Info className="w-5 h-5 text-primary" />}
            </div>
            <div className="flex-1 text-sm">
              {t.title && <div className="font-semibold text-ink mb-0.5">{t.title}</div>}
              <div className="text-ink-secondary text-xs leading-relaxed">{t.message}</div>
              {t.action && (
                <button
                  type="button"
                  onClick={() => {
                    t.action.onClick();
                    removeToast(t.id);
                  }}
                  className="mt-2 text-xs font-semibold text-primary hover:underline block"
                >
                  {t.action.label}
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="text-ink-faint hover:text-ink shrink-0 p-1"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, AlertTriangle, Info } from "lucide-react";
import "../styles/toast.css";

type ToastType = "success" | "error" | "info";

type ToastContextType = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
  } | null>(null);

  const showToast = useCallback(
    (message: string, type: ToastType = "success") => {
      setToast({ message, type });

      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);

      return () => clearTimeout(timer);
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className={`toast-notification ${toast.type} animate-in`}>
          {toast.type === "success" && (
            <CheckCircle size={18} color="#00ff88" style={{ flexShrink: 0 }} />
          )}
          {toast.type === "error" && (
            <AlertTriangle
              size={18}
              color="#ff3333"
              style={{ flexShrink: 0 }}
            />
          )}
          {toast.type === "info" && (
            <Info size={18} color="#00bfff" style={{ flexShrink: 0 }} />
          )}
          <span className="toast-text">{toast.message}</span>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast deve ser usado dentro de um ToastProvider");
  }
  return context;
}

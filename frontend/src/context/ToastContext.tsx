"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle2, AlertTriangle, Info, Loader2, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export type ToastType = "success" | "error" | "info" | "loading";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType) => string;
  dismissToast: (id: string) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
  showLoading: (message: string) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (type !== "loading") {
      setTimeout(() => {
        dismissToast(id);
      }, 4000);
    }

    return id;
  }, [dismissToast]);

  const showSuccess = useCallback((message: string) => {
    showToast(message, "success");
  }, [showToast]);

  const showError = useCallback((message: string) => {
    showToast(message, "error");
  }, [showToast]);

  const showInfo = useCallback((message: string) => {
    showToast(message, "info");
  }, [showToast]);

  const showLoading = useCallback((message: string) => {
    return showToast(message, "loading");
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast, showSuccess, showError, showInfo, showLoading }}>
      {children}
      
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => {
            let icon = <Info className="w-5 h-5 text-blue-500 shrink-0" />;
            let bgStyles = "bg-slate-900/90 dark:bg-slate-950/90 border-blue-500/20";
            
            if (toast.type === "success") {
              icon = <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
              bgStyles = "bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/20";
            } else if (toast.type === "error") {
              icon = <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />;
              bgStyles = "bg-rose-500/10 dark:bg-rose-500/15 border-rose-500/20";
            } else if (toast.type === "loading") {
              icon = <Loader2 className="w-5 h-5 text-indigo-500 animate-spin shrink-0" />;
              bgStyles = "bg-indigo-500/10 dark:bg-indigo-500/15 border-indigo-500/20";
            }

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-lg ${bgStyles}`}
              >
                {icon}
                <div className="flex-1 text-xs font-semibold text-foreground/90 leading-snug">
                  {toast.message}
                </div>
                <button
                  onClick={() => dismissToast(toast.id)}
                  className="text-muted-foreground hover:text-foreground shrink-0 cursor-pointer p-0.5 rounded-lg hover:bg-accent/40"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
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

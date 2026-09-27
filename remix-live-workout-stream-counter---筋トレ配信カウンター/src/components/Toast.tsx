import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning';
  title: string;
  subtitle?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts }) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`flex items-start gap-3 p-3.5 rounded-xl shadow-2xl border backdrop-blur-md text-white ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/50'
                : toast.type === 'warning'
                ? 'bg-amber-950/90 border-amber-500/50'
                : 'bg-neutral-900/95 border-neutral-700'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="font-bold text-sm leading-snug">{toast.title}</div>
              {toast.subtitle && (
                <div className="text-xs text-neutral-300 mt-0.5 whitespace-pre-wrap">{toast.subtitle}</div>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

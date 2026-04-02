import React, { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

const icons: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

const colors: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: { bg: 'rgba(5,150,105,0.15)', border: 'rgba(5,150,105,0.4)', icon: 'var(--emerald-light, #10b981)' },
  error:   { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)', icon: '#ef4444' },
  warning: { bg: 'rgba(217,119,6,0.15)', border: 'rgba(217,119,6,0.4)', icon: 'var(--amber-light, #f59e0b)' },
  info:    { bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.4)', icon: '#818cf8' },
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  const [exiting, setExiting] = useState(false);
  const c = colors[toast.type];

  useEffect(() => {
    const duration = toast.duration ?? 4000;
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onDismiss(toast.id), 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  return (
    <div
      className={`toast flex items-start gap-3 px-4 py-3 rounded-xl shadow-2xl ${exiting ? 'exiting' : ''}`}
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        minWidth: '280px',
        maxWidth: '400px',
        backdropFilter: 'blur(12px)',
      }}
    >
      <span className="text-lg font-bold shrink-0" style={{ color: c.icon }}>
        {icons[toast.type]}
      </span>
      <p className="text-sm flex-1 leading-snug" style={{ color: 'var(--text-primary)' }}>
        {toast.message}
      </p>
      <button
        onClick={() => { setExiting(true); setTimeout(() => onDismiss(toast.id), 300); }}
        className="shrink-0 opacity-50 hover:opacity-100 transition-opacity text-xs"
        style={{ color: 'var(--text-secondary)' }}
      >
        ✕
      </button>
    </div>
  );
};

const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2"
      style={{ pointerEvents: 'none' }}
    >
      {toasts.map(t => (
        <div key={t.id} style={{ pointerEvents: 'all' }}>
          <ToastItem toast={t} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
};

export default Toast;

// Hook for toast management
let _toastCounter = 0;
export function createToast(
  message: string,
  type: ToastType = 'info',
  duration = 4000
): ToastMessage {
  return { id: `toast-${++_toastCounter}`, message, type, duration };
}

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(({ message, type = 'info', duration = 4000 }) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const success = useCallback((message, duration) => addToast({ message, type: 'success', duration }), [addToast]);
  const error = useCallback((message, duration) => addToast({ message, type: 'error', duration }), [addToast]);
  const info = useCallback((message, duration) => addToast({ message, type: 'info', duration }), [addToast]);

  return (
    <ToastContext.Provider value={{ success, error, info, addToast }}>
      {children}
      <div className="civic-toast-container" role="region" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`civic-toast ${toast.type}`}>
            <div className="pt-0.5">
              {toast.type === 'success' && <CheckCircle2 size={18} className="text-success" />}
              {toast.type === 'error' && <AlertCircle size={18} className="text-danger" />}
              {toast.type === 'info' && <Info size={18} className="text-primary" />}
            </div>
            <div className="flex-grow-1">{toast.message}</div>
            <button
              type="button"
              className="btn btn-sm p-0 text-muted border-0"
              onClick={() => removeToast(toast.id)}
              aria-label="Close notification"
            >
              <X size={15} />
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
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

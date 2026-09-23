import React, { createContext, useContext, useState, useCallback } from 'react';
import { Glass } from './primitives';

interface ToastItem {
  id: string;
  message: string;
  type?: 'default' | 'info' | 'warn';
}

interface ConfirmOptions {
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface UIContextValue {
  toast: (message: string, type?: 'default' | 'info' | 'warn') => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const UIContext = createContext<UIContextValue | null>(null);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    options: ConfirmOptions;
    resolve: (val: boolean) => void;
  } | null>(null);

  const toast = useCallback((message: string, type: 'default' | 'info' | 'warn' = 'default') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmDialog({ options, resolve });
    });
  }, []);

  const handleConfirm = (val: boolean) => {
    if (confirmDialog) {
      confirmDialog.resolve(val);
      setConfirmDialog(null);
    }
  };

  return (
    <UIContext.Provider value={{ toast, confirm }}>
      {children}

      {/* Toasts overlay matching index.css .toast-stack */}
      {toasts.length > 0 && (
        <div className="toast-stack" aria-live="polite">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`toast ${t.type === 'warn' ? 'toast-warn' : t.type === 'info' ? 'toast-info' : ''}`}
            >
              <span>{t.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal Sheet matching index.css .sheet-scrim & .sheet */}
      {confirmDialog && (
        <div
          className="sheet-scrim"
          onClick={() => handleConfirm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 400 }}
          >
            <Glass strong className="sheet">
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>
                {confirmDialog.options.title}
              </h3>
              <p className="muted" style={{ marginTop: 8, fontSize: 13.5, lineHeight: 1.5 }}>
                {confirmDialog.options.body}
              </p>

              <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => handleConfirm(false)}
                >
                  {confirmDialog.options.cancelLabel || 'ยกเลิก'}
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  style={
                    confirmDialog.options.destructive
                      ? { background: 'linear-gradient(150deg, #E4325F, #A6322A)' }
                      : undefined
                  }
                  onClick={() => handleConfirm(true)}
                >
                  {confirmDialog.options.confirmLabel || 'ตกลง'}
                </button>
              </div>
            </Glass>
          </div>
        </div>
      )}
    </UIContext.Provider>
  );
};

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return ctx;
}

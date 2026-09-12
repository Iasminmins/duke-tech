import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

type ToastKind = 'success' | 'error';
type ToastItem = { id: number; kind: ToastKind; message: string };
type ToastContextValue = { success: (message: string) => void; error: (message: string) => void };
const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);
  const remove = useCallback((id: number) => setItems(prev => prev.filter(item => item.id !== id)), []);
  const push = useCallback((kind: ToastKind, message: string) => {
    const id = ++idRef.current;
    setItems(prev => [...prev, { id, kind, message }]);
    window.setTimeout(() => remove(id), 4500);
  }, [remove]);
  const value: ToastContextValue = { success: message => push('success', message), error: message => push('error', message) };
  return <ToastContext.Provider value={value}>
    {children}
    <div className="toast-viewport" role="status" aria-live="polite">
      {items.map(item => <div key={item.id} className={`toast toast-${item.kind}`}>
        <span>{item.message}</span>
        <button type="button" aria-label="Fechar notificação" onClick={() => remove(item.id)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>)}
    </div>
  </ToastContext.Provider>;
}

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) throw new Error('useToast deve ser usado dentro de ToastProvider');
  return value;
}

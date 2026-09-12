import { useEffect, useRef, type ReactNode } from 'react';

type DrawerProps = { open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode };

export function Drawer({ open, onClose, title, description, children }: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) { if (event.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKeyDown);
    const focusTarget = panelRef.current?.querySelector<HTMLElement>('input,select,textarea,button');
    focusTarget?.focus();
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;
  return <div className="drawer-overlay" onClick={onClose}>
    <div className="drawer-panel" role="dialog" aria-modal="true" aria-label={title} ref={panelRef} onClick={event => event.stopPropagation()}>
      <header className="drawer-header">
        <div><h3>{title}</h3>{description && <p className="muted">{description}</p>}</div>
        <button type="button" className="icon-button" aria-label="Fechar" onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </header>
      <div className="drawer-body">{children}</div>
    </div>
  </div>;
}

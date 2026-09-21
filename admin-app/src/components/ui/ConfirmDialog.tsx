import { useEffect, useRef } from 'react';

type Props = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Substitui window.confirm: acessivel (role=alertdialog), fecha com Esc e devolve o foco ao acionador. */
export function ConfirmDialog({ open, title, description, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', destructive = false, busy = false, onConfirm, onCancel }: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) { if (event.key === 'Escape') onCancel(); }
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('keydown', onKeyDown); previous?.focus?.(); };
  }, [open, onCancel]);

  if (!open) return null;
  return <div className="confirm-overlay" onClick={onCancel}>
    <div className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby={description ? 'confirm-desc' : undefined} onClick={event => event.stopPropagation()}>
      <h3 id="confirm-title">{title}</h3>
      {description && <p id="confirm-desc">{description}</p>}
      <div className="actions">
        <button type="button" className="btn" ref={cancelRef} onClick={onCancel} disabled={busy}>{cancelLabel}</button>
        <button type="button" className={`btn ${destructive ? 'danger solid' : 'primary'}`} onClick={onConfirm} disabled={busy} aria-busy={busy}>{busy ? 'Aguarde…' : confirmLabel}</button>
      </div>
    </div>
  </div>;
}

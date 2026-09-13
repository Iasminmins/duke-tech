import type { ReactNode } from 'react';

export type BadgeTone = 'neutral' | 'info' | 'warning' | 'success' | 'danger' | 'urgent';

const pillClass: Record<BadgeTone, string> = { neutral: 'neutral', info: 'blue', warning: 'gold', success: 'green', danger: 'red', urgent: 'red urgent' };
const tagClass: Record<BadgeTone, string> = { neutral: '', info: '', warning: 'tone-amber', success: 'tone-green', danger: 'tone-red', urgent: 'tone-red' };

type Props = { tone: BadgeTone; children: ReactNode; variant?: 'pill' | 'tag'; className?: string };

/** Componente único de status/prioridade: paleta semântica fixa (neutro/info/aviso/sucesso/erro/urgente). */
export function Badge({ tone, children, variant = 'pill', className = '' }: Props) {
  if (variant === 'tag') {
    return <span className={`priority-tag ${tagClass[tone]} ${className}`.trim()}><i className="priority-dot" />{children}</span>;
  }
  return <span className={`badge ${pillClass[tone]} ${className}`.trim()}>{children}</span>;
}

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon, type IconName } from './Icon';

type Tone = 'blue' | 'violet' | 'green' | 'amber' | 'red';

type Props = {
  label: string;
  value: ReactNode;
  icon?: IconName;
  tone?: Tone;
  note?: ReactNode;
  to?: string;
  primary?: boolean;
};

/** Card de indicador único do produto: ícone opcional com fundo colorido, valor tabular, nota secundária. */
export function KpiCard({ label, value, icon, tone = 'blue', note, to, primary }: Props) {
  const className = `metric-card${primary ? ' is-primary' : ''}`;
  const body = <>
    {icon && !primary && <div className={`metric-icon ${tone}`}><Icon name={icon} size={19} /></div>}
    <div className="metric-label">{label}</div>
    <strong>{value}</strong>
    {note && <div className="metric-foot">{note}</div>}
  </>;
  if (to) return <Link className={className} to={to}>{body}</Link>;
  return <article className={className}>{body}</article>;
}

import { Link } from 'react-router-dom';
import { Icon } from './Icon';

type Props = { icon?: Parameters<typeof Icon>[0]['name']; title: string; description: string; actionLabel: string; actionTo: string; example?: string };
export function EmptyState({ icon = 'box', title, description, actionLabel, actionTo, example }: Props) {
  return <div className="empty-state"><img className="empty-state-mascot" src={`${import.meta.env.BASE_URL}duke-mascote.webp`} alt="" width="64" height="116" loading="lazy" /><h3>{title}</h3><p>{description}</p>{example && <small>{example}</small>}<Link className="btn primary" to={actionTo}><Icon name="plus" size={16}/>{actionLabel}</Link></div>;
}

import { Link } from 'react-router-dom';
import { Icon } from './Icon';

type Props = { icon?: Parameters<typeof Icon>[0]['name']; title: string; description: string; actionLabel: string; actionTo: string; example?: string };
export function EmptyState({ icon = 'box', title, description, actionLabel, actionTo, example }: Props) {
  return <div className="empty-state"><div className="empty-state-icon"><Icon name={icon} size={24}/></div><h3>{title}</h3><p>{description}</p>{example && <small>{example}</small>}<Link className="btn primary" to={actionTo}><Icon name="plus" size={16}/>{actionLabel}</Link></div>;
}

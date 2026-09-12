import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useParams } from 'react-router-dom';
import { Icon } from '../../components/ui/Icon';
import { getPublicTracking, getPublicStoreProfile, subscribeToTracking, type PublicTracking } from './trackingRepository';

const statusLabel: Record<string, string> = { received: 'Recebido', diagnosis: 'Em diagnóstico', quote_sent: 'Orçamento enviado', awaiting_approval: 'Aguardando aprovação', approved: 'Aprovado', rejected: 'Reprovado', awaiting_part: 'Aguardando peça', repair: 'Em reparo', testing: 'Em testes', ready: 'Pronto para retirada', delivered: 'Entregue', cancelled: 'Cancelado' };

type StatusTone = 'blue' | 'amber' | 'green' | 'red';
const statusMeta: Record<string, { icon: Parameters<typeof Icon>[0]['name']; tone: StatusTone; fallback: string }> = {
  received: { icon: 'inbox', tone: 'blue', fallback: 'Recebemos seu aparelho. Em breve nossa equipe inicia a análise.' },
  diagnosis: { icon: 'search', tone: 'blue', fallback: 'Nossa equipe está analisando seu aparelho com cuidado.' },
  quote_sent: { icon: 'file', tone: 'amber', fallback: 'Enviamos o orçamento do reparo. Aguardamos sua aprovação.' },
  awaiting_approval: { icon: 'file', tone: 'amber', fallback: 'Aguardando sua aprovação para seguir com o reparo.' },
  approved: { icon: 'check', tone: 'blue', fallback: 'Orçamento aprovado. O reparo será iniciado em breve.' },
  rejected: { icon: 'x', tone: 'red', fallback: 'O orçamento não foi aprovado. Fale com a nossa equipe para mais detalhes.' },
  awaiting_part: { icon: 'wrench', tone: 'amber', fallback: 'Estamos aguardando uma peça para concluir o reparo.' },
  repair: { icon: 'wrench', tone: 'blue', fallback: 'Seu aparelho está em reparo com a nossa equipe técnica.' },
  testing: { icon: 'wrench', tone: 'blue', fallback: 'Reparo concluído. Estamos testando tudo antes de liberar.' },
  ready: { icon: 'check', tone: 'green', fallback: 'Seu aparelho está pronto! Pode vir retirar quando quiser.' },
  delivered: { icon: 'check', tone: 'green', fallback: 'Aparelho entregue. Obrigado por confiar na Duke Tech!' },
  cancelled: { icon: 'x', tone: 'red', fallback: 'Este atendimento foi cancelado. Fale com a nossa equipe para mais informações.' },
};

const steps: { label: string; icon: Parameters<typeof Icon>[0]['name']; statuses: string[] }[] = [
  { label: 'Recebido', icon: 'inbox', statuses: ['received'] },
  { label: 'Em diagnóstico', icon: 'search', statuses: ['diagnosis'] },
  { label: 'Aguardando aprovação', icon: 'file', statuses: ['quote_sent', 'awaiting_approval'] },
  { label: 'Em reparo', icon: 'wrench', statuses: ['approved', 'awaiting_part', 'repair', 'testing'] },
  { label: 'Finalizado', icon: 'check', statuses: ['ready', 'delivered'] },
];
const stepOf = (status: string) => steps.findIndex(step => step.statuses.includes(status));

export function PublicTrackingPage() {
  const { codigo = '' } = useParams();
  const [tracking, setTracking] = useState<PublicTracking | null>(null);
  const [store, setStore] = useState({ companyName: 'Duke Tech', logoUrl: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { getPublicStoreProfile().then(setStore); }, []);
  useEffect(() => {
    let stop = () => {};
    getPublicTracking(codigo).then(({ data, error }) => {
      setTracking(data); if (error) setError(error.message); setLoading(false);
      if (data) stop = subscribeToTracking(data.public_code, () => getPublicTracking(codigo).then(({ data: next }) => setTracking(next)));
    });
    return () => stop();
  }, [codigo]);

  const meta = tracking ? statusMeta[tracking.status] : null;
  const currentStep = useMemo(() => tracking ? stepOf(tracking.status) : -1, [tracking]);

  return <main className="tracking">
    <div className="tracking-shell">
      <header className="tracking-topbar">
        <div className={`brand-mark${store.logoUrl ? ' has-logo' : ''}`}>{store.logoUrl ? <img src={store.logoUrl} alt={store.companyName} /> : 'D'}</div>
        <div><strong>{store.companyName}</strong><span>Acompanhamento de reparo</span></div>
      </header>

      <section className="card tracking-card">
        {loading ? <div className="tracking-skeleton" role="status" aria-live="polite" aria-label="Consultando comanda">
          <span className="skeleton-row" style={{ width: 140, height: 20 }} />
          <span className="skeleton-row" style={{ width: '70%', height: 30, marginTop: 14 }} />
          <span className="skeleton-row" style={{ width: '40%', height: 16, marginTop: 10 }} />
          <span className="skeleton-row" style={{ width: '100%', height: 84, marginTop: 24, borderRadius: 16 }} />
          <span className="skeleton-row" style={{ width: '100%', height: 64, marginTop: 24, borderRadius: 16 }} />
        </div> : error || !tracking ? <div className="tracking-empty">
          <span className="tracking-empty-icon"><Icon name="x" size={22} /></span>
          <strong>Não encontramos uma comanda com este código.</strong>
          <p className="muted">Confira o link enviado pela nossa equipe ou fale com a Duke Tech para conferir o código correto.</p>
        </div> : <>
          <span className="tracking-pill">Acompanhamento público</span>
          <h1 className="tracking-title">Acompanhe o reparo do seu aparelho</h1>
          <div className="tracking-order-meta">
            <span className="tracking-order-number">Comanda #{tracking.number}</span>
            <span className="tracking-device">{tracking.brand} {tracking.model}</span>
          </div>

          <div className={`tracking-status-highlight tone-${meta?.tone || 'blue'}`}>
            <span className="tracking-status-icon"><Icon name={meta?.icon || 'inbox'} size={22} /></span>
            <div>
              <strong>{statusLabel[tracking.status] || tracking.status}</strong>
              <p>{tracking.public_message || meta?.fallback || 'Nossa equipe está cuidando do seu aparelho.'}</p>
            </div>
          </div>

          {currentStep >= 0 ? <div className="tracking-timeline" role="list" aria-label="Etapas do reparo">
            <span className="tracking-timeline-track" aria-hidden="true"><span className="tracking-timeline-progress" style={{ '--tl-progress': `${(currentStep / (steps.length - 1)) * 100}%` } as CSSProperties} /></span>
            {steps.map((step, index) => {
              const state = index < currentStep ? 'done' : index === currentStep ? 'current' : 'upcoming';
              return <div className={`tracking-step is-${state}${state === 'current' ? ` tone-${meta?.tone || 'blue'}` : ''}`} role="listitem" key={step.label} aria-current={state === 'current' ? 'step' : undefined}>
                <span className="tracking-step-dot">{state === 'done' ? <Icon name="check" size={14} /> : <Icon name={step.icon} size={14} />}</span>
                <span className="tracking-step-label">{step.label}</span>
              </div>;
            })}
          </div> : <p className="tracking-cancelled-note"><Icon name="x" size={15} /> Este atendimento não segue mais o fluxo padrão de reparo.</p>}

          <div className="tracking-info-grid">
            <div className="tracking-info-card">
              <Icon name="clock" size={17} />
              <span>Última atualização</span>
              <strong>{new Date(tracking.updated_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</strong>
            </div>
            <div className="tracking-info-card">
              <Icon name="calendar" size={17} />
              <span>Previsão de conclusão</span>
              <strong>{tracking.estimated_due_date ? new Date(`${tracking.estimated_due_date}T12:00:00`).toLocaleDateString('pt-BR') : 'A definir'}</strong>
            </div>
          </div>

          <p className="tracking-trust"><Icon name="refresh" size={14} /> Você poderá acompanhar qualquer mudança no status por este link.</p>
        </>}
      </section>

      <p className="tracking-privacy">Não exibimos CPF, senha do aparelho, custos internos ou observações administrativas.</p>
    </div>
  </main>;
}

import { FormEvent, useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { defaultStoreSettings } from '../finance/financeUtils';
import { permissionsByRole, roleLabels, type Role } from '../users/userUtils';
import { useToast } from '../../components/ui/ToastProvider';
import { dayOrder, dayLabels, defaultBusinessHours, type DayKey, type DayHours, type BusinessHours } from '../../lib/businessHours';

type Settings = { companyName: string; phone: string; whatsapp: string; address: string; whatsappMessage: string; privacyMessage: string; logoUrl: string };
type Notifications = { lowStock: boolean; newOrder: boolean; dueToday: boolean; whatsappReminders: boolean };

const initial: Settings = defaultStoreSettings;
const defaultHours: BusinessHours = defaultBusinessHours;
const defaultNotifications: Notifications = { lowStock: true, newOrder: true, dueToday: true, whatsappReminders: false };
const moduleLabels: Record<string, string> = { dashboard: 'Visão geral', comandas: 'Comandas', clientes: 'Clientes', aparelhos: 'Aparelhos', agenda: 'Agenda', produtos: 'Produtos', estoque: 'Estoque', vendas: 'Vendas', financeiro: 'Financeiro', relatorios: 'Relatórios', usuarios: 'Usuários', configuracoes: 'Configurações' };
const tabs = [
  { id: 'identidade', label: 'Identidade visual' },
  { id: 'loja', label: 'Dados da loja' },
  { id: 'horarios', label: 'Horários' },
  { id: 'notificacoes', label: 'Notificações' },
  { id: 'permissoes', label: 'Permissões' },
  { id: 'preferencias', label: 'Preferências' },
] as const;
type TabId = typeof tabs[number]['id'];

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];

async function persistStoreProfile(form: Settings) {
  if (!supabase) return { error: new Error('Supabase não configurado.') };
  const value = { companyName: form.companyName, phone: form.phone, whatsapp: form.whatsapp, address: form.address, logoUrl: form.logoUrl };
  const update = await supabase.from('store_settings').update({ value }).eq('key', 'store_profile').select('key').maybeSingle();
  if (update.error) return { error: update.error };
  if (update.data) return { error: null };
  const insert = await supabase.from('store_settings').insert({ key: 'store_profile', value });
  return { error: insert.error };
}

async function upsertSetting(key: string, value: unknown) {
  if (!supabase) return { error: new Error('Supabase não configurado.') };
  const update = await supabase.from('store_settings').update({ value }).eq('key', key).select('key').maybeSingle();
  if (update.error) return { error: update.error };
  if (update.data) return { error: null };
  const insert = await supabase.from('store_settings').insert({ key, value });
  return { error: insert.error };
}

export function SettingsPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<TabId>('identidade');
  const [form, setForm] = useState<Settings>(initial);
  const [hours, setHours] = useState<BusinessHours>(defaultHours);
  const [notifications, setNotifications] = useState<Notifications>(defaultNotifications);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState('');
  const [logoError, setLogoError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.from('store_settings').select('key,value').in('key', ['store_profile', 'whatsapp_messages', 'privacy', 'business_hours', 'notifications']).then(({ data, error: queryError }) => {
      if (queryError) setError('Não foi possível carregar as configurações.');
      const values: any = Object.fromEntries((data || []).map(item => [item.key, item.value]));
      const merged = { ...initial, ...(values.store_profile || {}), ...(values.whatsapp_messages || {}), ...(values.privacy || {}) };
      setForm(Object.fromEntries(Object.entries(initial).map(([key, fallback]) => [key, merged[key] ?? fallback])) as Settings);
      setHours({ ...defaultHours, ...(values.business_hours || {}) });
      setNotifications({ ...defaultNotifications, ...(values.notifications || {}) });
      setLoading(false);
    });
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault(); if (!supabase) return; setSaving(true); setError('');
    const results = await Promise.all([
      persistStoreProfile(form),
      upsertSetting('whatsapp_messages', { whatsappMessage: form.whatsappMessage }),
      upsertSetting('privacy', { privacyMessage: form.privacyMessage }),
      upsertSetting('business_hours', hours),
      upsertSetting('notifications', notifications),
    ]);
    if (results.some(result => result.error)) setError('Não foi possível salvar as configurações.'); else toast.success('Configurações salvas com sucesso.');
    setSaving(false);
  }

  async function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file || !supabase) return;
    setLogoError('');
    if (!ACCEPTED_TYPES.includes(file.type)) { setLogoError('Envie um arquivo PNG, JPG, WEBP ou SVG.'); return; }
    if (file.size > MAX_LOGO_BYTES) { setLogoError('A imagem precisa ter até 2 MB.'); return; }
    setUploadingLogo(true);
    const extension = file.name.split('.').pop() || 'png';
    const path = `logo-${crypto.randomUUID()}.${extension}`;
    const upload = await supabase.storage.from('store-assets').upload(path, file, { upsert: false, cacheControl: '3600' });
    if (upload.error) { setLogoError('Não foi possível enviar a imagem.'); setUploadingLogo(false); return; }
    const { data: publicUrlData } = supabase.storage.from('store-assets').getPublicUrl(path);
    const nextForm = { ...form, logoUrl: publicUrlData.publicUrl };
    const persisted = await persistStoreProfile(nextForm);
    if (persisted.error) { setLogoError('A imagem foi enviada, mas não foi possível salvá-la nas configurações.'); } else { setForm(nextForm); toast.success('Logo atualizada.'); }
    setUploadingLogo(false);
  }

  async function removeLogo() {
    if (!supabase) return;
    const nextForm = { ...form, logoUrl: '' };
    setUploadingLogo(true);
    const persisted = await persistStoreProfile(nextForm);
    if (persisted.error) setLogoError('Não foi possível remover a logo.'); else { setForm(nextForm); toast.success('Logo removida.'); }
    setUploadingLogo(false);
  }

  function updateDay(day: DayKey, patch: Partial<DayHours>) { setHours(prev => ({ ...prev, [day]: { ...prev[day], ...patch } })); }

  if (loading) return <section className="content"><div className="card loading-skeleton" role="status" aria-live="polite"><span /><span /><span /><span /></div></section>;

  return <section className="content settings-page">
    {error && <div className="error" role="alert">{error}</div>}

    <div className="toolbar command-filters" role="tablist" aria-label="Seções de configurações">
      {tabs.map(tab => <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} className={`btn${activeTab === tab.id ? ' active' : ''}`} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>)}
    </div>

    <form onSubmit={submit}>
      {activeTab === 'identidade' && <div className="settings-tab-grid">
        <div className="form-card">
          <h3>Identidade visual</h3>
          <p className="muted" style={{ marginTop: 4 }}>Usada no painel, na página pública de acompanhamento e como referência para peças de comunicação com o cliente.</p>
          <div className="logo-uploader">
            <div className="logo-preview" aria-hidden={!form.logoUrl}>
              {form.logoUrl ? <img src={form.logoUrl} alt="Logo da Duke Tech" /> : <span>{form.companyName.slice(0, 2).toUpperCase()}</span>}
            </div>
            <div className="logo-uploader-actions">
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden onChange={handleLogoChange} />
              <button type="button" className="btn" disabled={uploadingLogo} onClick={() => fileInputRef.current?.click()}>{uploadingLogo ? 'Enviando…' : form.logoUrl ? 'Trocar logo' : 'Enviar logo'}</button>
              {form.logoUrl && <button type="button" className="btn" disabled={uploadingLogo} onClick={removeLogo}>Remover</button>}
              <p className="muted logo-hint">PNG, JPG, WEBP ou SVG · até 2 MB. Prefira fundo transparente.</p>
              {logoError && <div className="error" role="alert">{logoError}</div>}
            </div>
          </div>
        </div>
        <div className="form-card brand-preview-card">
          <h3>Pré-visualização</h3>
          <p className="muted" style={{ marginTop: 4 }}>Como a marca aparece no menu do painel.</p>
          <div className="brand-preview">
            <div className="brand">
              <div className={`brand-mark${form.logoUrl ? ' has-logo' : ''}`}>{form.logoUrl ? <img src={form.logoUrl} alt="" /> : 'D'}</div>
              <div className="brand-copy"><strong>{form.companyName.split('|')[0].trim() || 'Duke Tech'}</strong><small>Gestão operacional</small></div>
            </div>
          </div>
        </div>
      </div>}

      {activeTab === 'loja' && <div className="form-card">
        <h3>Dados da loja</h3>
        <div className="form-grid">
          <div className="field"><label htmlFor="settings-company">Nome da empresa <span className="required">*</span></label><input id="settings-company" className="input" value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} required /></div>
          <div className="field"><label htmlFor="settings-phone">Telefone</label><input id="settings-phone" className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="field"><label htmlFor="settings-whatsapp">WhatsApp</label><input id="settings-whatsapp" className="input" value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} /></div>
          <div className="field"><label htmlFor="settings-address">Endereço</label><input id="settings-address" className="input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
        </div>
      </div>}

      {activeTab === 'horarios' && <div className="form-card">
        <h3>Horário de funcionamento</h3>
        <p className="muted" style={{ marginTop: 4 }}>Exibido para a equipe no painel. Ajuste os horários de abertura de cada dia da semana.</p>
        <div className="hours-grid">
          {dayOrder.map(day => <div className={`hours-row${hours[day].closed ? ' is-closed' : ''}`} key={day}>
            <span className="hours-day">{dayLabels[day]}</span>
            <label className="hours-closed-toggle"><input type="checkbox" checked={hours[day].closed} onChange={e => updateDay(day, { closed: e.target.checked })} /> Fechado</label>
            <input className="input" type="time" value={hours[day].open} disabled={hours[day].closed} onChange={e => updateDay(day, { open: e.target.value })} aria-label={`Abertura de ${dayLabels[day]}`} />
            <span className="hours-sep">até</span>
            <input className="input" type="time" value={hours[day].close} disabled={hours[day].closed} onChange={e => updateDay(day, { close: e.target.value })} aria-label={`Fechamento de ${dayLabels[day]}`} />
          </div>)}
        </div>
      </div>}

      {activeTab === 'notificacoes' && <div className="form-card">
        <h3>Notificações</h3>
        <p className="muted" style={{ marginTop: 4 }}>Escolha quais eventos devem gerar um alerta para a equipe dentro do painel.</p>
        <div className="notification-list">
          <label className="notification-item"><div><strong>Estoque baixo</strong><span className="muted">Avisar quando um produto atingir o estoque mínimo.</span></div><input type="checkbox" checked={notifications.lowStock} onChange={e => setNotifications({ ...notifications, lowStock: e.target.checked })} /></label>
          <label className="notification-item"><div><strong>Nova comanda</strong><span className="muted">Avisar quando uma comanda for registrada.</span></div><input type="checkbox" checked={notifications.newOrder} onChange={e => setNotifications({ ...notifications, newOrder: e.target.checked })} /></label>
          <label className="notification-item"><div><strong>Entregas do dia</strong><span className="muted">Avisar sobre comandas com previsão de entrega para hoje.</span></div><input type="checkbox" checked={notifications.dueToday} onChange={e => setNotifications({ ...notifications, dueToday: e.target.checked })} /></label>
          <label className="notification-item"><div><strong>Lembretes por WhatsApp</strong><span className="muted">Sugerir o envio de lembrete ao cliente antes da entrega.</span></div><input type="checkbox" checked={notifications.whatsappReminders} onChange={e => setNotifications({ ...notifications, whatsappReminders: e.target.checked })} /></label>
        </div>
        <p className="muted" style={{ marginTop: 16, fontSize: 11 }}>As preferências ficam salvas para a equipe; o envio automático ainda não está disponível.</p>
      </div>}

      {activeTab === 'permissoes' && <div className="form-card">
        <h3>Permissões por função</h3>
        <p className="muted" style={{ marginTop: 4 }}>Cada papel enxerga apenas os módulos abaixo. Para adicionar ou remover pessoas, use <a className="panel-link" href="/admin/usuarios" style={{ display: 'inline-flex' }}>Usuários e permissões</a>.</p>
        <div className="permissions-grid">
          {(Object.keys(roleLabels) as Role[]).map(role => <div className="permissions-card" key={role}>
            <span className="badge blue">{roleLabels[role]}</span>
            <ul className="permissions-list">{permissionsByRole[role].map(module => <li key={module}>{moduleLabels[module] || module}</li>)}</ul>
          </div>)}
        </div>
      </div>}

      {activeTab === 'preferencias' && <div className="form-card">
        <h3>Mensagens e privacidade</h3>
        <div className="form-grid">
          <div className="field full"><label htmlFor="settings-message">Mensagem automática do WhatsApp</label><textarea id="settings-message" className="textarea" value={form.whatsappMessage} onChange={e => setForm({ ...form, whatsappMessage: e.target.value })} /></div>
          <div className="field full"><label htmlFor="settings-privacy">Preferências de privacidade/LGPD</label><textarea id="settings-privacy" className="textarea" value={form.privacyMessage} onChange={e => setForm({ ...form, privacyMessage: e.target.value })} /></div>
        </div>
      </div>}

      <div className="settings-save-bar"><span className="muted">Alterações se aplicam a todas as abas.</span><button className="btn primary" disabled={saving}>{saving ? 'Salvando…' : 'Salvar alterações'}</button></div>
    </form>
  </section>;
}

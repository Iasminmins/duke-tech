import { FormEvent, useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { defaultStoreSettings } from '../finance/financeUtils';

type Settings = { companyName: string; phone: string; whatsapp: string; address: string; whatsappMessage: string; privacyMessage: string; logoUrl: string };
const initial: Settings = defaultStoreSettings;
const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];

async function persistStoreProfile(form: Settings) {
  if (!supabase) return { error: new Error('Supabase não configurado.') };
  const { error } = await supabase.from('store_settings').upsert({ key: 'store_profile', value: { companyName: form.companyName, phone: form.phone, whatsapp: form.whatsapp, address: form.address, logoUrl: form.logoUrl } }, { onConflict: 'key' });
  return { error };
}

export function SettingsPage() {
  const [form, setForm] = useState<Settings>(initial);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState('');
  const [logoError, setLogoError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (!supabase) { setLoading(false); return; } supabase.from('store_settings').select('key,value').in('key', ['store_profile', 'whatsapp_messages', 'privacy']).then(({ data, error: queryError }) => { if (queryError) setError('Não foi possível carregar as configurações.'); const values: any = Object.fromEntries((data || []).map(item => [item.key, item.value])); const merged = { ...initial, ...(values.store_profile || {}), ...(values.whatsapp_messages || {}), ...(values.privacy || {}) }; setForm(Object.fromEntries(Object.entries(initial).map(([key, fallback]) => [key, merged[key] ?? fallback])) as Settings); setLoading(false); }); }, []);

  async function submit(event: FormEvent) {
    event.preventDefault(); if (!supabase) return; setSaving(true); setError(''); setSuccess('');
    const profileResult = await persistStoreProfile(form);
    const messagesResult = await supabase.from('store_settings').upsert({ key: 'whatsapp_messages', value: { whatsappMessage: form.whatsappMessage } }, { onConflict: 'key' });
    const privacyResult = await supabase.from('store_settings').upsert({ key: 'privacy', value: { privacyMessage: form.privacyMessage } }, { onConflict: 'key' });
    if (profileResult.error || messagesResult.error || privacyResult.error) setError('Não foi possível salvar as configurações.'); else setSuccess('Configurações salvas com sucesso.');
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
    const path = `logo-${Date.now()}.${extension}`;
    const upload = await supabase.storage.from('store-assets').upload(path, file, { upsert: true, cacheControl: '3600' });
    if (upload.error) { setLogoError('Não foi possível enviar a imagem.'); setUploadingLogo(false); return; }
    const { data: publicUrlData } = supabase.storage.from('store-assets').getPublicUrl(path);
    const nextForm = { ...form, logoUrl: publicUrlData.publicUrl };
    const persisted = await persistStoreProfile(nextForm);
    if (persisted.error) { setLogoError('A imagem foi enviada, mas não foi possível salvá-la nas configurações.'); } else { setForm(nextForm); setSuccess('Logo atualizada.'); }
    setUploadingLogo(false);
  }

  async function removeLogo() {
    if (!supabase) return;
    const nextForm = { ...form, logoUrl: '' };
    setUploadingLogo(true);
    const persisted = await persistStoreProfile(nextForm);
    if (persisted.error) setLogoError('Não foi possível remover a logo.'); else { setForm(nextForm); setSuccess('Logo removida.'); }
    setUploadingLogo(false);
  }

  if (loading) return <section className="content"><div className="empty">Carregando configurações…</div></section>;
  return <section className="content">
    {success && <div className="success" role="status">{success}</div>}
    <div className="form-card logo-card">
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
    <form className="form-card" onSubmit={submit}>
      <h3>Dados da loja</h3>
      <div className="form-grid">
        <div className="field"><label htmlFor="settings-company">Nome da empresa <span className="required">*</span></label><input id="settings-company" className="input" value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} required /></div>
        <div className="field"><label htmlFor="settings-phone">Telefone</label><input id="settings-phone" className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
        <div className="field"><label htmlFor="settings-whatsapp">WhatsApp</label><input id="settings-whatsapp" className="input" value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} /></div>
        <div className="field"><label htmlFor="settings-address">Endereço</label><input id="settings-address" className="input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
        <div className="field full"><label htmlFor="settings-message">Mensagem automática do WhatsApp</label><textarea id="settings-message" className="textarea" value={form.whatsappMessage} onChange={e => setForm({ ...form, whatsappMessage: e.target.value })} /></div>
        <div className="field full"><label htmlFor="settings-privacy">Preferências de privacidade/LGPD</label><textarea id="settings-privacy" className="textarea" value={form.privacyMessage} onChange={e => setForm({ ...form, privacyMessage: e.target.value })} /></div>
      </div>
      {error && <div className="error" role="alert">{error}</div>}
      <div className="actions"><button className="btn primary" disabled={saving}>{saving ? 'Salvando…' : 'Salvar configurações'}</button></div>
    </form>
  </section>;
}

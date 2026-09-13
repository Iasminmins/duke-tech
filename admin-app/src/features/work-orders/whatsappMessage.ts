export type WhatsappTemplateVars = { cliente?: string | null; aparelho?: string | null; status?: string | null; link?: string | null; previsao?: string | null };

const PLACEHOLDER = /\{\{\s*(cliente|aparelho|status|link|previsao)\s*\}\}/g;

export function buildWhatsappMessage(template: string, vars: WhatsappTemplateVars) {
  const values: Record<string, string> = {
    cliente: vars.cliente || '',
    aparelho: vars.aparelho || '',
    status: vars.status || '',
    link: vars.link || '',
    previsao: vars.previsao || '',
  };
  const message = (template || '').replace(PLACEHOLDER, (_, key: string) => values[key]);
  if (vars.link && !template.includes('{{link}}')) return `${message}\n\n${vars.link}`;
  return message;
}

// Ponto de troca futuro: quando o envio automático via API oficial do WhatsApp Business
// estiver disponível, esta função deixa de gerar um link `wa.me` e passa a chamar a API
// (ex.: Cloud API) com o mesmo `phone` e `message` já montados aqui.
export function buildWhatsappUrl(phone: string | null | undefined, message: string) {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

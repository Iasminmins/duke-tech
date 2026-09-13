import { buildWhatsappMessage, buildWhatsappUrl } from './whatsappMessage';

test('interpolates placeholders and keeps explicit link position', () => {
  const message = buildWhatsappMessage('Olá {{cliente}}! Seu {{aparelho}} está {{status}}. Acompanhe: {{link}}', { cliente: 'Ana', aparelho: 'iPhone 12', status: 'Pronto para retirada', link: 'https://duke.tech/acompanhar/abc' });
  expect(message).toBe('Olá Ana! Seu iPhone 12 está Pronto para retirada. Acompanhe: https://duke.tech/acompanhar/abc');
});

test('appends link automatically when template does not reference it', () => {
  const message = buildWhatsappMessage('Olá! Aqui é da Duke Tech.', { link: 'https://duke.tech/acompanhar/abc' });
  expect(message).toBe('Olá! Aqui é da Duke Tech.\n\nhttps://duke.tech/acompanhar/abc');
});

test('builds a wa.me url stripping non-digit characters from the phone', () => {
  const url = buildWhatsappUrl('(24) 99812-4113', 'Olá!');
  expect(url).toBe('https://wa.me/24998124113?text=Ol%C3%A1!');
});

test('returns null when there is no phone to send to', () => {
  expect(buildWhatsappUrl(null, 'Olá!')).toBeNull();
  expect(buildWhatsappUrl('', 'Olá!')).toBeNull();
});

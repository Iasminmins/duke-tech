import { digitsOnly, formatBRL, formatCpfCnpj, formatDateBR, formatPhone } from './format';

test('formatBRL usa real com virgula', () => {
  expect(formatBRL(1234.5).replace(/\s/g, ' ')).toBe('R$ 1.234,50');
  expect(formatBRL(null).replace(/\s/g, ' ')).toBe('R$ 0,00');
  expect(formatBRL('abc').replace(/\s/g, ' ')).toBe('R$ 0,00');
});

test('formatPhone mascara celular, fixo e digitacao parcial', () => {
  expect(formatPhone('24999327549')).toBe('(24) 99932-7549');
  expect(formatPhone('2433334444')).toBe('(24) 3333-4444');
  expect(formatPhone('+55 24 99932-7549')).toBe('(24) 99932-7549');
  expect(formatPhone('249')).toBe('(24) 9');
  expect(formatPhone('')).toBe('');
});

test('formatCpfCnpj troca a mascara conforme o tamanho', () => {
  expect(formatCpfCnpj('12345678901')).toBe('123.456.789-01');
  expect(formatCpfCnpj('12345678000195')).toBe('12.345.678/0001-95');
  expect(formatCpfCnpj('1234')).toBe('123.4');
});

test('formatDateBR nao desloca o dia de datas aaaa-mm-dd', () => {
  expect(formatDateBR('2026-09-18')).toBe('18/09/2026');
  expect(formatDateBR(null)).toBe('');
  expect(formatDateBR('lixo')).toBe('');
  expect(digitsOnly('(24) 99932-7549')).toBe('24999327549');
});

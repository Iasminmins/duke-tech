// Formatadores e mascaras no padrao brasileiro. Sao funcoes puras: nao alteram dados salvos,
// apenas a forma de exibir/digitar. Use digitsOnly() antes de enviar ao banco, se o campo for numerico.

export const digitsOnly = (value: string) => value.replace(/\D/g, '');

export function formatBRL(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  return (Number.isFinite(n) ? n : 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** (24) 99932-7549 ou (24) 3333-4444. Aceita digitacao parcial, para uso em mascara de input. */
export function formatPhone(value: string): string {
  const d = digitsOnly(value).replace(/^55(?=\d{10,11}$)/, '').slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** CPF (11 digitos) ou CNPJ (14 digitos), conforme o tamanho digitado. */
export function formatCpfCnpj(value: string): string {
  const d = digitsOnly(value).slice(0, 14);
  if (d.length <= 11) {
    return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return d.replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

/** dd/mm/aaaa. Aceita Date, ISO completo ou aaaa-mm-dd (sem deslocar o dia por fuso). */
export function formatDateBR(value: Date | string | null | undefined): string {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-');
    return `${d}/${m}/${y}`;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

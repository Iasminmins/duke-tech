const APP_TIMEZONE = 'America/Sao_Paulo';

/**
 * Retorna a chave do dia local (YYYY-MM-DD) para um timestamp vindo do
 * banco (Supabase grava `timestamptz` em UTC).
 *
 * Bug que isso corrige: cortar os 10 primeiros caracteres de um ISO
 * string (`value.slice(0, 10)`) pega o dia em UTC, não no fuso local
 * (America/Sao_Paulo, UTC-3). Uma venda feita à noite (ex.: 21h-23h59
 * local) cai depois da meia-noite em UTC e "pula" para o dia seguinte
 * nos gráficos, mesmo aparecendo com a data certa nas tabelas.
 *
 * Se o valor já vier como data pura (sem hora, ex.: due_date), não há
 * fuso para corrigir — devolve como está.
 */
export function localDayKey(value: string | null | undefined): string {
  if (!value) return '';
  if (!value.includes('T')) return value.slice(0, 10);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export type AgendaOrder = { estimated_due_date: string | null; status: string };

export function getAgendaMetrics(rows: AgendaOrder[], today = new Date()) {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  const iso = (date: Date) => date.toISOString().slice(0, 10);
  const todayKey = iso(start);
  const nextWeekKey = iso(end);
  const scheduled = rows.filter(row => row.estimated_due_date);
  return {
    today: scheduled.filter(row => row.estimated_due_date === todayKey).length,
    nextSevenDays: scheduled.filter(row => row.estimated_due_date! >= todayKey && row.estimated_due_date! <= nextWeekKey).length,
    awaitingConfirmation: scheduled.filter(row => row.status === 'quote_sent' || row.status === 'awaiting_approval').length,
  };
}

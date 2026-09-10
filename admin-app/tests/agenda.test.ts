import { describe, expect, test } from 'vitest';
import { getAgendaMetrics } from '../src/features/agenda/agendaUtils';

describe('agenda metrics', () => {
  test('counts deliveries today, next seven days and awaiting confirmation', () => {
    const rows = [
      { estimated_due_date: '2026-09-09', status: 'ready' },
      { estimated_due_date: '2026-09-12', status: 'repair' },
      { estimated_due_date: '2026-09-14', status: 'awaiting_approval' },
      { estimated_due_date: null, status: 'quote_sent' },
    ];

    expect(getAgendaMetrics(rows, new Date('2026-09-09T12:00:00'))).toEqual({
      today: 1,
      nextSevenDays: 3,
      awaitingConfirmation: 1,
    });
  });
});

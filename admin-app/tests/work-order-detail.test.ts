import { describe, expect, test } from 'vitest';
import { formatWorkOrderNumber, mapWorkOrderDetail } from '../src/features/work-orders/workOrderRepository';

describe('work order detail', () => {
  test('uses the public numeric order format', () => {
    expect(formatWorkOrderNumber(11)).toBe('#11');
  });

  test('orders the complete timeline chronologically', () => {
    const result = mapWorkOrderDetail({ work_order_status_history: [
      { id: '2', status: 'repair', note: null, created_at: '2026-09-09T12:00:00Z' },
      { id: '1', status: 'received', note: 'Comanda criada', created_at: '2026-09-09T09:00:00Z' },
    ] });
    expect(result.work_order_status_history.map(item => item.id)).toEqual(['1', '2']);
  });
});

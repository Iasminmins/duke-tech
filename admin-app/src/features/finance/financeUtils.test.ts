import { computeFinanceStatus, getSalePayment } from './financeUtils';

test('a paid entry is always "paid", even with a due date in the past', () => {
  expect(computeFinanceStatus('2020-01-01', '2026-09-12T10:00:00Z', new Date('2026-09-13'))).toBe('paid');
});

test('an unpaid entry with a due date before today is "overdue"', () => {
  expect(computeFinanceStatus('2026-09-01', null, new Date('2026-09-13'))).toBe('overdue');
});

test('an unpaid entry with no due date is "pending"', () => {
  expect(computeFinanceStatus(null, null, new Date('2026-09-13'))).toBe('pending');
});

test('a sale payment is always recorded as already settled, since payments.paid_at no longer defaults to now()', () => {
  const payment = getSalePayment({ id: 'sale-1', total: 150, payment_method: 'pix' });
  expect(payment.paid_at).toBeTruthy();
  expect(computeFinanceStatus(null, payment.paid_at)).toBe('paid');
});

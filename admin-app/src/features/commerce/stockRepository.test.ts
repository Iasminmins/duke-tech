import { validatePurchaseRequest } from './stockRepository';

test('accepts a well-formed purchase request', () => {
  const error = validatePurchaseRequest({ product_id: 'p1', supplier_name: 'Distribuidora Alfa', quantity: 10, expected_date: '2026-10-01', note: '' });
  expect(error).toBe('');
});

test('rejects a purchase request with zero quantity or missing supplier', () => {
  expect(validatePurchaseRequest({ product_id: 'p1', supplier_name: 'Alfa', quantity: 0, expected_date: '', note: '' })).not.toBe('');
  expect(validatePurchaseRequest({ product_id: 'p1', supplier_name: '  ', quantity: 5, expected_date: '', note: '' })).not.toBe('');
});

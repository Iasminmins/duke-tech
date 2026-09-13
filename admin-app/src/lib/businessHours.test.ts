import { isStoreOpenNow, defaultBusinessHours, type BusinessHours } from './businessHours';

test('store is open when within the configured window for that weekday', () => {
  const hours: BusinessHours = { ...defaultBusinessHours, wed: { open: '09:00', close: '18:00', closed: false } };
  const wednesdayAtNoon = new Date('2026-09-16T12:00:00');
  expect(isStoreOpenNow(hours, wednesdayAtNoon)).toBe(true);
});

test('store is closed on a day explicitly marked as closed, even inside business hours', () => {
  const hours: BusinessHours = { ...defaultBusinessHours, sun: { open: '09:00', close: '18:00', closed: true } };
  const sundayAtNoon = new Date('2026-09-13T12:00:00');
  expect(isStoreOpenNow(hours, sundayAtNoon)).toBe(false);
});

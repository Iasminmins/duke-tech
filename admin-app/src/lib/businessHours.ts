export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export type DayHours = { open: string; close: string; closed: boolean };
export type BusinessHours = Record<DayKey, DayHours>;

export const dayOrder: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
export const dayLabels: Record<DayKey, string> = { mon: 'Segunda', tue: 'Terça', wed: 'Quarta', thu: 'Quinta', fri: 'Sexta', sat: 'Sábado', sun: 'Domingo' };
export const defaultBusinessHours: BusinessHours = dayOrder.reduce((acc, day) => ({ ...acc, [day]: { open: '09:00', close: '18:00', closed: day === 'sun' } }), {} as BusinessHours);

const jsDayToKey: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export function isStoreOpenNow(hours: BusinessHours, date = new Date()) {
  const today = hours[jsDayToKey[date.getDay()]];
  if (!today || today.closed) return false;
  const minutes = date.getHours() * 60 + date.getMinutes();
  const [openH, openM] = today.open.split(':').map(Number);
  const [closeH, closeM] = today.close.split(':').map(Number);
  return minutes >= openH * 60 + openM && minutes <= closeH * 60 + closeM;
}

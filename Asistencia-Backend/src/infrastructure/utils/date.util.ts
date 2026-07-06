/**
 * Utilidades de fecha con zona horaria de Colombia (America/Bogota, UTC-5).
 */

export function getColombiaDate(): Date {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  const iso = `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}.000-05:00`;
  return new Date(iso);
}

export function getColombiaDateString(): string {
  return getColombiaDate().toISOString().split('T')[0];
}

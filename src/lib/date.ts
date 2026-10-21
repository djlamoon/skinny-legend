/** Local-day key like "2026-10-21". */
export function dayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isSameDay(iso: string, date: Date = new Date()): boolean {
  return dayKey(new Date(iso)) === dayKey(date);
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m} ${h < 12 ? 'AM' : 'PM'}`;
}

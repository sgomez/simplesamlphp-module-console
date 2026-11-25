const day = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const moment = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

// "22 Nov 2026, 14:10", in the browser's time zone.
export function when(iso: string): string {
  return moment.format(new Date(iso));
}

// "21 Nov 2026".
export function onDay(iso: string): string {
  return day.format(new Date(iso));
}

const UNITS: [number, string, string][] = [
  [86400, 'day', 'days'],
  [3600, 'hour', 'hours'],
  [60, 'min', 'min'],
];

// "20 s ago", "3 hours ago": the time between two instants, both from the server's clock.
export function ago(iso: string, now: string): string {
  const seconds = Math.max(0, Math.floor((Date.parse(now) - Date.parse(iso)) / 1000));
  for (const [size, one, many] of UNITS) {
    if (seconds >= size) {
      const n = Math.floor(seconds / size);

      return `${n} ${n === 1 ? one : many} ago`;
    }
  }

  return `${seconds} s ago`;
}

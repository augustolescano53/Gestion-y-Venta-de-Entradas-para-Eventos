// Íconos SVG del inicio del participante (sin librerías). Heredan el color
// del texto (currentColor).

const STROKE = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
};

export function CalendarIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...STROKE}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4M8 14h2M14 14h2M8 17h2" />
    </svg>
  );
}

export function LocationIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...STROKE}>
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.4" />
    </svg>
  );
}

export function ChevronLeftIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...STROKE} strokeWidth={1.4}>
      <path d="M15 4 7 12l8 8" />
    </svg>
  );
}

export function ChevronRightIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...STROKE} strokeWidth={1.4}>
      <path d="m9 4 8 8-8 8" />
    </svg>
  );
}

// Íconos SVG del Header y el Footer (sin librerías). Heredan el color del
// texto (currentColor).

const STROKE = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
};

export function SearchIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...STROKE}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.2-4.2" />
    </svg>
  );
}

export function PersonIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...STROKE}>
      <circle cx="12" cy="8" r="3.8" />
      <path d="M4.5 20.5c.9-3.9 3.9-6 7.5-6s6.6 2.1 7.5 6" />
    </svg>
  );
}

export function MailIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...STROKE}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
    </svg>
  );
}

export function LockIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...STROKE}>
      <rect x="5" y="10.5" width="14" height="10" rx="2" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function TicketIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...STROKE}>
      <path d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5V10a2 2 0 0 0 0 4v2.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5V14a2 2 0 0 0 0-4Z" />
      <path d="M14 6v12" strokeDasharray="2 2" />
    </svg>
  );
}

export function GridIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...STROKE}>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
    </svg>
  );
}

export function LogoutIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...STROKE}>
      <path d="M14 4.5H6.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H14" />
      <path d="M10 12h10m-3.5-3.5L20 12l-3.5 3.5" />
    </svg>
  );
}

export function ChevronIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...STROKE}>
      <path d="m9 5.5 6.5 6.5L9 18.5" />
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

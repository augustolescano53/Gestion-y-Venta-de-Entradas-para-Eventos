// Una relación puede llegar del backend como id o como objeto poblado.
export function resolveId(ref) {
  if (ref == null) return null;
  return typeof ref === 'object' ? (ref.id ?? null) : ref;
}

// Un evento se identifica como "venueId-idEvent" (clave compuesta) en los
// <select> y en las URLs del área de compradores.
export function eventKey(venueId, idEvent) {
  return `${venueId}-${idEvent}`;
}

export function parseEventKey(key) {
  const [venue, event] = key.split('-').map(Number);
  return { venue, event };
}

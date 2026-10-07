// Una relación puede llegar del backend como id o como objeto poblado.
export function resolveId(ref) {
  if (ref == null) return null;
  return typeof ref === 'object' ? (ref.id ?? null) : ref;
}

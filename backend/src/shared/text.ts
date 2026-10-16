// Clave para detectar textos repetidos: sin espacios de más, en minúsculas y
// sin acentos. "VIP", " vip " y "Víp" son el mismo; "VIP 2" no.
export function normalizeKey(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

export function sameKey(a: unknown, b: unknown) {
  return normalizeKey(a) === normalizeKey(b)
}

// Texto para guardar: sin espacios en los extremos.
export function trimText(value: unknown) {
  return typeof value === 'string' ? value.trim() : value
}

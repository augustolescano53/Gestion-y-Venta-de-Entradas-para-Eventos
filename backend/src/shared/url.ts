// URL absoluta http o https (lugares: Google Maps; eventos: portada y banner).
export function isValidHttpUrl(value: unknown): boolean {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return false;
  }
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

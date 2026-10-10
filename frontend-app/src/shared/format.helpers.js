// Formatos de precios, fechas y horas para las pantallas del comprador.

const priceFormatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });

// El backend devuelve los DECIMAL como texto.
export function formatPrice(value) {
  return priceFormatter.format(Number(value ?? 0));
}

const WEEKDAYS = ['Dom.', 'Lun.', 'Mar.', 'Mié.', 'Jue.', 'Vie.', 'Sáb.'];
const MONTHS = ['Ene.', 'Feb.', 'Mar.', 'Abr.', 'May.', 'Jun.', 'Jul.', 'Ago.', 'Sep.', 'Oct.', 'Nov.', 'Dic.'];

// 'YYYY-MM-DD' -> "Vie. 9 Oct.". Se arma con la fecha local: new Date(texto)
// la tomaría en UTC y en Argentina caería el día anterior.
export function formatEventDate(date) {
  const [year, month, day] = date.split('-').map(Number);
  const local = new Date(year, month - 1, day);
  return `${WEEKDAYS[local.getDay()]} ${day} ${MONTHS[month - 1]}`;
}

export function formatTime(time) {
  return time.slice(0, 5);
}

// TEMPORAL: todavía no hay login. Mientras tanto "Mi cuenta" usa este
// participante. Para probar con otro: localStorage.setItem('pogo.participantId', '3').
// Cuando exista la sesión, solo hay que reemplazar el cuerpo de esta función.
const DEMO_PARTICIPANT_ID = 1;
const STORAGE_KEY = 'pogo.participantId';

export function getCurrentParticipantId() {
  try {
    const stored = Number(localStorage.getItem(STORAGE_KEY));
    if (Number.isInteger(stored) && stored > 0) return stored;
  } catch {
    // Sin acceso a localStorage se usa el participante de prueba.
  }
  return DEMO_PARTICIPANT_ID;
}

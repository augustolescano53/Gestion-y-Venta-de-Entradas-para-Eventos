import { useSyncExternalStore } from 'react';

// Ancho visible de la ventana sin la barra de scroll vertical. 100vw la
// incluye (en Windows) y un bloque de ese ancho genera scroll horizontal.
function subscribe(callback) {
  window.addEventListener('resize', callback);
  return () => window.removeEventListener('resize', callback);
}

function getSnapshot() {
  return document.documentElement.clientWidth;
}

export function useViewportWidth() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

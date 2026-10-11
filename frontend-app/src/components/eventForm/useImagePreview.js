import { useEffect, useRef, useState } from 'react';
import { IMAGE_STATUS, isHttpUrl } from '../../validation/eventForm.js';

// Pausa después de la última tecla antes de intentar cargar la imagen: no
// se pide una imagen por cada letra escrita.
const LOAD_DELAY_MS = 300;

// Estado de la vista previa de una URL de imagen: { status, src }.
// El formato se valida al instante; la carga, con new Image(). Cada intento
// tiene un número: una respuesta de una URL anterior nunca pisa a la actual.
export function useImagePreview(url) {
  const value = url.trim();
  const validFormat = value !== '' && isHttpUrl(value);
  const [result, setResult] = useState({ url: null, loaded: false });
  const lastRequest = useRef(0);

  useEffect(() => {
    if (!validFormat) return undefined;
    const requestId = ++lastRequest.current;
    const timer = setTimeout(() => {
      const image = new Image();
      image.onload = () => {
        if (lastRequest.current === requestId) setResult({ url: value, loaded: true });
      };
      image.onerror = () => {
        if (lastRequest.current === requestId) setResult({ url: value, loaded: false });
      };
      image.src = value;
    }, LOAD_DELAY_MS);
    return () => clearTimeout(timer);
  }, [value, validFormat]);

  if (value === '') return { status: IMAGE_STATUS.EMPTY, src: null };
  if (!validFormat) return { status: IMAGE_STATUS.INVALID, src: null };
  if (result.url !== value) return { status: IMAGE_STATUS.LOADING, src: null };
  return result.loaded ? { status: IMAGE_STATUS.LOADED, src: value } : { status: IMAGE_STATUS.ERROR, src: null };
}

import { IMAGE_STATUS } from '../../validation/eventForm.js';

const VARIANTS = {
  cover: { title: 'Portada', help: 'Se muestra en las tarjetas de los eventos.', empty: 'Sin imagen de portada' },
  banner: { title: 'Banner', help: 'Franja horizontal del detalle del evento. Opcional.', empty: 'Sin banner' },
};

const PLACEHOLDER_TEXT = {
  [IMAGE_STATUS.LOADING]: 'Cargando imagen...',
  [IMAGE_STATUS.INVALID]: 'La URL no es válida',
  [IMAGE_STATUS.ERROR]: 'No se pudo cargar la imagen',
};

function ImageIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="2" />
      <path d="m21 16-5-5-9 9" />
    </svg>
  );
}

// Vista previa de una imagen de evento (preview = useImagePreview(url)). Si
// no hay imagen cargada, recuadro gris con el motivo.
function ImagePreview({ variant, preview }) {
  const { title, help, empty } = VARIANTS[variant];
  const loaded = preview.status === IMAGE_STATUS.LOADED;

  return (
    <figure className={`image-preview image-preview--${variant}`}>
      <figcaption className="image-preview__caption">
        <strong>{title}</strong> <span>{help}</span>
      </figcaption>
      <div className="image-preview__frame" aria-live="polite">
        {loaded ? (
          <img src={preview.src} alt={`Vista previa: ${title.toLowerCase()}`} className="image-preview__img" />
        ) : (
          <div className="image-preview__placeholder">
            <ImageIcon />
            <span>{PLACEHOLDER_TEXT[preview.status] ?? empty}</span>
          </div>
        )}
      </div>
    </figure>
  );
}

export default ImagePreview;

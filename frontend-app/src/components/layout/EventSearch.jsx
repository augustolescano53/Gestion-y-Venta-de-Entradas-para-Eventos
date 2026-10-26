import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PARTICIPANTE_PATHS } from '../../shared/routes.js';
import { SearchIcon } from './icons.jsx';

// Buscador del Header: lleva a los resultados en el inicio del participante
// (/participante/inicio?q=...), desde cualquier página. Sin texto vuelve al
// inicio completo.
function EventSearch() {
  const navigate = useNavigate();
  const location = useLocation();
  const onResults = location.pathname === PARTICIPANTE_PATHS.inicio;
  const urlQuery = onResults ? (new URLSearchParams(location.search).get('q') ?? '') : '';

  const [text, setText] = useState(urlQuery);
  // Si la búsqueda de la URL cambia (por ejemplo, "Ver todos los eventos"),
  // el campo la acompaña.
  const [syncedQuery, setSyncedQuery] = useState(urlQuery);
  if (urlQuery !== syncedQuery) {
    setSyncedQuery(urlQuery);
    setText(urlQuery);
  }

  function handleSubmit(event) {
    event.preventDefault();
    const query = text.trim();
    navigate(query ? `${PARTICIPANTE_PATHS.inicio}?q=${encodeURIComponent(query)}` : PARTICIPANTE_PATHS.inicio);
  }

  return (
    <form className="site-search" role="search" onSubmit={handleSubmit}>
      <SearchIcon className="site-search__icon" />
      <input
        type="search"
        className="site-search__input"
        placeholder="Buscar eventos..."
        aria-label="Buscar eventos"
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
    </form>
  );
}

export default EventSearch;

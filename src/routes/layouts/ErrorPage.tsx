/**
 * ErrorPage Component
 * 
 * Global error handler for React Router errors.
 * Displays user-friendly error message with link back to app.
 * 
 * @package DechBar_App
 * @subpackage Routes/Layouts
 * @since 2.45.0
 */

import { useEffect } from 'react';
import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';
import './ErrorPage.css';

function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  // Vite/Webpack chunk load failures po novém deployi
  return (
    error.message.includes('Failed to fetch dynamically imported module') ||
    error.message.includes('Importing a module script failed') ||
    error.name === 'ChunkLoadError'
  );
}

export function ErrorPage() {
  const error = useRouteError();

  // Po novém Vercel deployi mají staré bundle hashe jiná jména.
  // Místo chybové stránky automaticky reloadujeme — uživatel dostane nový index.html.
  // Guard v sessionStorage zabrání nekonečné smyčce pokud reload nepomůže.
  useEffect(() => {
    if (!isChunkLoadError(error)) return;

    const RELOAD_KEY = 'chunkErrorReloadedAt';
    const last = sessionStorage.getItem(RELOAD_KEY);
    const now = Date.now();

    if (!last || now - parseInt(last, 10) > 30_000) {
      sessionStorage.setItem(RELOAD_KEY, String(now));
      window.location.reload();
    }
  }, [error]);

  let errorMessage: string;
  let errorStatus: string | undefined;

  if (isRouteErrorResponse(error)) {
    errorStatus = `${error.status} ${error.statusText}`;
    errorMessage = error.data?.message || error.statusText;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else {
    errorMessage = 'Neznámá chyba';
  }

  // Pokud jde o chunk error a reload ještě nenastal, zobrazíme prázdno (reload přijde)
  if (isChunkLoadError(error)) {
    return null;
  }

  return (
    <div className="error-page">
      <div className="error-page__content">
        <h1 className="error-page__title">
          {errorStatus || 'Něco se pokazilo'}
        </h1>
        <p className="error-page__message">{errorMessage}</p>
        <Link to="/" className="error-page__button">
          Zpět na homepage
        </Link>
      </div>
    </div>
  );
}

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

import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';
import './ErrorPage.css';

export function ErrorPage() {
  const error = useRouteError();
  
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

/**
 * PageLayout - Sub-Page Layout Component
 *
 * Used for dedicated sub-pages like Profil and Účet.
 * Renders a sticky header with back button, centered title,
 * and optional right action. No AppLayout wrapping needed.
 *
 * iOS safe area is handled via CSS env(safe-area-inset-*).
 *
 * @package DechBar_App
 * @subpackage Platform/Layouts
 * @since 0.4.0
 */

import type { ReactNode } from 'react';

export interface PageLayoutRightAction {
  label: string;
  onClick: () => void;
  /** 'ghost' = teal text, 'primary' = gold bold text. Default: 'ghost' */
  variant?: 'ghost' | 'primary';
  disabled?: boolean;
  loading?: boolean;
}

export interface PageLayoutProps {
  /** Page title shown centered in the header */
  title: string;
  /** Handler for the back button (usually navigate(-1)) */
  onBack: () => void;
  /** Optional action in the top-right corner */
  rightAction?: PageLayoutRightAction;
  children: ReactNode;
  className?: string;
}

/**
 * PageLayout — iOS-style sub-page with sticky header and back navigation.
 *
 * @example
 * <PageLayout
 *   title="Profil"
 *   onBack={() => navigate(-1)}
 *   rightAction={{ label: 'Upravit', onClick: () => setEditMode(true) }}
 * >
 *   <ProfilContent />
 * </PageLayout>
 */
export function PageLayout({
  title,
  onBack,
  rightAction,
  children,
  className = '',
}: PageLayoutProps) {
  return (
    <div className={`page-layout${className ? ` ${className}` : ''}`}>
      <header className="page-layout__header">
        {/* Back button */}
        <button
          className="page-layout__back-btn"
          onClick={onBack}
          aria-label="Zpět"
          type="button"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Title */}
        <h1 className="page-layout__title">{title}</h1>

        {/* Right action (or spacer for centering) */}
        {rightAction ? (
          <button
            className={`page-layout__right-action page-layout__right-action--${rightAction.variant ?? 'ghost'}`}
            onClick={rightAction.onClick}
            type="button"
            disabled={rightAction.disabled || rightAction.loading}
          >
            {rightAction.loading ? (
              <span className="page-layout__right-action-loader" aria-label="Ukládám..." />
            ) : (
              rightAction.label
            )}
          </button>
        ) : (
          <span className="page-layout__right-spacer" aria-hidden="true" />
        )}
      </header>

      <main className="page-layout__content">
        {children}
      </main>
    </div>
  );
}

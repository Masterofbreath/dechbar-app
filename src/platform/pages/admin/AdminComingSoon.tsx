/**
 * AdminComingSoon Component
 *
 * Placeholder page for future admin sections (Gamification, Users, System, etc.).
 * Shows coming soon message with SVG icon — no emoji.
 *
 * @package DechBar_App
 * @subpackage Platform/Pages/Admin
 * @since 2.44.0
 * @updated 2.48.0 - SVG icon, removed emoji
 */

import './AdminComingSoon.css';

interface AdminComingSoonProps {
  title: string;
}

export default function AdminComingSoon({ title }: AdminComingSoonProps) {
  return (
    <div className="admin-coming-soon">
      <div className="admin-coming-soon__content">
        <div className="admin-coming-soon__icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4l3 3" />
          </svg>
        </div>
        <h1 className="admin-coming-soon__title">{title}</h1>
        <p className="admin-coming-soon__message">
          Tato sekce bude dostupná v další fázi vývoje.
        </p>
      </div>
    </div>
  );
}

/**
 * AdminComingSoon Component
 * 
 * Placeholder page for future admin sections (Analytics, Gamification, Users, System).
 * Shows coming soon message with back to media button.
 * 
 * @package DechBar_App
 * @subpackage Platform/Pages/Admin
 * @since 2.44.0
 */

import './AdminComingSoon.css';

interface AdminComingSoonProps {
  title: string;
}

export default function AdminComingSoon({ title }: AdminComingSoonProps) {
  return (
    <div className="admin-coming-soon">
      <div className="admin-coming-soon__content">
        <div className="admin-coming-soon__icon">🚧</div>
        <h1 className="admin-coming-soon__title">{title}</h1>
        <p className="admin-coming-soon__message">
          Tato sekce bude dostupná v další fázi vývoje.
        </p>
        <a href="/app/admin/media" className="admin-coming-soon__button">
          Zpět na Media
        </a>
      </div>
    </div>
  );
}

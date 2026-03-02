/**
 * AdminSidebar Component
 *
 * Levá navigační sidebar admin panelu.
 *
 * Desktop/Tablet: Fixní sidebar (240px / 200px)
 * Mobile (<768px): Slide-in overlay
 *   - isOpen  → .admin-sidebar--open (transform: translateX(0))
 *   - onClose → zavře při kliknutí na položku nebo × tlačítko
 *
 * @package DechBar_App
 * @subpackage Platform/Components/Admin
 * @since 2.44.0
 * @updated 2.47.0 - Mobile overlay props
 */

import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/platform/auth';
import { NavIcon, Logo } from '@/platform/components';
import './AdminSidebar.css';

const ADMIN_MENU_ITEMS = [
  { path: '/app/admin/akademie',     icon: 'graduation-cap', label: 'Akademie'     },
  { path: '/app/admin/daily-program',icon: 'clock',          label: 'Denní program'},
  { path: '/app/admin/notifications',icon: 'bell',           label: 'Notifikace'   },
  { path: '/app/admin/feedback',     icon: 'message-square', label: 'Feedback'     },
  { path: '/app/admin/analytics',    icon: 'chart',          label: 'Analytika'    },
  { path: '/app/admin/gamification', icon: 'trophy',         label: 'Gamifikace'   },
  { path: '/app/admin/users',        icon: 'users',          label: 'Uživatelé'    },
  { path: '/app/admin/system',       icon: 'settings',       label: 'Systém'       },
];

interface AdminSidebarProps {
  isOpen:  boolean;
  onClose: () => void;
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleBackToApp = () => {
    navigate('/app');
  };

  return (
    <aside className={`admin-sidebar ${isOpen ? 'admin-sidebar--open' : ''}`}>

      {/* Close button — pouze mobile */}
      <button
        type="button"
        className="admin-sidebar__close"
        onClick={onClose}
        aria-label="Zavřít navigaci"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Logo */}
      <div className="admin-sidebar__logo">
        <Logo variant="off-white" />
      </div>

      {/* User info */}
      <div className="admin-sidebar__user">
        {user?.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={user.full_name || 'User'}
            className="admin-sidebar__avatar"
          />
        ) : (
          <div className="admin-sidebar__avatar admin-sidebar__avatar--placeholder">
            {user?.full_name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
        )}
        <div className="admin-sidebar__user-info">
          <span className="admin-sidebar__user-name">{user?.full_name || 'Admin'}</span>
          <span className="admin-sidebar__user-role">Admin</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="admin-sidebar__nav">
        {ADMIN_MENU_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `admin-sidebar__item ${isActive ? 'admin-sidebar__item--active' : ''}`
            }
          >
            <NavIcon name={item.icon} size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Back to app */}
      <button
        type="button"
        className="admin-sidebar__back"
        onClick={handleBackToApp}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Zpět do aplikace
      </button>
    </aside>
  );
}

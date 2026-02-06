/**
 * AdminSidebar Component
 * 
 * Left sidebar navigation for admin panel.
 * Width: 240px, transforms to hamburger overlay on mobile (<768px)
 * 
 * @package DechBar_App
 * @subpackage Platform/Components/Admin
 * @since 2.44.0
 */

import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/platform/auth';
import { NavIcon, Logo } from '@/platform/components';
import './AdminSidebar.css';

const ADMIN_MENU_ITEMS = [
  { path: '/app/admin/media', icon: 'music', label: 'Media' },
  { path: '/app/admin/analytics', icon: 'chart', label: 'Analytika' },
  { path: '/app/admin/gamification', icon: 'trophy', label: 'Gamifikace' },
  { path: '/app/admin/users', icon: 'users', label: 'Uživatelé' },
  { path: '/app/admin/system', icon: 'settings', label: 'Systém' },
];

export function AdminSidebar() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleBackToApp = () => {
    navigate('/app');
  };

  return (
    <aside className="admin-sidebar">
      {/* Logo section */}
      <div className="admin-sidebar__logo">
        <Logo variant="off-white" />
      </div>

      {/* User info section */}
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

      {/* Navigation menu */}
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

      {/* Back button (sticky at bottom) */}
      <button 
        className="admin-sidebar__back"
        onClick={handleBackToApp}
      >
        ← Zpět do aplikace
      </button>
    </aside>
  );
}

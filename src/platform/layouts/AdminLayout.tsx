/**
 * AdminLayout Component
 *
 * Main layout for admin panel with AdminSidebar and content area.
 * NO TopNav, NO BottomNav — Apple Premium Clean Design.
 *
 * Mobile (<768px):
 *   - Sidebar schovaná mimo obrazovku (transform: translateX(-100%))
 *   - Hamburger button (fixed, top-left) otevírá sidebar
 *   - Klik na backdrop / close button sidebar zavírá
 *   - Body scroll lock při otevřené sidebar
 *
 * @package DechBar_App
 * @subpackage Platform/Layouts
 * @since 2.44.0
 * @updated 2.47.0 - Mobile hamburger toggle
 */

import { useState, useEffect, useCallback, startTransition } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AdminSidebar } from '@/platform/components/admin/AdminSidebar';
import './AdminLayout.css';

export function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const openSidebar  = useCallback(() => setIsSidebarOpen(true),  []);
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);

  // Zavři sidebar při navigaci (kliknutí na menu položku)
  useEffect(() => {
    startTransition(() => setIsSidebarOpen(false));
  }, [location.pathname]);

  // Body scroll lock na mobile při otevřeném sidebar
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isSidebarOpen]);

  return (
    <div className="admin-layout">
      {/* Hamburger tlačítko — pouze mobile */}
      <button
        type="button"
        className="admin-layout__hamburger"
        onClick={openSidebar}
        aria-label="Otevřít navigaci"
        aria-expanded={isSidebarOpen}
      >
        <span className="admin-layout__hamburger-line" />
        <span className="admin-layout__hamburger-line" />
        <span className="admin-layout__hamburger-line" />
      </button>

      {/* Backdrop overlay — klik zavírá sidebar */}
      {isSidebarOpen && (
        <div
          className="admin-layout__backdrop"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <div className="admin-layout__container">
        <AdminSidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

        <main className="admin-layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/**
 * AdminLayout Component
 * 
 * Main layout for admin panel with AdminSidebar and content area.
 * NO TopNav, NO BottomNav, NO AdminHeader - Apple Premium Clean Design.
 * 
 * @package DechBar_App
 * @subpackage Platform/Layouts
 * @since 2.44.0
 * @updated 2.46.2 - Removed AdminHeader for cleaner design
 */

import { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from '@/platform/components/admin/AdminSidebar';
import './AdminLayout.css';

interface AdminLayoutProps {
  children?: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="admin-layout">
      <div className="admin-layout__container">
        <AdminSidebar />
        
        <main className="admin-layout__content">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}

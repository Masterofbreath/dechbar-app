/**
 * NotificationCenter - Platform Notifications Modal
 * 
 * Timeline of system, progress, achievement, and social notifications.
 * Badge counter for unread items.
 * 
 * @package DechBar_App
 * @subpackage Platform/Components
 * @since 0.3.0
 */

import { useEffect, useState } from 'react';
import { useNavigation } from '@/platform/hooks';
import { NavIcon } from './NavIcon';
import { CloseButton, ConfirmModal } from '@/components/shared';

export interface Notification {
  id: string;
  type: 'system' | 'progress' | 'achievement' | 'social';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  icon?: string;
}

/**
 * Get icon for notification type
 */
function getNotificationIcon(type: Notification['type']) {
  switch (type) {
    case 'system':
      return <NavIcon name="info" size={20} />;
    case 'progress':
      return <NavIcon name="chart-line" size={20} />;
    case 'achievement':
      return '🏆'; // Emoji OK for celebrations
    case 'social':
      return <NavIcon name="user" size={20} />;
    default:
      return <NavIcon name="bell" size={20} />;
  }
}

export function NotificationCenter() {
  const { isNotificationsOpen, closeNotifications, setUnreadNotifications } = useNavigation();
  
  // Mock data - TODO: Replace with Supabase query
  const initialNotifications: Notification[] = [
    {
      id: '1',
      type: 'progress',
      title: 'Nový rekord KP!',
      message: 'Tvá kontrolní pauza dosáhla 40 sekund. Skvělý pokrok!',
      timestamp: new Date(),
      read: false
    }
  ];
  
  const [localNotifications, setLocalNotifications] = useState(initialNotifications);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const unreadCount = localNotifications.filter(n => !n.read).length;
  
  const handleNotificationClick = (notifId: string) => {
    // Mark as read locally
    setLocalNotifications(prev => 
      prev.map(n => n.id === notifId ? { ...n, read: true } : n)
    );
    
    // TODO: Update in Supabase
    console.log(`Marked as read: ${notifId}`);
  };
  
  const handleDeleteNotification = (notifId: string) => {
    setDeleteConfirmId(notifId); // Open confirmation
  };
  
  const confirmDelete = () => {
    if (deleteConfirmId) {
      setLocalNotifications(prev => 
        prev.filter(n => n.id !== deleteConfirmId)
      );
      
      // TODO: Delete from Supabase
      console.log(`Deleted notification: ${deleteConfirmId}`);
    }
  };
  
  // Update global unread count
  useEffect(() => {
    setUnreadNotifications(unreadCount);
  }, [unreadCount, setUnreadNotifications]);
  
  if (!isNotificationsOpen) return null;
  
  return (
    <div className="modal-overlay" onClick={closeNotifications}>
      <div className="notification-center" onClick={e => e.stopPropagation()}>
        <div className="notification-center__header">
          <h2>Notifikace</h2>
          {unreadCount > 0 && (
            <span className="notification-center__badge">{unreadCount}</span>
          )}
        </div>
        
        <div className="notification-center__list">
          {localNotifications.length === 0 ? (
            <p className="notification-center__empty">Zatím žádné notifikace</p>
          ) : (
            localNotifications.map(notif => (
              <div 
                key={notif.id} 
                className={`notification-item notification-item--${notif.type} ${!notif.read ? 'notification-item--unread' : ''}`}
                onClick={() => handleNotificationClick(notif.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleNotificationClick(notif.id);
                  }
                }}
              >
                <div className="notification-item__icon">
                  {getNotificationIcon(notif.type)}
                </div>
                <div className="notification-item__content">
                  <h3>{notif.title}</h3>
                  <p>{notif.message}</p>
                  <time>{notif.timestamp.toLocaleString('cs-CZ')}</time>
                </div>
                
                {/* Delete button - using global component */}
                <div
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent mark as read
                  }}
                >
                  <CloseButton
                    onClick={() => handleDeleteNotification(notif.id)}
                    ariaLabel="Smazat notifikaci"
                    size={16}
                    className="notification-item__delete"
                  />
                </div>
              </div>
            ))
          )}
        </div>
        
        <button 
          className="notification-center__close"
          onClick={closeNotifications}
        >
          Zavřít
        </button>
      </div>
      
      <ConfirmModal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={confirmDelete}
        title="Smazat notifikaci?"
        message="Tato akce je nevratná."
        confirmText="Smazat"
        cancelText="Zrušit"
        variant="danger"
      />
    </div>
  );
}

/**
 * NotificationCenter - Platform Notifications Modal
 *
 * Timeline of system, progress, achievement, and social notifications.
 * Badge counter for unread items. Powered by Supabase via useNotifications hook.
 *
 * @package DechBar_App
 * @subpackage Platform/Components
 * @since 0.3.0
 */

import { useState, useRef, useCallback, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNavigation } from '@/platform/hooks';
import { useNotifications } from '@/platform/api/useNotifications';
import type { Notification } from '@/platform/api/notificationTypes';
import { NavIcon } from './NavIcon';
import { useHaptic } from '@/platform/services/haptic';

// ── Swipe-to-dismiss wrapper ──────────────────────────────────────────────────
// Swipe LEFT > 100px → item slides out with red delete hint → onDismiss() called.

const DISMISS_THRESHOLD = 100; // px left swipe to trigger dismiss

interface SwipeDismissWrapperProps {
  onDismiss: () => void;
  children: ReactNode;
}

function SwipeDismissWrapper({ onDismiss, children }: SwipeDismissWrapperProps) {
  const { trigger } = useHaptic();
  const [dx, setDx] = useState(0);
  const [isDismissing, setIsDismissing] = useState(false);

  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  // null = undecided, true = horizontal, false = vertical
  const isHorizontal = useRef<boolean | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isHorizontal.current = null;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (startX.current === null || startY.current === null) return;

    const touchDx = e.touches[0].clientX - startX.current;
    const touchDy = e.touches[0].clientY - startY.current;

    // Determine swipe direction after first meaningful movement
    if (isHorizontal.current === null && (Math.abs(touchDx) > 6 || Math.abs(touchDy) > 6)) {
      isHorizontal.current = Math.abs(touchDx) > Math.abs(touchDy);
    }

    // Vertical scroll — don't intercept
    if (!isHorizontal.current) return;
    // Only allow left swipe (negative dx)
    if (touchDx >= 0) return;

    // Prevent scroll while swiping left
    e.preventDefault();
    setDx(touchDx);
  }, []);

  const onTouchEnd = useCallback(() => {
    startX.current = null;
    startY.current = null;
    isHorizontal.current = null;

    if (dx < -DISMISS_THRESHOLD) {
      trigger('heavy');
      setIsDismissing(true);
      // Wait for slide-out animation before calling onDismiss
      setTimeout(() => onDismiss(), 220);
    } else {
      // Snap back
      setDx(0);
    }
  }, [dx, onDismiss, trigger]);

  if (isDismissing) return null;

  return (
    <div
      className="swipe-dismiss-wrapper"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Red delete hint — revealed behind item as it slides left */}
      <div className="swipe-dismiss-wrapper__hint" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </svg>
        <span>Smazat</span>
      </div>

      {/* Sliding content */}
      <div
        className="swipe-dismiss-wrapper__content"
        style={{
          transform: isDismissing ? 'translateX(-110%)' : `translateX(${dx}px)`,
          transition: (dx === 0 || isDismissing) ? 'transform 0.22s ease, opacity 0.22s ease' : 'none',
          opacity: isDismissing ? 0 : Math.max(0.4, 1 + dx / 300),
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function getNotificationIcon(type: Notification['type']) {
  switch (type) {
    case 'system':
      return <NavIcon name="info" size={20} />;
    case 'progress':
      return <NavIcon name="chart-line" size={20} />;
    case 'achievement':
      return '🏆';
    case 'reminder':
      return <NavIcon name="bell" size={20} />;
    default:
      return <NavIcon name="bell" size={20} />;
  }
}

const EXPAND_THRESHOLD = 120; // chars — nad tímto počtem se zobrazí "Zobrazit více"

export function NotificationCenter() {
  const navigate = useNavigate();
  const { isNotificationsOpen, closeNotifications } = useNavigation();
  const { notifications, unreadCount, isLoading, markAsRead, deleteNotification, markCtaClicked } =
    useNotifications();

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const isExpanded = (id: string) => expandedIds.has(id);

  const toggleExpanded = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Klik na notifikaci — jen označí jako přečtenou, NENAVIGUJE
  const handleItemClick = (notif: Notification) => {
    if (!notif.read) markAsRead(notif.id);
  };

  // Klik na CTA pill — označí jako přečtenou + zaznamená proklik + naviguje
  const handleCtaClick = (e: React.MouseEvent, notif: Notification) => {
    e.stopPropagation();
    if (!notif.read) markAsRead(notif.id);
    if (!notif.cta_clicked) markCtaClicked(notif.id);
    if (notif.action_url) {
      if (notif.action_url.startsWith('/')) {
        closeNotifications();
        navigate(notif.action_url);
      } else {
        window.open(notif.action_url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  // Smazání — přímé, bez confirm dialogu (Apple UX standard pro notifikace)
  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteNotification(id);
  };

  if (!isNotificationsOpen) return null;

  return (
    <div className="modal-overlay" onClick={closeNotifications}>
      <div className="notification-center" onClick={(e) => e.stopPropagation()}>

        <div className="notification-center__header">
          <h2>Notifikace</h2>
          {unreadCount > 0 && (
            <span className="notification-center__badge">{unreadCount}</span>
          )}
        </div>

        <div className="notification-center__list">
          {isLoading ? (
            <div className="notification-center__loading">
              <span className="notification-center__spinner" aria-label="Načítám notifikace" />
            </div>
          ) : notifications.length === 0 ? (
            <p className="notification-center__empty">Zatím žádné notifikace</p>
          ) : (
            notifications.map((notif) => (
              <SwipeDismissWrapper
                key={notif.id}
                onDismiss={() => deleteNotification(notif.id)}
              >
              <div
                className={`notification-item notification-item--${notif.type}${!notif.read ? ' notification-item--unread' : ''}`}
                onClick={() => handleItemClick(notif)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleItemClick(notif);
                  }
                }}
              >
                {/* Obrázek (pokud existuje) nebo ikona */}
                {notif.image_url ? (
                  <img
                    src={notif.image_url}
                    alt=""
                    className="notification-item__image"
                    loading="lazy"
                    aria-hidden="true"
                  />
                ) : (
                  <div className="notification-item__icon">
                    {getNotificationIcon(notif.type)}
                  </div>
                )}

                {/* Obsah — body má padding-right aby text nepřekrýval delete */}
                <div className="notification-item__body">
                  <h3 className="notification-item__title">{notif.title}</h3>
                  <p
                    className={`notification-item__message${isExpanded(notif.id) ? ' notification-item__message--expanded' : ''}`}
                  >
                    {notif.message}
                  </p>
                  {notif.message.length > EXPAND_THRESHOLD && (
                    <button
                      type="button"
                      className="notification-item__expand-btn"
                      onClick={(e) => toggleExpanded(e, notif.id)}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      {isExpanded(notif.id) ? 'Zobrazit méně ↑' : 'Zobrazit více ↓'}
                    </button>
                  )}

                  {/* Footer: čas vlevo, CTA vpravo */}
                  <div className="notification-item__footer">
                    <time className="notification-item__time">
                      {new Date(notif.created_at).toLocaleString('cs-CZ', {
                        day: 'numeric', month: 'numeric', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </time>
                    {notif.action_label && notif.action_url && (
                      <button
                        type="button"
                        className="notification-item__cta"
                        onClick={(e) => handleCtaClick(e, notif)}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        {notif.action_label}
                      </button>
                    )}
                  </div>
                </div>

                {/* Delete — top-right, independent of global close-button */}
                <button
                  type="button"
                  className="notification-item__delete-btn"
                  onClick={(e) => handleDelete(e, notif.id)}
                  aria-label="Smazat notifikaci"
                >
                  <svg
                    width={16}
                    height={16}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              </SwipeDismissWrapper>
            ))
          )}
        </div>

        <button className="notification-center__close" onClick={closeNotifications}>
          Zavřít
        </button>
      </div>
    </div>
  );
}

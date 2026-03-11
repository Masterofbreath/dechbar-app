/**
 * NotificationCenter - Platform Notifications Modal
 *
 * Timeline of system, progress, achievement, and social notifications.
 * Badge counter for unread items. Powered by Supabase via useNotifications hook.
 *
 * Funkce:
 * - Pinnované notifikace (is_pinned) vždy nahoře se zlatým pinem
 * - Auto-delete: promo 7d, ostatní 14d (pg_cron v DB)
 * - Swipe-to-dismiss (mobile)
 * - Markdown formátování zpráv (**bold**, *italic*, Enter)
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
import { renderMessageMarkdown } from '@/utils/renderMessageMarkdown';

// ── Swipe-to-dismiss wrapper ──────────────────────────────────────────────────

const DISMISS_THRESHOLD = 100;

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
    if (isHorizontal.current === null && (Math.abs(touchDx) > 6 || Math.abs(touchDy) > 6)) {
      isHorizontal.current = Math.abs(touchDx) > Math.abs(touchDy);
    }
    if (!isHorizontal.current) return;
    if (touchDx >= 0) return;
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
      setTimeout(() => onDismiss(), 220);
    } else {
      setDx(0);
    }
  }, [dx, onDismiss, trigger]);

  if (isDismissing) return null;

  return (
    <div className="swipe-dismiss-wrapper" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div className="swipe-dismiss-wrapper__hint" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </svg>
        <span>Smazat</span>
      </div>
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function getNotificationIcon(type: Notification['type']) {
  switch (type) {
    case 'system':      return <NavIcon name="info" size={20} />;
    case 'progress':    return <NavIcon name="chart-line" size={20} />;
    case 'achievement': return '🏆';
    case 'reminder':    return <NavIcon name="bell" size={20} />;
    default:            return <NavIcon name="bell" size={20} />;
  }
}

const EXPAND_THRESHOLD = 120;

// ── Pin ikona ────────────────────────────────────────────────────────────────

function PinIcon() {
  return (
    <svg
      className="notification-item__pin-icon"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-label="Pinnováno"
    >
      <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
    </svg>
  );
}

// ── NotificationItem subkomponenta ───────────────────────────────────────────

interface NotificationItemProps {
  notif: Notification;
  isExpanded: boolean;
  onItemClick: (notif: Notification) => void;
  onCtaClick: (e: React.MouseEvent, notif: Notification) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
  onToggleExpand: (e: React.MouseEvent, id: string) => void;
}

function NotificationItem({
  notif,
  isExpanded,
  onItemClick,
  onCtaClick,
  onDelete,
  onToggleExpand,
}: NotificationItemProps) {
  return (
    <div
      className={[
        'notification-item',
        `notification-item--${notif.type}`,
        !notif.read ? 'notification-item--unread' : '',
        notif.is_pinned ? 'notification-item--pinned' : '',
      ].filter(Boolean).join(' ')}
      onClick={() => onItemClick(notif)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onItemClick(notif);
        }
      }}
    >
      {/* Obrázek nebo ikona */}
      {notif.image_url ? (
        <img src={notif.image_url} alt="" className="notification-item__image" loading="lazy" aria-hidden="true" />
      ) : (
        <div className="notification-item__icon">
          {notif.is_pinned ? <PinIcon /> : getNotificationIcon(notif.type)}
        </div>
      )}

      {/* Obsah */}
      <div className="notification-item__body">
        <h3 className="notification-item__title">{notif.title}</h3>
        <p className={`notification-item__message${isExpanded ? ' notification-item__message--expanded' : ''}`}>
          {renderMessageMarkdown(notif.message)}
        </p>
        {notif.message.length > EXPAND_THRESHOLD && (
          <button
            type="button"
            className="notification-item__expand-btn"
            onClick={(e) => onToggleExpand(e, notif.id)}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {isExpanded ? 'Zobrazit méně ↑' : 'Zobrazit více ↓'}
          </button>
        )}

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
              onClick={(e) => onCtaClick(e, notif)}
              onKeyDown={(e) => e.stopPropagation()}
            >
              {notif.action_label}
            </button>
          )}
        </div>
      </div>

      {/* Delete */}
      <button
        type="button"
        className="notification-item__delete-btn"
        onClick={(e) => onDelete(e, notif.id)}
        aria-label="Smazat notifikaci"
      >
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function NotificationCenter() {
  const navigate = useNavigate();
  const { isNotificationsOpen, closeNotifications } = useNavigation();
  const { notifications, unreadCount, isLoading, markAsRead, deleteNotification, markCtaClicked, markAllAsRead, markAllAsReadPending, deleteAllNotifications, deleteAllNotificationsPending } =
    useNotifications();

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const isExpanded = (id: string) => expandedIds.has(id);
  const toggleExpanded = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleItemClick = (notif: Notification) => {
    if (!notif.read) markAsRead(notif.id);
  };

  const handleCtaClick = (e: React.MouseEvent, notif: Notification) => {
    e.stopPropagation();
    if (!notif.read) markAsRead(notif.id);
    if (!notif.cta_clicked) markCtaClicked(notif.id);
    if (notif.action_url) {
      let internalPath: string | null = null;
      try {
        const parsed = new URL(notif.action_url, window.location.origin);
        if (parsed.origin === window.location.origin) {
          internalPath = parsed.pathname + parsed.search + parsed.hash;
        }
      } catch {
        if (notif.action_url.startsWith('/')) internalPath = notif.action_url;
      }
      if (internalPath) {
        closeNotifications();
        navigate(internalPath);
      } else {
        window.open(notif.action_url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteNotification(id);
  };

  if (!isNotificationsOpen) return null;

  const pinned    = notifications.filter((n) => n.is_pinned);
  const regular   = notifications.filter((n) => !n.is_pinned);
  const hasRegular = regular.length > 0;
  const unreadNonPinned = regular.filter((n) => !n.read).length;

  return (
    <div className="modal-overlay" onClick={closeNotifications}>
      <div className="notification-center" onClick={(e) => e.stopPropagation()}>

        <div className="notification-center__header">
          <h2>Notifikace</h2>
          <div className="notification-center__header-right">
            {unreadCount > 0 && (
              <span className="notification-center__badge">{unreadCount}</span>
            )}
            {unreadNonPinned > 0 && (
              <button
                type="button"
                className="notification-center__mark-all-btn"
                onClick={() => markAllAsRead()}
                disabled={markAllAsReadPending}
                title="Označit vše jako přečtené (kromě pinnovaných)"
              >
                {markAllAsReadPending ? (
                  <span className="notification-center__mark-all-spinner" aria-hidden="true" />
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                Vše přečteno
              </button>
            )}
            {hasRegular && (
              <button
                type="button"
                className="notification-center__delete-all-btn"
                onClick={() => deleteAllNotifications()}
                disabled={deleteAllNotificationsPending}
                title="Smazat vše (kromě pinnovaných)"
              >
                {deleteAllNotificationsPending ? (
                  <span className="notification-center__mark-all-spinner" aria-hidden="true" />
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                )}
                Smazat vše
              </button>
            )}
          </div>
        </div>

        <div className="notification-center__list">
          {isLoading ? (
            <div className="notification-center__loading">
              <span className="notification-center__spinner" aria-label="Načítám notifikace" />
            </div>
          ) : notifications.length === 0 ? (
            <p className="notification-center__empty">Zatím žádné notifikace</p>
          ) : (
            <>
              {/* ── Pinnované sekce ── */}
              {pinned.length > 0 && (
                <>
                  <div className="notification-center__section-label notification-center__section-label--pinned">
                    <PinIcon />
                    Důležité
                  </div>
                  {pinned.map((notif) => (
                    <SwipeDismissWrapper key={notif.id} onDismiss={() => deleteNotification(notif.id)}>
                      <NotificationItem
                        notif={notif}
                        isExpanded={isExpanded(notif.id)}
                        onItemClick={handleItemClick}
                        onCtaClick={handleCtaClick}
                        onDelete={handleDelete}
                        onToggleExpand={toggleExpanded}
                      />
                    </SwipeDismissWrapper>
                  ))}
                  {regular.length > 0 && <div className="notification-center__separator" />}
                </>
              )}

              {/* ── Běžné notifikace ── */}
              {regular.map((notif) => (
                <SwipeDismissWrapper key={notif.id} onDismiss={() => deleteNotification(notif.id)}>
                  <NotificationItem
                    notif={notif}
                    isExpanded={isExpanded(notif.id)}
                    onItemClick={handleItemClick}
                    onCtaClick={handleCtaClick}
                    onDelete={handleDelete}
                    onToggleExpand={toggleExpanded}
                  />
                </SwipeDismissWrapper>
              ))}
            </>
          )}
        </div>

        <button className="notification-center__close" onClick={closeNotifications}>
          Zavřít
        </button>
      </div>
    </div>
  );
}

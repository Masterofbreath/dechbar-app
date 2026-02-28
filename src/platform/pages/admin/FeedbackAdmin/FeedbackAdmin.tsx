/**
 * FeedbackAdmin — Admin správa podnětů "Sdílej podnět"
 *
 * Taby:
 *   Kanban   → 3 sloupce DnD (Nové / Přijaté / Hotové) vždy vedle sebe
 *   Nové     → list podnětů se statusem new
 *   Přijaté  → list podnětů se statusem accepted
 *   Hotové   → list podnětů se statusem done
 *   Přispěvatelé → TOP 3 + tabulka s filtrací
 *
 * @package DechBar_App
 * @subpackage Platform/Pages/Admin
 * @since 2026-02-28
 */

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  getFeedbackList,
  updateFeedbackStatus,
  updateFeedbackPriority,
  getFeedbackStats,
} from '@/platform/services/admin/feedbackAdminApi';
import { CATEGORY_LABELS } from '@/platform/api/feedbackTypes';
import type {
  AdminFeedback,
  FeedbackCategory,
  FeedbackStats,
} from '@/platform/api/feedbackTypes';
import './FeedbackAdmin.css';

// ============================================================
// Typy
// ============================================================

type Tab = 'kanban' | 'nove' | 'prijate' | 'hotove' | 'prispevately';
type SortOrder = 'priority' | 'date';
type ContribPeriod = 'week' | 'month' | 'year' | 'all';

const TABS: { id: Tab; label: string; status?: AdminFeedback['status'] }[] = [
  { id: 'kanban',       label: 'Kanban'                              },
  { id: 'nove',         label: 'Nové',          status: 'new'      },
  { id: 'prijate',      label: 'Přijaté',        status: 'accepted' },
  { id: 'hotove',       label: 'Hotové',         status: 'done'     },
  { id: 'prispevately', label: 'Přispěvatelé'                        },
];

const CATEGORY_OPTIONS: { value: '' | FeedbackCategory; label: string }[] = [
  { value: '',         label: 'Všechny kategorie' },
  { value: 'napad',    label: CATEGORY_LABELS.napad    },
  { value: 'chyba',    label: CATEGORY_LABELS.chyba    },
  { value: 'pochvala', label: CATEGORY_LABELS.pochvala },
  { value: 'jine',     label: CATEGORY_LABELS.jine     },
];

const CATEGORY_BADGE_CLASS: Record<FeedbackCategory, string> = {
  napad:    'feedback-admin__badge--napad',
  chyba:    'feedback-admin__badge--chyba',
  pochvala: 'feedback-admin__badge--pochvala',
  jine:     'feedback-admin__badge--jine',
};

// ============================================================
// Priority barvy dle kategorie
// pochvala → zlatá škála (primary/secondary/tertiary gold)
// ostatní  → teal(1) / oranžová(2) / červená(3)
// ============================================================

const PRIORITY_COLORS_DEFAULT: Record<1 | 2 | 3, string> = {
  1: '#6CB4C8',
  2: '#E8821A',
  3: '#E84040',
};

const PRIORITY_COLORS_POCHVALA: Record<1 | 2 | 3, string> = {
  1: '#B8974A',  // gold tertiary
  2: '#D6A23A',  // gold secondary
  3: '#F0B429',  // gold primary
};

function getPriorityColors(category: FeedbackCategory) {
  return category === 'pochvala' ? PRIORITY_COLORS_POCHVALA : PRIORITY_COLORS_DEFAULT;
}

// ============================================================
// SVG ikony dle kategorie
// ============================================================

function FlameIcon({ filled, color }: { filled: boolean; color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24"
      fill={filled ? color : 'none'}
      stroke={filled ? color : 'var(--color-text-tertiary, #707070)'}
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8.5 14c0-3 2-5 3.5-7.5C13.5 9 15 11 15 14a3.5 3.5 0 0 1-7 0z" />
      <path d="M11 19c-3.3 0-6-2.7-6-6 0-2.5 1.5-4.5 3-6 0 2 1 3.5 2 4.5 0-2 1-4 2.5-5.5 1 2 2 4 2 6.5a4.5 4.5 0 0 1-3.5 6.5z" />
    </svg>
  );
}

function ExclamationIcon({ filled, color }: { filled: boolean; color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24"
      fill={filled ? color : 'none'}
      stroke={filled ? color : 'var(--color-text-tertiary, #707070)'}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function StarIcon({ filled, color }: { filled: boolean; color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24"
      fill={filled ? color : 'none'}
      stroke={filled ? color : 'var(--color-text-tertiary, #707070)'}
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function PriorityIcon({
  category, level, filled,
}: {
  category: FeedbackCategory; level: 1 | 2 | 3; filled: boolean;
}) {
  const color = getPriorityColors(category)[level];
  if (category === 'chyba')    return <ExclamationIcon filled={filled} color={color} />;
  if (category === 'pochvala') return <StarIcon        filled={filled} color={color} />;
  return <FlameIcon filled={filled} color={color} />;
}

// ============================================================
// PriorityControl
// ============================================================

interface PriorityControlProps {
  priority:   1 | 2 | 3 | null;
  feedbackId: string;
  category:   FeedbackCategory;
  locked:     boolean;
  onUpdate:   (p: 1 | 2 | 3 | null) => void;
}

function PriorityControl({ priority, feedbackId, category, locked, onUpdate }: PriorityControlProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (p: 1 | 2 | 3 | null) => updateFeedbackPriority(feedbackId, p),
    onSuccess: (_data, p) => {
      onUpdate(p);
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
    },
  });

  const handle = (level: 1 | 2 | 3) => {
    if (locked) return;
    mutation.mutate(priority === level ? null : level);
  };

  const label = locked
    ? `Priorita ${priority ?? 'nenastavena'} — uzamčena`
    : priority ? `Priorita ${priority}/3 — klikni pro změnu` : 'Nastavit prioritu';

  return (
    <div
      className={`feedback-admin__priority ${locked ? 'feedback-admin__priority--locked' : ''}`}
      aria-label={label}
      title={label}
    >
      {([1, 2, 3] as const).map((level) => (
        <button
          key={level}
          type="button"
          className="feedback-admin__priority-btn"
          onClick={() => handle(level)}
          disabled={locked || mutation.isPending}
          aria-label={`Priorita ${level}`}
        >
          <PriorityIcon
            category={category}
            level={level}
            filled={priority !== null && priority >= level}
          />
        </button>
      ))}
    </div>
  );
}

// ============================================================
// FeedbackCard
// ============================================================

interface FeedbackCardProps {
  item:        AdminFeedback;
  isDragging?: boolean;
}

export function FeedbackCard({ item, isDragging = false }: FeedbackCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const [priority, setPriority] = useState<1 | 2 | 3 | null>(item.priority);
  const queryClient = useQueryClient();

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'accepted' | 'done' }) =>
      updateFeedbackStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-feedback'] }),
  });

  const isShortText = item.message.length <= 180;
  const isLocked    = item.status === 'done';

  const formattedDate = new Intl.DateTimeFormat('cs-CZ', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(item.created_at));

  const initials = item.user_name
    ? item.user_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  // Levý okraj = vždy barva kategorie, při prioritě 3 se zvýrazní
  const borderClass = priority === 3
    ? `feedback-admin__card--cat-${item.category} feedback-admin__card--cat-${item.category}--max`
    : `feedback-admin__card--cat-${item.category}`;

  return (
    <div
      className={[
        'feedback-admin__card',
        `feedback-admin__card--${item.status}`,
        borderClass,
        isDragging ? 'feedback-admin__card--dragging' : '',
      ].filter(Boolean).join(' ')}
    >
      <span className="feedback-admin__card-number">#{item.feedback_number}</span>

      <div className="feedback-admin__card-header">
        {item.user_avatar_url ? (
          <img src={item.user_avatar_url} alt={item.user_name ?? 'Uživatel'} className="feedback-admin__avatar" />
        ) : (
          <div className="feedback-admin__avatar feedback-admin__avatar--initials">{initials}</div>
        )}
        <div className="feedback-admin__card-meta">
          <span className="feedback-admin__user-name">
            {item.user_name ?? item.user_email ?? 'Neznámý uživatel'}
          </span>
          <span className="feedback-admin__card-date">{formattedDate}</span>
        </div>
        <div className="feedback-admin__card-header-right">
          <PriorityControl
            priority={priority}
            feedbackId={item.id}
            category={item.category}
            locked={isLocked}
            onUpdate={setPriority}
          />
          <div className="feedback-admin__badges">
            <span className={`feedback-admin__badge ${CATEGORY_BADGE_CLASS[item.category]}`}>
              {CATEGORY_LABELS[item.category]}
            </span>
            {item.app_version && (
              <span className="feedback-admin__badge feedback-admin__badge--version">
                v{item.app_version}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="feedback-admin__card-body">
        <p className={`feedback-admin__message ${expanded || isShortText ? '' : 'feedback-admin__message--truncated'}`}>
          {item.message}
        </p>
        {!isShortText && (
          <button type="button" className="feedback-admin__expand-btn" onClick={() => setExpanded((v) => !v)}>
            {expanded ? 'Zobrazit méně' : 'Zobrazit více'}
          </button>
        )}
      </div>

      {item.image_url && (
        <div className="feedback-admin__screenshot">
          <img
            src={item.image_url}
            alt="Screenshot"
            className="feedback-admin__screenshot-thumb"
            onClick={() => setLightbox(true)}
          />
          {lightbox && (
            <>
              <div className="feedback-admin__lightbox-overlay" onClick={() => setLightbox(false)} />
              <div className="feedback-admin__lightbox">
                <img src={item.image_url} alt="Screenshot (plná velikost)" />
                <button type="button" className="feedback-admin__lightbox-close" onClick={() => setLightbox(false)}>
                  Zavřít
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="feedback-admin__card-footer">
        {item.status === 'new' && (
          <button
            type="button"
            className="feedback-admin__action-btn feedback-admin__action-btn--accept"
            onClick={() => statusMutation.mutate({ id: item.id, status: 'accepted' })}
            disabled={statusMutation.isPending}
          >
            {statusMutation.isPending ? 'Ukládám...' : 'Přijmout'}
          </button>
        )}
        {item.status === 'accepted' && (
          <button
            type="button"
            className="feedback-admin__action-btn feedback-admin__action-btn--done"
            onClick={() => statusMutation.mutate({ id: item.id, status: 'done' })}
            disabled={statusMutation.isPending}
          >
            {statusMutation.isPending ? 'Ukládám...' : 'Označit jako hotové'}
          </button>
        )}
        {item.status === 'done' && (
          <span className="feedback-admin__action-btn feedback-admin__action-btn--completed">
            Splněno
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================
// DraggableCard
// ============================================================

function DraggableCard({ item }: { item: AdminFeedback }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { item },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <FeedbackCard item={item} isDragging={isDragging} />
    </div>
  );
}

// ============================================================
// KanbanColumn
// ============================================================

const COLUMN_LABELS: Record<string, string> = {
  new:      'Nové',
  accepted: 'Přijaté',
  done:     'Hotové',
};

interface KanbanColumnProps {
  status: 'new' | 'accepted' | 'done';
  items:  AdminFeedback[];
  isOver: boolean;
}

function KanbanColumn({ status, items, isOver }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={[
        'feedback-admin__column',
        `feedback-admin__column--${status}`,
        isOver ? 'feedback-admin__column--over' : '',
      ].filter(Boolean).join(' ')}
    >
      <div className="feedback-admin__column-header">
        <span className="feedback-admin__column-title">{COLUMN_LABELS[status]}</span>
        <span className="feedback-admin__column-count">{items.length}</span>
      </div>
      <div className="feedback-admin__column-body">
        {items.length === 0 ? (
          <div className="feedback-admin__column-empty">
            {status === 'done' ? 'Zatím žádné splněné podněty.' : 'Prázdno'}
          </div>
        ) : (
          items.map((item) => <DraggableCard key={item.id} item={item} />)
        )}
      </div>
    </div>
  );
}

// ============================================================
// SimpleList — plain list (taby Nové / Přijaté / Hotové)
// ============================================================

function SimpleList({ items, isLoading, isError }: {
  items:     AdminFeedback[];
  isLoading: boolean;
  isError:   boolean;
}) {
  if (isLoading) return <div className="feedback-admin__loading">Načítám podněty...</div>;
  if (isError)   return <div className="feedback-admin__error">Nepodařilo se načíst podněty.</div>;
  if (items.length === 0) {
    return <div className="feedback-admin__empty">Zatím žádné podněty v této kategorii.</div>;
  }
  return (
    <div className="feedback-admin__list">
      {items.map((item) => <FeedbackCard key={item.id} item={item} />)}
    </div>
  );
}

// ============================================================
// ContributorsTab
// ============================================================

const PERIOD_LABELS: Record<ContribPeriod, string> = {
  week: 'Týden', month: 'Měsíc', year: 'Rok', all: 'Vše',
};

const MEDAL_CSS  = ['feedback-admin__medal--gold', 'feedback-admin__medal--silver', 'feedback-admin__medal--bronze'];
const MEDAL_RANK = ['1.', '2.', '3.'];

function ContributorsTab() {
  const [period, setPeriod]     = useState<ContribPeriod>('all');
  const [catFilter, setCatFilter] = useState<'' | FeedbackCategory>('');

  const { data: stats = [], isLoading, isError } = useQuery<FeedbackStats[]>({
    queryKey: ['admin-feedback-stats'],
    queryFn:  getFeedbackStats,
  });

  const getScore = useCallback((s: FeedbackStats): number => {
    if (period === 'week')  return s.score_week;
    if (period === 'month') return s.score_month;
    if (period === 'year')  return s.score_year;
    return s.score;
  }, [period]);

  const getCount = useCallback((s: FeedbackStats): number => {
    if (catFilter === 'napad')    return s.napad_count;
    if (catFilter === 'chyba')    return s.chyba_count;
    if (catFilter === 'pochvala') return s.pochvala_count;
    if (catFilter === 'jine')     return s.jine_count;
    if (period === 'week')  return s.this_week;
    if (period === 'month') return s.this_month;
    if (period === 'year')  return s.this_year;
    return s.total;
  }, [period, catFilter]);

  const sorted = useMemo(() =>
    [...stats].sort((a, b) => getScore(b) - getScore(a)),
    [stats, getScore],
  );

  // Vždy 3 sloty — pokud méně přispěvatelů, sloty zůstanou prázdné
  const top3Slots: (FeedbackStats | null)[] = [
    sorted[0] ?? null,
    sorted[1] ?? null,
    sorted[2] ?? null,
  ];

  if (isLoading) return <div className="feedback-admin__loading">Načítám přispěvatele...</div>;
  if (isError)   return <div className="feedback-admin__error">Nepodařilo se načíst statistiky.</div>;

  return (
    <div className="feedback-admin__contributors">

      {/* TOP 3 — vždy 3 sloty */}
      <div className="feedback-admin__top3">
        {top3Slots.map((s, idx) => {
          const initials = s?.user_name
            ? s.user_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
            : '?';

          return (
            <div key={idx} className={`feedback-admin__top3-card ${MEDAL_CSS[idx]} ${!s ? 'feedback-admin__top3-card--empty' : ''}`}>
              <span className="feedback-admin__top3-rank">{MEDAL_RANK[idx]}</span>
              {s ? (
                <>
                  {s.user_avatar_url ? (
                    <img src={s.user_avatar_url} alt={s.user_name ?? ''} className="feedback-admin__top3-avatar" />
                  ) : (
                    <div className="feedback-admin__top3-avatar feedback-admin__avatar--initials">{initials}</div>
                  )}
                  <span className="feedback-admin__top3-name">{s.user_name ?? 'Neznámý'}</span>
                  <span className="feedback-admin__top3-score">{getScore(s)} bodů</span>
                </>
              ) : (
                <span className="feedback-admin__top3-placeholder">—</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Filtry */}
      <div className="feedback-admin__contrib-filters">
        <div className="feedback-admin__period-toggle">
          {(Object.keys(PERIOD_LABELS) as ContribPeriod[]).map((p) => (
            <button
              key={p}
              type="button"
              className={`feedback-admin__period-btn ${period === p ? 'feedback-admin__period-btn--active' : ''}`}
              onClick={() => setPeriod(p)}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
        <select
          className="feedback-admin__select"
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value as '' | FeedbackCategory)}
        >
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Tabulka — bez redundantního period sloupce */}
      {sorted.length === 0 ? (
        <div className="feedback-admin__empty">Zatím žádní přispěvatelé.</div>
      ) : (
        <div className="feedback-admin__stats-table-wrap">
        <table className="feedback-admin__stats-table">
          <thead>
            <tr>
              <th className="feedback-admin__col-rank">#</th>
              <th className="feedback-admin__col-user">Uživatel</th>
              <th className="feedback-admin__col-num" title="Hodnotové skóre (pochvaly se nepočítají)">Skóre</th>
              <th className="feedback-admin__col-num">Počet</th>
              <th className="feedback-admin__col-num">Nápady</th>
              <th className="feedback-admin__col-num">Chyby</th>
              <th className="feedback-admin__col-num" title="Pochvaly se nezapočítávají do skóre">Pochvaly</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s, idx) => {
              const initials = s.user_name
                ? s.user_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                : '?';
              return (
                <tr key={s.user_id} className={idx < 3 ? 'feedback-admin__stats-row--top' : ''}>
                  <td className="feedback-admin__col-rank">{idx + 1}.</td>
                  <td className="feedback-admin__col-user">
                    {s.user_avatar_url ? (
                      <img src={s.user_avatar_url} alt={s.user_name ?? ''} className="feedback-admin__avatar feedback-admin__avatar--sm" />
                    ) : (
                      <div className="feedback-admin__avatar feedback-admin__avatar--sm feedback-admin__avatar--initials">{initials}</div>
                    )}
                    <span>{s.user_name ?? 'Neznámý uživatel'}</span>
                  </td>
                  <td className="feedback-admin__col-num">
                    <span className="feedback-admin__total-badge">{getScore(s)}</span>
                  </td>
                  <td className="feedback-admin__col-num">{getCount(s)}</td>
                  <td className="feedback-admin__col-num">{s.napad_count}</td>
                  <td className="feedback-admin__col-num">{s.chyba_count}</td>
                  <td className="feedback-admin__col-num feedback-admin__col-pochvala">{s.pochvala_count}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}

// ============================================================
// FeedbackAdmin — hlavní komponenta
// ============================================================

export default function FeedbackAdmin() {
  const [activeTab, setActiveTab]           = useState<Tab>('kanban');
  const [search, setSearch]                 = useState('');
  const [filterCategory, setFilterCategory] = useState<'' | FeedbackCategory>('');
  const [sortOrder, setSortOrder]           = useState<SortOrder>('priority');
  const [activeDragId, setActiveDragId]     = useState<string | null>(null);
  const [overColumnId, setOverColumnId]     = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: allFeedback = [], isLoading, isError } = useQuery<AdminFeedback[]>({
    queryKey: ['admin-feedback'],
    queryFn:  getFeedbackList,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'accepted' | 'done' }) =>
      updateFeedbackStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-feedback'] }),
  });

  const sortItems = useCallback((items: AdminFeedback[]) => {
    if (sortOrder === 'priority') {
      return [...items].sort((a, b) => {
        const pa = a.priority ?? 0, pb = b.priority ?? 0;
        if (pb !== pa) return pb - pa;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    }
    return [...items].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [sortOrder]);

  const applyFilters = useCallback((items: AdminFeedback[]) =>
    items.filter((item) => {
      if (filterCategory && item.category !== filterCategory) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!(item.user_name ?? item.user_email ?? '').toLowerCase().includes(q)) return false;
      }
      return true;
    }),
  [filterCategory, search]);

  const noveItems    = useMemo(() => sortItems(applyFilters(allFeedback.filter((f) => f.status === 'new'))),      [allFeedback, sortItems, applyFilters]);
  const prijateItems = useMemo(() => sortItems(applyFilters(allFeedback.filter((f) => f.status === 'accepted'))), [allFeedback, sortItems, applyFilters]);
  const hotoveItems  = useMemo(() => sortItems(applyFilters(allFeedback.filter((f) => f.status === 'done'))),     [allFeedback, sortItems, applyFilters]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  const activeDragItem = activeDragId
    ? allFeedback.find((f) => f.id === activeDragId) ?? null
    : null;

  const handleDragStart = (event: DragStartEvent) => setActiveDragId(event.active.id as string);
  const handleDragOver  = (event: { over: { id: string } | null }) => setOverColumnId(event.over?.id ?? null);

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    setOverColumnId(null);
    const { active, over } = event;
    if (!over) return;
    const draggedItem = allFeedback.find((f) => f.id === active.id);
    if (!draggedItem) return;
    const targetStatus = over.id as 'new' | 'accepted' | 'done';
    if (draggedItem.status === targetStatus) return;
    const validTransitions: Record<string, string[]> = { new: ['accepted'], accepted: ['done'] };
    if (!validTransitions[draggedItem.status]?.includes(targetStatus)) return;
    statusMutation.mutate({ id: draggedItem.id, status: targetStatus as 'accepted' | 'done' });
  };

  const counts = useMemo(() => ({
    nove:    allFeedback.filter((f) => f.status === 'new').length,
    prijate: allFeedback.filter((f) => f.status === 'accepted').length,
    hotove:  allFeedback.filter((f) => f.status === 'done').length,
  }), [allFeedback]);

  const isFilterableTab = activeTab !== 'prispevately';

  // Položky pro simple list tabu
  const activeListItems =
    activeTab === 'nove'    ? noveItems    :
    activeTab === 'prijate' ? prijateItems :
    activeTab === 'hotove'  ? hotoveItems  : [];

  return (
    <div className="feedback-admin">
      <div className="feedback-admin__page-header">
        <h1 className="feedback-admin__title">Feedback</h1>
        <p className="feedback-admin__subtitle">Podněty od členů DechBaru</p>
      </div>

      {/* Taby */}
      <nav className="feedback-admin__tabs" aria-label="Sekce feedbacku">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`feedback-admin__tab ${activeTab === tab.id ? 'feedback-admin__tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            {tab.label}
            {tab.status && counts[tab.id as keyof typeof counts] > 0 && (
              <span className="feedback-admin__tab-count">{counts[tab.id as keyof typeof counts]}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Filtry (ne pro Přispěvatelé) */}
      {isFilterableTab && (
        <div className="feedback-admin__filters">
          <input
            type="search"
            className="feedback-admin__search"
            placeholder="Hledat podle jména..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="feedback-admin__select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as '' | FeedbackCategory)}
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            type="button"
            className={`feedback-admin__sort-btn ${sortOrder === 'priority' ? 'feedback-admin__sort-btn--active' : ''}`}
            onClick={() => setSortOrder((s) => s === 'priority' ? 'date' : 'priority')}
            title={sortOrder === 'priority' ? 'Řazeno: Priorita → Datum' : 'Řazeno: Datum'}
          >
            {sortOrder === 'priority' ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M8.5 14c0-3 2-5 3.5-7.5C13.5 9 15 11 15 14a3.5 3.5 0 0 1-7 0z" />
                </svg>
                Priorita
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M3 4h13M3 8h9M3 12h5M21 4l-4 4-4-4M17 4v16" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Datum
              </>
            )}
          </button>
        </div>
      )}

      {/* Přispěvatelé */}
      {activeTab === 'prispevately' && <ContributorsTab />}

      {/* Kanban tab — DnD 3 sloupce */}
      {activeTab === 'kanban' && (
        <>
          {isLoading && <div className="feedback-admin__loading">Načítám podněty...</div>}
          {isError   && <div className="feedback-admin__error">Nepodařilo se načíst podněty.</div>}
          {!isLoading && !isError && (
            <DndContext
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <div className="feedback-admin__kanban">
                <KanbanColumn status="new"      items={noveItems}    isOver={overColumnId === 'new'} />
                <KanbanColumn status="accepted" items={prijateItems} isOver={overColumnId === 'accepted'} />
                <KanbanColumn status="done"     items={hotoveItems}  isOver={overColumnId === 'done'} />
              </div>
              <DragOverlay>
                {activeDragItem && (
                  <div className="feedback-admin__drag-overlay">
                    <FeedbackCard item={activeDragItem} isDragging />
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          )}
        </>
      )}

      {/* Simple list taby (Nové / Přijaté / Hotové) */}
      {(activeTab === 'nove' || activeTab === 'prijate' || activeTab === 'hotove') && (
        <SimpleList
          items={activeListItems}
          isLoading={isLoading}
          isError={isError}
        />
      )}
    </div>
  );
}

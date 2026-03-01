import { useState, useMemo } from 'react'
import { useAkademieSeries, useAkademieLessons, useToggleLessonFavorite } from '../../api/useAkademieProgram'
import { useAkademiePlayback } from '../../hooks/useAkademiePlayback'
import { useActiveDailyProgram } from '@/modules/mvp0/hooks/useActiveDailyProgram'
import { LockedFeatureModal } from '@/modules/mvp0/components'
import type { AkademieProgramVM, AkademieSeries, LessonWithProgress } from '../../types'

interface ProgramDetailProps {
  program: AkademieProgramVM
  userId: string | undefined
  onBack: () => void
  backLabel?: string
  /** Slug kategorie — předává se do Track pro správnou navigaci z StickyPlayeru */
  categorySlug: string
}

// --------------------------------------------------
// LessonRow — inline v accordion panelu
// --------------------------------------------------

interface LessonRowProps {
  lesson: LessonWithProgress
  seriesId: string
  isSeriesLocked: boolean
  userId: string | undefined
  coverUrl: string | null
  programId: string
  categorySlug: string
  programTitle: string
  onLockedPlay: () => void
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ width: 16, height: 16 }}>
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 14, height: 14 }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function LessonHeartIcon({ filled }: { filled: boolean }) {
  return filled ? (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ width: 14, height: 14 }}>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 14, height: 14 }}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

interface LessonRowPropsWithDays extends LessonRowProps {
  daysElapsed: number
  launchDate: Date | null
}

function DayLockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 14, height: 14, opacity: 0.55 }}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function formatCzechDate(date: Date): string {
  return date.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' })
}

function LessonRow({ lesson, seriesId, isSeriesLocked, userId, coverUrl, programId, categorySlug, programTitle, onLockedPlay, daysElapsed, launchDate }: LessonRowPropsWithDays) {
  const { playLesson, isCurrentlyPlaying } = useAkademiePlayback({ coverUrl, programId, categorySlug, programTitle })
  const toggleFavorite = useToggleLessonFavorite()
  const playing = isCurrentlyPlaying(lesson.id)

  // Postupné odemykání: pokud je launch_date nastaveno a day_number překračuje daysElapsed
  const isDayLocked = isFinite(daysElapsed) && lesson.day_number > daysElapsed

  // Tooltip pro zamčenou lekci — "Dostupné od D3 — 5. 3. 2026"
  const dayLockTitle = isDayLocked && launchDate
    ? (() => {
        const unlockDate = new Date(launchDate)
        unlockDate.setDate(unlockDate.getDate() + lesson.day_number - 1)
        return `Dostupné od D${lesson.day_number} — ${formatCzechDate(unlockDate)}`
      })()
    : undefined

  function handleClick() {
    if (isDayLocked) return
    if (isSeriesLocked) {
      onLockedPlay()
      return
    }
    playLesson(lesson)
  }

  function handleFavorite(e: React.MouseEvent) {
    e.stopPropagation()
    if (!userId || isSeriesLocked || isDayLocked) return
    toggleFavorite.mutate({
      userId,
      lessonId: lesson.id,
      seriesId,
      isFavorite: lesson.isFavorite,
    })
  }

  return (
    <div
      className={[
        'akademie-lesson-row',
        playing ? 'akademie-lesson-row--playing' : '',
        lesson.isCompleted ? 'akademie-lesson-row--completed' : '',
        isSeriesLocked ? 'akademie-lesson-row--locked' : '',
        isDayLocked ? 'akademie-lesson-row--day-locked' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="button"
      tabIndex={isDayLocked ? -1 : 0}
      aria-label={isDayLocked ? dayLockTitle : `${lesson.title}${lesson.isCompleted ? ', dokončeno' : ''}${lesson.isFavorite ? ', oblíbené' : ''}`}
      aria-disabled={isDayLocked}
      title={dayLockTitle}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (isDayLocked) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
    >
      <div className="akademie-lesson-row__day">
        D{lesson.day_number}
      </div>

      <div className="akademie-lesson-row__content">
        <span className="akademie-lesson-row__title">{lesson.title}</span>
      </div>

      {/* Favourite star — pouze pro odemčené, vlastněné série */}
      {!isSeriesLocked && !isDayLocked && userId && (
        <button
          className={[
            'akademie-lesson-row__star',
            lesson.isFavorite ? 'akademie-lesson-row__star--active' : '',
          ].filter(Boolean).join(' ')}
          onClick={handleFavorite}
          type="button"
          aria-label={lesson.isFavorite ? 'Odebrat z oblíbených' : 'Přidat do oblíbených'}
          aria-pressed={lesson.isFavorite}
        >
          <LessonHeartIcon filled={lesson.isFavorite} />
        </button>
      )}

      <div className="akademie-lesson-row__status">
        {isDayLocked ? (
          <span className="akademie-lesson-row__day-lock" aria-label={dayLockTitle}>
            <DayLockIcon />
          </span>
        ) : lesson.isCompleted ? (
          <span className="akademie-lesson-row__check" aria-label="Dokončeno">
            <CheckIcon />
          </span>
        ) : (
          <span className={['akademie-lesson-row__play', playing ? 'akademie-lesson-row__play--active' : ''].filter(Boolean).join(' ')}>
            <PlayIcon />
          </span>
        )}
      </div>
    </div>
  )
}

// --------------------------------------------------
// AccordionSeries — jedna série jako accordion item
// --------------------------------------------------

interface AccordionSeriesProps {
  series: AkademieSeries
  seriesIndex: number
  isOwned: boolean
  userId: string | undefined
  coverUrl: string | null
  programId: string
  categorySlug: string
  programTitle: string
  isOpen: boolean
  onToggle: () => void
  daysElapsed: number
  launchDate: Date | null
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 18, height: 18 }}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function AccordionSeries({ series, seriesIndex, isOwned, userId, coverUrl, programId, categorySlug, programTitle, isOpen, onToggle, daysElapsed, launchDate }: AccordionSeriesProps) {
  const [lockedModalOpen, setLockedModalOpen] = useState(false)

  const { data: lessons, isLoading } = useAkademieLessons(
    isOpen ? series.id : '',
    userId,
  )

  return (
    <div className={['akademie-accordion-item', isOpen ? 'akademie-accordion-item--open' : ''].filter(Boolean).join(' ')}>
      {/* Trigger */}
      <button
        className="akademie-accordion-trigger"
        onClick={onToggle}
        type="button"
        aria-expanded={isOpen}
        aria-controls={`accordion-panel-${series.id}`}
      >
        {/* Týden badge */}
        <span className="akademie-accordion-trigger__week">
          T{seriesIndex + 1}
        </span>

        {/* Info */}
        <span className="akademie-accordion-trigger__content">
          <span className="akademie-accordion-trigger__name">{series.name}</span>
        </span>

        {/* Lock nebo chevron */}
        {!isOwned ? (
          <span className="akademie-accordion-trigger__lock">
            <LockIcon />
          </span>
        ) : (
          <span className="akademie-accordion-trigger__chevron">
            <ChevronRightIcon />
          </span>
        )}
      </button>

      {/* Content panel — vždy v DOM, CSS show/hide zabraňuje scroll jumpu při collapse */}
      <div
        className="akademie-accordion-panel"
        id={`accordion-panel-${series.id}`}
        role="region"
        aria-label={`Série ${seriesIndex + 1}: ${series.name}`}
        hidden={!isOpen}
        style={!isOpen ? { display: 'none' } : undefined}
      >
        {isLoading && (
          <div style={{ padding: '12px 16px', color: 'var(--color-text-tertiary)', fontSize: '0.8125rem' }}>
            Načítám lekce…
          </div>
        )}

        {!isLoading && lessons?.length === 0 && (
          <div style={{ padding: '12px 16px', color: 'var(--color-text-tertiary)', fontSize: '0.8125rem' }}>
            Lekce budou brzy k dispozici.
          </div>
        )}

        {!isLoading &&
          lessons?.map((lesson) => (
            <LessonRow
              key={lesson.id}
              lesson={lesson}
              seriesId={series.id}
              isSeriesLocked={!isOwned}
              userId={userId}
              coverUrl={coverUrl}
              programId={programId}
              categorySlug={categorySlug}
              programTitle={programTitle}
              onLockedPlay={() => setLockedModalOpen(true)}
              daysElapsed={daysElapsed}
              launchDate={launchDate}
            />
          ))}
      </div>

      <LockedFeatureModal
        isOpen={lockedModalOpen}
        onClose={() => setLockedModalOpen(false)}
        featureName="Týdenní série"
        tierRequired="AKADEMIE"
        websiteUrl="https://zdravedychej.cz"
      />
    </div>
  )
}

// --------------------------------------------------
// ProgramDetail — hlavní komponenta
// --------------------------------------------------

export function ProgramDetail({ program, userId, onBack, backLabel = 'Zpět', categorySlug }: ProgramDetailProps) {
  const { data: series, isLoading: seriesLoading } = useAkademieSeries(program.module_id)
  const [openSeriesId, setOpenSeriesId] = useState<string | null>(null)

  const { data: activeProgram, setActiveProgram, clearActiveProgram } = useActiveDailyProgram(userId)
  const isActiveProgram = activeProgram?.program.module_id === program.module_id

  // Prefer DB value; fall back to computed from series count
  const durationDays = program.duration_days ?? (series?.length ?? 0) * 7
  const dailyMinutes = program.daily_minutes ?? null

  // Postupné odemykání dnů — useMemo zabraňuje volání Date.now() při každém re-renderu
  const { launchDate, daysElapsed } = useMemo(() => {
    const ld = program.launch_date ? new Date(program.launch_date) : null
    const elapsed = ld
      ? Math.max(0, Math.floor((new Date().getTime() - ld.getTime()) / 86_400_000) + 1)
      : Infinity
    return { launchDate: ld, daysElapsed: elapsed }
  }, [program.launch_date])

  return (
    <div>
      {/* Zpět tlačítko */}
      <button
        className="akademie-back akademie-back--subtle"
        onClick={onBack}
        type="button"
        aria-label={`Zpět na ${backLabel}`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        {backLabel}
      </button>

      {/* Side-by-side header */}
      <div className="akademie-program-detail__header">
        {/* Čtvercový thumbnail vlevo */}
        <div className="akademie-program-detail__thumb">
          {program.cover_image_url ? (
            <img src={program.cover_image_url} alt={program.name} />
          ) : (
            <div className="akademie-program-detail__thumb-placeholder">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M9 19V6l12-3v13M9 19c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm12-3c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z" />
              </svg>
            </div>
          )}
        </div>

        {/* Info vpravo */}
        <div className="akademie-program-detail__info">
          {/* Title row — název + pin button na stejné řádce */}
          <div className="akademie-program-detail__title-row">
            <h1 className="akademie-program-detail__title">{program.name}</h1>
            {program.isOwned && (
              <button
                className={`akademie-program-detail__pin-btn${isActiveProgram ? ' akademie-program-detail__pin-btn--active' : ''}`}
                onClick={isActiveProgram ? clearActiveProgram : () => setActiveProgram(program.module_id)}
                type="button"
                aria-label={isActiveProgram ? 'Odebrat z denního programu' : 'Nastavit jako denní program'}
              >
                {isActiveProgram ? (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Nastaveno
                  </>
                ) : (
                  'Denní program'
                )}
              </button>
            )}
          </div>
          {durationDays > 0 && (
            <div className="akademie-program-detail__meta">
              <span>{durationDays} dní</span>
              {dailyMinutes && (
                <>
                  <span>·</span>
                  <span>{dailyMinutes} min/den</span>
                </>
              )}
            </div>
          )}
          {program.description_long && (
            <p className="akademie-program-detail__desc">{program.description_long}</p>
          )}
        </div>
      </div>

      {/* Accordion série */}
      <div className="akademie-accordion-series">
        <p className="akademie-accordion-series__heading">Týdenní série</p>

        {seriesLoading && (
          <>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: 64,
                  borderRadius: 12,
                  background: 'var(--color-surface-elevated)',
                  opacity: 0.5,
                }}
              />
            ))}
          </>
        )}

        {!seriesLoading && series?.length === 0 && (
          <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.875rem' }}>
            Série budou brzy k dispozici.
          </p>
        )}

        {!seriesLoading &&
          series?.map((s, index) => (
            <AccordionSeries
              key={s.id}
              series={s}
              seriesIndex={index}
              isOwned={program.isOwned}
              userId={userId}
              coverUrl={program.cover_image_url}
              programId={program.id}
              categorySlug={categorySlug}
              programTitle={program.name}
              isOpen={openSeriesId === s.id}
              onToggle={() => setOpenSeriesId((prev) => (prev === s.id ? null : s.id))}
              daysElapsed={daysElapsed}
              launchDate={launchDate}
            />
          ))}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useAkademieSeries, useAkademieLessons } from '../../api/useAkademieProgram'
import { useAkademiePlayback } from '../../hooks/useAkademiePlayback'
import { LockedFeatureModal } from '@/modules/mvp0/components'
import type { AkademieProgramVM, AkademieSeries, LessonWithProgress } from '../../types'

interface ProgramDetailProps {
  program: AkademieProgramVM
  userId: string | undefined
  onBack: () => void
}

// --------------------------------------------------
// LessonRow — inline v accordion panelu
// --------------------------------------------------

interface LessonRowProps {
  lesson: LessonWithProgress
  isSeriesLocked: boolean
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

function LessonRow({ lesson, isSeriesLocked, onLockedPlay }: LessonRowProps) {
  const { playLesson, isCurrentlyPlaying } = useAkademiePlayback()
  const playing = isCurrentlyPlaying(lesson.id)

  const durationMin = Math.round(lesson.duration_seconds / 60)

  function handleClick() {
    if (isSeriesLocked) {
      onLockedPlay()
      return
    }
    playLesson(lesson)
  }

  return (
    <div
      className={[
        'akademie-lesson-row',
        playing ? 'akademie-lesson-row--playing' : '',
        lesson.isCompleted ? 'akademie-lesson-row--completed' : '',
        isSeriesLocked ? 'akademie-lesson-row--locked' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="button"
      tabIndex={0}
      aria-label={`${lesson.title}, ${durationMin} min${lesson.isCompleted ? ', dokončeno' : ''}`}
      onClick={handleClick}
      onKeyDown={(e) => {
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
        <span className="akademie-lesson-row__meta">{durationMin} min</span>
      </div>

      <div className="akademie-lesson-row__status">
        {lesson.isCompleted ? (
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
  isInitiallyOpen?: boolean
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

function AccordionSeries({ series, seriesIndex, isOwned, userId, isInitiallyOpen = false }: AccordionSeriesProps) {
  const [isOpen, setIsOpen] = useState(isInitiallyOpen)
  const [lockedModalOpen, setLockedModalOpen] = useState(false)

  const { data: lessons, isLoading } = useAkademieLessons(
    isOpen ? series.id : '',
    userId,
  )

  const completedCount = lessons?.filter((l) => l.isCompleted).length ?? 0
  const totalCount = lessons?.length ?? 0

  return (
    <div className={['akademie-accordion-item', isOpen ? 'akademie-accordion-item--open' : ''].filter(Boolean).join(' ')}>
      {/* Trigger */}
      <button
        className="akademie-accordion-trigger"
        onClick={() => setIsOpen((v) => !v)}
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
          <span className="akademie-accordion-trigger__meta">
            {series.description}
          </span>
          {isOwned && isOpen && totalCount > 0 && (
            <span className="akademie-accordion-trigger__progress">
              {completedCount}/{totalCount} dokončeno
            </span>
          )}
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

      {/* Content panel */}
      {isOpen && (
        <div
          className="akademie-accordion-panel"
          id={`accordion-panel-${series.id}`}
          role="region"
          aria-label={`Série ${seriesIndex + 1}: ${series.name}`}
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
                isSeriesLocked={!isOwned}
                onLockedPlay={() => setLockedModalOpen(true)}
              />
            ))}
        </div>
      )}

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

export function ProgramDetail({ program, userId, onBack }: ProgramDetailProps) {
  const { data: series, isLoading: seriesLoading } = useAkademieSeries(program.module_id)

  const durationDays = (series?.length ?? 0) * 7

  return (
    <div>
      {/* Zpět tlačítko — subdued styl */}
      <button
        className="akademie-back akademie-back--subtle"
        onClick={onBack}
        type="button"
        aria-label="Zpět na programy"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Zpět
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
          <h1 className="akademie-program-detail__title">{program.name}</h1>
          {durationDays > 0 && (
            <div className="akademie-program-detail__meta">
              <span>{durationDays} dní</span>
              <span>·</span>
              <span>7 min/den</span>
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
              isInitiallyOpen={index === 0 && program.isOwned}
            />
          ))}
      </div>
    </div>
  )
}

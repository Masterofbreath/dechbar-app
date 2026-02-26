/**
 * TodaysChallengeButton — Daily Program CTA
 *
 * Self-contained component. Handles its own data loading and audio playback.
 *
 * Priority logic:
 *   1. User has pinned program (user_active_program) → show their program + "Dnešní dýchačka"
 *   2. Admin featured program (platform_featured_program) → show featured + "Vyzkoušet"
 *   3. Nothing → return null
 *
 * Clicking "Dnešní dýchačka" / "Vyzkoušet" triggers StickyPlayer via useAkademiePlayback.
 * CRITICAL: playLesson must be called synchronously in onClick (iOS Safari requirement).
 *
 * @package DechBar_App
 * @subpackage MVP0/Components
 */

import { useAuth } from '@/platform/auth';
import { useActiveDailyProgram } from '../../hooks/useActiveDailyProgram';
import { usePlatformFeaturedProgram } from '../../hooks/usePlatformFeaturedProgram';
import { useAkademiePlayback } from '@/modules/akademie/hooks/useAkademiePlayback';
import { useAkademieNav } from '@/modules/akademie/hooks/useAkademieNav';
import { useNavigation } from '@/platform/hooks';
import type { ActiveDailyProgramInfo } from '../../hooks/useActiveDailyProgram';
import type { AkademieLesson } from '@/modules/akademie/types';
import './TodaysChallengeButton.css';

export interface TodaysChallengeButtonProps {
  className?: string;
}

// --------------------------------------------------
// Sub-components
// --------------------------------------------------

function PlayArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ width: 16, height: 16 }}>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 20, height: 20 }}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

// --------------------------------------------------
// Loading skeleton
// --------------------------------------------------

function SkeletonState({ className }: { className?: string }) {
  return (
    <div className={`todays-challenge-button todays-challenge-button--loading ${className || ''}`}>
      <div className="todays-challenge-button__skeleton">
        <div className="todays-challenge-button__skeleton-title" />
        <div className="todays-challenge-button__skeleton-subtitle" />
      </div>
    </div>
  );
}

// --------------------------------------------------
// Shared card layout used by both user & featured states
// --------------------------------------------------

interface ProgramCardProps {
  program: ActiveDailyProgramInfo;
  /** Hlavní řádek pod názvem programu — u aktivního: "Dnes: [lekce] · X min", u featured: metadata */
  subtitle: string;
  ctaLabel: string;
  ctaAriaLabel: string;
  modifier: string;
  onClick: () => void;
  className?: string;
}

function ProgramCard({
  program,
  subtitle,
  ctaLabel,
  ctaAriaLabel,
  modifier,
  onClick,
  className,
}: ProgramCardProps) {
  return (
    <button
      className={`todays-challenge-button todays-challenge-button--active ${modifier} ${className || ''}`}
      onClick={onClick}
      type="button"
      aria-label={ctaAriaLabel}
    >
      {/* Cover thumbnail */}
      <div className="todays-challenge-button__cover" aria-hidden="true">
        {program.cover_image_url ? (
          <img
            src={program.cover_image_url}
            alt=""
            className="todays-challenge-button__cover-img"
          />
        ) : (
          <div className="todays-challenge-button__cover-placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M9 18V5l12-2v13M9 19c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm12-3c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="todays-challenge-button__content">
        <h3 className="todays-challenge-button__title">{program.name}</h3>
        {subtitle && (
          <p className="todays-challenge-button__subtitle">{subtitle}</p>
        )}
      </div>

      {/* CTA */}
      <div className="todays-challenge-button__cta">
        <PlayArrowIcon />
        <span>{ctaLabel}</span>
      </div>
    </button>
  );
}

// --------------------------------------------------
// Completed state
// --------------------------------------------------

interface CompletedStateProps {
  program: ActiveDailyProgramInfo;
  onClear: () => void;
  className?: string;
}

function CompletedState({ program, onClear, className }: CompletedStateProps) {
  return (
    <div className={`todays-challenge-button todays-challenge-button--completed ${className || ''}`}>
      <div className="todays-challenge-button__cover" aria-hidden="true">
        {program.cover_image_url ? (
          <img src={program.cover_image_url} alt="" className="todays-challenge-button__cover-img" />
        ) : (
          <div className="todays-challenge-button__cover-placeholder">
            <CheckCircleIcon />
          </div>
        )}
      </div>

      <div className="todays-challenge-button__content">
        <h3 className="todays-challenge-button__title">{program.name}</h3>
        <p className="todays-challenge-button__subtitle">Program dokončen</p>
      </div>

      <button
        className="todays-challenge-button__cta-secondary"
        onClick={(e) => { e.stopPropagation(); onClear(); }}
        type="button"
        aria-label="Změnit denní program"
      >
        Změnit program
      </button>
    </div>
  );
}

// --------------------------------------------------
// Main component
// --------------------------------------------------

export function TodaysChallengeButton({ className }: TodaysChallengeButtonProps) {
  const { user } = useAuth();

  const userProgram = useActiveDailyProgram(user?.id);
  const featuredProgram = usePlatformFeaturedProgram();

  // Navigace pro featured CTA — deep link mechanismus (stejný vzor jako StickyPlayer)
  const { setCurrentTab } = useNavigation();
  const selectCategory = useAkademieNav((s) => s.selectCategory);
  const setPendingModuleId = useAkademieNav((s) => s.setPendingModuleId);

  // Determine active program info for playback
  const activeProgramInfo = userProgram.data?.program ?? null;

  const { playLesson } = useAkademiePlayback({
    coverUrl: activeProgramInfo?.cover_image_url ?? featuredProgram.data?.program.cover_image_url,
    programId: activeProgramInfo?.program_uuid ?? undefined,
    categorySlug: activeProgramInfo?.category_slug ?? undefined,
  });

  // Loading: wait for both queries — uživatel nemá pin (nebo se teprve načítá)
  // a featured program ještě není připravený → skeleton místo prázdna
  if (userProgram.isLoading || (!userProgram.data && featuredProgram.isLoading)) {
    return <SkeletonState className={className} />;
  }

  // --- State 1: User has a pinned program ---
  if (userProgram.data) {
    const { program, nextLesson } = userProgram.data;

    // State 1b: All lessons completed
    if (!nextLesson) {
      return (
        <CompletedState
          program={program}
          onClear={userProgram.clearActiveProgram}
          className={className}
        />
      );
    }

    // State 1a: Has next lesson to play
    const lessonSubtitle = buildLessonSubtitle(nextLesson, program.daily_minutes);

    function handleUserProgramClick() {
      if (!nextLesson) return;
      playLesson(nextLesson); // CRITICAL: synchronous — iOS Safari
    }

    return (
      <ProgramCard
        program={program}
        subtitle={lessonSubtitle}
        ctaLabel="Přehrát"
        ctaAriaLabel={`Spustit ${nextLesson.title} z programu ${program.name}`}
        modifier=""
        onClick={handleUserProgramClick}
        className={className}
      />
    );
  }

  // --- State 2: Admin featured program (no user pin) ---
  if (featuredProgram.data) {
    const { program, titleOverride } = featuredProgram.data;
    const displayProgram = titleOverride ? { ...program, name: titleOverride } : program;

    const featuredSubtitle = [
      program.duration_days ? `${program.duration_days} dní` : null,
      program.daily_minutes ? `${program.daily_minutes} min/den` : null,
    ].filter(Boolean).join(' · ');

    function handleFeaturedClick() {
      // Navigace do detailu programu přes Akademii deep-link mechanismus:
      //   1. Přepnout na tab Akademie
      //   2. Otevřít kategorii programu (načte seznam programů)
      //   3. setPendingModuleId → AkademieRoot auto-otevře program jakmile je načten
      if (program.category_slug) {
        selectCategory(program.category_slug);
      }
      setPendingModuleId(program.module_id);
      setCurrentTab('akademie');
    }

    return (
      <ProgramCard
        program={displayProgram}
        subtitle={featuredSubtitle}
        ctaLabel="Zjistit více"
        ctaAriaLabel={`Zobrazit program ${displayProgram.name} v Akademii`}
        modifier="todays-challenge-button--featured"
        onClick={handleFeaturedClick}
        className={className}
      />
    );
  }

  // --- State 3: Nothing to show ---
  return null;
}

// --------------------------------------------------
// Helpers
// --------------------------------------------------

/**
 * Sestaví subtitle pro aktivní denní program.
 * Zobrazuje název dnešní lekce + délku v minutách.
 *
 * Priorita délky:
 *   1. programDailyMinutes (z akademie_programs.daily_minutes) — "slíbená" délka programu
 *   2. lesson.duration_seconds → minuty — skutečná délka konkrétního audia
 *   3. nic — subtitle bez délky
 *
 * Proč priorita programDailyMinutes:
 *   - Den 1 má sample audio (7 min), ale program slibuje 15 min/den
 *   - Uživatel vidí konzistentní číslo odpovídající popisu programu
 *   - Po nahrání plných audiích se délka automaticky upřesní přes duration_seconds
 */
function buildLessonSubtitle(lesson: AkademieLesson, programDailyMinutes?: number | null): string {
  const durationMin =
    programDailyMinutes != null && programDailyMinutes > 0
      ? programDailyMinutes
      : lesson.duration_seconds > 0
        ? Math.round(lesson.duration_seconds / 60)
        : null;

  const parts: string[] = [`Dnes: ${lesson.title}`];
  if (durationMin) parts.push(`${durationMin} min`);
  return parts.join(' · ');
}

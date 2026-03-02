/**
 * TodaysChallengeButton — Daily Program CTA
 *
 * Self-contained component. Handles its own data loading and audio playback.
 *
 * Priority logic:
 *   1. User has pinned program (user_active_program) → show their program + "Přehrát"
 *   2. Admin daily override (platform_daily_override) → custom audio with custom text
 *   3. Admin featured program (platform_featured_program):
 *      a) isPremium → always play / show
 *      b) userHasEarlyAccess && !isAllCompleted → play for free
 *      c) userHasEarlyAccess && isAllCompleted  → locked (completed, SMART for replay)
 *      d) !userHasEarlyAccess                   → locked (registered after deadline, SMART required)
 *   4. Nothing → return null
 *
 * Clicking "Přehrát" / "Spustit" triggers StickyPlayer via useAkademiePlayback / playSticky.
 * CRITICAL: playLesson / playSticky must be called synchronously in onClick (iOS Safari).
 *
 * @package DechBar_App
 * @subpackage MVP0/Components
 */

import { useState } from 'react';
import { useAuth } from '@/platform/auth';
import { useUserState } from '@/platform/user/userStateStore';
import { TierLockModal } from '../TierLockModal/TierLockModal';
import { supabase } from '@/platform/api/supabase';
import { useActiveDailyProgram } from '../../hooks/useActiveDailyProgram';
import { usePlatformFeaturedProgram } from '../../hooks/usePlatformFeaturedProgram';
import { usePlatformDailyOverride } from '../../hooks/usePlatformDailyOverride';
import { useAkademiePlayback } from '@/modules/akademie/hooks/useAkademiePlayback';
import { useAkademieNav } from '@/modules/akademie/hooks/useAkademieNav';
import { useNavigation } from '@/platform/hooks';
import { useAudioPlayerStore } from '@/platform/components/AudioPlayer/store';
import type { ActiveDailyProgramInfo } from '../../hooks/useActiveDailyProgram';
import type { DailyOverrideData } from '../../hooks/usePlatformDailyOverride';
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

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 20, height: 20 }}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
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
// Locked featured state (SMART required)
// --------------------------------------------------

type LockedReason = 'completed' | 'no-access';

interface LockedFeaturedStateProps {
  program: ActiveDailyProgramInfo;
  reason: LockedReason;
  className?: string;
}

function LockedFeaturedState({ program, reason, className }: LockedFeaturedStateProps) {
  const [showModal, setShowModal] = useState(false);

  const modalDescription =
    reason === 'completed'
      ? 'Gratulujeme k dokončení výzvy! Pro opakované přehrávání všech výzev aktivuj tarif SMART.'
      : 'Tato výzva je součástí tarifu SMART. Aktivuj předplatné a získej přístup ke všem dechovým výzvám.';

  const benefits =
    reason === 'completed'
      ? [
          'Neomezené opakování všech výzev',
          'Přístup ke všem dechovým programům',
          'Prémiová cvičení a meditace',
        ]
      : [
          'Ranní dechová výzva (30 dní)',
          'Všechny dechové programy a výzvy',
          'Prémiová cvičení a meditace',
        ];

  return (
    <>
      <button
        className={`todays-challenge-button todays-challenge-button--active todays-challenge-button--featured todays-challenge-button--locked ${className || ''}`}
        onClick={() => setShowModal(true)}
        type="button"
        aria-label={`Odemknout program ${program.name} — vyžaduje SMART tarif`}
      >
        {/* Cover thumbnail */}
        <div className="todays-challenge-button__cover" aria-hidden="true">
          {program.cover_image_url ? (
            <img src={program.cover_image_url} alt="" className="todays-challenge-button__cover-img todays-challenge-button__cover-img--locked" />
          ) : (
            <div className="todays-challenge-button__cover-placeholder">
              <LockIcon />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="todays-challenge-button__content">
          <h3 className="todays-challenge-button__title">{program.name}</h3>
          <p className="todays-challenge-button__subtitle todays-challenge-button__subtitle--locked">
            {reason === 'completed' ? 'Výzva dokončena' : 'Výzva uzamčena'}
          </p>
        </div>

        {/* CTA — SMART badge */}
        <div className="todays-challenge-button__cta todays-challenge-button__cta--smart">
          <LockIcon />
          <span>SMART</span>
        </div>
      </button>

      {/* iOS-compliant paywall modal */}
      <TierLockModal
        isOpen={showModal}
        requiredTier="SMART"
        featureName={reason === 'completed' ? 'Opakování dechových výzev' : 'Dechové výzvy — SMART'}
        description={modalDescription}
        benefits={benefits}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}

// --------------------------------------------------
// Override state (admin-scheduled custom audio)
// --------------------------------------------------

interface OverrideStateProps {
  override: DailyOverrideData;
  onPlay: () => void;
  className?: string;
}

function OverrideState({ override, onPlay, className }: OverrideStateProps) {
  return (
    <button
      className={`todays-challenge-button todays-challenge-button--active todays-challenge-button--override ${className || ''}`}
      onClick={onPlay}
      type="button"
      aria-label={`Spustit ${override.title}`}
    >
      <div className="todays-challenge-button__cover" aria-hidden="true">
        {override.cover_image_url ? (
          <img src={override.cover_image_url} alt="" className="todays-challenge-button__cover-img" />
        ) : (
          <div className="todays-challenge-button__cover-placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="M10 8l6 4-6 4V8z" fill="currentColor" stroke="none" />
            </svg>
          </div>
        )}
      </div>
      <div className="todays-challenge-button__content">
        <h3 className="todays-challenge-button__title">{override.title}</h3>
        <p className="todays-challenge-button__subtitle">{override.subtitle}</p>
      </div>
      <div className="todays-challenge-button__cta">
        <PlayArrowIcon />
        <span>Spustit</span>
      </div>
    </button>
  );
}

// --------------------------------------------------
// Main component
// --------------------------------------------------

export function TodaysChallengeButton({ className }: TodaysChallengeButtonProps) {
  const { user } = useAuth();
  const isPremium = useUserState((s) => s.isPremium);

  // user.created_at slouží jako per-user start date pro oba hooky:
  //   effectiveStartDate = MAX(user.created_at, program.launch_date)
  // Pinnutí (activated_at) výzvu neresetuje — je to jen UI preference.
  const userProgram = useActiveDailyProgram(user?.id, user?.created_at);
  const dailyOverride = usePlatformDailyOverride();
  const featuredProgram = usePlatformFeaturedProgram(user?.id, user?.created_at);

  // Navigace pro featured CTA (stejný vzor jako StickyPlayer)
  const { setCurrentTab } = useNavigation();
  const selectCategory = useAkademieNav((s) => s.selectCategory);
  const setPendingModuleId = useAkademieNav((s) => s.setPendingModuleId);

  // Audio store pro přímé přehrání override audia (bez akademie lekce)
  const playSticky = useAudioPlayerStore((s) => s.playSticky);

  // Determine active program info for playback
  const activeProgramInfo = userProgram.data?.program ?? null;
  const featuredProgramInfo = featuredProgram.data?.program ?? null;

  const { playLesson } = useAkademiePlayback({
    coverUrl: activeProgramInfo?.cover_image_url ?? featuredProgramInfo?.cover_image_url,
    programId: activeProgramInfo?.program_uuid ?? featuredProgramInfo?.program_uuid,
    categorySlug: activeProgramInfo?.category_slug ?? featuredProgramInfo?.category_slug,
  });

  function handleOverridePlay() {
    if (!dailyOverride.data) return;
    const o = dailyOverride.data;
    // Start audio synchronously (iOS Safari requires onClick to be synchronous)
    playSticky({
      id: `override-${o.id}`,
      album_id: null,
      title: o.title,
      artist: 'DechBar',
      album: null,
      duration: o.duration_seconds,
      audio_url: o.audio_url,
      cover_url: o.cover_image_url,
      duration_category: '3-9',
      mood_category: null,
      difficulty_level: 'easy',
      kp_suitability: null,
      media_type: 'audio',
      exercise_format: 'meditace',
      intensity_level: 'jemna',
      narration_type: 'pribeh',
      tags: ['override'],
      description: o.subtitle,
      track_order: 0,
      is_published: true,
      play_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Analytics context
      source_category_slug: 'denni-program',
      source_program_title: 'Denní program',
    });
    // Increment play count after audio starts — log result for debugging
    supabase.rpc('increment_override_play_count', { override_id: o.id })
      .then(({ error }) => {
        if (error) {
          console.error('[PlayCount] RPC failed:', error.message, '| override_id:', o.id);
        } else {
          console.log('[PlayCount] ✅ Incremented | override_id:', o.id);
        }
      });
  }

  // Loading: wait for user program + override before showing skeleton
  if (userProgram.isLoading || (!userProgram.data && dailyOverride.isLoading)) {
    return <SkeletonState className={className} />;
  }

  // --- State 0: Force-priority override (beats even pinned program) ---
  if (dailyOverride.data?.force_priority) {
    return (
      <OverrideState
        override={dailyOverride.data}
        onPlay={handleOverridePlay}
        className={className}
      />
    );
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

  // --- State 2: Admin daily override (time-limited custom audio) ---
  if (dailyOverride.data) {
    return (
      <OverrideState
        override={dailyOverride.data}
        onPlay={handleOverridePlay}
        className={className}
      />
    );
  }

  // --- State 3: Admin featured program (no user pin, no override) ---
  if (featuredProgram.data) {
    const {
      program,
      titleOverride,
      nextLesson: featuredNextLesson,
      isAllCompleted,
      userHasEarlyAccess,
    } = featuredProgram.data;
    const displayProgram = titleOverride ? { ...program, name: titleOverride } : program;

    function handleFeaturedNavigate() {
      if (program.category_slug) {
        selectCategory(program.category_slug);
      }
      setPendingModuleId(program.module_id);
      setCurrentTab('akademie');
    }

    // State 3c: Uživatel NEMÁ early access (registroval se po deadline) + není Premium
    // → výzva uzamčena, SMART required
    if (!userHasEarlyAccess && !isPremium) {
      return (
        <LockedFeaturedState
          program={displayProgram}
          reason="no-access"
          className={className}
        />
      );
    }

    // State 3d: Uživatel MÁ early access (nebo je Premium) + všechny lekce dokončeny
    // → non-premium users vidí locked-completed state; premium může opakovat
    if (isAllCompleted && !isPremium) {
      return (
        <LockedFeaturedState
          program={displayProgram}
          reason="completed"
          className={className}
        />
      );
    }

    // State 3a/b: Má dostupnou lekci → přehrát přímo
    if (featuredNextLesson) {
      const featuredLessonSubtitle = buildLessonSubtitle(featuredNextLesson, program.daily_minutes);
      return (
        <ProgramCard
          program={displayProgram}
          subtitle={featuredLessonSubtitle}
          ctaLabel="Přehrát"
          ctaAriaLabel={`Spustit ${featuredNextLesson.title} z programu ${displayProgram.name}`}
          modifier="todays-challenge-button--featured"
          onClick={() => playLesson(featuredNextLesson)}
          className={className}
        />
      );
    }

    // Nemá lekci (program ještě nezačal / neznámé) → navigace do Akademie
    const featuredSubtitle = [
      program.duration_days ? `${program.duration_days} dní` : null,
      program.daily_minutes ? `${program.daily_minutes} min/den` : null,
    ].filter(Boolean).join(' · ');

    return (
      <ProgramCard
        program={displayProgram}
        subtitle={featuredSubtitle}
        ctaLabel="Zjistit více"
        ctaAriaLabel={`Zobrazit program ${displayProgram.name} v Akademii`}
        modifier="todays-challenge-button--featured"
        onClick={handleFeaturedNavigate}
        className={className}
      />
    );
  }

  // --- State 4: Nothing to show ---
  return null;
}

// --------------------------------------------------
// Helpers
// --------------------------------------------------

/**
 * Sestaví subtitle pro aktivní denní program.
 * Zobrazuje název dnešní lekce + délku v minutách.
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

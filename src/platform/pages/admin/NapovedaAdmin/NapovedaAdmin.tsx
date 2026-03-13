/**
 * NapovedaAdmin — Admin panel pro Nápověda & Tour System
 *
 * Sekce v Admin sidebaru: KOMUNITA → Nápověda
 * Route: /app/admin/napoveda
 *
 * Funkce:
 * - Globální přepínač (zapnout/vypnout celý systém Nápovědy)
 * - Přehled úrovní a kapitol
 * - Sprint 4: Inline editor textu kroků (cs + en)
 * - Sprint 4: Toggle jednotlivého kroku (is_active)
 * - Sprint 4: Toggle celé kapitoly (is_active)
 * - Sprint 4: Přidat nový krok do kapitoly
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/platform/api/supabase';
import { useAuthStore } from '@/platform/auth';
import './NapovedaAdmin.css';

// ===================================================
// Types
// ===================================================

interface NapovedaSettings {
  id: number;
  is_enabled: boolean;
  disabled_by: string | null;
  disabled_at: string | null;
  disabled_reason: string | null;
  updated_at: string;
}

interface TourStep {
  id: string;
  order_index: number;
  title: Record<string, string>;
  description: Record<string, string>;
  dom_selector: string | null;
  step_type: 'highlight' | 'interactive' | 'info';
  interactive_action: string | null;
  is_required_for_reward: boolean;
  is_active: boolean;
}

interface TourChapter {
  id: string;
  slug: string;
  order_index: number;
  title: Record<string, string>;
  route_path: string | null;
  is_active: boolean;
  tour_steps: TourStep[];
}

interface TourLevel {
  id: string;
  slug: string;
  order_index: number;
  title: Record<string, string>;
  requires_plan: string | null;
  reward_days: number;
  is_active: boolean;
  tour_chapters: TourChapter[];
}

// ===================================================
// API helpers
// ===================================================

async function fetchNapovedaSettings(): Promise<NapovedaSettings> {
  const { data, error } = await supabase
    .from('napoveda_settings')
    .select('*')
    .eq('id', 1)
    .single();
  if (error) throw error;
  return data as NapovedaSettings;
}

async function fetchTourLevels(): Promise<TourLevel[]> {
  const { data, error } = await supabase
    .from('tour_levels')
    .select(`
      id, slug, order_index, title, requires_plan, reward_days, is_active,
      tour_chapters(
        id, slug, order_index, title, route_path, is_active,
        tour_steps(
          id, order_index, title, description, dom_selector,
          step_type, interactive_action, is_required_for_reward, is_active
        )
      )
    `)
    .order('order_index');
  if (error) throw error;
  return (data ?? []) as unknown as TourLevel[];
}

// ===================================================
// StepEditor — inline editor pro jeden krok
// ===================================================

interface StepEditorProps {
  step: TourStep;
  onSave: (stepId: string, updates: Partial<TourStep>) => Promise<void>;
  onToggle: (stepId: string, isActive: boolean) => Promise<void>;
  isSaving: boolean;
}

function StepEditor({ step, onSave, onToggle, isSaving }: StepEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [titleCs, setTitleCs] = useState(step.title?.cs ?? '');
  const [titleEn, setTitleEn] = useState(step.title?.en ?? '');
  const [descCs, setDescCs] = useState(step.description?.cs ?? '');
  const [descEn, setDescEn] = useState(step.description?.en ?? '');
  const [domSelector, setDomSelector] = useState(step.dom_selector ?? '');

  async function handleSave() {
    await onSave(step.id, {
      title: { cs: titleCs, en: titleEn },
      description: { cs: descCs, en: descEn },
      dom_selector: domSelector.trim() || null,
    });
    setIsEditing(false);
  }

  function handleCancel() {
    setTitleCs(step.title?.cs ?? '');
    setTitleEn(step.title?.en ?? '');
    setDescCs(step.description?.cs ?? '');
    setDescEn(step.description?.en ?? '');
    setDomSelector(step.dom_selector ?? '');
    setIsEditing(false);
  }

  return (
    <div className={`step-editor ${!step.is_active ? 'step-editor--inactive' : ''}`}>
      <div className="step-editor__header">
        <span className="step-editor__index">{step.order_index}.</span>
        <span className="step-editor__type-badge step-editor__type-badge--${step.step_type}">
          {step.step_type}
        </span>
        <span className="step-editor__title-preview">
          {step.title?.cs ?? step.id}
        </span>
        {step.is_required_for_reward && (
          <span className="step-editor__reward-badge" title="Povinný pro odměnu">⭐</span>
        )}

        <div className="step-editor__actions">
          <button
            className="step-editor__btn-toggle"
            onClick={() => void onToggle(step.id, !step.is_active)}
            disabled={isSaving}
            type="button"
            title={step.is_active ? 'Deaktivovat krok' : 'Aktivovat krok'}
            aria-label={step.is_active ? 'Deaktivovat krok' : 'Aktivovat krok'}
          >
            {step.is_active ? '✓' : '○'}
          </button>
          <button
            className="step-editor__btn-edit"
            onClick={() => setIsEditing((v) => !v)}
            type="button"
            title="Upravit krok"
          >
            {isEditing ? '✕' : '✎'}
          </button>
        </div>
      </div>

      {isEditing && (
        <div className="step-editor__form">
          <div className="step-editor__row">
            <div className="step-editor__field">
              <label className="step-editor__label">Titulek (CS)</label>
              <input
                className="step-editor__input"
                value={titleCs}
                onChange={(e) => setTitleCs(e.target.value)}
                placeholder="Titulek česky"
              />
            </div>
            <div className="step-editor__field">
              <label className="step-editor__label">Titulek (EN)</label>
              <input
                className="step-editor__input"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder="Title in English"
              />
            </div>
          </div>

          <div className="step-editor__row">
            <div className="step-editor__field">
              <label className="step-editor__label">Popis (CS)</label>
              <textarea
                className="step-editor__textarea"
                value={descCs}
                onChange={(e) => setDescCs(e.target.value)}
                placeholder="Popis česky"
                rows={3}
              />
            </div>
            <div className="step-editor__field">
              <label className="step-editor__label">Popis (EN)</label>
              <textarea
                className="step-editor__textarea"
                value={descEn}
                onChange={(e) => setDescEn(e.target.value)}
                placeholder="Description in English"
                rows={3}
              />
            </div>
          </div>

          <div className="step-editor__field">
            <label className="step-editor__label">DOM Selektor (volitelné)</label>
            <input
              className="step-editor__input step-editor__input--mono"
              value={domSelector}
              onChange={(e) => setDomSelector(e.target.value)}
              placeholder="Např. #kp-center-btn nebo .top-nav__bell-button"
            />
          </div>

          <div className="step-editor__form-actions">
            <button
              className="step-editor__btn-save"
              onClick={() => void handleSave()}
              disabled={isSaving}
              type="button"
            >
              {isSaving ? 'Ukládám…' : 'Uložit'}
            </button>
            <button
              className="step-editor__btn-cancel"
              onClick={handleCancel}
              type="button"
            >
              Zrušit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ===================================================
// AddStepForm — přidání nového kroku do kapitoly
// ===================================================

interface AddStepFormProps {
  chapterId: string;
  nextOrderIndex: number;
  onAdded: () => void;
}

function AddStepForm({ chapterId, nextOrderIndex, onAdded }: AddStepFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [titleCs, setTitleCs] = useState('');
  const [descCs, setDescCs] = useState('');
  const [stepType, setStepType] = useState<'highlight' | 'interactive' | 'info'>('highlight');
  const [domSelector, setDomSelector] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function handleAdd() {
    if (!titleCs.trim()) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('tour_steps').insert({
        chapter_id: chapterId,
        order_index: nextOrderIndex,
        title: { cs: titleCs.trim(), en: '' },
        description: { cs: descCs.trim(), en: '' },
        step_type: stepType,
        dom_selector: domSelector.trim() || null,
        is_required_for_reward: false,
        is_active: true,
      });
      if (error) throw error;
      setTitleCs('');
      setDescCs('');
      setDomSelector('');
      setIsOpen(false);
      onAdded();
    } finally {
      setIsSaving(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        className="add-step-btn"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        + Přidat krok
      </button>
    );
  }

  return (
    <div className="add-step-form">
      <h4 className="add-step-form__title">Nový krok #{nextOrderIndex}</h4>

      <div className="step-editor__field">
        <label className="step-editor__label">Titulek (CS) *</label>
        <input
          className="step-editor__input"
          value={titleCs}
          onChange={(e) => setTitleCs(e.target.value)}
          placeholder="Titulek nového kroku"
          autoFocus
        />
      </div>

      <div className="step-editor__field">
        <label className="step-editor__label">Popis (CS)</label>
        <textarea
          className="step-editor__textarea"
          value={descCs}
          onChange={(e) => setDescCs(e.target.value)}
          placeholder="Popis nového kroku"
          rows={2}
        />
      </div>

      <div className="step-editor__row">
        <div className="step-editor__field">
          <label className="step-editor__label">Typ kroku</label>
          <select
            className="step-editor__select"
            value={stepType}
            onChange={(e) => setStepType(e.target.value as typeof stepType)}
          >
            <option value="highlight">highlight (spotlight)</option>
            <option value="info">info (bez selektoru)</option>
            <option value="interactive">interactive (čeká na akci)</option>
          </select>
        </div>
        <div className="step-editor__field">
          <label className="step-editor__label">DOM Selektor</label>
          <input
            className="step-editor__input step-editor__input--mono"
            value={domSelector}
            onChange={(e) => setDomSelector(e.target.value)}
            placeholder="#element nebo .class"
          />
        </div>
      </div>

      <div className="step-editor__form-actions">
        <button
          className="step-editor__btn-save"
          onClick={() => void handleAdd()}
          disabled={isSaving || !titleCs.trim()}
          type="button"
        >
          {isSaving ? 'Přidávám…' : 'Přidat krok'}
        </button>
        <button
          className="step-editor__btn-cancel"
          onClick={() => setIsOpen(false)}
          type="button"
        >
          Zrušit
        </button>
      </div>
    </div>
  );
}

// ===================================================
// Main Component
// ===================================================

export function NapovedaAdmin() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const [disableReason, setDisableReason] = useState('');
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [savingStepId, setSavingStepId] = useState<string | null>(null);
  const [savingChapterId, setSavingChapterId] = useState<string | null>(null);

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['napoveda-settings'],
    queryFn: fetchNapovedaSettings,
  });

  const { data: levels = [], isLoading: levelsLoading } = useQuery({
    queryKey: ['tour-levels-admin'],
    queryFn: fetchTourLevels,
  });

  // Globální přepínač
  const toggleMutation = useMutation({
    mutationFn: async (enable: boolean) => {
      const { error } = await supabase
        .from('napoveda_settings')
        .update({
          is_enabled: enable,
          disabled_by: enable ? null : (userId ?? null),
          disabled_at: enable ? null : new Date().toISOString(),
          disabled_reason: enable ? null : (disableReason.trim() || 'Manuálně vypnuto adminem'),
          updated_at: new Date().toISOString(),
        })
        .eq('id', 1);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['napoveda-settings'] });
      setShowReasonInput(false);
      setDisableReason('');
    },
  });

  // Uložení textu kroku
  const handleSaveStep = useCallback(
    async (stepId: string, updates: Partial<TourStep>) => {
      setSavingStepId(stepId);
      try {
        const { error } = await supabase
          .from('tour_steps')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', stepId);
        if (error) throw error;
        void queryClient.invalidateQueries({ queryKey: ['tour-levels-admin'] });
      } finally {
        setSavingStepId(null);
      }
    },
    [queryClient]
  );

  // Toggle kroku (is_active)
  const handleToggleStep = useCallback(
    async (stepId: string, isActive: boolean) => {
      setSavingStepId(stepId);
      try {
        const { error } = await supabase
          .from('tour_steps')
          .update({ is_active: isActive, updated_at: new Date().toISOString() })
          .eq('id', stepId);
        if (error) throw error;
        void queryClient.invalidateQueries({ queryKey: ['tour-levels-admin'] });
      } finally {
        setSavingStepId(null);
      }
    },
    [queryClient]
  );

  // Toggle kapitoly (is_active)
  const handleToggleChapter = useCallback(
    async (chapterId: string, isActive: boolean) => {
      setSavingChapterId(chapterId);
      try {
        const { error } = await supabase
          .from('tour_chapters')
          .update({ is_active: isActive, updated_at: new Date().toISOString() })
          .eq('id', chapterId);
        if (error) throw error;
        void queryClient.invalidateQueries({ queryKey: ['tour-levels-admin'] });
      } finally {
        setSavingChapterId(null);
      }
    },
    [queryClient]
  );

  const isEnabled = settings?.is_enabled ?? true;

  function handleToggle() {
    if (isEnabled) {
      setShowReasonInput(true);
    } else {
      toggleMutation.mutate(true);
    }
  }

  if (settingsLoading) {
    return (
      <div className="napoveda-admin">
        <div className="napoveda-admin__loading">Načítám nastavení Nápovědy…</div>
      </div>
    );
  }

  return (
    <div className="napoveda-admin">
      <div className="napoveda-admin__header">
        <h1 className="napoveda-admin__title">Nápověda & Tour System</h1>
        <p className="napoveda-admin__subtitle">
          Správa onboarding průvodce, kroků a globálního stavu systému.
        </p>
      </div>

      {/* ===== GLOBÁLNÍ PŘEPÍNAČ ===== */}
      <section className="napoveda-admin__section">
        <div className="napoveda-admin__toggle-card">
          <div className="napoveda-admin__toggle-info">
            <div className="napoveda-admin__toggle-header">
              <span
                className={`napoveda-admin__status-dot ${isEnabled ? 'napoveda-admin__status-dot--on' : 'napoveda-admin__status-dot--off'}`}
              />
              <h2 className="napoveda-admin__toggle-title">
                Nápověda je{' '}
                <strong>{isEnabled ? 'zapnuta' : 'vypnuta'}</strong>
              </h2>
            </div>

            <p className="napoveda-admin__toggle-desc">
              {isEnabled
                ? 'Žárovička je viditelná pro všechny uživatele. Tour se spouští standardně.'
                : 'Žárovička je skryta pro všechny uživatele. Tour nelze spustit.'}
            </p>

            {!isEnabled && settings?.disabled_at && (
              <div className="napoveda-admin__disabled-info">
                <span className="napoveda-admin__disabled-label">Vypnuto:</span>{' '}
                {new Date(settings.disabled_at).toLocaleString('cs-CZ')}
                {settings.disabled_reason && (
                  <> — <em>{settings.disabled_reason}</em></>
                )}
              </div>
            )}
          </div>

          <button
            className={`napoveda-admin__toggle-btn ${isEnabled ? 'napoveda-admin__toggle-btn--disable' : 'napoveda-admin__toggle-btn--enable'}`}
            onClick={handleToggle}
            disabled={toggleMutation.isPending}
            type="button"
          >
            {toggleMutation.isPending
              ? 'Ukládám…'
              : isEnabled
                ? 'Vypnout Nápovědu'
                : 'Zapnout Nápovědu'}
          </button>
        </div>

        {showReasonInput && (
          <div className="napoveda-admin__reason-box">
            <label className="napoveda-admin__reason-label" htmlFor="disable-reason">
              Důvod vypnutí (volitelné — zobrazí se v logu)
            </label>
            <input
              id="disable-reason"
              className="napoveda-admin__reason-input"
              type="text"
              value={disableReason}
              onChange={(e) => setDisableReason(e.target.value)}
              placeholder="Např. PROD incident, A/B test, údržba…"
              autoFocus
            />
            <div className="napoveda-admin__reason-actions">
              <button
                className="napoveda-admin__reason-confirm"
                onClick={() => toggleMutation.mutate(false)}
                disabled={toggleMutation.isPending}
                type="button"
              >
                Potvrdit vypnutí
              </button>
              <button
                className="napoveda-admin__reason-cancel"
                onClick={() => setShowReasonInput(false)}
                type="button"
              >
                Zrušit
              </button>
            </div>
          </div>
        )}

        {toggleMutation.isError && (
          <p className="napoveda-admin__error">
            Chyba:{' '}
            {toggleMutation.error instanceof Error
              ? toggleMutation.error.message
              : 'Neznámá chyba'}
          </p>
        )}
      </section>

      {/* ===== EDITOR ÚROVNÍ A KROKŮ (Sprint 4) ===== */}
      <section className="napoveda-admin__section">
        <h2 className="napoveda-admin__section-title">Struktura & Editor</h2>

        {levelsLoading ? (
          <div className="napoveda-admin__loading">Načítám strukturu…</div>
        ) : (
          <div className="napoveda-admin__levels">
            {levels.map((level) => (
              <div key={level.id} className="napoveda-admin__level-card">
                <div className="napoveda-admin__level-header">
                  <div className="napoveda-admin__level-meta">
                    <span className="napoveda-admin__level-badge">Úroveň {level.order_index}</span>
                    {level.requires_plan && (
                      <span className="napoveda-admin__plan-badge">{level.requires_plan}</span>
                    )}
                    <span
                      className={`napoveda-admin__active-badge ${level.is_active ? 'napoveda-admin__active-badge--on' : 'napoveda-admin__active-badge--off'}`}
                    >
                      {level.is_active ? 'aktivní' : 'neaktivní'}
                    </span>
                    <span className="napoveda-admin__reward-info">
                      odměna +{level.reward_days} d SMART
                    </span>
                  </div>
                  <h3 className="napoveda-admin__level-title">
                    {level.title?.cs ?? level.slug}
                  </h3>
                </div>

                {/* Kapitoly */}
                <div className="napoveda-admin__chapters-expanded">
                  {(level.tour_chapters ?? [])
                    .sort((a, b) => a.order_index - b.order_index)
                    .map((chapter) => {
                      const activeSteps = chapter.tour_steps?.filter((s) => s.is_active).length ?? 0;
                      const totalSteps = chapter.tour_steps?.length ?? 0;

                      return (
                        <div
                          key={chapter.id}
                          className={`napoveda-admin__chapter-block ${!chapter.is_active ? 'napoveda-admin__chapter-block--inactive' : ''}`}
                        >
                          {/* Kapitola header */}
                          <div className="napoveda-admin__chapter-header">
                            <span className="napoveda-admin__chapter-order">
                              {chapter.order_index}.
                            </span>
                            <div className="napoveda-admin__chapter-info">
                              <strong className="napoveda-admin__chapter-name">
                                {chapter.title?.cs ?? chapter.slug}
                              </strong>
                              <span className="napoveda-admin__chapter-meta">
                                {chapter.route_path ?? 'bez route'} · {activeSteps}/{totalSteps} aktivních kroků
                              </span>
                            </div>

                            <button
                              className={`napoveda-admin__chapter-toggle ${chapter.is_active ? 'napoveda-admin__chapter-toggle--on' : 'napoveda-admin__chapter-toggle--off'}`}
                              onClick={() => void handleToggleChapter(chapter.id, !chapter.is_active)}
                              disabled={savingChapterId === chapter.id}
                              type="button"
                              title={chapter.is_active ? 'Deaktivovat kapitolu' : 'Aktivovat kapitolu'}
                            >
                              {savingChapterId === chapter.id
                                ? '…'
                                : chapter.is_active
                                  ? 'Aktivní'
                                  : 'Neaktivní'}
                            </button>
                          </div>

                          {/* Kroky */}
                          <div className="napoveda-admin__steps">
                            {(chapter.tour_steps ?? [])
                              .sort((a, b) => a.order_index - b.order_index)
                              .map((step) => (
                                <StepEditor
                                  key={step.id}
                                  step={step}
                                  onSave={handleSaveStep}
                                  onToggle={handleToggleStep}
                                  isSaving={savingStepId === step.id}
                                />
                              ))}

                            {/* Přidat krok */}
                            <AddStepForm
                              chapterId={chapter.id}
                              nextOrderIndex={(chapter.tour_steps?.length ?? 0) + 1}
                              onAdded={() => {
                                void queryClient.invalidateQueries({ queryKey: ['tour-levels-admin'] });
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

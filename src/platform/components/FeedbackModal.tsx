/**
 * FeedbackModal — "Sdílej podnět"
 *
 * Modal pro odeslání podnětu ke zlepšení od členů DechBaru.
 * Renderuje se v GlobalModals (mimo SettingsDrawer) pro správný z-index.
 *
 * Views: 'form' → 'success' (po úspěšném odeslání)
 *
 * @package DechBar_App
 * @subpackage Platform/Components
 * @since 2026-02-28
 */

import { useState, useRef } from 'react';
import { CloseButton } from '@/components/shared';
import { useSubmitFeedback } from '@/platform/api/useFeedback';
import { uploadService } from '@/platform/services/upload/uploadService';
import { CATEGORY_LABELS } from '@/platform/api/feedbackTypes';
import type { FeedbackCategory } from '@/platform/api/feedbackTypes';
import './FeedbackModal.css';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MAX_LENGTH = 1000;

function CheckIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [view, setView]               = useState<'form' | 'success'>('form');
  const [category, setCategory]       = useState<FeedbackCategory | null>(null);
  const [message, setMessage]         = useState('');
  const [imageUrl, setImageUrl]       = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageProgress, setImageProgress]   = useState(0);
  const [errorMsg, setErrorMsg]       = useState('');
  const [isDragOver, setIsDragOver]   = useState(false);
  const imageInputRef                 = useRef<HTMLInputElement>(null);

  const submitMutation = useSubmitFeedback();

  const handleClose = () => {
    // Reset state při zavření
    setView('form');
    setCategory(null);
    setMessage('');
    setImageUrl(null);
    setImageUploading(false);
    setImageProgress(0);
    setErrorMsg('');
    setIsDragOver(false);
    onClose();
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploading(true);
    setImageProgress(0);
    setErrorMsg('');

    try {
      const url = await uploadService.uploadFeedbackImage(file, ({ percent }) => {
        setImageProgress(percent);
      });
      setImageUrl(url);
    } catch {
      setErrorMsg('Nepodařilo se nahrát obrázek. Zkus to znovu.');
    } finally {
      setImageUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl(null);
    setImageProgress(0);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!imageUploading && !imageUrl) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (imageUploading || imageUrl) return;

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setErrorMsg('Nepodporovaný formát. Použij JPG, PNG nebo WebP.');
      return;
    }

    setImageUploading(true);
    setImageProgress(0);
    setErrorMsg('');

    try {
      const url = await uploadService.uploadFeedbackImage(file, ({ percent }) => {
        setImageProgress(percent);
      });
      setImageUrl(url);
    } catch {
      setErrorMsg('Nepodařilo se nahrát obrázek. Zkus to znovu.');
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !message.trim()) return;

    setErrorMsg('');

    submitMutation.mutate(
      { category, message: message.trim(), image_url: imageUrl },
      {
        onSuccess: () => setView('success'),
        onError: () => setErrorMsg('Nepodařilo se odeslat podnět. Zkus to znovu.'),
      },
    );
  };

  if (!isOpen) return null;

  const categories: FeedbackCategory[] = ['napad', 'chyba', 'pochvala', 'jine'];

  return (
    <>
      <div className="feedback-modal-overlay" onClick={handleClose} />
      <div className="feedback-modal" role="dialog" aria-modal="true" aria-labelledby="feedback-modal-title">

        {view === 'form' && (
          <>
            <div className="feedback-modal__header">
              <div>
                <h2 id="feedback-modal-title" className="feedback-modal__title">
                  Sdílej podnět
                </h2>
                <p className="feedback-modal__subtitle">
                  Pomoz nám DechBar rozdýchat. Pracujeme na každém podnětu.
                </p>
              </div>
              <CloseButton onClick={handleClose} ariaLabel="Zavřít" />
            </div>

            <form className="feedback-modal__form" onSubmit={handleSubmit} noValidate>
              {/* Kategorie */}
              <div className="feedback-modal__field">
                <span className="feedback-modal__label">Kategorie</span>
                <div className="feedback-modal__pills" role="group" aria-label="Vyberte kategorii">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={`feedback-modal__pill ${category === cat ? 'feedback-modal__pill--active' : ''}`}
                      onClick={() => setCategory(cat)}
                      aria-pressed={category === cat}
                    >
                      {CATEGORY_LABELS[cat]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Popis */}
              <div className="feedback-modal__field">
                <label className="feedback-modal__label" htmlFor="feedback-message">
                  Popis
                  <span className="feedback-modal__counter">
                    {message.length} / {MAX_LENGTH}
                  </span>
                </label>
                <textarea
                  id="feedback-message"
                  className="feedback-modal__textarea"
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, MAX_LENGTH))}
                  placeholder="Co tě napadlo? Napiš nám to..."
                  rows={5}
                  required
                />
              </div>

              {/* Screenshot */}
              <div className="feedback-modal__field">
                {imageUrl ? (
                  <div className="feedback-modal__image-preview">
                    <img src={imageUrl} alt="Náhled screenshotu" className="feedback-modal__image-thumb" />
                    <button
                      type="button"
                      className="feedback-modal__image-remove"
                      onClick={handleRemoveImage}
                    >
                      Odebrat
                    </button>
                  </div>
                ) : (
                  <label className="feedback-modal__upload-label"
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      className="feedback-modal__upload-input"
                      onChange={handleImageSelect}
                      disabled={imageUploading}
                    />
                    <span className={`feedback-modal__upload-btn${isDragOver ? ' feedback-modal__upload-btn--dragover' : ''}`}>
                      {imageUploading
                        ? `Nahrávám... ${imageProgress} %`
                        : isDragOver
                          ? 'Pusť screenshot sem'
                          : 'Přilož screenshot (nebo sem přetáhni)'}
                    </span>
                  </label>
                )}
              </div>

              {errorMsg && (
                <p className="feedback-modal__error">{errorMsg}</p>
              )}

              <div className="feedback-modal__footer">
                <button
                  type="button"
                  className="feedback-modal__btn feedback-modal__btn--secondary"
                  onClick={handleClose}
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="feedback-modal__btn feedback-modal__btn--primary"
                  disabled={!category || !message.trim() || submitMutation.isPending || imageUploading}
                >
                  {submitMutation.isPending ? 'Odesílám...' : 'Odešli podnět →'}
                </button>
              </div>
            </form>
          </>
        )}

        {view === 'success' && (
          <div className="feedback-modal__success">
            <div className="feedback-modal__success-icon">
              <CheckIcon />
            </div>
            <h2 className="feedback-modal__success-title">
              Díky! Tvůj podnět letí k nám.
            </h2>
            <p className="feedback-modal__success-text">
              Dáme vědět, až ho rozdýcháme.
            </p>
            <button
              type="button"
              className="feedback-modal__btn feedback-modal__btn--secondary"
              onClick={handleClose}
            >
              Zavřít
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/**
 * DigitalniTichoSocialProof Component
 *
 * V5 - Desktop: expandable grid (3 + tlačítko) | Mobile: auto-rotating slider (všech 6)
 * Auto-play: každé 3.5s posun na další kartu, pauza 6s po dotyku uživatele
 *
 * @package DechBar_App
 * @subpackage Modules/PublicWeb/DigitalniTicho
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { MESSAGES } from '@/config/messages';

const CARD_WIDTH = 260;
const CARD_GAP = 16;
const AUTO_PLAY_INTERVAL = 3500;
const USER_PAUSE_DURATION = 6000;

export function DigitalniTichoSocialProof() {
  const { title, subtitle, quotes } = MESSAGES.digitalniTicho.socialProof;
  const [expanded, setExpanded] = useState(false);

  const sliderRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentIndexRef = useRef(0);

  const scrollToCard = useCallback((index: number) => {
    const el = sliderRef.current;
    if (!el) return;
    // padding-left je calc(50% - 130px) → karta na indexu i se vycentruje při scrollLeft = i * (šířka + gap)
    el.scrollTo({ left: index * (CARD_WIDTH + CARD_GAP), behavior: 'smooth' });
    currentIndexRef.current = index;
  }, []);

  const startAutoPlay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const next = (currentIndexRef.current + 1) % quotes.length;
      scrollToCard(next);
    }, AUTO_PLAY_INTERVAL);
  }, [quotes.length, scrollToCard]);

  const pauseAutoPlay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    pauseTimeoutRef.current = setTimeout(startAutoPlay, USER_PAUSE_DURATION);
  }, [startAutoPlay]);

  useEffect(() => {
    startAutoPlay();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    };
  }, [startAutoPlay]);

  const desktopVisible = expanded ? quotes : quotes.slice(0, 3);
  const hasMore = !expanded && quotes.length > 3;

  return (
    <section className="digitalni-ticho-social-proof">
      <div className="digitalni-ticho-social-proof__container">
        <h2 className="digitalni-ticho-social-proof__title">
          {title}
        </h2>

        <p className="digitalni-ticho-social-proof__subtitle">
          {subtitle}
        </p>

        {/* Desktop grid — 3 karty + expand */}
        <div className="digitalni-ticho-social-proof__grid digitalni-ticho-social-proof__grid--desktop">
          {desktopVisible.map((quote, index) => (
            <div key={index} className="digitalni-ticho-social-proof__card">
              <p className="digitalni-ticho-social-proof__quote">
                "{quote.text}"
              </p>
              <div className="digitalni-ticho-social-proof__author">
                <p className="digitalni-ticho-social-proof__author-name">
                  {quote.author}
                </p>
                <p className="digitalni-ticho-social-proof__author-role">
                  {quote.role}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Expand button — pouze desktop, zmizí po rozbalení */}
        {hasMore && (
          <div className="digitalni-ticho-social-proof__expand">
            <button
              className="digitalni-ticho-social-proof__expand-btn"
              onClick={() => setExpanded(true)}
              type="button"
            >
              Zobrazit další recenze →
            </button>
          </div>
        )}

        {/* Mobile slider — auto-play + user interaction pause */}
        <div
          ref={sliderRef}
          className="digitalni-ticho-social-proof__grid digitalni-ticho-social-proof__grid--mobile"
          onTouchStart={pauseAutoPlay}
          onMouseDown={pauseAutoPlay}
        >
          {quotes.map((quote, index) => (
            <div key={index} className="digitalni-ticho-social-proof__card">
              <p className="digitalni-ticho-social-proof__quote">
                "{quote.text}"
              </p>
              <div className="digitalni-ticho-social-proof__author">
                <p className="digitalni-ticho-social-proof__author-name">
                  {quote.author}
                </p>
                <p className="digitalni-ticho-social-proof__author-role">
                  {quote.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

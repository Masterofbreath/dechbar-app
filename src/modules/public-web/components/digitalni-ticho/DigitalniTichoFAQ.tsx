/**
 * DigitalniTichoFAQ Component
 * 
 * FAQ jako prodejní zbraň - TOP 10 objections
 * Accordion funkčnost (expand/collapse)
 * 
 * Deep Research: FAQ není doplněk, je to sales tool
 * Freedom.to pattern: Námitky řeší rovnou v FAQ
 * Confidence: 9/10
 * 
 * Pattern: Následuje ChallengeFAQ
 * 
 * @package DechBar_App
 * @subpackage Modules/PublicWeb/DigitalniTicho
 */

import { useState } from 'react';
import { MESSAGES } from '@/config/messages';

export function DigitalniTichoFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleQuestion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const { title, questions } = MESSAGES.digitalniTicho.faq;
  const subtitle = 'subtitle' in MESSAGES.digitalniTicho.faq ? MESSAGES.digitalniTicho.faq.subtitle : undefined;

  return (
    <section className="digitalni-ticho-faq">
      <div className="digitalni-ticho-faq__container">
        <h2 className="digitalni-ticho-faq__title">
          {title}
        </h2>

        {subtitle && (
          <p className="digitalni-ticho-faq__subtitle">
            {subtitle}
          </p>
        )}

        <div className="digitalni-ticho-faq__list">
          {questions.map((item, index) => (
            <div 
              key={index} 
              className={`digitalni-ticho-faq__item ${openIndex === index ? 'digitalni-ticho-faq__item--open' : ''}`}
            >
              <button
                className="digitalni-ticho-faq__question"
                onClick={() => toggleQuestion(index)}
                aria-expanded={openIndex === index}
              >
                <span className="digitalni-ticho-faq__question-text">
                  {item.question}
                </span>
                <span className="digitalni-ticho-faq__icon">
                  {openIndex === index ? '−' : '+'}
                </span>
              </button>

              {openIndex === index && (
                <div className="digitalni-ticho-faq__answer">
                  {Array.isArray(item.answer)
                    ? item.answer.map((paragraph, pIdx) => (
                        <p key={pIdx} className="digitalni-ticho-faq__answer-paragraph">
                          {paragraph}
                        </p>
                      ))
                    : item.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

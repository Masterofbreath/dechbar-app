/**
 * ChallengeFAQ Component
 * 
 * FAQ sekce s accordion funkcionalitou
 * Apple Premium: Clean, minimal, only expand on click
 * 
 * Purpose: Odstranit poslední bariéry před registrací
 * 
 * @package DechBar_App
 * @subpackage Modules/PublicWeb/Challenge
 */

import { useState } from 'react';
import { MESSAGES } from '@/config/messages';

export function ChallengeFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleQuestion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="challenge-faq">
      <div className="challenge-faq__container">
        <h2 className="challenge-faq__title">
          {MESSAGES.challenge.faq.title}
        </h2>

        <div className="challenge-faq__list">
          {MESSAGES.challenge.faq.questions.map((item, index) => (
            <div 
              key={index} 
              className={`challenge-faq__item ${openIndex === index ? 'challenge-faq__item--open' : ''}`}
            >
              <button
                className="challenge-faq__question"
                onClick={() => toggleQuestion(index)}
                aria-expanded={openIndex === index}
              >
                <span className="challenge-faq__question-text">
                  {item.question}
                </span>
                <span className="challenge-faq__icon">
                  {openIndex === index ? '−' : '+'}
                </span>
              </button>

              {openIndex === index && (
                <div className="challenge-faq__answer">
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

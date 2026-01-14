/**
 * FAQ Component
 * 
 * Accordion-style FAQ for landing page
 * Addresses common objections from Czech market research
 * 
 * Design: Accordion (expand/collapse), one open at a time
 * Accessibility: Keyboard navigation, ARIA labels, focus states
 * 
 * @package DechBar_App
 * @subpackage Modules/PublicWeb
 */

import { useState } from 'react';
import { FAQ_ITEMS } from '../../data/faq';

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

function FAQItem({ question, answer, isOpen, onToggle }: FAQItemProps) {
  return (
    <div className="faq-item">
      <button 
        className="faq-item__question"
        onClick={onToggle}
        aria-expanded={isOpen}
        type="button"
      >
        <span className="faq-item__question-text">{question}</span>
        <svg 
          className={`faq-item__icon ${isOpen ? 'faq-item__icon--open' : ''}`}
          width="20" 
          height="20" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path 
            d="M6 9l6 6 6-6" 
            stroke="currentColor" 
            strokeWidth="2" 
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      
      {isOpen && (
        <div className="faq-item__answer">
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  
  function handleToggle(index: number) {
    setOpenIndex(openIndex === index ? null : index);
  }
  
  return (
    <div className="faq-list" role="list">
      {FAQ_ITEMS.map((item: { question: string; answer: string }, index: number) => (
        <FAQItem
          key={index}
          question={item.question}
          answer={item.answer}
          isOpen={openIndex === index}
          onToggle={() => handleToggle(index)}
        />
      ))}
    </div>
  );
}

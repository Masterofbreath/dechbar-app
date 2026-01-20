/**
 * NotesField - Collapsible notes textarea
 * 
 * Progressive disclosure - collapsed by default
 * Saves vertical space
 * 
 * @package DechBar_App
 * @subpackage MVP0/Components/SessionEngine
 */

import { useState } from 'react';
import { NavIcon } from '@/platform/components';

interface NotesFieldProps {
  value: string;
  onChange: (notes: string) => void;
}

export function NotesField({ value, onChange }: NotesFieldProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className={`session-notes ${isExpanded ? 'session-notes--expanded' : ''}`}>
      <button
        type="button"
        className="session-notes__toggle"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span>Poznámka (volitelné)</span>
        <NavIcon 
          name={isExpanded ? 'chevron-up' : 'chevron-down'} 
          size={16} 
        />
      </button>
      
      {isExpanded && (
        <textarea
          id="session-notes-input"
          className="session-notes__input"
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, 150))}
          placeholder="Jak ti to šlo? Nějaké postřehy..."
          rows={3}
          maxLength={150}
        />
      )}
      
      {value.length > 0 && (
        <div className="session-notes__counter">
          {value.length}/150
        </div>
      )}
    </div>
  );
}

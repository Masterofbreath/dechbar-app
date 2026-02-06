/**
 * TagSelect Component
 * 
 * Multi-select dropdown for tags with keyboard navigation.
 * Allows selecting multiple tags from predefined list.
 * 
 * @package DechBar_App
 * @subpackage Platform/Pages/Admin/Components
 * @since 2.47.1
 */

import { useState, useRef, useEffect } from 'react';
import './TagSelect.css';

interface TagSelectProps {
  selectedTags: string[];
  availableTags: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
}

export function TagSelect({ selectedTags, availableTags, onChange, disabled }: TagSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter(t => t !== tag));
    } else {
      onChange([...selectedTags, tag]);
    }
  };

  const removeTag = (tag: string) => {
    onChange(selectedTags.filter(t => t !== tag));
  };

  return (
    <div className="tag-select" ref={containerRef}>
      {/* Selected tags */}
      <div className="tag-select__selected">
        {selectedTags.length === 0 ? (
          <span className="tag-select__placeholder">Vyber tagy...</span>
        ) : (
          selectedTags.map(tag => (
            <span key={tag} className="tag-select__tag">
              {tag}
              {!disabled && (
                <button
                  type="button"
                  className="tag-select__tag-remove"
                  onClick={() => removeTag(tag)}
                  aria-label={`Odstranit ${tag}`}
                >
                  ×
                </button>
              )}
            </span>
          ))
        )}
        {!disabled && (
          <button
            type="button"
            className="tag-select__toggle"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Otevřít výběr tagů"
          >
            {isOpen ? '▲' : '▼'}
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="tag-select__dropdown">
          {availableTags.map(tag => (
            <label key={tag} className="tag-select__option">
              <input
                type="checkbox"
                checked={selectedTags.includes(tag)}
                onChange={() => toggleTag(tag)}
              />
              <span>{tag}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

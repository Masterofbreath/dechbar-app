/**
 * SearchBar Component
 * 
 * Reusable search input with icon and clear button.
 * 
 * @package DechBar_App
 * @subpackage Platform/Pages/Admin/Components
 * @since 2.44.0
 */

import { NavIcon } from '@/platform/components';
import './SearchBar.css';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Hledat...' }: SearchBarProps) {
  const handleClear = () => {
    onChange('');
  };

  return (
    <div className="search-bar">
      <NavIcon name="search" size={18} className="search-bar__icon" />
      <input
        type="text"
        className="search-bar__input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <button
          className="search-bar__clear"
          onClick={handleClear}
          aria-label="Vymazat hledání"
        >
          ✕
        </button>
      )}
    </div>
  );
}

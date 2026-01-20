/**
 * DifficultyCheck - Difficulty rating component
 * 
 * Text-only buttons (no emoji) - simpler, cleaner UX
 * 
 * @package DechBar_App
 * @subpackage MVP0/Components/SessionEngine
 */

interface DifficultyCheckProps {
  value: number | null;
  onChange: (rating: number) => void;
}

export function DifficultyCheck({ value, onChange }: DifficultyCheckProps) {
  return (
    <div className="difficulty-check">
      <h3 className="difficulty-check__title">Jak se ti dýchalo?</h3>
      <div className="difficulty-options">
        <button
          className={`difficulty-button ${value === 3 ? 'difficulty-button--active' : ''}`}
          onClick={() => onChange(3)}
          type="button"
        >
          Snadné
        </button>
        <button
          className={`difficulty-button ${value === 2 ? 'difficulty-button--active' : ''}`}
          onClick={() => onChange(2)}
          type="button"
        >
          Tak akorát
        </button>
        <button
          className={`difficulty-button ${value === 1 ? 'difficulty-button--active' : ''}`}
          onClick={() => onChange(1)}
          type="button"
        >
          Náročné
        </button>
      </div>
    </div>
  );
}

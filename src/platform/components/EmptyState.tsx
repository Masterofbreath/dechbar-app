/**
 * EmptyState - Universal Empty State Component
 * 
 * For placeholder pages, no data states, coming soon screens.
 * Brand Book 2.0 compliant with icon, title, message, optional CTA.
 * 
 * @package DechBar_App
 * @subpackage Platform/Components
 * @since 0.2.0
 */

export interface EmptyStateProps {
  /** Emoji or icon (e.g., "🏋️", "📊", "🎓") */
  icon: string;
  /** Main heading */
  title: string;
  /** Description text */
  message: string;
  /** Optional subtext */
  subtext?: string;
  /** Optional CTA button */
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * EmptyState - Premium empty state component
 * 
 * @example
 * <EmptyState
 *   icon="🏋️"
 *   title="Cvičit"
 *   message="Knihovna cvičení bude dostupná brzy."
 *   subtext="Zde najdeš všechna dechová cvičení."
 * />
 */
export function EmptyState({ 
  icon, 
  title, 
  message, 
  subtext,
  action 
}: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">{icon}</div>
      <h1 className="empty-state__title">{title}</h1>
      <p className="empty-state__message">{message}</p>
      {subtext && <p className="empty-state__subtext">{subtext}</p>}
      
      {action && (
        <button 
          className="empty-state__action"
          onClick={action.onClick}
          type="button"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

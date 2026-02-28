import type { ReactNode } from 'react';

export interface EmptyStateProps {
  /** SVG icon element or legacy string */
  icon: ReactNode;
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

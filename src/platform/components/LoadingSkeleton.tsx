/**
 * LoadingSkeleton - Loading Placeholder Component
 * 
 * Shimmer effect for loading states.
 * Provides visual feedback while content is loading.
 * 
 * @package DechBar_App
 * @subpackage Platform/Components
 * @since 0.2.0
 */

export interface LoadingSkeletonProps {
  /** Skeleton variant */
  variant?: 'pill' | 'notification' | 'card' | 'text';
  /** Width override */
  width?: string;
  /** Height override */
  height?: string;
  /** Number of lines (for text variant) */
  lines?: number;
}

/**
 * LoadingSkeleton - Shimmer loading effect
 * 
 * @example
 * <LoadingSkeleton variant="pill" />
 * <LoadingSkeleton variant="text" lines={3} />
 */
export function LoadingSkeleton({ 
  variant = 'text',
  width,
  height,
  lines = 1
}: LoadingSkeletonProps) {
  if (variant === 'text' && lines > 1) {
    return (
      <div className="skeleton-group">
        {Array.from({ length: lines }).map((_, i) => (
          <div 
            key={i}
            className="skeleton skeleton--text"
            style={{ width: i === lines - 1 ? '70%' : '100%' }}
          />
        ))}
      </div>
    );
  }
  
  return (
    <div 
      className={`skeleton skeleton--${variant}`}
      style={{ width, height }}
    />
  );
}

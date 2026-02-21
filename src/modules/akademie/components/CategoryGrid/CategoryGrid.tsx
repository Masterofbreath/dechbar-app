import type { AkademieCategoryVM } from '../../types'

interface CategoryGridProps {
  categories: AkademieCategoryVM[]
  onSelect: (slug: string) => void
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function CategoryIcon({ slug }: { slug: string }) {
  switch (slug) {
    case 'rezim':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      )
    case 'vyzvy':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      )
    case 'kurzy':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      )
    case 'dechopedie':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      )
    case 'bonusy':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      )
    case 'vip':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      )
  }
}

export function CategoryGrid({ categories, onSelect }: CategoryGridProps) {
  return (
    <div>
      <div className="akademie-page-header">
        <h1 className="akademie-page-header__title">Akademie</h1>
        <p className="akademie-page-header__subtitle">Vyber, kde chceš pokračovat</p>
      </div>

      <div className="akademie-category-grid">
        {categories.map((cat) => {
          const isComingSoon = !cat.is_active
          const isLocked = cat.is_active && !cat.isAccessible

          return (
            <div
              key={cat.id}
              className={[
                'akademie-category-card',
                isLocked ? 'akademie-category-card--locked' : '',
                isComingSoon ? 'akademie-category-card--coming-soon' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              role={isComingSoon ? undefined : 'button'}
              tabIndex={isComingSoon ? -1 : 0}
              aria-label={cat.name}
              onClick={() => {
                if (isComingSoon) return
                onSelect(cat.slug)
              }}
              onKeyDown={(e) => {
                if (isComingSoon) return
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelect(cat.slug)
                }
              }}
            >
              {isComingSoon && (
                <span className="akademie-category-card__coming-soon-badge">Brzy</span>
              )}

              {isLocked && !isComingSoon && (
                <span className="akademie-category-card__lock">
                  <LockIcon />
                </span>
              )}

              {!isLocked && !isComingSoon && (
                <span className="akademie-category-card__icon">
                  <CategoryIcon slug={cat.slug} />
                </span>
              )}

              <span className="akademie-category-card__name">{cat.name}</span>
              {cat.description && (
                <span className="akademie-category-card__desc">{cat.description}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

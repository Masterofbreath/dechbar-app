import type { AkademieCategory } from '../../types'

interface CategoryPillsProps {
  categories: AkademieCategory[]
  activeSlug: string
  onSelect: (slug: string) => void
}

export function CategoryPills({ categories, activeSlug, onSelect }: CategoryPillsProps) {
  return (
    <nav className="akademie-pills" aria-label="Kategorie Akademie">
      {categories.map((cat) => (
        <button
          key={cat.id}
          className={`akademie-pills__item${activeSlug === cat.slug ? ' akademie-pills__item--active' : ''}`}
          onClick={() => onSelect(cat.slug)}
          aria-pressed={activeSlug === cat.slug}
          type="button"
        >
          {cat.name}
        </button>
      ))}
    </nav>
  )
}

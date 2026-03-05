/**
 * EconomicsAdmin — Sekce Ekonomika (placeholder shell)
 *
 * Vizuálně hezký "Připravujeme" screen s popisem budoucích 4 podsekci:
 *   Příjmy, Náklady, Výsledky, Vývoj
 *
 * Implementace ekonomiky proběhne v samostatném agentu / itaraci.
 *
 * @package DechBar_App
 * @subpackage Platform/Pages/Admin/EconomicsAdmin
 */

import './EconomicsAdmin.css';

interface PreviewCard {
  title: string;
  description: string;
  badge: string;
  iconPath: string;
}

const PREVIEW_CARDS: PreviewCard[] = [
  {
    title: 'Příjmy',
    description: 'MRR, ARR, nové předplatné, obnovení, jednoráz. platby. Trend a srovnání s minulým obdobím.',
    badge: 'Plánováno',
    iconPath: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  },
  {
    title: 'Náklady',
    description: 'Infrastruktura, API, marketing, mzdy. Přehled nákladů po kategoriích a jejich podíl na příjmech.',
    badge: 'Plánováno',
    iconPath: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z',
  },
  {
    title: 'Výsledky',
    description: 'Ziskovost, gross margin, ARPU (příjem na uživatele), LTV vs. CAC. Klíčové SaaS metriky.',
    badge: 'Plánováno',
    iconPath: 'M18 20V10M12 20V4M6 20v-6',
  },
  {
    title: 'Vývoj',
    description: 'Měsíční růst MRR, churned revenue, expansion revenue. Waterfall chart příjmů v čase.',
    badge: 'Plánováno',
    iconPath: 'M23 6l-9.5 9.5-5-5L1 18',
  },
];

export default function EconomicsAdmin() {
  return (
    <div className="economics-admin">

      <div className="economics-admin__header">
        <h1 className="economics-admin__title">Ekonomika</h1>
        <div className="economics-admin__subtitle">
          Finanční přehled, příjmy, náklady a výsledky
        </div>
      </div>

      {/* Hero */}
      <div className="economics-admin__hero">
        <div className="economics-admin__hero-icon">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v2m0 8v2" />
            <path d="M9 9.5a3 3 0 0 1 6 0c0 1.5-1 2.5-3 3s-3 1.5-3 3a3 3 0 0 0 6 0" />
          </svg>
        </div>
        <div className="economics-admin__hero-label">Připravujeme</div>
        <div className="economics-admin__hero-title">Ekonomická sekce</div>
        <div className="economics-admin__hero-desc">
          Tato sekce bude obsahovat kompletní finanční přehled aplikace —
          příjmy, náklady, marže a klíčové SaaS metriky.
          Implementace proběhne v samostatné iteraci.
        </div>
      </div>

      {/* Preview karet */}
      <div className="economics-admin__preview-label">Co bude sekce obsahovat</div>
      <div className="economics-admin__preview-grid">
        {PREVIEW_CARDS.map((card) => (
          <div key={card.title} className="economics-admin__preview-card">
            <div className="economics-admin__preview-card-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d={card.iconPath} />
              </svg>
            </div>
            <div className="economics-admin__preview-card-title">{card.title}</div>
            <div className="economics-admin__preview-card-desc">{card.description}</div>
            <span className="economics-admin__preview-card-badge">{card.badge}</span>
          </div>
        ))}
      </div>

    </div>
  );
}

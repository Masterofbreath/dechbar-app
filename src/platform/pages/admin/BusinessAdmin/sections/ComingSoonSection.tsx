/**
 * ComingSoonSection — placeholder karty pro budoucí business metriky
 *
 * @package DechBar_App
 * @subpackage Platform/Pages/Admin/BusinessAdmin/sections
 */

interface ComingSoonCard {
  title: string;
  description: string;
  icon: string;
}

const COMING_SOON_CARDS: ComingSoonCard[] = [
  {
    title: 'Trial → Paid konverze',
    description: 'Kolik % uživatelů přechází z trial na placené předplatné a kde ve funnelu odpadají.',
    icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  },
  {
    title: 'Kohortová retence grid',
    description: 'Tabulka: každý týden registrací × procento aktivních v D7/D14/D30/D60.',
    icon: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  },
  {
    title: 'Activation rate per zdroj',
    description: 'Jak rychle noví uživatelé z různých akvizičních kanálů dosáhnou první aktivity.',
    icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  },
];

export function ComingSoonSection() {
  return (
    <div className="business-admin__coming-soon">
      <div className="business-admin__coming-soon-header">
        <div className="business-admin__coming-soon-title">Připravujeme</div>
        <div className="business-admin__coming-soon-subtitle">
          Další business metriky budou přidány v příštích iteracích
        </div>
      </div>
      <div className="business-admin__coming-soon-grid">
        {COMING_SOON_CARDS.map((card) => (
          <div key={card.title} className="business-admin__coming-soon-card">
            <div className="business-admin__coming-soon-card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d={card.icon} />
              </svg>
            </div>
            <div className="business-admin__coming-soon-card-title">{card.title}</div>
            <div className="business-admin__coming-soon-card-desc">{card.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

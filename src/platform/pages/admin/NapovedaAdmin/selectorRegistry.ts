/**
 * SELECTOR_REGISTRY — mapa views, sekcí a DOM prvků DechBar appky
 *
 * Slouží pro admin "DOM Selector Picker" — klikací strom bez nutnosti
 * pamatovat si konkrétní CSS selektory.
 *
 * Struktura: view → sekce → prvky → { label, selector, hint? }
 *
 * ⚠️ Udržuj aktuální při přidávání nových komponent.
 */

export interface SelectorEntry {
  label: string;
  selector: string;
  hint?: string;
}

export interface SelectorSection {
  label: string;
  icon?: string;
  items: SelectorEntry[];
}

export interface SelectorView {
  label: string;
  icon?: string;
  route?: string;
  sections: Record<string, SelectorSection>;
}

export const SELECTOR_REGISTRY: Record<string, SelectorView> = {

  // ==========================================
  // GLOBÁLNÍ — TopNav (všechny views)
  // ==========================================
  topnav: {
    label: 'TopNav',
    icon: '🔝',
    sections: {
      left: {
        label: 'Levá část',
        items: [
          { label: 'Avatar + XP', selector: '.top-nav__user', hint: 'Profilový foto + XP badge' },
        ],
      },
      right: {
        label: 'Pravá část',
        items: [
          { label: '💡 Žárovička průvodce', selector: '.bulb-indicator', hint: 'Hlavní vstup do Nápovědy' },
          { label: '🔔 Zvonec notifikací', selector: '.top-nav__bell-button', hint: 'Notifikace a upozornění' },
          { label: '⚙️ Nastavení', selector: '.top-nav__settings-button', hint: 'Nastavení profilu a appky' },
        ],
      },
    },
  },

  // ==========================================
  // GLOBÁLNÍ — BottomNav
  // ==========================================
  bottomnav: {
    label: 'BottomNav',
    icon: '⬇️',
    sections: {
      tabs: {
        label: 'Záložky',
        items: [
          { label: '🏠 Dnes', selector: '.bottom-nav__tab[aria-label="Dnes"]' },
          { label: '💪 Cvičit', selector: '.bottom-nav__tab[aria-label="Cvičit"]' },
          { label: '📚 Akademie', selector: '.bottom-nav__tab[aria-label="Akademie"]' },
          { label: '📊 Pokrok', selector: '.bottom-nav__tab[aria-label="Pokrok"]' },
        ],
      },
    },
  },

  // ==========================================
  // VIEW: Dnes
  // ==========================================
  dnes: {
    label: 'Dnes',
    icon: '🏠',
    route: '/app',
    sections: {
      header: {
        label: 'Header',
        items: [
          { label: 'Ahoj, [jméno]', selector: '.home-header__title', hint: 'Nadpis "Ahoj, Jakube"' },
          { label: 'KP badge (vlevo)', selector: '.kp-badge', hint: 'Kontrolní pauza hodnota' },
        ],
      },
      tabs: {
        label: 'Přepínač SMART / Cesta',
        items: [
          { label: 'SMART Cvičení tab', selector: '.tab-btn--smart, [data-tab="smart"]' },
          { label: 'Cesta na Trůn tab', selector: '.tab-btn--cesta, [data-tab="cesta"]' },
        ],
      },
      daily: {
        label: 'Denní program',
        items: [
          { label: 'Denní program sekce', selector: '.daily-program' },
          { label: 'Přehrát tlačítko', selector: '.daily-program .play-btn, .daily-program button' },
        ],
      },
      protocols: {
        label: 'Doporučené protokoly',
        items: [
          { label: 'Protokoly grid', selector: '.protocols-grid, .recommended-protocols' },
          { label: 'Ráno', selector: '.protocol-card--rano, [data-time="rano"]' },
          { label: 'Klid', selector: '.protocol-card--klid, [data-time="klid"]' },
          { label: 'Večer', selector: '.protocol-card--vecер, [data-time="vecer"]' },
        ],
      },
    },
  },

  // ==========================================
  // VIEW: Cvičit
  // ==========================================
  cvicit: {
    label: 'Cvičit',
    icon: '💪',
    route: '/app/cvicit',
    sections: {
      kp: {
        label: 'Kontrolní pauza (KP)',
        items: [
          { label: 'KP Měřič', selector: '.kp-meter, .kp-widget', hint: 'Tlačítko pro měření KP' },
          { label: 'KP hodnota', selector: '.kp-value' },
          { label: 'KP trend', selector: '.kp-trend' },
        ],
      },
      protocols: {
        label: 'Protokoly',
        items: [
          { label: 'Protokol grid', selector: '.protocols-list' },
          { label: 'Spustit cvičení', selector: '.protocol-start-btn, .exercise-btn' },
        ],
      },
    },
  },

  // ==========================================
  // VIEW: Akademie
  // ==========================================
  akademie: {
    label: 'Akademie',
    icon: '📚',
    route: '/app/akademie',
    sections: {
      tracky: {
        label: 'Vzdělávací tracky',
        items: [
          { label: 'Track list', selector: '.track-list, .akademie-tracks' },
          { label: 'Track karta', selector: '.track-card' },
        ],
      },
    },
  },

  // ==========================================
  // VIEW: Pokrok
  // ==========================================
  pokrok: {
    label: 'Pokrok',
    icon: '📊',
    route: '/app/pokrok',
    sections: {
      stats: {
        label: 'Statistiky',
        items: [
          { label: 'KP graf', selector: '.kp-chart, .progress-chart' },
          { label: 'Streak', selector: '.streak-badge, .streak-counter' },
          { label: 'Celkový čas', selector: '.total-time' },
        ],
      },
      achievements: {
        label: 'Úspěchy',
        items: [
          { label: 'Badge grid', selector: '.achievements-grid' },
          { label: 'Badge karta', selector: '.achievement-card' },
        ],
      },
    },
  },

  // ==========================================
  // NASTAVENÍ
  // ==========================================
  nastaveni: {
    label: 'Nastavení',
    icon: '⚙️',
    route: '/app/settings',
    sections: {
      profil: {
        label: 'Profil',
        items: [
          { label: 'Přezdívka', selector: '[data-field="nickname"], .nickname-input' },
          { label: 'Vokativ', selector: '[data-field="vocative"], .vocative-input' },
          { label: 'Safety flags', selector: '.safety-flags' },
        ],
      },
      clenstvo: {
        label: 'Členství',
        items: [
          { label: 'SMART badge', selector: '.smart-badge, .membership-badge' },
          { label: 'Upgrade tlačítko', selector: '.upgrade-btn' },
        ],
      },
    },
  },
};

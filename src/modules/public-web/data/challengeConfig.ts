/**
 * Challenge Configuration
 * 
 * Centrální konfigurace pro Březnovou Dechovou Výzvu 2026
 * 
 * @package DechBar_App
 * @subpackage Modules/PublicWeb
 */

export interface ChallengeConfig {
  id: string;
  name: string;
  timeline: {
    preRegistration: { start: string; end: string };
    preview: string;
    registration: { start: string; end: string };
    challenge: { start: string; end: string };
  };
  smartBonus: {
    enabled: boolean;
    duration: number; // dní
    value: number; // Kč
  };
  testimonials: Array<{
    image?: string; // WhatsApp screenshot path
    text: string;
    author: string;
    age?: number;
    city?: string;
  }>;
}

export const CHALLENGE_CONFIG: ChallengeConfig = {
  id: 'march_2026',
  name: 'Březnová Dechová Výzva 2026',
  
  timeline: {
    // Pre-registrace (sběr emailů)
    preRegistration: { 
      start: '2026-01-26', 
      end: '2026-02-25' 
    },
    
    // Ochutnávka (plné DechPresso audio)
    preview: '2026-02-21',
    
    // Registrace (3denní okno - Magic Link sending)
    registration: { 
      start: '2026-02-26', 
      end: '2026-02-28' 
    },
    
    // Samotná výzva (21 dní)
    challenge: { 
      start: '2026-03-01', 
      end: '2026-03-21' 
    }
  },
  
  smartBonus: {
    enabled: true,
    duration: 21, // dní SMART tarifu zdarma
    value: 249 // Kč/měsíc hodnota
  },
  
  testimonials: [
    {
      // image: '/testimonials/whatsapp-1.png', // Placeholder pro screenshot
      text: 'Konečně něco bez ezo. Ráno 7 minut a v práci jsem klidnější.',
      author: 'Petr',
      age: 34,
    },
    {
      // image: '/testimonials/whatsapp-2.png',
      text: 'Nevěřila jsem, ale po týdnu spím líp. Díky!',
      author: 'Jana',
      age: 29,
    },
    {
      // image: '/testimonials/whatsapp-3.png',
      text: 'Super appka. Jednoduchá, černá, neruší.',
      author: 'Tomáš',
      age: 31,
    }
  ]
};

/**
 * Helper: Check if we're in pre-registration phase
 */
export function isPreRegistrationOpen(): boolean {
  const now = new Date();
  const start = new Date(CHALLENGE_CONFIG.timeline.preRegistration.start);
  const end = new Date(CHALLENGE_CONFIG.timeline.preRegistration.end);
  return now >= start && now <= end;
}

/**
 * Helper: Check if registration window is open (26-28.2.)
 */
export function isRegistrationOpen(): boolean {
  const now = new Date();
  const start = new Date(CHALLENGE_CONFIG.timeline.registration.start);
  const end = new Date(CHALLENGE_CONFIG.timeline.registration.end);
  return now >= start && now <= end;
}

/**
 * Helper: Check if challenge is active (1-21.3.)
 */
export function isChallengeActive(): boolean {
  const now = new Date();
  const start = new Date(CHALLENGE_CONFIG.timeline.challenge.start);
  const end = new Date(CHALLENGE_CONFIG.timeline.challenge.end);
  return now >= start && now <= end;
}

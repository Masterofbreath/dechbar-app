/**
 * How It Works Data
 * 
 * 3-step process explanation for landing page
 * Measure → Practice → Improve flow
 * 
 * @package DechBar_App
 * @subpackage Modules/PublicWeb/Data
 */

export interface HowItWorksStep {
  number: number;
  title: string;
  description: string;
  screenshotPlaceholder: 'measure' | 'practice' | 'improve';
}

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    number: 1,
    title: 'Změř',
    description: 'Změř své KP během pár minut. Získej výchozí hodnotu pro sledování pokroku.',
    screenshotPlaceholder: 'measure',
  },
  {
    number: 2,
    title: 'Cvič',
    description: 'Vyber si z 150+ audio cvičení. Ranní aktivace, polední reset nebo večerní relaxace.',
    screenshotPlaceholder: 'practice',
  },
  {
    number: 3,
    title: 'Zlepšuj',
    description: 'Sleduj svůj pokrok v čase. Průměrné zlepšení: +12 sekund za 3 týdny.',
    screenshotPlaceholder: 'improve',
  },
];

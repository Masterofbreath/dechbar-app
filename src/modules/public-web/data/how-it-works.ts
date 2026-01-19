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
    description: 'Změř své KP za pár minut. Poznej výchozí stav.',
    screenshotPlaceholder: 'measure',
  },
  {
    number: 2,
    title: 'Cvič',
    description: '150+ audio cvičení včetně přednastaveních programů. Vyber si ráno, v poledne či večer.',
    screenshotPlaceholder: 'practice',
  },
  {
    number: 3,
    title: 'Zlepšuj',
    description: 'Sleduj pokrok v čase. Analyzuj výsledky. Rostěte společně.',
    screenshotPlaceholder: 'improve',
  },
];

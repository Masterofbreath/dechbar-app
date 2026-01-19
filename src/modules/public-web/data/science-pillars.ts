/**
 * Science Pillars Data
 * 
 * 3 key scientific principles behind DechBar
 * Benefit-driven approach covering sleep, energy, and stress
 * 
 * @package DechBar_App
 * @subpackage Modules/PublicWeb/Data
 */

export interface SciencePillar {
  id: string;
  icon: 'moon' | 'lightning' | 'chart';
  title: string;
  subtitle: string;
  description: string;
}

export const SCIENCE_PILLARS: SciencePillar[] = [
  {
    id: 'better-sleep',
    icon: 'moon',
    title: 'Lepší spánek',
    subtitle: 'Zapojení bránice',
    description: 'Uvolňuje nervový systém. Usneš rychleji, spíš kvalitněji.',
  },
  {
    id: 'more-energy',
    icon: 'lightning',
    title: 'Víc energie',
    subtitle: 'Bohrův efekt',
    description: 'Správná tolerance CO₂ = víc kyslíku v buňkách = víc energie v těle.',
  },
  {
    id: 'less-stress',
    icon: 'chart',
    title: 'Měřitelný pokrok',
    subtitle: 'KP (Kontrolní pauza)',
    description: 'Měř svůj pokrok objektivně. Vyšší KP = nižší stres a lepší výdrž.',
  },
];

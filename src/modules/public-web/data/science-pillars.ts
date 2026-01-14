/**
 * Science Pillars Data
 * 
 * 3 key scientific principles behind DechBar
 * Based on Bohr effect, nitric oxide, and BOLT measurement
 * 
 * @package DechBar_App
 * @subpackage Modules/PublicWeb/Data
 */

export interface SciencePillar {
  id: string;
  icon: 'dna' | 'lungs' | 'chart';
  title: string;
  description: string;
}

export const SCIENCE_PILLARS: SciencePillar[] = [
  {
    id: 'bohr-effect',
    icon: 'dna',
    title: 'Bohrův efekt',
    description: 'Více CO₂ = lepší okysličení tkání',
  },
  {
    id: 'nitric-oxide',
    icon: 'lungs',
    title: 'Oxid dusnatý',
    description: 'Nosní dech = +18% kyslíku',
  },
  {
    id: 'bolt-tracking',
    icon: 'chart',
    title: 'Sleduj pokrok',
    description: 'BOLT skóre = objektivní metrika zdraví',
  },
];

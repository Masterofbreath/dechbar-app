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
    subtitle: 'Dýchání do břicha',
    description: 'Aktivuje parasympatikus - nervový systém klidu. Usneš rychleji, spíš hlouběji.',
  },
  {
    id: 'more-energy',
    icon: 'lightning',
    title: 'Víc energie',
    subtitle: 'Bohrův efekt',
    description: 'Správné CO₂ = víc kyslíku v buňkách. Méně únavy, víc výkonu během dne.',
  },
  {
    id: 'less-stress',
    icon: 'chart',
    title: 'Měřitelný pokrok',
    subtitle: 'BOLT skóre',
    description: 'Sleduj svou odolnost vůči stresu objektivně. Vyšší BOLT = lepší zvládání.',
  },
];

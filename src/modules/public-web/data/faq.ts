/**
 * FAQ Data - Landing Page
 * 
 * Frequently Asked Questions for landing page
 * Based on Czech market research and common objections
 * 
 * @package DechBar_App
 * @subpackage Modules/PublicWeb/Data
 */

export interface FAQItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'Potřebuji nějaké vybavení?',
    answer: 'Ne. Stačí telefon a 5 minut denně. Vše ostatní je v tobě.',
  },
  {
    question: 'Jak rychle uvidím výsledky?',
    answer: 'První změny (lepší spánek, větší klid) během 7 dní. Měřitelné zlepšení BOLT skóre za 3 týdny.',
  },
  {
    question: 'Je to vhodné pro začátečníky?',
    answer: 'Ano. Aplikace tě provede od základů. Žádná předchozí zkušenost není potřeba.',
  },
  {
    question: 'Kolik to stojí?',
    answer: 'Základní verze je zdarma. Prémiové tarify od 125 Kč/měsíc (roční předplatné).',
  },
  {
    question: 'Funguje offline?',
    answer: 'Ano. Všechna cvičení si můžeš stáhnout a cvičit bez internetu.',
  },
  {
    question: 'Co je BOLT skóre?',
    answer: 'Objektivní metrika tvé schopnosti tolerovat CO₂. Čím vyšší BOLT, tím zdravější dýchání. Průměr populace: 20 sekund. Optimum: 40+ sekund.',
  },
  {
    question: 'Potřebuji Apple Watch nebo fitness tracker?',
    answer: 'Ne. Aplikace funguje samostatně. Ale podporujeme Apple Watch pro pokročilé sledování srdečního tepu (HRV).',
  },
];

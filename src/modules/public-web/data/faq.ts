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
    answer: 'Ne. Stačí telefon a 7 minut denně. Vše ostatní je v tobě.',
  },
  {
    question: 'Jak rychle uvidím výsledky?',
    answer: 'První změny (lepší spánek, větší klid) během 7-14 dní. Měřitelné zlepšení KP za 3 týdny.',
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
    question: 'Co je KP (Kontrolní pauza)?',
    answer: 'Objektivní metrika tvé schopnosti tolerovat CO₂. Čím vyšší KP, tím zdravější dýchání. Průměr populace je 15 sekund. Od 25 sekund začíná tělo vykazovat první signály funkčního dýchání a optimální stav je 40+ sekund.',
  },
  {
    question: 'Potřebuji Apple Watch nebo fitness tracker?',
    answer: 'Ne, aplikace funguje samostatně. Brzy však bude podporovat Apple Watch, Oura ring nebo hrudní pás pro pokročilé sledování.',
  },
];

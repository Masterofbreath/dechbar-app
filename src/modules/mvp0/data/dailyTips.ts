/**
 * Daily Tips - Breathing Science Facts
 * 
 * Collection of scientific facts about breathing.
 * One random tip displayed per day (hash-based selection).
 * 
 * @package DechBar_App
 * @subpackage MVP0/Data
 * @since 0.1.0
 */

export interface DailyTip {
  id: number;
  text: string;
}

/**
 * Daily tips collection (10 vědeckých faktů)
 */
export const DAILY_TIPS: DailyTip[] = [
  {
    id: 1,
    text: "Nosní dýchání zvyšuje produkci oxidu dusnatého (NO) o 18%, což zlepšuje okysličení mozku."
  },
  {
    id: 2,
    text: "Kontrolní pauza (KP) nad 40 sekund indikuje optimální dýchání. Průměr populace je pouze 20 sekund."
  },
  {
    id: 3,
    text: "6 dechů za minutu je rezonanční frekvence pro maximální HRV a aktivaci parasympatiku."
  },
  {
    id: 4,
    text: "Bohrův efekt: Vyšší hladina CO₂ v krvi zlepšuje uvolňování kyslíku do tkání."
  },
  {
    id: 5,
    text: "Ústní dýchání aktivuje sympatikus (stresový režim), nosní dýchání podporuje parasympatikus (klid)."
  },
  {
    id: 6,
    text: "Dechová kadence 4-6 (nádech 4s, výdech 6s) synchronizuje srdeční rytmus s dechem."
  },
  {
    id: 7,
    text: "Redukované dýchání (Breathe Light) zvyšuje toleranci na CO₂ a zlepšuje okysličení tkání."
  },
  {
    id: 8,
    text: "Hyperventilace (příliš objemné dýchání) vede k respirační alkalóze a hypoxii tkání."
  },
  {
    id: 9,
    text: "Paranasální dutiny produkují oxid dusnatý (NO), který má antivirotické a antibakteriální účinky."
  },
  {
    id: 10,
    text: "4-7-8 breathing (nádech 4s, zadržení 7s, výdech 8s) podporuje produkci melatoninu a usnadňuje usnutí."
  }
];

/**
 * Get daily tip based on current date
 * Same tip for the whole day (deterministic hash)
 * 
 * @returns Random tip that changes daily
 */
export function getDailyTip(): DailyTip {
  const today = new Date().toDateString();
  const hash = today.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  const index = Math.abs(hash) % DAILY_TIPS.length;
  return DAILY_TIPS[index];
}

/**
 * Greeting - Personalized friendly greeting
 *
 * Hierarchie zobrazení:
 *   1. userNameVocative (5. pád z DB) — "Jakube"
 *   2. Fallback: client-side getVocative(křestní jméno) — "Jakube" (pokud je v mapě)
 *   3. Fallback na 1. slovo z full_name — "Jakub"
 *   4. Neutrální fallback — bez jména
 *
 * Proč client-side fallback? Existující uživatelé mohou mít v DB uloženou špatnou
 * hodnotu (null nebo celé jméno). Fallback zajistí správné oslovení bez nutnosti
 * migrovat data v DB.
 *
 * Future slot: prop `message` umožní v budoucnu zobrazit admin-ovladatelnou
 * zprávu/otázku místo výchozího pozdravu (např. při opakovaném vstupu v den).
 * Slot je označen data-slot="greeting-message" pro snadné napojení.
 *
 * @package DechBar_App
 * @subpackage MVP0/Components
 * @since 0.1.0
 */

import { getVocative } from '@/lib/vocative';

export interface GreetingProps {
  /** Celé jméno uživatele — "Jakub Pelikán" */
  userName?: string;
  /** 5. pád (vocativ) z DB — "Jakube". Pokud chybí, použije se client-side fallback. */
  userNameVocative?: string;
  /**
   * Admin-ovladatelná zpráva místo výchozího pozdravu.
   * Pokud není nastaveno, zobrazí se výchozí "Ahoj, [jméno]"
   *
   * @slot greeting-message
   * @future Admin panel → Nastavení → Uvítací zprávy
   */
  message?: string;
}

/** Vrátí první slovo z celého jména — "Jakub Pelikán" → "Jakub" */
function extractFirstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0];
}

/**
 * Určí nejlepší oslovení uživatele v pořadí priorit:
 * 1. DB vocative (pokud není celé jméno — ochrana proti legacy chybě)
 * 2. Client-side getVocative(křestní jméno) z mapy 400 jmen
 * 3. Křestní jméno (fallback bez vokativu)
 * 4. null (bez jména)
 */
function resolveDisplayName(
  userName?: string,
  userNameVocative?: string,
): string | null {
  const firstName = userName ? extractFirstName(userName) : null;

  // Pokud vocative z DB existuje a není to celé jméno (legacy bug), použij ho
  if (userNameVocative && firstName && !userNameVocative.includes(' ')) {
    return userNameVocative;
  }

  // Client-side vocative lookup — pokud je křestní jméno v mapě
  if (firstName) {
    const vocative = getVocative(firstName);
    if (vocative) return vocative;
  }

  // Fallback: křestní jméno bez vokativu
  return firstName ?? null;
}

export function Greeting({ userName, userNameVocative, message }: GreetingProps) {
  const displayName = resolveDisplayName(userName, userNameVocative);

  const defaultGreeting = displayName
    ? `Ahoj, ${displayName}`
    : 'Ahoj';

  const text = message ?? defaultGreeting;

  return (
    <h1 className="greeting" data-slot="greeting-message">
      {text}
    </h1>
  );
}

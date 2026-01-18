/**
 * Greeting - Personalized Friendly Greeting
 * 
 * Always uses "Ahoj" for friendly tone.
 * Supports vocative case (5. pád) for Czech names.
 * 
 * @package DechBar_App
 * @subpackage MVP0/Components
 * @since 0.1.0
 */

export interface GreetingProps {
  userName?: string;
  userNameVocative?: string; // 5. pád (e.g., "Jakub" → "Jakube")
}

/**
 * Get greeting - always friendly "Ahoj"
 */
function getGreeting(): string {
  return "Ahoj";
}

/**
 * Greeting component with vocative support
 * 
 * @example
 * <Greeting userName="Jakub Pelikán" userNameVocative="Jakube" />
 */
export function Greeting({ userName, userNameVocative }: GreetingProps) {
  const greeting = getGreeting();
  
  // Prefer vocative, fallback to nominative or default
  const displayName = userNameVocative || userName || 'příteli';
  
  return (
    <h1 className="greeting">
      {greeting}, {displayName}!
    </h1>
  );
}

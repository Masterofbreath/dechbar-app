/**
 * Greeting Component - Dynamic Time-Based Welcome
 * 
 * Displays personalized greeting based on time of day.
 * Tone of Voice: Tykání, gender-neutral, friendly.
 * 
 * @package DechBar_App
 * @subpackage MVP0/Components
 * @since 0.1.0
 */

/**
 * Get greeting based on current hour
 */
function getGreeting(hour: number): string {
  if (hour < 12) return "Dobré ráno";
  if (hour < 18) return "Dobrý den";
  return "Dobrý večer";
}

export interface GreetingProps {
  /**
   * User's first name or full name
   * Falls back to "příteli" if not provided
   */
  userName?: string;
}

/**
 * Greeting - Dynamic welcome message
 * 
 * @example
 * <Greeting userName="Jakub" />
 * // Output: "Dobré ráno, Jakube! 👋"
 */
export function Greeting({ userName }: GreetingProps) {
  const hour = new Date().getHours();
  const greeting = getGreeting(hour);
  const displayName = userName || 'příteli';
  
  return (
    <h1 className="greeting">
      {greeting}, {displayName}! 👋
    </h1>
  );
}

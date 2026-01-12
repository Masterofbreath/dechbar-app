/**
 * 🔤 CZECH INFLECTION UTILITIES
 * 
 * Utility functions for Czech language declension (skloňování).
 * 
 * @see docs/design-system/TONE_OF_VOICE.md - Why we use vocative
 * 
 * Version: 1.0
 * Last Updated: 2026-01-10
 */

/**
 * Get vocative (5th) case of a Czech name
 * 
 * @param name - Nominative (1st case) Czech name
 * @returns Vocative (5th case) for personalized greetings
 * 
 * @example
 * getVocative("Lukáš") // → "Lukáši"
 * getVocative("Anna")  // → "Anno"
 * getVocative("Petr")  // → "Petre"
 * getVocative("Marie") // → "Marie" (unchanged)
 */
export function getVocative(name: string): string {
  if (!name || name.trim() === '') {
    return name;
  }

  const trimmedName = name.trim();
  const lower = trimmedName.toLowerCase();

  // ============================================================
  // MUŽSKÁ JMÉNA (Male Names)
  // ============================================================

  // -áš → -áši (Lukáš, Tomáš, Matyáš)
  if (lower.endsWith('áš')) {
    return trimmedName.slice(0, -2) + 'áši';
  }

  // -etr → -etre (Petr)
  if (lower.endsWith('etr')) {
    return trimmedName + 'e';
  }

  // -avel → -avle (Pavel)
  if (lower.endsWith('avel')) {
    return trimmedName.slice(0, -2) + 'le';
  }

  // -el → -ele (Daniel, Michael, Samuel)
  if (lower.endsWith('el')) {
    return trimmedName + 'e';
  }

  // -ek → -ku (Vítek, Zdeněk)
  if (lower.endsWith('ek')) {
    return trimmedName.slice(0, -2) + 'ku';
  }

  // -an → -ane (Jan, Milan, Štěpán)
  if (lower.endsWith('an') || lower.endsWith('án')) {
    return trimmedName + 'e';
  }

  // -in → -ine (Martin)
  if (lower.endsWith('in')) {
    return trimmedName + 'e';
  }

  // -on → -one (Šimon)
  if (lower.endsWith('on')) {
    return trimmedName + 'e';
  }

  // Irregular: Jan → Honzo/Jene
  // Check explicitly for "honza" (casual for Jan)
  if (lower === 'honza') {
    return trimmedName.slice(0, -1) + 'o'; // Honzo
  }

  // Irregular: Jirka → Jirko
  if (lower.endsWith('ka') && /^[^aeiou]+ka$/.test(lower)) {
    return trimmedName.slice(0, -1) + 'o';
  }

  // ============================================================
  // ŽENSKÁ JMÉNA (Female Names)
  // ============================================================

  // -ie → beze změny (Marie, Julie, Natalie, Rosalie)
  if (lower.endsWith('ie')) {
    return trimmedName; // No change
  }

  // -a → -o (Anna, Tereza, Karolína, Petra, Jana)
  // BUT NOT if ends with -ia (which is rare in Czech)
  if (lower.endsWith('a') && !lower.endsWith('ia')) {
    return trimmedName.slice(0, -1) + 'o';
  }

  // -y → -y (Katy) - rare but keep unchanged
  if (lower.endsWith('y')) {
    return trimmedName; // No change
  }

  // ============================================================
  // FALLBACK (Unknown/Unusual Names)
  // ============================================================
  // If no rule matched, return original
  return trimmedName;
}

/**
 * Check if vocative was successfully generated or just returned original
 * 
 * @param original - Original name (nominative)
 * @param vocative - Vocative form returned by getVocative()
 * @returns true if vocative is different from original
 */
export function isVocativeGenerated(original: string, vocative: string): boolean {
  return original.trim().toLowerCase() !== vocative.trim().toLowerCase();
}

/**
 * Get display name for greetings with fallback
 * 
 * If vocative was auto-generated, use it. Otherwise use original name.
 * 
 * @param displayName - Original name (nominative)
 * @param vocativeName - Pre-stored vocative (if any)
 * @returns Name suitable for greeting
 * 
 * @example
 * getGreetingName("Lukáš", "Lukáši") // → "Lukáši"
 * getGreetingName("Lukáš", undefined) // → "Lukáši" (auto-generated)
 * getGreetingName("Xyz", undefined)   // → "Xyz" (fallback)
 */
export function getGreetingName(
  displayName: string,
  vocativeName?: string | null
): string {
  // If vocative is explicitly stored, use it
  if (vocativeName && vocativeName.trim() !== '') {
    return vocativeName;
  }

  // Otherwise, auto-generate
  const autoVocative = getVocative(displayName);
  
  // If auto-generation worked (changed the name), use it
  if (isVocativeGenerated(displayName, autoVocative)) {
    return autoVocative;
  }

  // Fallback: use original name
  return displayName;
}

// ============================================================
// TESTING / DEBUG (development only)
// ============================================================

/**
 * Test cases for getVocative()
 * 
 * @example
 * testVocative() // Logs all test results
 */
export function testVocative() {
  const tests = [
    // Male names
    { input: 'Lukáš', expected: 'Lukáši' },
    { input: 'Tomáš', expected: 'Tomáši' },
    { input: 'Petr', expected: 'Petre' },
    { input: 'Pavel', expected: 'Pavle' },
    { input: 'Jan', expected: 'Jane' },
    { input: 'Honza', expected: 'Honzo' },
    { input: 'Martin', expected: 'Martine' },
    { input: 'Daniel', expected: 'Daniele' },
    { input: 'Michael', expected: 'Michaele' },
    { input: 'Vítek', expected: 'Vítku' },
    { input: 'Zdeněk', expected: 'Zdeňku' },
    { input: 'Milan', expected: 'Milane' },
    { input: 'Šimon', expected: 'Šimone' },
    { input: 'Jirka', expected: 'Jirko' },
    
    // Female names
    { input: 'Anna', expected: 'Anno' },
    { input: 'Tereza', expected: 'Terezo' },
    { input: 'Karolína', expected: 'Karolíno' },
    { input: 'Marie', expected: 'Marie' }, // No change
    { input: 'Julie', expected: 'Julie' }, // No change
    { input: 'Petra', expected: 'Petro' },
    { input: 'Jana', expected: 'Jano' },
    { input: 'Natalie', expected: 'Natalie' }, // No change
  ];

  console.log('🔤 Testing Czech Vocative Generation:');
  console.log('=====================================');

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = getVocative(test.input);
    const status = result === test.expected ? '✅' : '❌';
    
    if (result === test.expected) {
      passed++;
    } else {
      failed++;
    }

    console.log(`${status} ${test.input} → ${result} (expected: ${test.expected})`);
  }

  console.log('=====================================');
  console.log(`✅ Passed: ${passed} | ❌ Failed: ${failed}`);
}

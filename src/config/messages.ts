/**
 * 📚 MESSAGE LIBRARY - DechBar App
 * 
 * Centrální konfigurace pro VŠECHNY UI texty.
 * 
 * @see docs/design-system/MESSAGE_LIBRARY.md - Kompletní dokumentace
 * @see docs/design-system/TONE_OF_VOICE.md - Pravidla tone of voice
 * 
 * PRAVIDLA:
 * - NIKDY nepiš UI texty přímo do JSX
 * - VŽDY odkazuj na MESSAGES.*
 * - Pokud zpráva neexistuje → přidej ji sem + do MESSAGE_LIBRARY.md
 * 
 * Version: 1.0
 * Last Updated: 2026-01-10
 */

export const MESSAGES = {
  // ============================================================
  // 🎉 SUCCESS MESSAGES
  // Tone: Celebrační + Dechový vibe (30-50%)
  // Emoji: Ano (1 na začátku, optional)
  // ============================================================
  success: {
    registration: "Super! Tvůj účet je vytvořený. Ať to dýchá!",
    login: "Vítej zpátky! Dej si nádech a pokračuj.",
    profileUpdate: "Hotovo! Tvůj profil dýchá novotou.",
    passwordChanged: "Heslo změněno! Dýchej v klidu.",
    emailVerified: "Email ověřen! Jsi oficiálně součástí DechBaru.",
    exerciseComplete: "Parádní práce! Máš dodýcháno.",
    challengeComplete: "Bomba! Nadechl ses k úspěchu",
    goalAchieved: "Hurá! Rozdýchal jsi svůj cíl!",
    dataSaved: "Uloženo! Všechno dýchá, jak má.",
    settingsUpdated: "Nastavení uloženo. Dýchej dál!",
    passwordResetSent: "Pokud existuje účet s tímto emailem, zaslali jsme ti odkaz pro obnovení hesla.",
    passwordResetSuccess: "Tvoje heslo bylo úspěšně aktualizováno. Budeš přesměrován na Dashboard.",
  },

  // ============================================================
  // ⏳ LOADING STATES
  // Tone: Uklidňující + Dechový vibe (100%)
  // Emoji: Ne
  // ============================================================
  loading: {
    default: "Dej si pár nádechů a výdechů, protože za moment pokračujeme...",
    saving: "Dej nám chvilku, jen něco rozdýcháváme...",
    processing: "Chvilku strpení, nádech, výdech...",
    login: "Přihlašujeme tě, nádech...",
    registering: "Vytváříme tvůj účet, výdech...",
    loadingExercise: "Připravujeme tvoje dechování...",
  },

  // ============================================================
  // 🚫 ERROR MESSAGES
  // Tone: Friendly + Dechový vibe (kde to dává smysl)
  // Emoji: Ne (clarity first)
  // ============================================================
  error: {
    // Obecné validační chyby
    requiredFields: "Vyplň prosím všechna pole",
    
    // E-mail validace (kontextově specifické)
    invalidEmailLogin: "Tento e-mail vypadá divně. Zkontroluj ho, prosím",
    invalidEmailRegister: "Hmm, zkontroluj e-mail. Potřebujeme správný formát",
    invalidEmail: "Ups! Tento e-mail s námi nedýchá. Zkontroluj ho, prosím", // Reset hesla
    
    // Heslo validace
    passwordRequired: "Zadej prosím své heslo",
    passwordTooShort: "Heslo musí mít alespoň 6 znaků",
    passwordMismatch: "Hesla se neshodují. Zkontroluj to, prosím",
    
    // GDPR
    gdprRequired: "Pro registraci potřebujeme tvůj souhlas s podmínkami",
    
    // Backend kombinované chyby
    emailExists: "Tento e-mail už s námi dýchá. Chceš se přihlásit?",
    invalidCredentials: "E-mail nebo heslo nesedí. Zkus to znovu",
    
    // Backend/Network chyby
    loginFailed: "Hm, nerozdýchali jsme to. Zkus to znovu",
    registrationFailed: "Nepodařilo se vytvořit účet. Zkus to prosím znovu",
    networkError: "Ztratili jsme dech internetu. Zkontroluj připojení.",
    serverError: "Něco se pokazilo na naší straně. Zkus to za chvilku",
    notFound: "Toto jsme nenašli. Zkus něco jiného",
    unauthorized: "K tomuto nemáš přístup. Přihlaš se prosím",
    sessionExpired: "Tvoje session vypršela. Přihlaš se znovu",
    
    // Feature-specific chyby
    uploadFailed: "Nepodařilo se nahrát soubor. Zkus to znovu",
    exerciseNotFound: "Tohle dechování jsme nenašli",
    challengeLocked: "Tato výzva je zamčená. Splň nejdřív předchozí!",
    passwordResetFailed: "Nepodařilo se odeslat odkaz. Zkus to znovu",
    passwordUpdateFailed: "Nepodařilo se změnit heslo. Zkus to znovu",
  },

  // ============================================================
  // 📭 EMPTY STATES
  // Tone: Motivační + Dechový vibe (100%)
  // Emoji: Ne
  // ============================================================
  empty: {
    noChallenges: "Zatím je tu ticho bez dechu. Začni svou první výzvu!",
    noHistory: "Tvoje cesta právě začíná. Nádechni se k prvnímu kroku!",
    noExercises: "Ještě jsi nerozdýchal žádnou výzvu. Začni teď!",
    noProgress: "Tvůj první nádech čeká. Začni své dechování!",
    noNotifications: "Žádné nové zprávy. Dýchej v klidu!",
    noSearchResults: "Nic jsme nenašli. Zkus jiná slova",
    noFavorites: "Ještě nemáš oblíbená dechování. Přidej si je!",
  },

  // ============================================================
  // 💡 HINTS & HELPERS
  // Tone: Helpful + Neutrální (bez dechový vibe)
  // Emoji: Ne
  // ============================================================
  hints: {
    emailHelper: "Použij tvůj registrační e-mail",
    passwordStrength: "Doporučujeme použít čísla a speciální znaky",
    nicknameHelper: "Jak tě máme oslovovat?",
    optional: "(nepovinné)",
    required: "Všechna pole jsou povinná",
  },

  // ============================================================
  // 🔘 BUTTON LABELS
  // Primary CTA (s →) vs. Secondary (bez →)
  // ============================================================
  buttons: {
    // Primary CTA
    login: "Přihlásit se →",
    register: "Registruj se zdarma →",
    continueWithEmail: "Pokračovat s emailem →",
    startChallenge: "Začít výzvu →",
    continue: "Pokračovat →",
    startExercise: "Začít dechování →",
    sendResetLink: "Poslat odkaz →",
    setPassword: "Nastavit heslo →",
    createAccount: "Vytvořit účet zdarma →",
    
    // Secondary Actions
    save: "Uložit",
    cancel: "Zrušit",
    close: "Zavřít",
    back: "← Zpět",
    edit: "Upravit",
    delete: "Smazat",
    confirm: "Potvrdit",
    
    // Loading States
    loading: {
      login: "Přihlašuji...",
      register: "Vytvářím účet...",
      saving: "Ukládám...",
      sending: "Odesílám...",
      sendingEmail: "Posílám email...",
    },
  },

  // ============================================================
  // 🧭 NAVIGATION
  // Tone: Neutrální (bez dechový vibe)
  // Emoji: Ne
  // ============================================================
  nav: {
    dashboard: "Dashboard",
    challenges: "Výzvy",
    exercises: "Dechování",
    progress: "Tvůj pokrok",
    settings: "Nastavení",
    profile: "Profil",
    logout: "Odhlásit se",
    help: "Pomoc",
    community: "Komunita",
  },

  // ============================================================
  // 📝 FORM LABELS
  // Tone: Neutrální, stručný (bez dechový vibe)
  // Emoji: Ne
  // ============================================================
  form: {
    email: "E-mail",
    password: "Heslo",
    passwordConfirm: "Potvrzení hesla",
    nickname: "Přezdívka",
    fullName: "Celé jméno",
    dateOfBirth: "Datum narození",
    rememberMe: "Zapamatovat si mě",
    gdprConsent: "Souhlasím s GDPR a obchodními podmínkami",
    
    // Placeholders
    placeholders: {
      email: "tvuj@email.cz",
      password: "Minimálně 6 znaků",
      passwordConfirm: "Zadej heslo znovu",
      // nickname: Dynamic (rotating names in component)
    },
  },

  // ============================================================
  // 🎭 AUTH-SPECIFIC MESSAGES
  // Specific texts for authentication flow
  // ============================================================
  auth: {
    // Titles
    loginTitle: "Vítej v DechBaru",
    registerTitle: "Začni svou cestu!",
    forgotPasswordTitle: "Zapomenuté heslo?",
    resetPasswordTitle: "Nastav si nové heslo",
    
    // Subtitles
    loginSubtitle: "Přihlaš se a pokračuj ve svém dechování",
    registerSubtitle: "Připoj se k 1150+ členům komunity DechBar",
    forgotPasswordSubtitle: "Zadej svůj email a my ti pošleme další instrukce",
    resetPasswordSubtitle: "Vyber si silné heslo pro svůj účet",
    
    // Footer links
    noAccount: "Nemáš účet?",
    alreadyHaveAccount: "Už máš účet?",
    knowPassword: "Už víš heslo?",
    
    // Email sent messages
    emailSentTitle: "Zkontroluj svůj email!",
    emailSentSubtitle: "Poslali jsme ti odkaz na:",
    emailSentInstruction: "Klikni na odkaz v emailu a pokračuj ve svém dechování.",
    emailSentSpamHint: "💡 Nenašel jsi email? Zkontroluj spam.",
  },
} as const;

// Type for autocomplete
export type MessageKeys = typeof MESSAGES;

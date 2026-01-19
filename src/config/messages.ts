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
    loadingExercise: "Připravujeme tvoje cvičení...",
    breatheWithUs: "Dýchej s námi...",
    preparingApp: "Připravujeme tvou aplikaci. Dýchej s námi...",
  },

  // ============================================================
  // 💡 BREATHING FACTS (Loading Screen Tips)
  // Tone: Educational + Inspiring (like PC game loading screens)
  // Format: Short, valuable, enriching
  // Usage: Random selection during login/app loading
  // ============================================================
  breathingFacts: [
    "Průměrný člověk nadechne 20 000× denně. Kolik z toho je vědomě?",
    "Správný dech může snížit stres až o 40% během 2 minut.",
    "Lenochod dýchá 6× za minutu. My 12-20×. Koho bys rád napodobil?",
    "Tvůj dech ovlivňuje tepovou frekvenci během 30 sekund.",
    "Nejdelší zadržení dechu: 24 minut. Ale 5 sekund ti změní den.",
    "Nosní dýchání zvyšuje příjem kyslíku o 10-15% oproti ústům.",
    "Japonci mají slovo 'Kokyu' - doslovně 'spolupráce dechu s tělem'.",
    "Dech je jediná autonomní funkce těla, kterou můžeš vědomě řídit.",
    "4-7-8 dech ti pomůže usnout do 2 minut. Zkusíš to dnes?",
    "Hlubší dech aktivuje parasympatikus - tvůj přirozený zklidňovač.",
    "Navy SEALs používají 'Box breathing' před misemi. Funguje i v běžném životě.",
    "Výdech by měl být 2× delší než nádech pro maximální relaxaci.",
    "Dýchání ovlivňuje pH krve. Tělo je chemická laboratoř.",
    "Freedivers dokážou snížit tep na 30 úderů/min jen dechem.",
    "Pranayama znamená 'řízení životní energie'. Všechno začíná dechem.",
  ],

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
    exerciseNotFound: "Tohle cvičení jsme nenašli",
    challengeLocked: "Tato výzva je zamčená. Splň nejdřív předchozí!",
    passwordResetFailed: "Nepodařilo se odeslat odkaz. Zkus to znovu",
    passwordUpdateFailed: "Nepodařilo se změnit heslo. Zkus to znovu",
    
    // OAuth chyby
    oauthFailed: "Nepodařilo se přihlásit. Zkus to znovu",
    oauthCancelled: "Přihlášení bylo zrušeno",
    oauthNotAvailable: "Tato možnost bude brzy dostupná",
    
    // ✅ NEW: OAuth-specific errors (account type mismatch)
    oauthAccountExists: "Tento e-mail používá přihlášení přes Google. Klikni na ikonu Google níže.",
    emailNotConfirmed: "E-mail nebyl potvrzen. Zkontroluj svou schránku a klikni na odkaz.",
    
    // ✅ NEW: Generic fallback (when we don't know the specific error)
    unknownAuthError: "Něco se pokazilo. Zkus to prosím znovu.",
    
    // Supabase rate limiting & security
    rateLimitEmail: "Z bezpečnostních důvodů můžeš poslat další email až za 60 sekund.",
    tooManyRequests: "Příliš mnoho pokusů. Zkus to za chvilku",
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
    noProgress: "Tvůj první nádech čeká. Začni své cvičení!",
    noNotifications: "Žádné nové zprávy. Dýchej v klidu!",
    noSearchResults: "Nic jsme nenašli. Zkus jiná slova",
    noFavorites: "Ještě nemáš oblíbená cvičení. Přidej si je!",
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
    continueWithEmail: "Poslat odkaz →",
    startChallenge: "Začít výzvu →",
    continue: "Pokračovat →",
    startExercise: "Začít cvičení →",
    sendResetLink: "Poslat odkaz →",
    setPassword: "Nastavit heslo →",
    createAccount: "Vytvořit účet zdarma →",
    
    // OAuth Buttons
    continueWithGoogle: "Pokračovat s Google",
    continueWithApple: "Pokračovat s Apple",
    continueWithFacebook: "Pokračovat s Facebook",
    
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
    exercises: "Cvičení",
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
    registerTitle: "Registruj se zdarma",
    forgotPasswordTitle: "Zapomenuté heslo?",
    resetPasswordTitle: "Nastav si nové heslo",
    passwordResetSuccessTitle: "Heslo změněno",
    
    // Subtitles
    loginSubtitle: "Přihlaš se a dýchej s námi",
    registerSubtitle: "Registrační odkaz ti pošleme na e-mail",
    forgotPasswordSubtitle: "Zadej svůj email a pošleme ti další instrukce",
    resetPasswordSubtitle: "Vyber si silné heslo pro svůj účet",
    
    // Footer links
    noAccount: "Nemáš účet?",
    alreadyHaveAccount: "Už máš účet?",
    knowPassword: "Už víš heslo?",
    
    // Email sent messages (Apple "Méně je více" - ultra minimal)
    emailSentTitle: "E-mail poslán",
    emailSentInstruction: "Dýchej s námi.",
    
    // OAuth divider (imperativ per Tone of Voice)
    oauthDivider: "nebo pokračuj s",
    
    // GDPR Notice (implicit consent - informational only)
    gdprNotice: "Registrací souhlasíš s GDPR a obchodními podmínkami včetně používání souborů Cookie.",
  },

  // ============================================================
  // 🏠 HEADER MESSAGES
  // Landing page header CTAs (authenticated vs. unauthenticated)
  // ============================================================
  header: {
    // Authenticated user CTAs
    authenticatedPrimaryCTA: "Dýchej s námi →",
    authenticatedProfileFallback: "Profil",  // Fallback if no vocative_name
    
    // Unauthenticated CTAs
    loginCTA: "Přihlásit",
    registerCTA: "Začít zdarma",
  },

  // ============================================================
  // 🌐 LANDING PAGE MESSAGES
  // Public-facing marketing copy (Czech market 2026)
  // Science-first positioning, minimal "dechový vibe"
  // ============================================================
  landing: {
    // Hero section
    hero: {
      headline: "První česká aplikace pro funkční dýchání",
      subheadline: "Měř svůj pokrok. Cvič s certifikovaným instruktorem. Viditelné výsledky za 21 dní.",
      ctaPrimary: "Začít zdarma →",
      ctaSubtext: "",
    },

    // ✅ NOVÉ: Authenticated user CTAs (when user is logged in on landing page)
    authenticatedCTA: {
      heroPrimary: "Vrať se do appky →",
      heroSubtext: "",
      finalPrimary: "Vrať se do appky →",
      finalSubtext: "",
    },

    // Trust signals
    trust: {
      users: "1150+ dýchačů",
      exercises: "100+ cvičení",
      certified: "Certifikováno",
      pricing: "Od 0 Kč",
    },

    // Science section
    science: {
      title: "Proč dýchání mění vše",
      intro: "95% populace dýchá suboptimálně. To ovlivňuje spánek, energii i odolnost vůči stresu.",
      linkText: "Přečti si vědecké pozadí →",
    },

    // How it works section
    howItWorks: {
      title: "Jak DechBar funguje",
    },

    // Trust section
    trustSection: {
      title: "Co říkají odborníci",
    },

    // Final CTA section
    finalCTA: {
      headline: "Připravený na první nádech?",
      faqTitle: "Často kladené otázky",
    },

    // Footer
    footer: {
      slogan: "Tvůj dechový průvodce v kapse.",
      madeIn: "🇨🇿 Vytvořeno v České republice",
      copyright: "© 2026 DechBar | Certifikováno odborníky",
    },
  },
} as const;

// Type for autocomplete
export type MessageKeys = typeof MESSAGES;

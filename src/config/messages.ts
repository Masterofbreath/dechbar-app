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

  // ============================================================
  // 🎯 CHALLENGE LANDING PAGE (/vyzva)
  // Březnová Dechová Výzva 2026 - Ultra-minimalistická LP
  // Apple Premium style: Méně je více, sebevědomá jednoduchost
  // Tone: Tykání, imperativ, krátké věty, BEZ emoji
  // ============================================================
  challenge: {
    // Email submission responses
    emailSubmitSuccess: "Super! Jsi registrovaný. Očekávej email 21.2.",
    emailDuplicate: "Tento email už je registrovaný. Očekávej náš email.",
    emailInvalid: "Ups! Tenhle email s námi nedýchá. Zkontroluj ho, prosím",
    
    // Hero section
    hero: {
      headline: "Největší 21denní dechová výzva roku 2026",
      subtitle: "Ráno dělá den. Začni ten svůj funkčně. Stačí 7 minut a sluchátka.",
      cta: "Registruj se zdarma →",
      bonus: "BONUS: SMART tarif zdarma na 21 dní",
      bonusValue: "(Hodnota 249 Kč)",
      timeline: "VÝZVA STARTUJE 1. BŘEZNA 2026",
      emailPlaceholder: "tvuj@email.cz",
      // Trust signals (below CTA)
      trustSignals: {
        free: "Zcela zdarma",
        participants: "850+ lidí dýchalo v 2025",
        simple: "2 kliky ke spuštění"
      }
    },
    
    // 3 Reasons section
    reasons: {
      title: "", // No title (Apple Premium style)
      reason1: {
        headline: "Funkční probuzení",
        text: "7 minut a jedeš.",
      },
      reason2: {
        headline: "Pustíš a dýcháš",
        text: "Dva kliky. To je celé.",
      },
      reason3: {
        headline: "Funguje i offline",
        text: "Stáhneš a dýcháš kdykoli.",
      },
    },
    
    // Timeline section
    timeline: {
      title: "Co tě čeká",
      breakingText: "Změň své ráno. Změní se ti den.",
      now: "TEĎ",
      nowAction: "Registruj se. Potvrď e-mail.",
      registration: "26. ÚNORA",
      registrationAction: "Spouštíme appku. Otestuj ji.",
      start: "1. BŘEZNA",
      startAction: "Výzva startuje.",
    },
    
    // FAQ section
    faq: {
      title: "Časté otázky",
      questions: [
        {
          question: "Je to opravdu zdarma?",
          answer: "Ano. Celá výzva je zdarma. Žádné skryté poplatky."
        },
        {
          question: "Zvládnu výzvu i když nemám žádné zkušenosti?",
          answer: "Ano. Výzva je dělaná pro nováčky i profíky."
        },
        {
          question: "Co když nestihnu ráno?",
          answer: "Audio je dostupné celý den. Dýchej, kdy se ti to hodí."
        },
        {
          question: "Co když vynechám den?",
          answer: "Nic se neděje. Pokračuj druhý den. Nejde o perfekci."
        },
        {
          question: "Jak výzva bude probíhat?",
          answer: "Každé ráno klikneš na 'Dnešní dechpresso' a dýcháš. 7 minut. Jednoduché a praktické."
        },
        {
          question: "Můžu to zkusit předem?",
          answer: "21.2. pošleme všem registrovaným ochutnávku do mailu. Pak se rozhodneš."
        }
      ]
    },
    
    // Final CTA section
    final: {
      headline: "Změň své ráno za 21 dní.",
      cta: "Chci začít →",
      subtext: "Zdarma. 7 minut denně.",
    },
  },

  // ============================================================
  // 🎵 DIGITÁLNÍ TICHO LANDING PAGE (/digitalni-ticho)
  // Audio program strukturovaného klidu - 21denní REŽIM
  // Tone: Tykání, imperativ, krátké věty, BEZ emoji (Apple Premium)
  // Cena: 990 Kč (předprodej) → 1290 Kč (po startu 1.3.2026)
  // ============================================================
  digitalniTicho: {
    // Hero section (V3 FINAL - Umění odpočinku positioning)
    hero: {
      headline: "Vypni hluk. Zapni sebe.",
      subheadline: "15 minut denně – regulace nervového systému, která funguje.",
      description: [
        "Cítíš se přehlcený a mysl i tělo potřebují reset? Program REŽIM tě naučí odpočívat v době, kdy to nejvíce potřebuješ.",
        "Žádná meditace – čistá neurověda. Stačí ti 15 minut, sluchátka a chuť cítit se lépe."
      ],
      badge: "21 audio tréninků × 15 min",
      cta: "Odemkni program →",
      audioSampleLabel: "Poslechni si ukázku prvního dne →",
      videoNote: "5 minut o tom, proč umění odpočinku změní tvůj den",
      trustBar: {
        start: "Start 1. 3. 2026",
        duration: "21 tréninků × 15 min",
        lifetime: "Přístup navždy",
        guarantee: "7denní garance vrácení",
        stripe: "Bezpečná platba Stripe",
        members: "1000+ členů DechBaru"
      }
    },
    
    // Storytelling section (V3 FINAL - Extended use cases + neurověda)
    story: {
      pain: {
        headline: "Poznáváš to?",
        paragraphs: [
          "Je 8 ráno. Máš před sebou náročný den - schůzky, e-maily, úkoly. Hlava ti vrčí ještě ze včerejška.",
          "Potřebuješ trénink odpočinku. Ne kávu. Ne motivaci. Opravdový RESET systému."
        ]
      },
      solution: {
        headline: "Program REŽIM",
        paragraphs: [
          "Mezi schůzkami, před poradou, o polední pauze - kdykoli. Nasadíš sluchátka, pustíš a dýcháš.",
          "15 minut tréninku odpočinku. Jasné instrukce regulující nervový systém."
        ]
      },
      transformation: {
        headline: "Co se stane?",
        paragraphs: [
          "Ve 3. minutě cítíš jak se dech prohlubuje. V 10. minutě je hlava čistá.",
          "A po 15 minutách? Klid v těle. Jasno v hlavě.",
          "Program REŽIM učí umění odpočinku v době, kdy je to nejvíce potřeba."
        ]
      }
    },
    
    // Highlights section (V3 - Program struktura místo benefitů)
    highlights: {
      title: "", // No title (Apple Premium style - clean)
      items: [
        { 
          headline: "Od Příběhu k Tichu",
          text: "3 týdny. 3 fáze. Postupné prohlubování od stimulu k vlastnímu prostoru."
        },
        {
          headline: "Každý den jinak",
          text: "21 unikátních audio nahrávek. Žádné opakování. Každý den tě posune dál."
        },
        {
          headline: "Doživotně tvoje",
          text: "Jedna platba. Přístup navždy. Můžeš pustit offline kdekoli a kdykoli."
        }
      ]
    },
    
    // Audio preview section (V3 - Single preview, no subtitle)
    audioPreview: {
      title: "Poslechni si první den zdarma"
    },
    
    // Pro koho to je / není
    pro: {
      title: "Pro koho je program REŽIM?",
      subtitle: "",
      forTitle: "Program je pro tebe, pokud…",
      forItems: [
        "Chceš vyčistit mysl od přebytečného informačního šumu",
        "Hledáš funkční reset – mezi schůzkami, před náročným úkolem nebo na konci dne",
        "Chceš se naučit vědomě regulovat nervový systém a cítit se klidněji",
        "Stačí ti 15 minut denně a chceš z toho reálný výsledek",
        "Vnímáš, že jsi zapomněl/a, jaké to je být skutečně v klidu"
      ],
      notForTitle: "Program není pro tebe, pokud…",
      notForItems: [
        "Nechceš pracovat na svém klidu ani soustředěnosti",
        "Hledáš motivační obsah, který tě bude povzbuzovat a chválit",
        "Preferuješ zábavu, body a odměny místo skutečné práce na sobě",
        "Chceš dál číst teorie a stahovat PDFka místo skutečné praxe",
        "Volíš poslouchat další podcast místo toho, abys začal"
      ]
    },
    
    // Timeline (V3 FINAL - Regulace nervového systému emphasis)
    timeline: {
      title: "Jak to funguje",
      phases: [
        {
          title: "Týden 1: Příběh",
          days: "Den 1-7",
          description: "Nervový systém se začíná uklidňovat. Vedu tě hlasem, příběhem a rytmem dechu."
        },
        {
          title: "Týden 2: Vedení",
          days: "Den 8-14",
          description: "Jdeme hlouběji. Příběh ustupuje a regulace nervového systému se prohlubuje."
        },
        {
          title: "Týden 3: Ticho",
          days: "Den 15-21",
          description: "Prostor pro tebe. Ticho, které funguje. Pozornost bez námahy."
        }
      ],
      note: ""
    },
    
    // Sound Identity (detail pro melancholiky)
    soundIdentity: {
      title: "Sound Identity",
      subtitle: "Pro ty, kdo chtějí vědět, co poslouchají",
      architectureTitle: "Architektura nahrávky",
      architecture: [
        { phase: "Brand Intro Sting", duration: "6-9s", bpm: "-" },
        { phase: "Počátek", duration: "5-6 min", bpm: "58-60" },
        { phase: "Hluboká práce", duration: "5-6 min", bpm: "52-55" },
        { phase: "Doznění", duration: "4-5 min", bpm: "56-58" },
        { phase: "Brand Outro Sting", duration: "6-9s", bpm: "-" }
      ],
      elementsTitle: "Zvukové elementy",
      allowedTitle: "Povolené prvky",
      allowed: [
        "Analogové synth pads (teplé, pomalé)",
        "Sub sine pulse (jemný, strukturální)",
        "Sub drone (stabilní základ)",
        "Granulární mikro-textura (pomalu se mění)",
        "Airy shimmer (vysoké spektrum, jemně)"
      ],
      forbiddenTitle: "Zakázané prvky",
      forbidden: [
        "Vokály / slova",
        "Výrazná melodie",
        "Piano jako default nástroj",
        "Perkusní beat (kick/snare/hat)",
        "Kapky vody, ptáci, les (spa klišé)"
      ]
    },
    
    // Dech block (optional)
    dech: {
      title: "Dechové módy",
      subtitle: "Doporučené způsoby dýchání (ne povinnost)",
      modes: [
        {
          name: "Tichý nos",
          description: "Pomalý nádech nosem, pomalý výdech nosem. Minimální pohyb hrudníku."
        },
        {
          name: "Dlouhý výdech",
          description: "Nádech 4s, výdech 8s. Aktivuje parasympatikus (zklidnění)."
        },
        {
          name: "Box breathing",
          description: "Nádech 4s, zadrž 4s, výdech 4s, zadrž 4s. Navy SEALs technika."
        }
      ],
      note: "Opřeno o HRV research a stress regulation meta-analýzy."
    },
    
    // Pricing section (V3 FINAL - Product name title, lifetime first)
    pricing: {
      price: "990 Kč",
      perDay: "47 Kč/den",
      coffeeNote: "(Méně než ranní káva)",
      title: "Digitální ticho",
      subtitle: "Zajisti si místo. Program startuje 1. 3. 2026.",
      badge: "PŘEDPRODEJ",
      featuresTitle: "Co dostaneš",
      features: [
        "Plný přístup – jedna platba, žádné předplatné",
        "21 unikátních audio tréninků (každé 15 min)",
        "Jasné vedení hlasem – vždy víš, co dělat",
        "Funguje offline – stáhneš a posloucháš kdekoli",
        "7denní garance vrácení peněz"
      ],
      cta: "Koupit za 990 Kč →",
      stats: [
        { value: "21", label: "tréninků" },
        { value: "315", label: "minut obsahu" },
        { value: "47 Kč", label: "za den" }
      ]
    },
    
    // Social proof (V2 - Zkušební vlna testimonials)
    socialProof: {
      title: "Co říkají lidé",
      subtitle: "Zpětná vazba ze zkušební vlny",
      quotes: [
        {
          text: "První den jsem byla skeptická. Čtvrtý den jsem to poslouchala dvakrát. Teď to pouštím každé ráno a je to můj rituál.",
          author: "Petra, 34",
          role: "Podnikatelka"
        },
        {
          text: "Nečekal jsem, že audio bez hlasu může něco udělat. Ale po týdnu jsem si všiml, že se mi líp dýchá. A hlava je klidnější.",
          author: "Martin, 42",
          role: "Freelancer"
        },
        {
          text: "Pustila jsem to poprvé mezi schůzkami. 15 minut. A pak jsem šla na call úplně jinak. V klidu. Tohle je game changer.",
          author: "Jana, 38",
          role: "Manažerka"
        },
        {
          text: "Myslela jsem, že potřebuju další kurz. Nepotřebovala. Stačilo tohle. Každý den 15 minut a cítím rozdíl.",
          author: "Lucie, 29",
          role: "Maminka"
        },
        {
          text: "Pouštím si to i v práci, když je toho na mě moc. Sluchátka, 15 minut a jsem zpátky. Lepší než přestávka na kafe.",
          author: "Tomáš, 45",
          role: "IT manager"
        },
      {
        text: "Nečekala jsem, že to bude mít takový dopad. Po týdnu cítím, jak se mi líp dýchá. A hlava? Čistší. Používám to denně.",
        author: "Kateřina, 31",
        role: "Grafička"
      }
      ]
    },
    
    // FAQ section (V3 FINAL - Neurověda + 2026 přestimulování positioning)
    faq: {
      title: "Časté otázky",
      questions: [
        {
          question: "Bude to fungovat i na mě?",
          answer: [
            "Neslibujeme zázrak, ale vyčištění hlavy a regulaci nervového systému.",
            "Toto je fyziologie a neurověda. Otestuj a poznej na vlastní kůži. Navíc máš 7denní garanci vrácení peněz – bez otázek."
          ]
        },
        {
          question: "Je to meditace?",
          answer: [
            "Ne. V meditaci člověk spočívá v tichu uvnitř sebe, v prostém bytí.",
            "Trénink odpočinku je jiný – cíleně regulujeme nervový systém, uvolňujeme napětí v těle a čistíme mysl od přebytečného informačního šumu. Neurověda, ne spiritualita.",
            "Na konci tě to může dostat do podobného stavu – ale cestu volíme jinou."
          ]
        },
        {
          question: "Co když nemám zkušenosti?",
          answer: "Nepotřebuješ žádnou praxi. Nasadíš sluchátka, pustíš a dýcháš dle instrukcí. Vše ostatní se děje samo."
        },
        {
          question: "Proč bych do programu měl jít?",
          answer: [
            "Protože tvůj nervový systém je v roce 2026 každý den přestimulovaný. Konstantní hluk a digitální rozptýlení. Notifikace, pracovní tlak, ekonomické nároky.",
            "Program REŽIM učí moderního člověka umění odpočinku. Dovednost, kterou využiješ každý den."
          ]
        },
        {
          question: "Je platba bezpečná?",
          answer: "Platební data jsou kvalitně zabezpečena a šifrována přes Stripe. Navíc máš 7denní garanci vrácení peněz při nespokojenosti."
        },
        {
          question: "Co dostanu a kdy?",
          answer: [
            "Kupuješ vstup do programu REŽIM – Digitální ticho.",
            "Program startuje 1. 3. 2026. V den startu dostaneš přístupy ke všem 21 tréninkům a můžeš okamžitě začít odpočinek trénovat."
          ]
        }
      ]
    },
    
    // Final CTA section (V3 FINAL)
    finalCTA: {
      headline: "Chceš se naučit umění odpočinku?",
      subtext: "Předprodej • Start 1. 3. 2026 • 7denní garance vrácení",
      cta: "Ano, chci začít →"
    },
    
    // Footer (V3 - Trénink odpočinku tagline)
    footer: {
      tagline: "Trénink odpočinku pro moderní člověka.",
      copyright: "© 2026 DechBar"
    },
    
    // Thank You Page (po nákupu)
    thankYou: {
      title: "Děkujeme!",
      subtitle: "Tvoje místo v Digitálním tichu je zajištěno.",
      emailTitle: "Co dál?",
      emailText: "Za chvíli ti přijde potvrzovací e-mail s detaily.",
      startTitle: "Kdy to začne?",
      startText: "Program startuje 1.3.2026. V den startu dostaneš přístup.",
      preparationTitle: "Příprava",
      preparationItems: [
        "Připrav si sluchátka (doporučujeme přes-the-ear)",
        "Najdi si tiché místo (15 min bez rušení)",
        "Hlasitost drž níž (ambient má fungovat v pozadí)"
      ],
      ctaDashboard: "Zpět na DechBar →"
    },

    // Author / Founder story section
    // Placement: between Timeline and Pricing (authority bridge)
    author: {
      headline: "Proč jsem program REŽIM vytvořil",
      paragraphs: [
        "Minulý rok byl pro mě extrémně náročný. Práce, podnikání, finance, rodina. V říjnu jsem pil tři kávy denně a chodil spát pozdě v noci. Hledal jsem způsob, jak z toho ven. A pak mi to došlo — moderní člověk neumí odpočívat. Skutečně odpočívat. Jdeme do wellness, do parku — ale furt v ruce mobil, v uších sluchátka. Umět se zastavit a jen být? To nás nikdo neučil.",
        "Proto vznikl program REŽIM. Jako certifikovaný instruktor funkčního dýchání (Oxygen Advantage) jsem za poslední rok vytvořil přes 150 audio nahrávek a provedl stovky lidí na festivalech, ve firmách i v osobním mentoringu. Program REŽIM jsem vytvořil jako první pro sebe. Funguje. A teď ho dávám tobě. Věřím, že 15 minut tréninku odpočinku denně je v roce 2026 jedna z nejcennějších dovedností, kterou si můžeš dopřát."
      ],
      name: "Jakub",
      title: "Instruktor funkčního dýchání · Zakladatel DechBar",
      photoAlt: "Jakub — instruktor funkčního dýchání a zakladatel DechBar",
      credentials: [
        { value: "150+", label: "audio nahrávek" },
        { value: "1000+", label: "členů DechBaru" },
        { value: "3+ roky", label: "praxe s lidmi" }
      ]
    }
  },
} as const;

// Type for autocomplete
export type MessageKeys = typeof MESSAGES;

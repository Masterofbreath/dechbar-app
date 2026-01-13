# 📚 Message Library - DechBar App

**Version:** 1.0  
**Last Updated:** 2026-01-10  
**Status:** ✅ Active Reference  
**For:** All AI Agents, Developers, Copywriters

---

## 📋 TABLE OF CONTENTS

1. [Přehled](#přehled)
2. [Jak používat](#jak-používat)
3. [Success Messages](#success-messages)
4. [Loading States](#loading-states)
5. [Error Messages](#error-messages)
6. [Empty States](#empty-states)
7. [Hints & Helpers](#hints--helpers)
8. [Button Labels](#button-labels)
9. [Navigation](#navigation)
10. [Form Labels](#form-labels)
11. [Jak přidat novou zprávu](#jak-přidat-novou-zprávu)

---

## 🎯 PŘEHLED

Tento dokument obsahuje **VŠECHNY UI texty** používané v DechBar App.

**Proč centralizace?**
- ✅ Jedna source of truth
- ✅ Konzistence tone of voice
- ✅ Snadná změna textů bez prohledávání kódu
- ✅ Ready pro i18n (CZ/EN)
- ✅ A/B testing zpráv (později)

**Kde jsou implementované?**  
👉 `src/config/messages.ts`

**Pravidla tone of voice:**  
👉 `docs/design-system/TONE_OF_VOICE.md`

---

## 🔧 JAK POUŽÍVAT

### Import v komponentě:

```typescript
import { MESSAGES } from '@/config/messages';

// Použití:
<p className="success">{MESSAGES.success.registration}</p>
<Button>{MESSAGES.buttons.login}</Button>
<span className="error">{MESSAGES.error.invalidEmail}</span>
```

### Pravidla:
1. **NIKDY** nepiš UI texty přímo do JSX
2. **VŽDY** odkazuj na `MESSAGES.*`
3. Pokud zpráva neexistuje → přidej ji do `messages.ts` + sem do dokumentace

---

## 🎉 SUCCESS MESSAGES

Zobrazují se po **úspěšném dokončení akce**.

**Tone:** Celebrační + Dechový vibe (30-50%)  
**Emoji:** Ano (1 na začátku, optional)

| Key | Text | Kdy použít |
|-----|------|-----------|
| `success.registration` | "Super! Tvůj účet je vytvořený. Ať to dýchá!" | Po úspěšné registraci |
| `success.login` | "Vítej zpátky! Dej si nádech a pokračuj." | Po úspěšném přihlášení |
| `success.profileUpdate` | "Hotovo! Tvůj profil dýchá novotou." | Po uložení profilu |
| `success.passwordChanged` | "Heslo změněno! Dýchej v klidu." | Po změně hesla |
| `success.emailVerified` | "Email ověřen! Jsi oficiálně součástí DechBaru." | Po ověření emailu |
| `success.exerciseComplete` | "Parádní práce! Máš dodýcháno." | Po dokončení cvičení |
| `success.challengeComplete` | "Bomba! Nadechl ses k úspěchu" | Po splnění výzvy |
| `success.goalAchieved` | "Hurá! Rozdýchal jsi svůj cíl!" | Po dosažení cíle |
| `success.dataSaved` | "Uloženo! Všechno dýchá, jak má." | Po uložení dat |
| `success.settingsUpdated` | "Nastavení uloženo. Dýchej dál!" | Po změně nastavení |

---

## ⏳ LOADING STATES

Zobrazují se během **načítání/zpracování**.

**Tone:** Uklidňující + Dechový vibe (100%)  
**Emoji:** Ne

| Key | Text | Kdy použít |
|-----|------|-----------|
| `loading.default` | "Dej si pár nádechů a výdechů, protože za moment pokračujeme..." | Obecné načítání |
| `loading.saving` | "Dej nám chvilku, jen něco rozdýcháváme..." | Ukládání dat |
| `loading.processing` | "Chvilku strpení, nádech, výdech..." | Zpracování dat |
| `loading.login` | "Přihlašujeme tě, nádech..." | Během přihlášení |
| `loading.registering` | "Vytváříme tvůj účet, výdech..." | Během registrace |
| `loading.loadingExercise` | "Připravujeme tvoje dechování..." | Načítání cvičení |

---

## 🚫 ERROR MESSAGES

Zobrazují se při **chybě/validaci**.

**Tone:** Friendly + Dechový vibe (kde to dává smysl)  
**Emoji:** Ne (clarity first)

### Validační chyby (formuláře)

| Key | Text | Kdy použít |
|-----|------|-----------|
| `error.requiredFields` | "Vyplň prosím všechna pole" | Prázdná required pole |
| `error.invalidEmail` | "Ups! Tenhle email s námi nedýchá. Zkontroluj ho, prosím" | Nevalidní email |
| `error.passwordTooShort` | "Heslo musí mít alespoň 6 znaků" | Heslo < 6 znaků |
| `error.passwordMismatch` | "Hesla nedýchají v rytmu. Zkus to znovu" | Hesla se neshodují |
| `error.emailExists` | "Tento email už s námi dýchá. Chceš se přihlásit?" | Email již registrován |
| `error.invalidCredentials` | "Email nebo heslo nesedí. Zkus to znovu" | Špatné přihlášení |

### Backend/Network chyby

| Key | Text | Kdy použít |
|-----|------|-----------|
| `error.loginFailed` | "Hm, nerozdýchali jsme to. Zkus to znovu" | Obecná chyba přihlášení |
| `error.registrationFailed` | "Nepodařilo se vytvořit účet. Zkus to prosím znovu" | Chyba registrace |
| `error.networkError` | "Ztratili jsme dech internetu. Zkontroluj připojení." | Chyba sítě |
| `error.serverError` | "Něco se pokazilo na naší straně. Zkus to za chvilku" | 500 error |
| `error.notFound` | "Toto jsme nenašli. Zkus něco jiného" | 404 error |
| `error.unauthorized` | "K tomuto nemáš přístup. Přihlaš se prosím" | 401/403 error |
| `error.sessionExpired` | "Tvoje session vypršela. Přihlaš se znovu" | Session timeout |

### Feature-specific chyby

| Key | Text | Kdy použít |
|-----|------|-----------|
| `error.uploadFailed` | "Nepodařilo se nahrát soubor. Zkus to znovu" | Upload error |
| `error.exerciseNotFound` | "Tohle dechování jsme nenašli" | Cvičení nenalezeno |
| `error.challengeLocked` | "Tato výzva je zamčená. Splň nejdřív předchozí!" | Locked challenge |

---

## 📭 EMPTY STATES

Zobrazují se při **prázdném stavu** (no data).

**Tone:** Motivační + Dechový vibe (100%)  
**Emoji:** Ne

| Key | Text | Kdy použít |
|-----|------|-----------|
| `empty.noChallenges` | "Zatím je tu ticho bez dechu. Začni svou první výzvu!" | Žádné výzvy |
| `empty.noHistory` | "Tvoje cesta právě začíná. Nádechni se k prvnímu kroku!" | Prázdná historie |
| `empty.noExercises` | "Ještě jsi nerozdýchal žádnou výzvu. Začni teď!" | Žádná cvičení |
| `empty.noProgress` | "Tvůj první nádech čeká. Začni své dechování!" | Žádný progress |
| `empty.noNotifications` | "Žádné nové zprávy. Dýchej v klidu!" | Prázdné notifikace |
| `empty.noSearchResults` | "Nic jsme nenašli. Zkus jiná slova" | Prázdné výsledky hledání |
| `empty.noFavorites` | "Ještě nemáš oblíbená dechování. Přidej si je!" | Prázdné oblíbené |

---

## 💡 HINTS & HELPERS

Zobrazují se jako **nápověda pod inputy**.

**Tone:** Helpful + Neutrální (bez dechový vibe)  
**Emoji:** Ne

| Key | Text | Kdy použít |
|-----|------|-----------|
| `hints.emailHelper` | "Použij tvůj registrační email" | Pod emailem v Forgot Password |
| `hints.passwordStrength` | "Doporučujeme použít čísla a speciální znaky" | Pod heslem při registraci |
| `hints.nicknameHelper` | "Jak tě máme oslovovat?" | Pod přezdívkou v registraci |
| `hints.optional` | "(nepovinné)" | U nepovinných polí |
| `hints.required` | "Všechna pole jsou povinná" | U formulářů |

---

## 🔘 BUTTON LABELS

**Primary CTA** (s šipkou →) vs. **Secondary actions** (bez šipky)

### Primary CTA

| Key | Text | Kdy použít |
|-----|------|-----------|
| `buttons.login` | "Přihlásit se →" | Hlavní login button |
| `buttons.register` | "Registruj se zdarma →" | Hlavní registration button |
| `buttons.startChallenge` | "Začít výzvu →" | Start challenge CTA |
| `buttons.continue` | "Pokračovat →" | Forward progress |
| `buttons.startExercise` | "Začít dechování →" | Start exercise CTA |
| `buttons.sendResetLink` | "Poslat odkaz →" | Forgot password submit |
| `buttons.setPassword` | "Nastavit heslo →" | Reset password submit |
| `buttons.createAccount` | "Vytvořit účet zdarma →" | Alt. registrace |

### Secondary Actions

| Key | Text | Kdy použít |
|-----|------|-----------|
| `buttons.save` | "Uložit" | Save form |
| `buttons.cancel` | "Zrušit" | Cancel action |
| `buttons.close` | "Zavřít" | Close modal |
| `buttons.back` | "← Zpět" | Go back (s šipkou vlevo) |
| `buttons.edit` | "Upravit" | Edit mode |
| `buttons.delete` | "Smazat" | Delete action |
| `buttons.confirm` | "Potvrdit" | Confirm dialog |

### Loading States (buttons)

| Key | Text | Kdy použít |
|-----|------|-----------|
| `buttons.loading.login` | "Přihlašuji..." | Login button loading |
| `buttons.loading.register` | "Vytvářím účet..." | Register button loading |
| `buttons.loading.saving` | "Ukládám..." | Save button loading |
| `buttons.loading.sending` | "Odesílám..." | Send button loading |

---

## 🧭 NAVIGATION

Menu položky, sekce, stránky.

**Tone:** Neutrální (bez dechový vibe)  
**Emoji:** Ne

| Key | Text | Kdy použít |
|-----|------|-----------|
| `nav.dashboard` | "Dashboard" | Hlavní přehled |
| `nav.challenges` | "Výzvy" | Challenges sekce |
| `nav.exercises` | "Dechování" | Exercises sekce |
| `nav.progress` | "Tvůj pokrok" | Progress tracking |
| `nav.settings` | "Nastavení" | Settings page |
| `nav.profile` | "Profil" | User profile |
| `nav.logout` | "Odhlásit se" | Logout link |
| `nav.help` | "Pomoc" | Help/Support |
| `nav.community` | "Komunita" | Community section |

---

## 📝 FORM LABELS

Input labels, checkboxy, selecty.

**Tone:** Neutrální, stručný (bez dechový vibe)  
**Emoji:** Ne

| Key | Text | Kdy použít |
|-----|------|-----------|
| `form.email` | "Email" | Email input label |
| `form.password` | "Heslo" | Password input label |
| `form.passwordConfirm` | "Potvrzení hesla" | Confirm password label |
| `form.nickname` | "Přezdívka" | Nickname input label |
| `form.fullName` | "Celé jméno" | Full name input (pokud použijeme) |
| `form.dateOfBirth` | "Datum narození" | DOB input label |
| `form.rememberMe` | "Zapamatovat si mě" | Remember me checkbox |
| `form.gdprConsent` | "Souhlasím s GDPR a obchodními podmínkami" | GDPR checkbox (s odkazy) |

### Placeholders

| Key | Text | Kdy použít |
|-----|------|-----------|
| `form.placeholders.email` | "tvuj@email.cz" | Email input placeholder |
| `form.placeholders.password` | "Minimálně 6 znaků" | Password placeholder |
| `form.placeholders.passwordConfirm` | "Zadej heslo znovu" | Confirm password placeholder |
| `form.placeholders.nickname` | Dynamic (rotating names) | Nickname placeholder (special) |

---

## ➕ JAK PŘIDAT NOVOU ZPRÁVU

### Postup:

1. **Přidej text do `src/config/messages.ts`:**
   ```typescript
   export const MESSAGES = {
     success: {
       newFeature: "Tvůj nový text zde!", // ← PŘIDEJ TENTO ŘÁDEK
     },
   };
   ```

2. **Přidej dokumentaci sem (`MESSAGE_LIBRARY.md`):**
   - Do příslušné sekce (success, error, loading...)
   - S popisem "Kdy použít"

3. **Zkontroluj tone of voice:**
   - [ ] Tykání ✅
   - [ ] Imperativ (pokud CTA) ✅
   - [ ] Dechový vibe (30-50% zpráv) ✅
   - [ ] Emoji (pouze success, 0-50%) ✅

4. **Použij v komponentě:**
   ```typescript
   import { MESSAGES } from '@/config/messages';
   <p>{MESSAGES.success.newFeature}</p>
   ```

---

## 📊 STATISTIKY (aktuální stav)

| Kategorie | Počet zpráv | Dechový vibe % |
|-----------|-------------|----------------|
| Success Messages | 10 | 90% |
| Loading States | 6 | 100% |
| Error Messages | 15 | 40% |
| Empty States | 7 | 100% |
| Hints & Helpers | 5 | 0% |
| Button Labels | 16 | 0% |
| Navigation | 9 | 0% |
| Form Labels | 11 | 0% |
| **CELKEM** | **79** | **~35%** ✅ |

**Cíl:** 30-50% dechový vibe → **✅ Splněno!**

---

## 🔄 VERSION HISTORY

- **1.0** (2026-01-10): Initial library - 79 zpráv, 35% dechový vibe

---

## 📖 DALŠÍ ZDROJE

- **Tone of Voice:** `docs/design-system/TONE_OF_VOICE.md`
- **Implementation:** `src/config/messages.ts`
- **Component Guide:** `docs/development/AI_AGENT_COMPONENT_GUIDE.md`

---

✅ **Toto je živý dokument. Aktualizuj ho, když přidáš nové zprávy!**

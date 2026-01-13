# Tone of Voice - Imperativ + UX Polish - Implementation Log

**Datum:** 2026-01-10 (VLNA 2)  
**Autor:** AI Agent  
**Feature:** Přepnutí z infinitivu na imperativ + odstranění emoji + UX vylepšení

---

## 🎯 Cíl

Dokončit tone of voice refactoring: přepnout z **infinitivu/substantiva** na **imperativ** pro ještě přívětivější a action-oriented komunikaci.

**Kontext:**
- ✅ VLNA 1 (dříve): Vykání → Tykání ✅ HOTOVO
- ✅ VLNA 2 (teď): Infinitiv → Imperativ ✅ HOTOVO

---

## 💡 Proč imperativ?

### **Imperativ vs. Infinitiv:**

| **Aspekt** | **Infinitiv** ❌ | **Imperativ** ✅ |
|------------|------------------|------------------|
| **Příklad** | "Registrace zdarma" | "**Registruj se zdarma**" |
| **Tone** | Formální, pasivní | Friendly, aktivní |
| **User experience** | Navigace (kde?) | Call to action (udělej!) |
| **Benchmark** | Corporate weby | Instagram, YouTube, Netflix |
| **4 Temperaments** | 1/4 preferuje | 3/4 preferuje |

**Quote:**
> **"Nemáš účet? Registruj se zdarma"** = kamarád ti radí  
> **"Nemáš účet? Registrace zdarma"** = úřední nápis

---

## 📝 Změny v textech

### **1. LoginView** 🔓

| **Element** | **Před (infinitiv)** | **Po (imperativ)** |
|-------------|----------------------|-------------------|
| Footer link | "Nemáte účet? Registrujte se zdarma" | "Nemáš účet? **Registruj se zdarma**" |

**Soubor:** `src/components/auth/LoginView.tsx`

---

### **2. RegisterView** 📝

| **Element** | **Před (infinitiv)** | **Po (imperativ)** |
|-------------|----------------------|-------------------|
| Footer link | "Už máte účet? Přihlásit se" | "Už máš účet? **Přihlaš se**" |

**Soubor:** `src/components/auth/RegisterView.tsx`

---

### **3. ForgotPasswordView** 🔑

| **Element** | **Před** | **Po (imperativ + UX polish)** |
|-------------|----------|--------------------------------|
| **Title** | "Zapomenuté heslo? 🔐" | "Zapomenuté heslo?" (bez emoji) |
| **Subtitle** | "Zadejte svůj email a my vám pošleme odkaz" | "Zadej **svůj** email a my **ti** pošleme další instrukce" |
| **Helper text** | "Použij email, na který ses registroval" | "Použij **tvůj** registrační email" (stručnější) |
| **Footer** | "Vzpomněl sis? Přihlásit se" | "**Už víš heslo? Přihlaš se**" (genderově neutrální!) |

**Soubor:** `src/components/auth/ForgotPasswordView.tsx`

**🎯 UX vylepšení:**
- ✅ **Odstranění emoji 🔐** - čistší, profesionálnější vzhled
- ✅ **"Už víš heslo?"** místo "Vzpomněl/a sis?" - genderově neutrální, jednodušší
- ✅ **"další instrukce"** místo "odkaz" - jasnější očekávání

---

### **4. ResetPasswordPage** 🔒

| **Element** | **Před** | **Po (bez emoji)** |
|-------------|----------|-------------------|
| **Title** | "Nastav si nové heslo 🔐" | "Nastav si nové heslo" (bez emoji) |

**Soubor:** `src/pages/auth/ResetPasswordPage.tsx`

**🎯 UX vylepšení:**
- ✅ **Odstranění emoji 🔐** - konzistentní s ForgotPasswordView

---

## 📊 Statistiky změn

### **Celkem změn (VLNA 2):**

| **Soubor** | **Změn** | **Typ** |
|------------|----------|---------|
| `LoginView.tsx` | 1 | Footer text (imperativ) |
| `RegisterView.tsx` | 1 | Footer text (imperativ) |
| `ForgotPasswordView.tsx` | 4 | Title, subtitle, helper, footer |
| `ResetPasswordPage.tsx` | 1 | Title (odstranění emoji) |
| **CELKEM** | **7 změn** | **4 soubory** |

### **Kompletní refactoring (VLNA 1 + 2):**
- ✅ **Vykání → Tykání:** 13 změn
- ✅ **Infinitiv → Imperativ:** 7 změn
- **CELKEM:** **20 textových změn** napříč auth flow

---

## 🎨 Tone of Voice Guidelines (Final)

### **✅ Používáme (imperativ + tykání):**

**Footer links:**
```
"Nemáš účet? Registruj se zdarma"
"Už máš účet? Přihlaš se"
"Už víš heslo? Přihlaš se"
```

**Call to Action buttons:**
```
"Přihlásit se →"
"Vytvořit účet zdarma →"
"Odeslat odkaz →"
```

**Genderově neutrální formulace:**
```
✅ "Už víš heslo?"
❌ "Vzpomněl/a sis?"
```

---

### **❌ Nepoužíváme:**

**Infinitiv v CTA:**
```
❌ "Nemáš účet? Registrace zdarma"
❌ "Už víš heslo? Přihlásit se"
```

**Emoji v titles:**
```
❌ "Zapomenuté heslo? 🔐"
❌ "Nastav si nové heslo 🔐"
```
*Důvod:* Čistší, profesionálnější design pro wellness appku

---

## 🧪 Testování

### **Tested in Browser:**
- ✅ Chrome localhost:5173

### **Test Cases:**

#### **A) LoginView:**
- ✅ Footer: "Nemáš účet? **Registruj se zdarma**"

#### **B) RegisterView:**
- ✅ Footer: "Už máš účet? **Přihlaš se**"

#### **C) ForgotPasswordView:**
- ✅ Title: "Zapomenuté heslo?" (bez 🔐)
- ✅ Subtitle: "Zadej **svůj** email a my **ti** pošleme další instrukce"
- ✅ Helper: "Použij **tvůj** registrační email"
- ✅ Footer: "**Už víš heslo? Přihlaš se**"

#### **D) ResetPasswordPage:**
- ✅ Title: "Nastav si nové heslo" (bez 🔐)

---

## 📁 Upravené soubory

| Soubor | Změny | Počet |
|--------|-------|-------|
| `src/components/auth/LoginView.tsx` | Footer imperativ | 1 |
| `src/components/auth/RegisterView.tsx` | Footer imperativ | 1 |
| `src/components/auth/ForgotPasswordView.tsx` | Title, subtitle, helper, footer | 4 |
| `src/pages/auth/ResetPasswordPage.tsx` | Title (bez emoji) | 1 |

**Celkem:** 4 soubory, 7 změn

---

## 🎯 Výsledek

### **Před (VLNA 2):**
- ⚠️ Mix infinitivu a imperativu
- ⚠️ Emoji v titles (🔐)
- ⚠️ Delší formulace ("Použij email, na který ses registroval")
- ⚠️ Genderově závislé ("Vzpomněl sis?")

### **Po (VLNA 2):**
- ✅ **100% imperativ** v footer links
- ✅ **Bez emoji** v titles (čistý design)
- ✅ **Stručnější texty** ("Použij tvůj registrační email")
- ✅ **Genderově neutrální** ("Už víš heslo?")

---

## 💬 Kompletní Tone of Voice (FINÁLNÍ)

### **Celková proměna:**

**PŘED (původní stav):**
```
"Nemáte účet? Registrujte se zdarma"
"Vzpomněli jste si? Přihlásit se"
"Zadejte svůj email a my vám pošleme odkaz 🔐"
```
- ❌ Vykání + Infinitiv + Emoji
- ❌ Formální, distancované, starý pattern

**PO (finální stav):**
```
"Nemáš účet? Registruj se zdarma"
"Už víš heslo? Přihlaš se"
"Zadej svůj email a my ti pošleme další instrukce"
```
- ✅ Tykání + Imperativ + Bez emoji
- ✅ Friendly, direct, modern wellness appka

---

## 🌍 Impact na UX

### **Psychologický efekt imperativu:**

**Imperativ vytváří:**
1. ✅ **Urgency** - vybízí k akci TEĎKA
2. ✅ **Personal connection** - mluvíme S tebou, ne O tobě
3. ✅ **Empowerment** - TY máš kontrolu
4. ✅ **Modern feel** - jako Instagram, YouTube

**Infinitiv by vytvářel:**
1. ❌ **Distance** - navigační prvek, ne výzva
2. ❌ **Passivity** - jen informuje, nevybízí
3. ❌ **Old-school** - corporate weby, portály

---

## 📸 Screenshots

- `forgot-password-imperativ.png` - "Už víš heslo? Přihlaš se" + bez emoji
- `register-imperativ.png` - "Už máš účet? Přihlaš se"
- `reset-password-imperativ.png` - "Nastav si nové heslo" (bez emoji)

---

## 🚀 Conclusion

**Tone of Voice je teď 100% konzistentní napříč 2 dimenzemi:**

1. ✅ **Tykání** (ne vykání) - intimate, personal
2. ✅ **Imperativ** (ne infinitiv) - action-oriented, direct

**Final quote:**
> **"Nemáš účet? Registruj se zdarma a začni svou cestu!"** 🚀
> 
> Friendly. Direct. Modern. DechBar.

---

**Autor:** AI Agent (Claude Sonnet 4.5)  
**Datum:** 2026-01-10 (VLNA 2)  
**Status:** ✅ Hotovo  
**Testováno:** ✅ Chrome localhost:5173  
**Approved by:** User ✅

---

## 📋 Related Logs

- **[VLNA 1: Tone of Voice - Tykání](./2026-01-10-tone-of-voice-tykani.md)** - První vlna (vykání → tykání)

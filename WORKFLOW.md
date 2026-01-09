# 🔄 Development Workflow

**Last Updated:** 2026-01-09  
**Version:** 1.0  
**Purpose:** Kompletní workflow pro vývoj DechBar App

---

## 🎯 TŘI PROSTŘEDÍ

```
LOCAL     → Rychlý vývoj (okamžitý feedback)
PREVIEW   → Testování (sdílení s týmem)
PROD      → Uživatelé (stabilní verze)
```

---

## ⚡ LOCAL Development (Cursor)

### **Proč LOCAL?**

✅ **Okamžitý feedback** (změna viditelná za 1s)  
✅ **Hot Module Replacement** (bez page reload)  
✅ **Rychlé experimentování** (bez commitů)  
✅ **Debugging** v reálném čase  
✅ **Žádné čekání** na Vercel build

---

### **Jak spustit LOCAL server:**

```bash
# 1. Přejdi do projektu
cd /Users/DechBar/dechbar-app

# 2. Ujisti se že jsi na test branch
git checkout test

# 3. Spusť dev server (JEDNOU)
npm run dev

# → Server běží na http://localhost:5173/
```

---

### **Jak pracovat:**

```
1. Spusť server (npm run dev)
2. Otevři http://localhost:5173/ v prohlížeči
3. Edituj soubory v Cursoru
4. Ulož (Cmd+S)
5. Za 1 sekundu vidíš změnu v prohlížeči!
6. Opakuj 100x (žádné commity!)
```

**Výsledek:**
- 🚀 Rychlý vývoj
- ⚡ Okamžitá změna
- 🎨 Experimentování bez obav

---

## 🧪 PREVIEW Deployment (Test)

### **Kdy poslat na PREVIEW?**

✅ Hotový funkční blok (component, feature, fix)  
✅ Potřebuješ feedback od týmu  
✅ Chceš otestovat na mobilu (reálná URL)  
✅ Před nasazením na PROD

---

### **Jak nahrát na PREVIEW:**

```bash
# 1. Ujisti se že jsi na test branch
git checkout test

# 2. Zkontroluj co se změnilo
git status

# 3. Přidej změny
git add .

# 4. Commit s popisnou zprávou
git commit -m "Feature: Přidán Login formulář"

# 5. Push na GitHub (test branch)
git push origin test

# → Vercel automaticky deployne za 1-2 minuty
# → Preview URL: dechbar-app-*-git-test-dechbars-projects.vercel.app
```

---

### **Jak získat Preview URL:**

1. **Jdi na:** https://vercel.com → dechbar-app-lleh → Deployments
2. **Najdi:** `test` branch deployment
3. **Klikni:** "Visit" → otevře Preview URL
4. **Nebo:** GitHub commit → Vercel bot komentář s URL

---

### **Testování a feedback loop:**

```
1. Pošleš Preview URL týmu/testerům
2. Oni kontrolují a dávají feedback
3. TY MEZITÍM vyvíjíš další funkci (LOCAL)
4. Dostaneš feedback → opravíš (LOCAL)
5. Push novou verzi na PREVIEW
6. Znovu kontrola
7. Opakuješ dokud není schváleno ✅
```

---

## 🚀 PRODUCTION Deployment (PROD)

### **Kdy nasadit na PROD?**

✅ PREVIEW je otestovaný a schválený  
✅ Žádné známé bugy  
✅ Tým/tester dal OK ✅  
✅ Jsi připravený na LIVE nasazení

---

### **⚠️ POZOR! Toto jde LIVE na dechbar.cz!**

```bash
# 1. Přepni na main branch
git checkout main

# 2. Merge test → main
git merge test

# 3. Zkontroluj že vše vypadá OK
git log --oneline -5

# 4. Push na main (PRODUCTION!)
git push origin main

# → Vercel deployne na https://dechbar.cz
# → LIVE pro všechny uživatele! 🚀
```

---

## 📊 Celý workflow (krok za krokem)

### **FÁZE 1: LOCAL Development** ⚡

```bash
cd /Users/DechBar/dechbar-app
git checkout test
npm run dev

# Otevři: http://localhost:5173/
# Vyvíjej, testuj, opakuj...
```

**Checklist:**
- [ ] Server běží (npm run dev)
- [ ] Změny viditelné okamžitě (Cmd+S)
- [ ] Hotový funkční blok

---

### **FÁZE 2: PREVIEW Deployment** 🧪

```bash
git add .
git commit -m "Feature: Popis změny"
git push origin test

# Čekej 1-2 min na Vercel build
```

**Checklist:**
- [ ] Build úspěšný (Vercel dashboard)
- [ ] Preview URL funguje
- [ ] Poslal jsi týmu na kontrolu

---

### **FÁZE 3: Feedback Loop** 🔄

```
1. Tým kontroluje PREVIEW
2. Dostaneš feedback
3. Opravíš (LOCAL)
4. Push na PREVIEW (git push origin test)
5. Znovu kontrola
6. Opakuješ dokud OK ✅
```

---

### **FÁZE 4: PRODUCTION Deployment** 🚀

```bash
# POZOR! Jde to LIVE!
git checkout main
git merge test
git push origin main

# Čekej 1-2 min na Vercel build
```

**Checklist:**
- [ ] PREVIEW schválený ✅
- [ ] Žádné známé bugy
- [ ] Merge úspěšný
- [ ] Build na PROD úspěšný
- [ ] dechbar.cz funguje! 🎉

---

## 🔒 Bezpečnostní pravidla

### **⚠️ NIKDY:**

❌ Nepushuj přímo na `main` bez testování  
❌ Neexperimentuj na PROD  
❌ Necommituj polovičatý kód na PREVIEW  
❌ Nepominuj testování

### **✅ VŽDY:**

✅ Pracuj na `test` branch  
✅ Testuj na LOCAL před PREVIEW  
✅ Čekej na schválení před PROD  
✅ Commituj pouze hotové bloky

---

## 🚨 Co dělat když...

### **Něco se pokazilo na PREVIEW:**

```bash
# Oprav to na LOCAL
git checkout test
# [oprav bug...]
git add .
git commit -m "Fix: Oprava bugu X"
git push origin test
# → Nový PREVIEW deployment
```

---

### **Něco se pokazilo na PROD:**

```bash
# ROLLBACK na předchozí verzi

# 1. Najdi poslední funkční commit
git log --oneline

# 2. Rollback na ten commit
git checkout main
git reset --hard [commit-hash]
git push origin main --force

# → Vercel deployne starší verzi
# → PROD je opět funkční!
```

**⚠️ POZOR:** Force push je nebezpečný! Použij jen v nouzi!

---

## 📋 Checklist před PROD deploymentem

### **Pre-deployment checklist:**

- [ ] ✅ PREVIEW otestovaný (tým dal OK)
- [ ] ✅ Žádné console errors (F12)
- [ ] ✅ Funguje na mobilu (375px, 768px)
- [ ] ✅ Funguje na desktopu (1280px, 1920px)
- [ ] ✅ Žádné broken linky
- [ ] ✅ Všechny assets se načítají
- [ ] ✅ Supabase API funguje
- [ ] ✅ Authentication funguje
- [ ] ✅ CHANGELOG.md aktualizován
- [ ] ✅ Git commit message srozumitelný

---

## 🎯 Best Practices

### **Commit messages:**

```bash
# ✅ DOBŘE:
git commit -m "Feature: Přidán Login formulář s validací"
git commit -m "Fix: Opravena chyba v Dashboard načítání"
git commit -m "Refactor: Zlepšena struktura Button komponenty"

# ❌ ŠPATNĚ:
git commit -m "update"
git commit -m "fix"
git commit -m "changes"
```

---

### **Branch naming:**

```
test        → Default pro testování
main        → Production POUZE
feature/X   → Pro jednotlivé funkce (volitelné)
```

---

### **Kdy commitovat:**

✅ Hotový funkční blok  
✅ Před koncem dne (backup)  
✅ Před přepnutím na jinou funkci

❌ Každou malou změnu  
❌ Nefunkční kód  
❌ Experimentální změny

---

## 💡 Tipy pro efektivitu

### **1. Hot Reload = Rychlý vývoj**

```
Změna → Cmd+S → vidíš za 1s
(žádný git push!)
```

### **2. Paralelní práce**

```
Tým testuje PREVIEW
↓
TY MEZITÍM vyvíjíš další funkci LOCAL
↓
Dostaneš feedback → opravíš → pushneš
```

### **3. Feature branches (pokročilé)**

```bash
# Pro velkou funkci:
git checkout -b feature/ai-chatbot
# [vyvíjíš...]
git push origin feature/ai-chatbot
# → Vlastní Preview URL

# Až hotovo:
git checkout test
git merge feature/ai-chatbot
git push origin test
```

---

## 📚 Další informace

- **PROJECT_GUIDE.md** → Master dokumentace
- **CONTRIBUTING.md** → Pravidla pro přispívání
- **CHANGELOG.md** → Historie změn
- **docs/development/01_WORKFLOW.md** → Detailní workflow

---

## 🆘 Pomoc

**Problém?**
1. Zkontroluj tento dokument
2. Podívej se do PROJECT_GUIDE.md
3. Zkontroluj Vercel logy (Deployments → View Logs)
4. Ptej se týmu!

---

**Happy coding! 🚀**

*Created: 2026-01-09*  
*Version: 1.0*

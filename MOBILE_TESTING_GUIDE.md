# 📱 Jak testovat localhost na mobilu - Kompletní Návod

**Date:** 2026-01-26  
**Účel:** Testovat změny na reálném mobilu bez pushe na GitHub

---

## 🚀 METODA 1: VITE DEV SERVER NA SÍTI (NEJLEPŠÍ!)

### ✅ KROK 1: Server už je nakonfigurovaný!

Upravil jsem `vite.config.ts` - server teď poslouchá na všech síťových rozhraních:

```typescript
server: {
  host: true,        // Listen on 0.0.0.0 (všechny network interfaces)
  port: 5173,
  strictPort: true,
}
```

### ✅ KROK 2: Spusť server

```bash
cd /Users/DechBar/dechbar-app
npm run dev
```

Server ti vypíše něco jako:

```
VITE v5.x.x  ready in 234 ms

➜  Local:   http://localhost:5173/
➜  Network: http://192.168.1.123:5173/    ← TADY JE TVOJE IP!
```

### ✅ KROK 3: Najdi svou lokální IP adresu

**Možnost A - Z Vite outputu:**
Podívej se na výpis serveru, řádek `Network:` obsahuje IP

**Možnost B - macOS System Settings:**
1. System Settings → Network
2. Wi-Fi → Details
3. Zkopíruj IP address (např. `192.168.1.123`)

**Možnost C - Terminal:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

### ✅ KROK 4: Otevři na mobilu

**Na svém iPhone/Android:**
1. Ujisti se, že jsi na **stejné Wi-Fi síti** jako Mac
2. Otevři Safari/Chrome
3. Zadej: `http://192.168.1.123:5173` (použij SVOU IP z kroku 3)

### 🎉 HOTOVO!

Teď vidíš localhost přímo na mobilu! Každá změna v kódu se automaticky refreshne.

---

## 🔧 TROUBLESHOOTING

### ❌ "This site can't be reached"

**Příčina:** Mac a mobil na různých Wi-Fi sítích

**Řešení:**
1. Zkontroluj Wi-Fi na Macu: System Settings → Network
2. Zkontroluj Wi-Fi na mobilu: Settings → Wi-Fi
3. Musí být **stejná síť**!

### ❌ "ERR_CONNECTION_REFUSED"

**Příčina:** Mac firewall blokuje incoming connections

**Řešení:**
1. System Settings → Network → Firewall
2. Firewall Options → Přidej Node.js/Vite do Allow list
3. Nebo vypni firewall pro testování (System Settings → Network → Firewall Off)

### ❌ "Unable to connect"

**Příčina:** Port 5173 je obsazený

**Řešení:**
```bash
# Zjisti co běží na portu 5173
lsof -ti:5173

# Zabij process (PID z předchozího příkazu)
kill -9 <PID>

# Spusť server znovu
npm run dev
```

---

## 💡 TIPY PRO RYCHLÉ TESTOVÁNÍ

### 1. Fast Refresh je aktivní!
- Ulož soubor (Cmd+S) → mobil se automaticky refreshne
- Žádný manual refresh potřeba!

### 2. Debugging na mobilu:

**Safari (iPhone):**
1. iPhone: Settings → Safari → Advanced → Web Inspector (ON)
2. Mac: Safari → Develop → [Tvůj iPhone] → http://192.168.1.123:5173
3. Console otevřený - vidíš errory!

**Chrome (Android):**
1. Android: Settings → Developer Options → USB Debugging (ON)
2. Chrome na Macu: `chrome://inspect`
3. Najdi svůj device → Inspect

### 3. Responsive Mode vs. Real Device:

| Feature | Chrome DevTools | Real iPhone |
|---------|----------------|-------------|
| Screen size | ✅ Přesné | ✅ Přesné |
| Touch events | ⚠️ Simulované | ✅ Reálné |
| Safe area insets | ⚠️ Přibližné | ✅ Přesné notch/home indicator |
| Performance | ❌ Rychlejší | ✅ Reálné |
| Network speed | ❌ Desktop | ✅ Mobile 4G/5G |

**→ VŽDY testuj na reálném zařízení pro finální check!**

---

## 📋 WORKFLOW DOPORUČENÍ

### Development Cycle:

```
1. Změň CSS/kód v Cursoru (Cmd+S)
   ↓ Auto Fast Refresh (~200ms)
2. Podívej se na mobil
   ↓ Vypadá dobře?
3. Repeat nebo commit
```

### Pro větší změny:

```
1. Implementuj změny
2. Test na localhost:5173 (desktop)
3. Test na mobilu (http://192.168.1.123:5173)
4. Git commit + push
5. Deploy na TEST server
6. Final testing na test.zdravedychej.cz
```

---

## 🌐 ALTERNATIVA: NGROK (pokud předchozí nefunguje)

Pokud máš problémy s firewallem nebo síťovým nastavením:

### 1. Nainstaluj ngrok:
```bash
brew install ngrok
```

### 2. Spusť tunnel:
```bash
# V jednom terminalu
npm run dev

# V druhém terminalu
ngrok http 5173
```

### 3. Ngrok ti dá public URL:
```
Forwarding  https://abc123.ngrok.io → http://localhost:5173
```

### 4. Otevři na mobilu:
`https://abc123.ngrok.io`

**Výhody:**
- ✅ Funguje i mimo local network
- ✅ Funguje přes mobilní data
- ✅ HTTPS (pro PWA testing)

**Nevýhody:**
- ❌ Pomalejší (data jdou přes ngrok server)
- ❌ Random URL při každém restartu (free tier)

---

## 🎯 CO TESTOVAT NA MOBILU:

### Mobile UX Fixes (naše dnešní změny):

- [ ] **Circle centering** - otevři KP měření, je circle ve středu?
- [ ] **Button width** - všechny buttony 75% šířky?
- [ ] **MiniTip position** - viditelný nad buttonem?
- [ ] **Modal centering** - "Opravdu ukončit?" centered?
- [ ] **Settings drawer** - TOP NAV skrytý nebo pod overlay?

### Touch Interactions:

- [ ] Tap targets min 44px (pohodlné klikání)
- [ ] Smooth scrolling
- [ ] No accidental clicks
- [ ] Swipe gestures work

### Safe Area Insets:

- [ ] iPhone notch - content není pod notchem
- [ ] Home indicator - buttony nad indicatorem
- [ ] Landscape mode funguje

---

## 📊 SROVNÁNÍ METOD:

| Metoda | Rychlost | Setup | Use Case |
|--------|----------|-------|----------|
| **Local Network** | ⚡⚡⚡ Fastest | ✅ Easy | **Daily development** |
| **ngrok** | ⚡⚡ Fast | ⚡ Medium | Testing přes mobilní data |
| **TEST Server** | ⚡ Slow | ⚡⚡ Complex | Final testing před PROD |
| **PROD Server** | ⚡ Slow | ⚡⚡⚡ Most complex | Live users |

**→ Pro každodenní development: LOCAL NETWORK!** 🚀

---

## 🔐 BEZPEČNOST

### ⚠️ Local Network Access:

- ✅ **Bezpečné** - pouze devices na tvé Wi-Fi
- ✅ **Private** - data neopouští tvou síť
- ❌ **Nefunguje** - mimo domácí/kancelářskou Wi-Fi

### ⚠️ ngrok:

- ⚠️ **Public URL** - kdokoliv s URL může přistoupit
- ⚠️ **Temporary** - URL se mění při restartu
- ✅ **Free tier OK** pro development

**→ NIKDY nesdílej ngrok URL veřejně!**

---

## 💬 QUICK REFERENCE

### Spustit server pro mobile testing:
```bash
cd dechbar-app
npm run dev
```

### Najít IP adresu:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

### Mobile URL:
```
http://[TVOJE_IP]:5173
# Příklad: http://192.168.1.123:5173
```

### Restart serveru:
```bash
# Ctrl+C (stop)
npm run dev  # (start)
```

---

**Server je ready!** 🎉  
**Teď spusť `npm run dev` a zkus mobile URL!** 📱

Pokud máš jakýkoliv problém, dej vědět! 💬

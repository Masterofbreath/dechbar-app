# Moduly vs Stripe — přehled cen a nastavení

**Účel:** Srovnání cen v dokumentaci/DB, tvé prodejní ceny a Stripe. Návod, jak mít vše v souladu a jak doplnit subscription.

---

## 1. Co máme v Modules (dokumentace a DB)

V `docs/architecture/03_DATABASE.md` a `docs/product/MODULES.md` je uvedeno:

| Modul (id) | Dokumentace | Tvůj prodej | Stripe (z tvého screenshotu) |
|------------|-------------|-------------|-------------------------------|
| **Program REŽIM** (`digitalni-ticho`) | 990 Kč lifetime | 990 Kč lifetime | 4 ceny, kategorie „non subscription - permanent rights“ ✓ |
| **Dechové výzvy** | 490 Kč lifetime | **290 Kč** lifetime | „Ranní dechová výzva“ 290 Kč — ale kategorie **subscription** (conditional rights) |
| **SMART Membership** (`membership-smart`) | 249 Kč/měsíc, roční 50 % sleva | stejně | 2 ceny, subscription ✓ |
| **AI COACH Membership** (`membership-ai-coach`) | 490 Kč/měsíc, roční 50 % sleva | stejně | 2 ceny, subscription ✓ |
| **Akademie** (programy) | 1490 Kč lifetime (referenčně) | Část jako **lifetime** (jednorázově), část přístupná v **rámci tarifu SMART** | Programy vytváříš v adminu → Edge Function `create-akademie-product` (Stripe + DB) |

**Rozdíly k srovnání:**

- **Výzvy:** V docs je 490 Kč, ty prodáváš 290 Kč. V Stripe máš „Ranní dechová výzva“ 290 Kč — to sedí na cenu, ale **daňová kategorie je „subscription“**. Pro **lifetime** by měla být **one-time** cena a kategorie typu „non subscription - permanent rights“ (jako u REŽIMu).
- **REŽIM:** 990 Kč a „4 prices“ v Stripe — můžeš používat jednu z nich jako hlavní pro 990 Kč; zbytek může být jiné balíčky/slevy.

---

## 2. Jak to nastavit ve Stripe a v projektu

### 2.1 Předplatné (SMART, AI COACH) — už máš

- V Stripe už máš produkty **SMART Membership** a **AI COACH Membership** s **2 cenami** (měsíční + roční).
- Checkout: frontend posílá `priceId` + `moduleId` do Edge Function `create-checkout-session`. Ta načte cenu (`stripe.prices.retrieve(priceId)`): pokud je `type === 'recurring'`, nastaví `mode: 'subscription'`.
- Webhook `stripe-webhooks` mapuje `priceId` na modul přes:
  1. tabulku `modules` (sloupec `stripe_price_id`), nebo  
  2. **fallback mapu** v kódu (protože membershipy tam často nemají `stripe_price_id`).

**Co udělat:**

1. Ve Stripe Dashboardu u SMART a AI COACH zkopíruj **všechny** Price ID (měsíční i roční).
2. Do fallback mapy v `supabase/functions/stripe-webhooks/index.ts` (proměnná `subscriptionPriceMap`) doplň **všechna** tvá reálná Price ID.  
   Teď tam je jen jeden cenový ID pro AI COACH (annual); pokud máš i měsíční, přidej ho.
3. Frontend (MujUcetPage / PricingSection) musí na „Koupit“ posílat správné `priceId` podle zvoleného tarifu a intervalu (měsíc/rok) — ty ID ber z DB nebo z konfigurace, která odpovídá Stripe.

Tím máš subscription plně napojené na Stripe bez dalších produktů.

---

### 2.2 Jednorázové produkty (lifetime)

- **Program REŽIM (990 Kč):**  
  Už máš produkt a ceny ve Stripe. Používej jednu cenu za 990 Kč jako hlavní (např. do `.env`: `VITE_STRIPE_PRICE_DIGITALNI_TICHO=price_xxx`). V tabulce `modules` by měl být řádek s `id = 'digitalni-ticho'` a `stripe_price_id = toto Price ID`, aby webhook našel modul podle `stripe_price_id`.
- **Dechové výzvy (290 Kč):**  
  - Pokud je to **lifetime** (doživotní přístup), ve Stripe by měla být **one-time** cena (ne recurring) a daňová kategorie „non subscription - permanent rights“.  
  - V Stripe Dashboardu u produktu „Ranní dechová výzva“ zkontroluj:  
    - že používáš **Price** s typem **One time** (ne Recurring),  
    - a u produktu / ceny nastav Tax code např. „Digital Audio Works - downloaded - non subscription - with permanent rights“.  
  - V DB (`modules`) měj záznam např. `id = 'challenges'` (nebo jiný slug, který používáš v kódu), `price_czk = 290`, `price_type = 'lifetime'`, `stripe_price_id = <Price ID pro 290 Kč one-time>`.

---

### 2.3 Akademie — lifetime + obsah v rámci SMART

- **Obsah dostupný jen v rámci tarifu SMART:**  
  Nepotřebuješ ve Stripe samostatný produkt. Přístup řešíš v aplikaci: pokud má uživatel `memberships.plan = 'SMART'` (nebo vyšší), zobrazíš obsah. Stripe má jen SMART/AI COACH subscription.
- **Lifetime programy (jednorázový nákup):**  
  Vytváříš je v adminu (Akademie). Volání `create-akademie-product` vytvoří ve Stripe **Product + one-time Price** a uloží `stripe_price_id` do `modules`. Webhook pak při platbě najde modul přes `modules.stripe_price_id` a zapíše nákup do `user_modules`.  
  Nastavení tedy už je: přidávat programy v adminu a používat stávající Edge Function.

---

## 3. Stripe CLI — vytvoření produktu a cen

Pro ruční vytvoření nebo ověření v terminálu.

### 3.1 Jednorázová cena (lifetime)

```bash
# 1. Produkt
stripe products create \
  --name "Ranní dechová výzva" \
  --description "21 dní dechové výzvy — lifetime přístup" \
  --api-key sk_test_XXX

# Výstup: "id": "prod_XXXXX"

# 2. One-time cena (290 Kč = 29000 haléřů v CZK)
stripe prices create \
  --product prod_XXXXX \
  --currency czk \
  --unit-amount 29000 \
  --api-key sk_test_XXX
# Bez --recurring = one-time. Výstup: "id": "price_XXXXX"
```

Pak v DB (`modules`) nastav `stripe_price_id = price_XXXXX`, `price_czk = 290`, `price_type = 'lifetime'`.

### 3.2 Předplatné (měsíční / roční)

```bash
# Produkt už máš; přidáš jen cenu.

# Měsíční (249 Kč)
stripe prices create \
  --product prod_SMART_ID \
  --currency czk \
  --unit-amount 24900 \
  -d "recurring[interval]=month" \
  --api-key sk_test_XXX

# Roční (12*249*0,5 = 1494 Kč, nebo zaokrouhleně 1499 Kč)
stripe prices create \
  --product prod_SMART_ID \
  --currency czk \
  --unit-amount 149400 \
  -d "recurring[interval]=year" \
  --api-key sk_test_XXX
```

CZK je „minor unit = 1 Kč“, takže 249 Kč = 24900, 1494 Kč = 149400.

### 3.3 Trial u předplatného (volitelně)

Trial se nastavuje při vytváření **Checkout Session** (v Edge Function), ne na Price. V `create-checkout-session` můžeš přidat:

```ts
subscription_data: {
  trial_period_days: 7,
  metadata: { ... }
}
```

Nebo v Stripe Dashboard u dané ceny (Price) lze nastavit default trial.

---

## 4. Kontrolní seznam

- [ ] **DB `modules`:** Pro každý prodávaný modul existuje řádek s `id`, `price_czk`, `price_type`, u one-time i `stripe_price_id`.
- [ ] **Stripe:** Výzvy 290 Kč = one-time cena a kategorie „permanent rights“. REŽIM 990 Kč = jedna hlavní one-time cena, jejíž ID používáš v env / frontendu.
- [ ] **Webhook:** V `subscriptionPriceMap` jsou všechna Price ID pro SMART a AI COACH (měsíční + roční). Případně místo mapy můžeš u membershipů doplnit `stripe_price_id` do `modules` (jeden řádek na tarif, pak by bylo potřeba ukládat více ID — typicky se dělá právě mapou).
- [ ] **Frontend:** Tlačítka „Koupit“ posílají správné `priceId` z Stripe (podle zvoleného tarifu a intervalu).
- [ ] **Akademie:** Lifetime programy jen přes admin + `create-akademie-product`. Obsah „v rámci SMART“ jen kontrolou `memberships.plan` v aplikaci.

---

## 5. Související dokumenty

- `docs/development/STRIPE_GUIDE.md` — API klíče, checkout flow, webhooky, testování  
- `docs/STRIPE_INTEGRATION_GUIDE.md` — celkový plán integrace  
- `docs/product/MODULES.md` — reference cen (aktualizuj na 290 Kč u Výzev, pokud je to finální cena)

Po srovnání těchto bodů budeš mít subscription i one-time produkty nastavené konzistentně mezi Modules, Stripe a kódem.

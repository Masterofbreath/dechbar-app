# TierLockModal Component

**Status:** 🚧 To Be Implemented  
**Version:** 1.0.0  
**Type:** Global Component (Platform-level)  
**Created:** 5. února 2026

---

## 📋 Overview

**TierLockModal** je globální komponenta pro zobrazení paywall hlášky, když uživatel zkouší přistoupit k premium funkci.

**KRITICKÉ:** iOS-compliant - **bez přímých odkazů na platbu** (Apple App Store pravidla).

---

## 🎯 Purpose

- 🔒 Blokovat přístup k premium funkcím (FREE tier)
- 💬 Informovat o potřebném tarifu (SMART / AI COACH)
- 📋 Umožnit kopírování odkazu na web
- ✅ Splňovat Apple App Store pravidla (no IAP bypass)

---

## 🚀 Usage

```typescript
import { TierLockModal } from '@/modules/mvp0/components/TierLockModal';

function MyComponent() {
  const [showPaywall, setShowPaywall] = useState(false);
  const { plan } = useMembership();
  
  function handlePremiumFeature() {
    if (plan === 'ZDARMA') {
      setShowPaywall(true);
      return;
    }
    
    // Proceed with feature
  }
  
  return (
    <>
      <Button onClick={handlePremiumFeature}>
        Premium Feature
      </Button>
      
      <TierLockModal
        isOpen={showPaywall}
        requiredTier="SMART"
        featureName="Komplexní nástroj na tvorbu cvičení"
        onClose={() => setShowPaywall(false)}
      />
    </>
  );
}
```

---

## 📐 Props Interface

```typescript
export interface TierLockModalProps {
  isOpen: boolean;
  requiredTier: 'SMART' | 'AI_COACH';
  featureName: string;
  description?: string; // Optional custom message
  onClose: () => void;
}
```

### Props Details

**isOpen** (boolean, required)
- Controls modal visibility

**requiredTier** ('SMART' | 'AI_COACH', required)
- Which tier is needed for the feature
- Used in message: "dostupná od tarifu SMART"

**featureName** (string, required)
- Name of the locked feature
- Examples:
  - "Více než 3 vlastní cvičení"
  - "Komplexní nástroj na tvorbu cvičení"
  - "AI generování cvičení"

**description** (string, optional)
- Custom description if default is not suitable
- Default: "Tato funkce je dostupná od tarifu {tier}."

**onClose** (function, required)
- Callback when modal is closed

---

## 🎨 UI Design

### Visual Layout

```
┌─────────────────────────────────────────┐
│                                          │
│               🔒                         │  ← Lock icon (64px)
│                                          │
│    Komplexní nástroj na tvorbu          │  ← Feature name (20px, semibold)
│    cvičení                               │
│                                          │
│  Tato funkce je dostupná od tarifu      │  ← Description (16px)
│  SMART.                                  │
│                                          │
│  Pro odemčení navštiv dechbar.cz       │  ← Instructions (16px, teal)
│                                          │
│  ┌────────────────────────────────┐    │
│  │  📋 Zkopírovat odkaz           │    │  ← Copy button (secondary)
│  └────────────────────────────────┘    │
│                                          │
│           [Zavřít]                      │  ← Close button (ghost)
└─────────────────────────────────────────┘
```

### Design Specs

**Modal:**
- Max width: 400px (desktop)
- Padding: 32px
- Background: `var(--color-surface-elevated)` (#2A2A2A)
- Border radius: 16px
- Shadow: `var(--shadow-xl)`

**Lock Icon:**
- Size: 64px
- Color: `var(--text-secondary)` (#A0A0A0)
- Centered above text

**Typography:**
- Feature name: 20px, semibold, -0.02em letter-spacing
- Description: 16px, regular
- Instructions: 16px, regular, teal color (#2CBEC6)

**Buttons:**
- Copy button: Secondary variant, full-width
- Close button: Ghost variant, full-width
- Gap: 12px between buttons

---

## ⚠️ iOS COMPLIANCE RULES

**Apple App Store Guidelines (3.1.1):**

❌ **FORBIDDEN:**
- Direct payment links
- "Upgrade" or "Buy" CTAs
- Webview redirects to payment page
- Deep links to pricing page

✅ **ALLOWED:**
- Informational text about tiers
- Copy link to clipboard
- Open Safari browser manually (user action)

### Implementation Requirements

```typescript
// ✅ CORRECT (iOS-compliant)
function TierLockModal() {
  async function handleCopyLink() {
    await navigator.clipboard.writeText('https://dechbar.cz');
    // Show feedback: "✓ Zkopírováno"
  }
  
  return (
    <div>
      <p>Pro odemčení navštiv dechbar.cz</p>
      <Button onClick={handleCopyLink}>
        📋 Zkopírovat odkaz
      </Button>
    </div>
  );
}

// ❌ WRONG (violates Apple rules)
function TierLockModal() {
  return (
    <Button onClick={() => window.open('https://dechbar.cz/pricing')}>
      Upgrade na SMART  {/* ← Forbidden CTA */}
    </Button>
  );
}
```

---

## 🔌 Integration Examples

### Example 1: Exercise Creator (4th Exercise Limit)

```typescript
// CvicitPage.tsx
function CvicitPage() {
  const { data: customCount } = useCustomExerciseCount();
  const { plan } = useMembership();
  const [showTierLock, setShowTierLock] = useState(false);
  
  function handleCreateCustom() {
    // Check FREE limit
    if (plan === 'ZDARMA' && (customCount || 0) >= 3) {
      setShowTierLock(true);
      return;
    }
    
    // Open creator
    setShowCreator(true);
  }
  
  return (
    <>
      <Button onClick={handleCreateCustom}>
        + Vytvořit nové cvičení
      </Button>
      
      <TierLockModal
        isOpen={showTierLock}
        requiredTier="SMART"
        featureName="Více než 3 vlastní cvičení"
        description="Dosáhl jsi limit 3 cvičení na FREE tarifu."
        onClose={() => setShowTierLock(false)}
      />
    </>
  );
}
```

### Example 2: Complex Mode Toggle

```typescript
// ModeToggle.tsx
function ModeToggle({ currentMode, onModeChange, isEnabled }) {
  const [showTierLock, setShowTierLock] = useState(false);
  
  function handleToggle() {
    if (!isEnabled) {
      setShowTierLock(true);
      return;
    }
    
    onModeChange(currentMode === 'simple' ? 'complex' : 'simple');
  }
  
  return (
    <>
      <button onClick={handleToggle}>
        {/* Toggle UI */}
      </button>
      
      <TierLockModal
        isOpen={showTierLock}
        requiredTier="SMART"
        featureName="Komplexní nástroj na tvorbu cvičení"
        onClose={() => setShowTierLock(false)}
      />
    </>
  );
}
```

### Example 3: AI Features (Future)

```typescript
// AI Coach feature
<TierLockModal
  isOpen={true}
  requiredTier="AI_COACH"
  featureName="AI generování cvičení"
  description="Personalizované AI doporučení jsou dostupná v tarifu AI COACH."
  onClose={() => {}}
/>
```

---

## 📊 Analytics Events

Track when paywall shown:
```typescript
analytics.track('tier_lock_modal_shown', {
  feature: featureName,
  required_tier: requiredTier,
  current_tier: plan,
  context: 'exercise_creator', // where modal was triggered
});

analytics.track('tier_lock_link_copied', {
  feature: featureName,
});
```

---

## ✅ Implementation Checklist

- [ ] Create TierLockModal.tsx
- [ ] Props interface defined
- [ ] Copy to clipboard functionality
- [ ] Success feedback ("✓ Zkopírováno")
- [ ] CSS styling (tier-lock-modal.css)
- [ ] Responsive (mobile + desktop)
- [ ] Analytics events
- [ ] Test on iOS Safari (no payment link violations)
- [ ] Export from index.ts
- [ ] Update platform components index (if moving to platform/)

---

## 🎨 Design System Compliance

**Colors:**
```css
background: var(--color-surface-elevated); /* #2A2A2A */
color: var(--text-primary); /* #E0E0E0*/
```

**Typography:**
```css
font-family: 'Inter', sans-serif;
font-size: 16px;
line-height: 1.5;
```

**Spacing:**
```css
padding: 32px;
gap: 16px; /* between elements */
```

**Buttons:**
- Copy button: Secondary variant (surface + border)
- Close button: Ghost variant (transparent)

---

## 🚀 Future Enhancements

### V2.0:
- [ ] Deep link support (open Safari to exact tier page)
- [ ] Comparison table (FREE vs SMART features)
- [ ] "Notify me" option (email when tier unlocked)

### V3.0:
- [ ] In-app tier comparison page
- [ ] Gift tier option (for friends)

---

## 📚 Related Components

- **LockedFeatureModal** (existing) - Similar pattern, refactor to use TierLockModal?
- **SmartExerciseButton** (existing) - Uses similar tier check logic

**Recommendation:** Migrate existing tier-check patterns to use this unified TierLockModal component.

---

*Status: Specification Ready*  
*Implementation: Pending*  
*Priority: High (required for Exercise Creator)*

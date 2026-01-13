# Study Guide: Media Components

**Pro agenty implementující:** audio přehrávače, video, galerie, obrázky, visualizéry

---

## 📚 CO SI NASTUDOVAT (v tomto pořadí):

### **1. Design Tokens** ⭐ KRITICKÉ

```
src/styles/design-tokens/
├── colors.css (player UI colors)
├── shadows.css (player shadow, depth)
├── effects.css (glassmorphism pro player overlay)
└── spacing.css (controls spacing)
```

**Klíčové pro media:**
```css
--glass-card       (pro player overlay)
--shadow-md        (player shadow)
--color-gold       (progress bar, aktiv buttons)
```

---

### **2. Supabase Storage (CDN)** ⭐ KRITICKÉ

```
docs/development/02_SUPABASE.md
└── Sekce: "Storage & CDN"
```

**Klíčové informace:**
```
Kde jsou media soubory: Supabase Storage
URL formát: https://[project].supabase.co/storage/v1/object/public/[bucket]/[file]
CDN: Automaticky (Supabase má built-in CDN)
Upload: Přes Supabase Dashboard nebo API
```

**Bucket structure:**
```
audio/
  ├── exercises/
  │   ├── breathing-01.mp3
  │   └── meditation-01.mp3
  └── ambient/
      └── nature-sounds.mp3
```

---

### **3. Audio Player Patterns**

```
docs/design-system/06_COMPONENTS.md
└── Sekce: "Media Components" (pokud existuje)
```

**Základní features:**
- Play/Pause toggle
- Progress bar (seek)
- Volume control
- Current time / Duration
- Skip forward/backward (optional)
- Waveform visualizer (optional)

---

### **4. Mobile Considerations** ⭐ KRITICKÉ

```
docs/design-system/05_BREAKPOINTS.md
```

**Mobile audio playback:**
```
- iOS: Auto-play restrictions (musí user interaction)
- Android: Podobné omezení
- Sticky player: Fixed position při scrollování
- Touch-friendly controls (min 44px)
- Background playback: Service Worker (PWA)
```

---

### **5. 4 Temperaments for Media** ⭐ KRITICKÉ

```
docs/design-system/01_PHILOSOPHY.md
```

**Jak media komponenty vyhoví všem 4:**

```
🎉 SANGVINIK (Fun & Visual):
   - Animovaný waveform
   - Barevný progress bar (gold)
   - Vizuální feedback při play/pause
   - Smooth animations
   
⚡ CHOLERIK (Fast & Control):
   - Keyboard shortcuts (Space=play, Arrow=skip)
   - Skip buttons (±5s, ±15s)
   - Speed control (0.5x, 1x, 1.5x, 2x)
   - Quick access controls
   
📚 MELANCHOLIK (Details & Quality):
   - Metadata display (title, duration, author)
   - Precise progress bar (s/ms)
   - Track info (bitrate, format)
   - Playlists, favorites
   
🕊️ FLEGMATIK (Simple & Calm):
   - Clean, minimal UI
   - Autoplay option
   - Simple controls (just play/pause)
   - No overwhelming options
```

---

## 🎯 KLÍČOVÉ KONCEPTY:

### **Audio Player Architecture:**

```typescript
// src/platform/components/AudioPlayer.tsx

interface AudioPlayerProps {
  src: string;                    // URL from Supabase Storage
  title?: string;                 // Track title
  author?: string;                // Author/artist
  autoplay?: boolean;             // Autoplay on mount
  loop?: boolean;                 // Loop playback
  showWaveform?: boolean;         // Waveform visualizer
  onEnded?: () => void;           // Callback when finished
  onTimeUpdate?: (time: number) => void;
}

// State
const [isPlaying, setIsPlaying] = useState(false);
const [currentTime, setCurrentTime] = useState(0);
const [duration, setDuration] = useState(0);
const [volume, setVolume] = useState(1);
const [loading, setLoading] = useState(true);

// Ref for HTML audio element
const audioRef = useRef<HTMLAudioElement>(null);
```

---

### **Basic Implementation:**

```typescript
export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  title,
  autoplay = false,
  onEnded,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  return (
    <div className="glass-card audio-player">
      {/* Hidden HTML audio element */}
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={onEnded}
        autoPlay={autoplay}
      />

      {/* UI Controls */}
      <div className="player-controls">
        <button onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? '⏸' : '▶'}
        </button>
        
        <div className="progress-bar">
          <span>{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration}
            value={currentTime}
            onChange={(e) => {
              if (audioRef.current) {
                audioRef.current.currentTime = Number(e.target.value);
              }
            }}
          />
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {title && <div className="player-title">{title}</div>}
    </div>
  );
};
```

---

### **Design Tokens Usage:**

```css
.audio-player {
  /* Glassmorphism effect */
  background: var(--glass-card);
  backdrop-filter: blur(20px);
  
  /* Shadow */
  box-shadow: var(--shadow-md);
  
  /* Spacing */
  padding: var(--spacing-md);
  border-radius: var(--radius-lg);
}

.progress-bar input[type="range"] {
  /* Gold progress */
  accent-color: var(--color-gold);
}

.player-controls button {
  /* Spring animation on click */
  transition: transform var(--spring-bounce);
}

.player-controls button:active {
  transform: scale(0.95);
}
```

---

## 📋 CHECKLIST PŘED IMPLEMENTACÍ:

- [ ] Četl jsem design tokens (colors, shadows, effects)
- [ ] Rozumím Supabase Storage URL structure
- [ ] Vím, jak splnit 4 temperamenty pro media
- [ ] Rozumím mobile audio restrictions (iOS/Android)
- [ ] Vím, kde vytvořím komponentu (src/platform/components/)
- [ ] Rozumím responsive breakpoints
- [ ] Vím, jak testovat audio playback
- [ ] Keyboard shortcuts jsou jasné

---

## ✅ TEMPLATE ODPOVĚDI (zkopíruj a vyplň):

```markdown
📚 CO JSEM NASTUDOVAL:
- src/styles/design-tokens/ (colors, shadows, effects)
- docs/development/02_SUPABASE.md (Storage CDN)
- docs/design-system/01_PHILOSOPHY.md (4 Temperaments)
- docs/design-system/05_BREAKPOINTS.md (Mobile considerations)

🎯 MŮJ NÁVRH:
Audio Player komponenta s těmito features:
- [Basic: Play/Pause, Progress bar, Volume]
- [Advanced: Waveform, Speed control, Keyboard shortcuts]
- Glassmorphism design
- Responsive (mobile-first)

Props:
- src: string (Supabase URL)
- title?: string
- autoplay?: boolean
- showWaveform?: boolean
- onEnded?: () => void

🏗️ IMPLEMENTAČNÍ PLÁN:
1. Vytvoření AudioPlayer.tsx v src/platform/components/
2. HTML audio element (ref)
3. State management (isPlaying, currentTime, duration, volume)
4. UI controls (play/pause, progress, volume)
5. Glassmorphism styling (design tokens)
6. Implementace 4 temperamentů:
   - 🎉 Sangvinik: Animovaný waveform, gold progress
   - ⚡ Cholerik: Keyboard shortcuts (Space, Arrows), skip buttons
   - 📚 Melancholik: Metadata display, precise progress
   - 🕊️ Flegmatik: Minimal UI, autoplay option
7. Mobile testing (iOS/Android restrictions)
8. Accessibility (ARIA, keyboard)
9. Update src/platform/components/index.ts

📝 SOUBORY:
- src/platform/components/AudioPlayer.tsx
- Update src/platform/components/index.ts

🎨 DESIGN:
- Glassmorphism card (var(--glass-card))
- Gold progress bar (var(--color-gold))
- Shadow: var(--shadow-md)
- Spring animation on button click

📱 MOBILE:
- Touch-friendly controls (44px min)
- iOS autoplay restriction (require user interaction)
- Sticky player option (fixed position)
- Responsive breakpoints (320px, 480px, 768px, 1024px)

⌨️ KEYBOARD SHORTCUTS:
- Space: Play/Pause
- Arrow Left: -5s
- Arrow Right: +5s
- Arrow Up: Volume +
- Arrow Down: Volume -

❓ OTÁZKY:
- Máme již audio soubory v Supabase Storage?
- Potřebujeme waveform visualizer nebo jen basic player?
- Chceme speed control (0.5x, 1x, 1.5x, 2x)?
```

---

**Až toto napíšeš → čekej na schválení!**

**Supabase Storage URL příklad:**
```
https://iqyahebbteiwzwyrtmns.supabase.co/storage/v1/object/public/audio/exercises/breathing-01.mp3
```

---

*Last updated: 2026-01-09*

# Animations & Motion

## Motion Principles

1. **Natural** - Spring-based, not linear
2. **Fast** - Under 300ms for UI feedback
3. **Purposeful** - Only animate with reason
4. **Accessible** - Respect prefers-reduced-motion

## Timing Functions

### Spring Bounce
```css
transition-spring-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
```
**Use for:** Button presses, card interactions

### Spring Smooth
```css
transition-spring-smooth: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```
**Use for:** Modal openings, drawer slides

### Apple Ease
```css
transition-apple: cubic-bezier(0.25, 0.1, 0.25, 1);
```
**Use for:** General transitions, iOS-like feel

## Duration

| Duration | Usage |
|----------|-------|
| 150ms (fast) | Button feedback, hover states |
| 250ms (default) | Standard transitions |
| 350ms (slow) | Complex animations |

## Common Patterns

### Button Press
```tsx
<button className="
  transform 
  transition-transform 
  duration-fast
  active:scale-95
">
  Press me
</button>
```

### Modal Entry
```tsx
<Modal className="
  transition-all 
  duration-default
  ease-spring-smooth
">
  Content
</Modal>
```

### Fade In
```tsx
<div className="
  animate-fade-in
  transition-opacity 
  duration-default
">
  Content
</div>
```

## Accessibility

Always respect reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

This is automatically handled in `src/styles/globals.css`.

## Files

- Implementation: `src/styles/design-tokens/effects.css`
- Tailwind config: `tailwind.config.js`

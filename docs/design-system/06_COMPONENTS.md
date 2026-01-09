# Component Library

## Platform Components

All shared components live in `src/platform/components/`.

## Available Components

### Button
```tsx
import { Button } from '@/platform/components';

<Button variant="primary">Click me</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
```

### Card
```tsx
import { Card } from '@/platform/components';

<Card elevated>
  Content
</Card>
```

### Modal
```tsx
import { Modal } from '@/platform/components';

<Modal open={isOpen} onClose={handleClose}>
  Modal content
</Modal>
```

### Input
```tsx
import { Input } from '@/platform/components';

<Input 
  type="text" 
  placeholder="Enter text..."
  value={value}
  onChange={setValue}
/>
```

## Component Guidelines

All components must:
- Support all 4 temperaments
- Be accessible (keyboard, screen reader)
- Be responsive (mobile-first)
- Have TypeScript types
- Include loading/error states

## Documentation

Full component documentation coming soon.

See implementations in `src/platform/components/`.

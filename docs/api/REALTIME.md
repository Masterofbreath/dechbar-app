# Realtime API

Supabase provides WebSocket-based real-time subscriptions.

## Use Cases

- Live updates when data changes
- Real-time module pricing updates
- Live session tracking
- Multiplayer features (Game module)

## Basic Subscription

```typescript
import { supabase } from '@/platform/api';

// Subscribe to module changes
const channel = supabase
  .channel('modules-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'modules',
    },
    (payload) => {
      console.log('Module updated:', payload);
      // Refetch modules in UI
    }
  )
  .subscribe();

// Cleanup
channel.unsubscribe();
```

## With React Query

```typescript
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

function useModulesRealtime() {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const channel = supabase
      .channel('modules-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'modules' },
        () => {
          // Invalidate cache when modules change
          queryClient.invalidateQueries({ queryKey: ['modules'] });
        }
      )
      .subscribe();
      
    return () => {
      channel.unsubscribe();
    };
  }, [queryClient]);
}
```

## Presence (Future)

Track online users:

```typescript
const channel = supabase.channel('room1');

// Track presence
channel.on('presence', { event: 'sync' }, () => {
  const users = channel.presenceState();
  console.log('Online users:', users);
});

// Send presence
channel.subscribe(async (status) => {
  if (status === 'SUBSCRIBED') {
    await channel.track({ user_id: currentUser.id });
  }
});
```

## Broadcast (Future)

Send messages between clients:

```typescript
// Send message
channel.send({
  type: 'broadcast',
  event: 'exercise_completed',
  payload: { exerciseId: '123' },
});

// Receive message
channel.on('broadcast', { event: 'exercise_completed' }, (payload) => {
  console.log('Someone completed exercise:', payload);
});
```

## See Also

- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [Platform API](PLATFORM_API.md)

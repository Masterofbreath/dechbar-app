/**
 * FavouriteButton - Heart icon toggle button
 * 
 * - Icon: Heart (44px touch target)
 * - States: filled (liked), outline (not liked)
 * - Toggle: onClick → save to track_favourites
 * - Color: Gold when liked, secondary when not
 * 
 * @version 2.43.0
 */

import React, { useState } from 'react';

interface FavouriteButtonProps {
  trackId: string;
  isFavourite?: boolean;
  onToggle?: (isFavourite: boolean) => void;
}

export const FavouriteButton: React.FC<FavouriteButtonProps> = ({
  trackId,
  isFavourite: initialFavourite = false,
  onToggle,
}) => {
  const [isFavourite, setIsFavourite] = useState(initialFavourite);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    
    try {
      // TODO: Save to track_favourites DB when Supabase is ready
      const newState = !isFavourite;
      setIsFavourite(newState);
      
      console.log('❤️ Favourite toggled:', { trackId, isFavourite: newState });
      
      /* FUTURE IMPLEMENTATION:
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: existing } = await supabase
        .from('track_favourites')
        .select('id')
        .eq('user_id', user.id)
        .eq('track_id', trackId)
        .maybeSingle();
      
      if (existing) {
        // Unlike
        await supabase
          .from('track_favourites')
          .delete()
          .eq('id', existing.id);
      } else {
        // Like
        await supabase
          .from('track_favourites')
          .insert({
            user_id: user.id,
            track_id: trackId,
          });
      }
      */
      
      // Callback
      if (onToggle) {
        onToggle(newState);
      }
    } catch (error) {
      console.error('Failed to toggle favourite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className="
        w-11 h-11
        rounded-full
        flex items-center justify-center
        transition-all duration-200
        hover:bg-surface-elevated
        active:scale-95
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
      "
      aria-label={isFavourite ? 'Odebrat z oblíbených' : 'Přidat do oblíbených'}
    >
      {isFavourite ? (
        // Filled heart (liked)
        <svg
          className="w-6 h-6 text-accent"
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      ) : (
        // Outline heart (not liked)
        <svg
          className="w-6 h-6 text-text-secondary"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      )}
    </button>
  );
};

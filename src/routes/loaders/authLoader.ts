/**
 * Auth Loader
 * 
 * Protects routes requiring authentication.
 * Runs BEFORE route renders, checks auth session.
 * If not authenticated → redirect to landing with return URL.
 * 
 * @package DechBar_App
 * @subpackage Routes/Loaders
 * @since 2.45.0
 */

import { redirect } from 'react-router-dom';
import { supabase } from '@/platform/api/supabase';

export async function authLoader({ request }: { request: Request }) {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    // Save intended URL for post-login redirect
    const url = new URL(request.url);
    const returnTo = encodeURIComponent(url.pathname + url.search);
    
    // Redirect to landing with returnTo param
    return redirect(`/?returnTo=${returnTo}`);
  }
  
  // User authenticated, proceed to route
  return { user: session.user };
}

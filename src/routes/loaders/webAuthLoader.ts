/**
 * Web Auth Loader
 *
 * Protects web-facing pages (outside /app) that require authentication.
 * Unlike authLoader, redirects to / WITHOUT a returnTo param —
 * used for pages like /muj-ucet where we simply send unauthenticated
 * visitors to the homepage.
 *
 * @package DechBar_App
 * @subpackage Routes/Loaders
 */

import { redirect } from 'react-router-dom';
import { supabase } from '@/platform/api/supabase';

export async function webAuthLoader() {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    return redirect('/');
  }

  return { user: session.user };
}

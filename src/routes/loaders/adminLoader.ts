/**
 * Admin Loader
 * 
 * Protects admin routes with cache-first role checking.
 * Fast response using localStorage cache (~2-5ms vs ~150ms DB fetch).
 * 
 * @package DechBar_App
 * @subpackage Routes/Loaders
 * @since 2.46.0
 */

import { redirect } from 'react-router-dom';
import { supabase } from '@/platform/api/supabase';
import { roleService } from '@/platform/auth/roleService';

export async function adminLoader() {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return redirect('/?returnTo=%2Fapp%2Fadmin');
  }
  
  try {
    // Fetch roles with cache-first strategy (FAST if cached!)
    const roles = await roleService.fetchRolesWithCache(session.user.id);
    
    const isAdmin = roles.includes('admin') || roles.includes('ceo');
    
    if (!isAdmin) {
      console.log('🔴 adminLoader: User is not admin, redirecting to /app');
      return redirect('/app?error=access_denied');
    }
    
    console.log('✅ adminLoader: User is admin, proceeding to admin panel');
    return { user: session.user, roles };
  } catch (err) {
    // Network error → fail-safe: deny access
    console.error('adminLoader: Failed to check admin status', err);
    return redirect('/app?error=network_error');
  }
}

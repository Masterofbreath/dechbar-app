/**
 * DashboardPage Component
 * 
 * Main dashboard view after user authentication
 * Placeholder for future dashboard implementation
 * 
 * @package DechBar_App
 * @subpackage Pages/Dashboard
 */

import { useAuth } from '@/platform/auth';
import { Button, Card } from '@/platform/components';
import { getGreetingName } from '@/utils/inflection';

export function DashboardPage() {
  const { user, signOut } = useAuth();

  // Get personalized greeting name (with vocative case)
  const greetingName = user?.full_name 
    ? getGreetingName(user.full_name, user.vocative_name)
    : user?.email;

  async function handleSignOut() {
    try {
      await signOut();
      // User will be redirected by ProtectedRoute
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }

  return (
    <div className="dashboard-page min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Vítej zpátky, <span className="text-[#F8CA00]">{greetingName}</span>! 🎉
          </h1>
          <p className="text-gray-600">
            Jsi úspěšně přihlášen do DechBar App
          </p>
        </div>

        {/* User Info Card */}
        <Card variant="elevated" className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Tvůj profil
          </h2>
          
          <div className="space-y-3">
            <div>
              <span className="text-sm font-semibold text-gray-500">E-mail:</span>
              <p className="text-gray-900">{user?.email}</p>
            </div>
            
            {user?.full_name && (
              <div>
                <span className="text-sm font-semibold text-gray-500">Jméno:</span>
                <p className="text-gray-900">{user.full_name}</p>
              </div>
            )}

            {user?.vocative_name && (
              <div>
                <span className="text-sm font-semibold text-gray-500">Oslovení (5. pád):</span>
                <p className="text-gray-900">{user.vocative_name}</p>
              </div>
            )}
            
            <div>
              <span className="text-sm font-semibold text-gray-500">User ID:</span>
              <p className="text-gray-900 font-mono text-sm">{user?.id}</p>
            </div>
          </div>
        </Card>

        {/* Coming Soon Card */}
        <Card variant="glass" className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🚀 Dashboard Coming Soon
          </h2>
          <p className="text-gray-600 mb-4">
            Tento dashboard je placeholder. Brzy zde bude:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>Přehled tvých aktivit</li>
            <li>Statistiky dechových cvičení</li>
            <li>Přístup k modulům (Studio, Výzvy, Akademie)</li>
            <li>Nastavení profilu</li>
            <li>Historie a progress tracking</li>
          </ul>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            variant="secondary"
            onClick={() => window.location.reload()}
          >
            Obnovit stránku
          </Button>
          
          <Button
            variant="primary"
            onClick={handleSignOut}
          >
            Odhlásit se
          </Button>
        </div>

        {/* Debug Info (for development) */}
        {import.meta.env.DEV && (
          <Card variant="elevated" className="mt-6 bg-gray-50">
            <h3 className="text-sm font-bold text-gray-700 mb-2">
              🔧 Debug Info (pouze v dev mode)
            </h3>
            <pre className="text-xs text-gray-600 overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </Card>
        )}
      </div>
    </div>
  );
}

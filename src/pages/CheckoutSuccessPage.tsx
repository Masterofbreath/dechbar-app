/**
 * Checkout Success Page
 * 
 * Displayed after successful Stripe payment
 * 
 * @package DechBar/Pages
 * @since 2026-01-20
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/platform/auth/useAuth';
import { Button } from '@/platform/components/Button';
import { Card } from '@/platform/components/Card';
import { Loader } from '@/platform/components/Loader';

export const CheckoutSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);
  
  const sessionId = searchParams.get('session_id');
  const isGuest = !user;

  useEffect(() => {
    // Give webhook time to process (3 seconds)
    const timer = setTimeout(() => {
      setIsVerifying(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--color-background)' }}>
        <Card className="max-w-md w-full text-center p-8">
          <div className="mb-6">
            <Loader size="lg" />
          </div>
          <h1 className="text-2xl font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Zpracovávám platbu...
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Ověřuji tvé předplatné. Chvilku strpení.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--color-background)' }}>
      <Card className="max-w-2xl w-full text-center p-8">
        {/* Success Icon with pulse animation */}
        <div 
          className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
          style={{ 
            backgroundColor: 'var(--color-success)',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
          }}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        {/* Conditional Content based on auth status */}
        {isGuest ? (
          <>
            {/* Guest User Content */}
            <h1 className="text-4xl font-black mb-4" style={{ color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>
              Platba byla úspěšná!
            </h1>
            <p className="text-xl mb-8" style={{ color: 'var(--color-text-secondary)' }}>
              Poslali jsme ti přihlašovací odkaz na email 📧
            </p>
            
            <div 
              className="p-6 rounded-2xl mb-8 text-left"
              style={{ 
                background: 'var(--glass-pricing-card)',
                border: '1px solid var(--color-border)',
              }}
            >
              <h3 className="font-black text-xl mb-4" style={{ color: 'var(--color-accent)' }}>
                Co dál? 🚀
              </h3>
              <ol className="space-y-3 text-left" style={{ color: 'var(--color-text-primary)' }}>
                <li className="flex items-start gap-2">
                  <span className="font-bold">1.</span>
                  <span>Otevři svůj email</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">2.</span>
                  <span>Klikni na přihlašovací odkaz</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">3.</span>
                  <span>Přihlásíš se automaticky - bez hesla!</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">4.</span>
                  <span>Vše je připravené k používání</span>
                </li>
              </ol>
            </div>
            
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              Nevidíš email? Zkontroluj spam nebo koš.
            </p>
            
            <Button
              variant="ghost"
              size="lg"
              className="w-full"
              onClick={() => navigate('/')}
            >
              Zpět na úvod
            </Button>
          </>
        ) : (
          <>
            {/* Authenticated User Content */}
            <h1 className="text-4xl font-black mb-4" style={{ color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>
              Platba byla úspěšná!
            </h1>
            <p className="text-xl mb-8" style={{ color: 'var(--color-text-secondary)' }}>
              Tvé předplatné je aktivní. Vítej v prémiové DechBar komunitě! 🎉
            </p>

        {/* CTA Buttons */}
        <div className="space-y-3 mb-10">
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => navigate('/app')}
          >
            Přejít do členské sekce →
          </Button>
          
          <Button
            variant="ghost"
            size="lg"
            className="w-full"
            onClick={() => navigate('/')}
          >
            Zpět na úvod
          </Button>
        </div>

        {/* What's Next Section */}
        <div 
          className="mt-10 p-6 rounded-2xl text-left"
          style={{ 
            background: 'linear-gradient(135deg, rgba(30, 30, 30, 0.8), rgba(30, 30, 30, 0.6))',
            border: '1px solid var(--color-border)',
          }}
        >
          <h3 className="font-black text-xl mb-4" style={{ color: 'var(--color-accent)' }}>
            Co dál? 🚀
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                <span className="text-white font-bold text-sm">1</span>
              </div>
              <div>
                <p className="font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                  Prozkoumej členskou sekci
                </p>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Všechny prémiové funkce jsou nyní odemčené a připravené k použití.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                <span className="text-white font-bold text-sm">2</span>
              </div>
              <div>
                <p className="font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                  Nastav si profil
                </p>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Personalizuj své dechové cvičení podle svých cílů a preferencí.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                <span className="text-white font-bold text-sm">3</span>
              </div>
              <div>
                <p className="font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                  Začni svůj první trénink
                </p>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Vyber si z 150+ audio programů a zahaj svou dechovou cestu.
                </p>
              </div>
            </div>
          </div>
        </div>

            {/* Confirmation Details */}
            <div 
              className="mt-6 p-4 rounded-lg text-left"
              style={{ 
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
              }}
            >
              <h3 className="font-semibold text-sm mb-2" style={{ color: 'var(--color-text-primary)' }}>
                ✅ Potvrzení
              </h3>
              <ul className="space-y-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                <li>• Platba byla úspěšně zpracována</li>
                <li>• Tvé předplatné je aktivní</li>
                <li>• Přístup k prémiové funkce odemčen</li>
                <li>• Email s potvrzením byl odeslán</li>
              </ul>
              {sessionId && (
                <p className="text-xs mt-3 opacity-50" style={{ color: 'var(--color-text-tertiary)' }}>
                  ID relace: {sessionId}
                </p>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

/**
 * LandingPage Component
 * 
 * Main landing page - public-facing marketing page
 * Routes: dechbar.cz/
 * 
 * Sections:
 * - Header (sticky with glassmorphism)
 * - Hero (headline, CTA, animated waves, screenshot)
 * - Pricing (3 tiers)
 * - Footer (4-column links + copyright)
 * 
 * @package DechBar_App
 * @subpackage Modules/PublicWeb
 */

import { useState } from 'react';
import { Header } from '../components/landing/Header';
import { HeroSection } from '../components/landing/HeroSection';
import { PricingSection } from '../components/landing/PricingSection';
import { Footer } from '../components/landing/Footer';
import { AuthModal } from '@/components/auth/AuthModal';

export function LandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'register'>('register');

  function handleCTA() {
    setAuthView('register');
    setShowAuthModal(true);
  }

  return (
    <div className="landing-page">
      {/* Header - sticky navigation */}
      <Header />

      {/* Hero - main value proposition */}
      <HeroSection onCTA={handleCTA} />

      {/* Pricing - 3 tiers */}
      <PricingSection onCTA={handleCTA} />

      {/* Footer - links and copyright */}
      <Footer />

      {/* AuthModal - shared from platform */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultView={authView}
      />
    </div>
  );
}

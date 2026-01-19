/**
 * TrustSection Component
 * 
 * Social proof section with professional endorsement + data panel
 * Conditional rendering - show endorsement only if available
 * 
 * Design: Centered quote card + 3-column data metrics
 * Based on Czech research - professional > influencer trust
 * 
 * @package DechBar_App
 * @subpackage Modules/PublicWeb
 */

interface TrustSectionProps {
  showEndorsement?: boolean;
}

export function TrustSection({ showEndorsement = true }: TrustSectionProps) {
  return (
    <section className="trust-section">
      <div className="trust-section__container">
        <h2 className="section-title">Co říkají odborníci</h2>
        
        {showEndorsement && (
          <blockquote className="professional-quote">
            <p className="professional-quote__text">
              "Funkční dýchání je jednou z nejefektivnějších metod pro regulaci nervového systému. 
              DechBar je nejlepší nástroj, který mohu svým klientům doporučit."
            </p>
            <footer className="professional-quote__attribution">
              <strong>MUDr. Jan Novák</strong>, fyzioterapeut
              <br />
              Fakultní nemocnice Motol, Praha
            </footer>
            <div className="professional-quote__note">
              * Placeholder citace - bude nahrazena reálnou
            </div>
          </blockquote>
        )}
        
        <div className="data-panel">
          <div className="data-metric">
            <div className="data-metric__number">1150+</div>
            <div className="data-metric__label">aktivních uživatelů</div>
          </div>
          
          <div className="data-metric">
            <div className="data-metric__number">+12s</div>
            <div className="data-metric__label">průměrné zlepšení KP (3 týdny)</div>
          </div>
          
          <div className="data-metric">
            <div className="data-metric__number">4,9★</div>
            <div className="data-metric__label">průměrné hodnocení (2025)</div>
          </div>
        </div>
      </div>
    </section>
  );
}

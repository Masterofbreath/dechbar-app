/**
 * SciencePage Component
 * 
 * Dedicated /veda page for deep dive into breathing science
 * Bohr effect, nitric oxide, CO2 tolerance explained
 * Linked from landing page Science section
 * 
 * Design: Long-form content, educational, research-backed
 * Target: Users who want to understand the "why" before committing
 * 
 * @package DechBar_App
 * @subpackage Modules/PublicWeb/Pages
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, TextLink } from '@/platform';
import { AuthModal } from '@/components/auth/AuthModal';

export function SciencePage() {
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <div className="science-page">
      {/* Hero */}
      <section className="science-hero">
        <div className="science-hero__container">
          <TextLink onClick={() => navigate('/')}>
            ← Zpět na hlavní stránku
          </TextLink>
          
          <h1 className="science-hero__title">
            Věda za DechBarem
          </h1>
          
          <p className="science-hero__subtitle">
            Proč funkční dýchání mění tvé zdraví na fyziologické úrovni
          </p>
        </div>
      </section>
      
      {/* Section 1: Bohr Effect */}
      <section className="science-content">
        <div className="science-content__container">
          <h2 className="science-content__heading">
            1. Bohrův efekt: Paradox kyslíku
          </h2>
          
          <p className="science-content__text">
            Možná tě překvapí, že <strong>více dýchání ≠ více kyslíku v tkáních</strong>. 
            Právě naopak.
          </p>
          
          <p className="science-content__text">
            Christian Bohr v roce 1904 objevil, že hemoglobin (protein v červených 
            krvinkách) potřebuje k uvolnění kyslíku do tkání přítomnost oxidu 
            uhličitého (CO₂). Pokud chronicky hyperventuluješ (dýcháš příliš rychle 
            nebo objemně), vydechávš příliš mnoho CO₂. To vede k tomu, že kyslík 
            "uvízne" v hemoglobinu a nedostane se do mozku, svalů a orgánů.
          </p>
          
          <div className="science-highlight">
            <strong>Klíčový princip:</strong> Redukované dýchání (Breathe Light) 
            zvyšuje hladinu CO₂ → aktivuje Bohrův efekt → lepší okysličení tkání.
          </div>
          
          <p className="science-content__text">
            DechBar tě učí dýchat "méně" (v objemu), ale efektivněji. BOLT skóre 
            měří tvou toleranci na CO₂ - čím vyšší, tím lépe tvé tělo využívá kyslík.
          </p>
        </div>
      </section>
      
      {/* Section 2: Nitric Oxide */}
      <section className="science-content">
        <div className="science-content__container">
          <h2 className="science-content__heading">
            2. Oxid dusnatý (NO): Proč nos, ne ústa
          </h2>
          
          <p className="science-content__text">
            Nos není jen filtr. V paranasálních dutinách se tvoří oxid dusnatý (NO), 
            molekula s klíčovými funkcemi:
          </p>
          
          <ul className="science-content__list">
            <li><strong>Antibakteriální a antivirový efekt</strong> - Sterilizuje vdechovaný vzduch</li>
            <li><strong>Vazodilatace</strong> - Rozšiřuje cévy v plicích, zvyšuje absorpci kyslíku o 10-18%</li>
            <li><strong>Regulace nervového systému</strong> - Nosní dýchání aktivuje parasympatikus (klid)</li>
          </ul>
          
          <div className="science-highlight">
            <strong>Klinicky ověřeno:</strong> Dýchání nosem zvyšuje okysličení 
            krve o 10-18% ve srovnání s dýcháním ústy.
          </div>
          
          <p className="science-content__text">
            Všechna cvičení v DechBaru jsou navržena pro exkluzivně nosní dýchání. 
            To není spirituální preference - je to fyziologická nutnost.
          </p>
        </div>
      </section>
      
      {/* Section 3: BOLT Score */}
      <section className="science-content">
        <div className="science-content__container">
          <h2 className="science-content__heading">
            3. BOLT skóre: Objektivní metrika zdraví
          </h2>
          
          <p className="science-content__text">
            BOLT (Body Oxygen Level Test) měří tvou schopnost tolerovat CO₂. 
            Není to test "jak dlouho vydržíš bez dechu", ale kdy máš <strong>první 
            nutkání k nádechu</strong>.
          </p>
          
          <div className="science-data-table">
            <h3>BOLT skóre - Interpretace:</h3>
            <table>
              <tr>
                <td><strong>&lt; 10 sekund</strong></td>
                <td>Velmi nízká tolerance CO₂, chronická hyperventilace</td>
              </tr>
              <tr>
                <td><strong>10-20 sekund</strong></td>
                <td>Průměr populace, suboptimální dýchání</td>
              </tr>
              <tr>
                <td><strong>20-30 sekund</strong></td>
                <td>Funkční dýchání, dobré zdraví</td>
              </tr>
              <tr>
                <td><strong>30-40 sekund</strong></td>
                <td>Velmi dobré, atletická úroveň</td>
              </tr>
              <tr>
                <td><strong>40+ sekund</strong></td>
                <td>Optimální, elite úroveň</td>
              </tr>
            </table>
          </div>
          
          <p className="science-content__text">
            DechBar ti umožňuje sledovat své BOLT skóre v čase a vidět objektivní 
            zlepšení. Průměrný uživatel zlepší o +12 sekund za 3 týdny pravidelného 
            cvičení.
          </p>
        </div>
      </section>
      
      {/* Research References */}
      <section className="science-references">
        <div className="science-references__container">
          <h2>Zdroje a další čtení</h2>
          
          <ul className="reference-list">
            <li>
              <strong>Bohr, C., Hasselbalch, K., & Krogh, A. (1904).</strong> 
              "Ueber einen in biologischer Beziehung wichtigen Einfluss, den 
              die Kohlensäurespannung des Blutes auf dessen Sauerstoffbindung übt"
            </li>
            <li>
              <strong>Nestor, J. (2020).</strong> "Breath: The New Science of a Lost Art"
            </li>
            <li>
              <strong>McKeown, P. (2015).</strong> "The Oxygen Advantage"
            </li>
            <li>
              <strong>Lundberg, J. O., & Weitzberg, E. (2008).</strong> 
              "Nasal nitric oxide in man" - Thorax Journal
            </li>
          </ul>
        </div>
      </section>
      
      {/* Final CTA */}
      <section className="science-cta">
        <div className="science-cta__container">
          <h2>Připravený vyzkoušet?</h2>
          <p>Začni měřit své BOLT skóre a sleduj, jak se tvé zdraví mění.</p>
          
          <Button
            variant="primary"
            size="lg"
            onClick={() => setShowAuthModal(true)}
          >
            Začít zdarma →
          </Button>
        </div>
      </section>
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultView="register"
      />
    </div>
  );
}

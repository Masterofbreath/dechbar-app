/**
 * PrivacyContent - Shared content for Ochrana osobních údajů
 *
 * Exported as pure data/JSX — no layout wrappers.
 * Used by:
 *   - PrivacyPage (/ochrana-osobnich-udaju) — public web with Header + Footer
 *   - AppPrivacyPage (/app/privacy)          — in-app view with back button only
 *
 * @package DechBar_App
 * @subpackage Modules/PublicWeb/Legal
 */

import type { LegalSection } from './LegalPageLayout';

export const PRIVACY_LAST_UPDATED = '23. 2. 2026';

export type DataRow = {
  category: string;
  specific: string;
  purpose: string;
  legalBasis: string;
  retention: string;
};

export const DATA_ROWS: DataRow[] = [
  {
    category: 'Identifikační',
    specific: 'E‑mail',
    purpose: 'Přihlášení, komunikace, doručování obsahu',
    legalBasis: 'Plnění smlouvy',
    retention: 'Po dobu účtu + 1 rok',
  },
  {
    category: 'Identifikační',
    specific: 'Jméno (volitelné)',
    purpose: 'Personalizace a lepší zkušenost v aplikaci',
    legalBasis: 'Oprávněný zájem',
    retention: 'Po dobu účtu + 1 rok',
  },
  {
    category: 'Platební',
    specific: 'E‑mail, jméno (dle checkoutu)',
    purpose: 'Fakturace a evidence plateb',
    legalBasis: 'Plnění smlouvy',
    retention: '10 let (daňové povinnosti)',
  },
  {
    category: 'Marketingové',
    specific: 'E‑mail',
    purpose: 'Newsletter, výzvy, obsah, o který sis řekl/řekla',
    legalBasis: 'Souhlas',
    retention: 'Do odvolání souhlasu',
  },
  {
    category: 'Technické',
    specific: 'IP adresa, user agent, technické logy',
    purpose: 'Bezpečnost, prevence zneužití, diagnostika',
    legalBasis: 'Oprávněný zájem',
    retention: '12 měsíců',
  },
  {
    category: 'Analytické',
    specific: 'Anonymizovaná data chování (např. události v aplikaci)',
    purpose: 'Zlepšení produktu a UX',
    legalBasis: 'Oprávněný zájem',
    retention: '24 měsíců',
  },
];

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    id: 'spravce',
    title: 'Správce osobních údajů',
    content: (
      <>
        <div className="legal-company">
          <p>
            <strong>Správce:</strong> Jakub Pelikán
            <br />
            <strong>IČO:</strong> 05630886
            <br />
            <strong>Sídlo:</strong> Vysoké Mýto – Domoradice 30, 566 01
            <br />
            <strong>E-mail:</strong>{' '}
            <a href="mailto:info@dechbar.cz">info@dechbar.cz</a>
            <br />
            <strong>Web:</strong> dechbar.cz
          </p>
        </div>
        <p>
          Tady najdeš informace o tom, jak DechBar pracuje s osobními údaji. Pokud ti něco
          nebude jasné, napiš nám.
        </p>
        <blockquote className="legal-quote">
          Používáním platformy DechBar — zejména přihlášením do členské sekce prostřednictvím
          e-mailové adresy — vyjadřuješ souhlas se zpracováním svých osobních údajů v souladu s
          těmito zásadami. Stejně tak souhlasíš se zpracováním osobních údajů registrací nebo
          vyplněním e-mailové adresy v jakémkoliv formuláři na platformě DechBar.
        </blockquote>
      </>
    ),
  },
  {
    id: 'udaje',
    title: 'Jaké údaje zpracováváme a proč',
    content: (
      <>
        <p>
          V přehledu níže najdeš hlavní kategorie údajů, účel, právní základ a dobu
          uchovávání.
        </p>
        <div
          className="legal-table__wrapper"
          role="region"
          aria-label="Přehled zpracování údajů"
        >
          <table className="legal-table">
            <thead>
              <tr>
                <th>Kategorie</th>
                <th>Konkrétní data</th>
                <th>Účel</th>
                <th>Právní základ</th>
                <th>Doba uchovávání</th>
              </tr>
            </thead>
            <tbody>
              {DATA_ROWS.map((row, idx) => (
                <tr key={idx}>
                  <td>{row.category}</td>
                  <td>{row.specific}</td>
                  <td>{row.purpose}</td>
                  <td>{row.legalBasis}</td>
                  <td>{row.retention}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="legal-note">
          Poznámka: Konkrétní rozsah údajů může záviset na tom, jaké funkce používáš (výzva,
          aplikace, placený produkt).
        </p>
      </>
    ),
  },
  {
    id: 'zpracovatele',
    title: 'Příjemci a zpracovatelé údajů',
    content: (
      <>
        <p>
          Údaje sdílíme jen v rozsahu nutném pro provoz služby. Typicky jde o zpracovatele,
          kteří nám pomáhají provozovat infrastrukturu.
        </p>
        <ul>
          <li>
            <strong>Supabase</strong> – autentizace a databáze (provoz aplikace).
          </li>
          <li>
            <strong>Stripe</strong> – platby a checkout.
          </li>
          <li>
            <strong>Vercel</strong> – hosting webové aplikace.
          </li>
          <li>
            <strong>Ecomail</strong> – zasílání e‑mailů (newslettery, výzvy).
          </li>
          <li>
            <strong>bunny.net</strong> – CDN / doručování médií (distribuce audio obsahu).
          </li>
          <li>Orgány veřejné moci – pokud nám to ukládá zákon.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'treti-zeme',
    title: 'Předávání do třetích zemí',
    content: (
      <>
        <p>
          Někteří poskytovatelé mohou zpracovávat údaje mimo EU/EHP (např. v USA). V takovém
          případě používáme právní mechanismy pro zajištění odpovídající ochrany – typicky
          standardní smluvní doložky (SCC) dle rozhodnutí Komise 2021/914 a další záruky dle
          smluvních podmínek poskytovatelů.
        </p>
      </>
    ),
  },
  {
    id: 'prava',
    title: 'Tvá práva (GDPR)',
    content: (
      <>
        <p>V souvislosti se zpracováním osobních údajů máš zejména tato práva:</p>
        <ul>
          <li>Právo na přístup k údajům</li>
          <li>Právo na opravu</li>
          <li>Právo na výmaz („právo být zapomenut")</li>
          <li>Právo na omezení zpracování</li>
          <li>Právo na přenositelnost</li>
          <li>Právo vznést námitku</li>
          <li>Právo kdykoli odvolat souhlas (např. u newsletteru)</li>
        </ul>
        <p>
          Stížnost můžeš podat u Úřadu pro ochranu osobních údajů (
          <a href="https://uoou.gov.cz" target="_blank" rel="noopener noreferrer">
            uoou.gov.cz
          </a>
          ). Na žádosti reagujeme bez zbytečného odkladu, nejpozději do 30 dnů.
        </p>
      </>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies a localStorage',
    content: (
      <>
        <p>
          Web a aplikace mohou používat cookies a obdobné technologie. Některé jsou technicky
          nezbytné pro správné fungování služby, jiné mohou sloužit k měření a zlepšování
          produktu.
        </p>
        <p>
          <strong>Technické cookies</strong> jsou nezbytné pro poskytování služby a typicky
          nevyžadují souhlas.
        </p>
        <p>
          <strong>Analytické cookies</strong> (pokud jsou nasazeny) používáme pro měření a
          zlepšování. Nastavení cookies můžeš změnit ve svém prohlížeči (blokování, mazání,
          režimy ochrany soukromí).
        </p>
        <p>
          Používáme také <strong>localStorage</strong> (např. pro udržení přihlášení a
          lokálních preferencí), aby služba fungovala plynule.
        </p>
      </>
    ),
  },
  {
    id: 'zabezpeceni',
    title: 'Zabezpečení',
    content: (
      <>
        <p>
          Používáme HTTPS, řízení přístupů a další technická a organizační opatření, aby byly
          údaje chráněny před neoprávněným přístupem, ztrátou nebo zneužitím.
        </p>
      </>
    ),
  },
  {
    id: 'kontakt',
    title: 'Kontakt pro GDPR záležitosti',
    content: (
      <>
        <p>
          E‑mail: <a href="mailto:info@dechbar.cz">info@dechbar.cz</a>
          <br />
          Odpovíme bez zbytečného odkladu, nejpozději do 30 dnů.
        </p>
      </>
    ),
  },
  {
    id: 'zmeny',
    title: 'Změny dokumentu',
    content: (
      <>
        <p>
          Tento dokument můžeme aktualizovat (například při změně služeb nebo poskytovatelů).
          Pokud půjde o podstatnou změnu, dáme ti vědět přiměřeným způsobem – typicky e‑mailem.
        </p>
      </>
    ),
  },
];

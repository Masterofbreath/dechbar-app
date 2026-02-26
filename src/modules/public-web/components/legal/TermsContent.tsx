/**
 * TermsContent - Shared content for Obchodní podmínky
 *
 * Exported as pure data/JSX — no layout wrappers.
 * Used by:
 *   - TermsPage (/obchodni-podminky) — public web with Header + Footer
 *   - AppTermsPage (/app/terms)       — in-app view with back button only
 *
 * @package DechBar_App
 * @subpackage Modules/PublicWeb/Legal
 */

import type { LegalSection } from './LegalPageLayout';

export const TERMS_LAST_UPDATED = '23. 2. 2026';

export const TERMS_SECTIONS: LegalSection[] = [
  {
    id: 'uvodni-ustanoveni',
    title: 'Úvodní ustanovení',
    content: (
      <>
        <div className="legal-company">
          <p>
            <strong>Provozovatel:</strong> Jakub Pelikán
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
          Tyto obchodní podmínky (dále jen „Podmínky") upravují vztah mezi provozovatelem a
          tebou jako uživatelem (spotřebitelem nebo podnikatelem) při využívání služeb a
          produktů DechBar.
        </p>
        <p>
          Podmínky se vztahují na bezplatné i placené digitální produkty a služby dostupné na
          webu dechbar.cz a v navazující aplikaci DechBar App.
        </p>
      </>
    ),
  },
  {
    id: 'produkty',
    title: 'Předmět smlouvy a produkty',
    content: (
      <>
        <p>
          Poskytujeme zejména digitální obsah a digitální služby v oblasti dechových cvičení a
          wellbeing.
        </p>
        <p>
          Naše produkty a služby jsou dostupné ve dvou obchodních modelech:
        </p>
        <ul>
          <li>
            <strong>Lifetime přístup (doživotní)</strong> – jednorázová platba za trvalý přístup
            k obsahu nebo funkci. Doživotním přístupem se rozumí přístup po celou dobu provozu
            platformy DechBar.cz. Provozovatel si vyhrazuje právo ukončit provoz platformy s
            předchozím upozorněním uživatelů.
          </li>
          <li>
            <strong>Předplatné</strong> – opakovaná platba v pravidelných intervalech (měsíčně,
            ročně nebo jinak dle nabídky). Předplatné se automaticky obnovuje, není-li v nabídce
            stanoveno jinak. Uživatel má právo předplatné kdykoli zrušit před jeho dalším
            obnovením. Zrušení předplatného nemá vliv na přístup k obsahu do konce již zaplacené
            doby.
          </li>
        </ul>
        <p>
          Konkrétní rozsah, cena, délka trvání a podmínky služby jsou uvedeny vždy u dané
          nabídky (landing page, checkout nebo přímo v aplikaci).
        </p>
      </>
    ),
  },
  {
    id: 'ucet',
    title: 'Registrace a uživatelský účet',
    content: (
      <>
        <p>
          Pro využití některých funkcí může být potřeba registrace (typicky e‑mail). Zavazuješ
          se uvádět pravdivé údaje a udržovat je aktuální.
        </p>
        <blockquote className="legal-quote">
          Vyplněním a odesláním e-mailové adresy nebo registračního formuláře vyjadřuješ souhlas
          s těmito Obchodními podmínkami a Ochranou osobních údajů. Zároveň souhlasíš se
          zpracováním tvé e-mailové adresy za účelem zasílání obsahu a informací, které jsi
          požadoval/a.
        </blockquote>
        <p>
          Přístupové údaje a odkazy udržuj v bezpečí. Pokud máš podezření na zneužití účtu,
          napiš nám co nejdřív na{' '}
          <a href="mailto:info@dechbar.cz">info@dechbar.cz</a>.
        </p>
      </>
    ),
  },
  {
    id: 'obchodni-sdeleni',
    title: 'Obchodní sdělení a newsletter',
    content: (
      <>
        <p>
          Vyplněním a odesláním e-mailové adresy prostřednictvím jakéhokoli formuláře na
          platformě DechBar (registrace, výzva, placený produkt) souhlasíš se zařazením do
          seznamu příjemců obchodních sdělení DechBar.
        </p>
        <p>
          Tato sdělení mohou zahrnovat:
        </p>
        <ul>
          <li>novinky a tipy z oblasti dýchání a wellbeing</li>
          <li>informace o nových produktech, kurzech a akcích</li>
          <li>personalizovaný obsah na základě tvého využívání platformy</li>
          <li>informace o speciálních nabídkách a slevách</li>
        </ul>
        <blockquote className="legal-quote">
          Z odběru obchodních sdělení se můžeš kdykoli odhlásit — odhlašovací odkaz je vždy
          součástí patičky každého e-mailu. Odhlášení je okamžité a bezplatné a nemá žádný vliv
          na přístup k zakoupeným službám ani na tvůj účet.
        </blockquote>
        <p>
          Zasílání obchodních sdělení zajišťuje platforma Ecomail (ecomail.cz). Tvůj e-mail je
          zpracováván v souladu s{' '}
          <a href="/ochrana-osobnich-udaju">Ochranou osobních údajů</a>.
        </p>
      </>
    ),
  },
  {
    id: 'platby',
    title: 'Platby a vracení peněz',
    content: (
      <>
        <p>
          U placených produktů probíhá platba přes Stripe. Platební údaje (např. číslo karty)
          nejsou ukládány na našich serverech – zpracování zajišťuje platební poskytovatel.
        </p>

        <h3 className="legal-subheading">Digitální obsah — zánik práva odstoupit</h3>
        <p>
          V souladu s § 1837 písm. l) zákona č. 89/2012 Sb. (občanský zákoník){' '}
          <strong>právo spotřebitele odstoupit od smlouvy zaniká</strong> u digitálního obsahu,
          který není dodán na hmotném nosiči, pokud bylo plnění zahájeno se souhlasem spotřebitele
          a ten byl poučen o zániku práva na odstoupení.
        </p>
        <p>
          Zakoupením digitálního obsahu nebo předplatného a zahájením jeho plnění
          (zpřístupněním obsahu) potvrzuješ, že jsi byl/a poučen/a o zániku práva na odstoupení
          od smlouvy a s tímto postupem souhlasíš.
        </p>

        <h3 className="legal-subheading">Produkty s dobrovolnou 7denní garancí vrácení peněz</h3>
        <p>
          U vybraných produktů nabízíme dobrovolnou 7denní garanci vrácení peněz, i přes zákonný
          zánik práva na odstoupení. Aktuální seznam produktů s touto garancí:
        </p>
        <ul>
          <li>Program REŽIM (Digitální ticho)</li>
        </ul>
        <p>
          Tento seznam budeme průběžně aktualizovat. Pokud zakoupený produkt v seznamu není,
          garance se nevztahuje. O vrácení peněz v rámci garance napiš na{' '}
          <a href="mailto:info@dechbar.cz">info@dechbar.cz</a> do 7 dnů od zakoupení.
        </p>

        <h3 className="legal-subheading">Fyzické akce a prezenční kurzy — záloha a storno</h3>
        <p>
          Závazná registrace na fyzickou akci (pobyt, kurz, workshop) nastává v okamžiku
          zaplacení <strong>zálohy ve výši 50 % z celkové ceny akce</strong>. Plná cena může
          být uhrazena zálohou i doplatkem nebo jednorázově.
        </p>
        <p>
          Storno podmínky se počítají z <strong>celkové ceny akce</strong>. Vrácená částka
          nikdy nepřesáhne reálně uhrazenou sumu.
        </p>
        <ul>
          <li>
            <strong>30 a více dní před startem akce:</strong> vrácení 100 % uhrazené částky
            (záloha i případný doplatek)
          </li>
          <li>
            <strong>15–29 dní před startem akce:</strong> vrácení 50 % zálohy (tj. 25 % z
            celkové ceny akce) — příklad: akce za 10 000 Kč, záloha 5 000 Kč → vrátíme 2 500 Kč
          </li>
          <li>
            <strong>14 a méně dní před startem akce:</strong> bez nároku na vrácení peněz —
            storno právo zaniká
          </li>
        </ul>
        <p>
          Storno podmínky mohou být individuálně upraveny v případě závažných důvodů (akutní
          nemoc, úraz nebo jiná neočekávaná překážka zabraňující účasti). Každý takový případ
          posuzuje provozovatel DechBar individuálně. Žádost zašli na{' '}
          <a href="mailto:info@dechbar.cz">info@dechbar.cz</a> co nejdříve.
        </p>

        <h3 className="legal-subheading">Výše vrácené částky</h3>
        <p>
          Vrácená částka vždy odpovídá reálně přijaté platbě po odečtení:
        </p>
        <ul>
          <li>
            <strong>Poplatků platební brány</strong> – Stripe účtuje transakční poplatky, které
            provozovatel nemůže zpětně získat. Vrácená částka je proto nižší než původně zaplacená
            cena.
          </li>
          <li>
            <strong>Poměrných provozních nákladů</strong> – u předplatného se odečítají náklady
            vzniklé za skutečně využitou část předplatného (např. náklady na AI funkce,
            zpracování dat apod.).
          </li>
        </ul>
        <p>
          U předplatného se vrácená částka vypočítá poměrně:{' '}
          <em>zaplacená částka ÷ počet dní v období × počet nevyužitých dní</em>, snížená o
          transakční poplatky a skutečné provozní náklady vzniklé v průběhu využívání.
        </p>
        <p>
          Příklad: při měsíčním předplatném 249 Kč, zrušeném 6. den, provozovatel vrátí
          poměrnou část odpovídající zbývajícím 24 dnům, sníženou o transakční poplatky a
          provozní náklady za prvních 6 dní využívání.
        </p>

        <h3 className="legal-subheading">Jak požádat o vrácení peněz</h3>
        <p>
          Napiš na <a href="mailto:info@dechbar.cz">info@dechbar.cz</a>. Uveď e‑mail použitý
          při nákupu, název produktu a důvod žádosti. Na žádosti reagujeme zpravidla do 3
          pracovních dní.
        </p>
      </>
    ),
  },
  {
    id: 'licence',
    title: 'Digitální obsah a licence',
    content: (
      <>
        <p>
          Veškerý obsah (audio, video, texty, cvičení, programy) je chráněn autorským právem.
          Zpřístupněním obsahu ti udělujeme{' '}
          <strong>nevýhradní licenci k osobnímu (nekomerčnímu) použití</strong>.
        </p>
        <p>
          Co to znamená v praxi: obsah smíš používat výhradně ty osobně, pro svou vlastní
          potřebu. Nemůžeš ho přenechat jiným osobám, zveřejňovat, kopírovat, šířit, prodávat
          ani jinak komerčně využívat. Provozovatel si uchová veškerá autorská a duševní práva
          k obsahu.
        </p>
        <p>
          Pro komerční využití obsahu (výuka, firemní použití, publikování, přednášky apod.) je
          nutný výslovný písemný souhlas provozovatele nebo zakoupení komerční licence. Zájem
          o komerční licenci zašli na{' '}
          <a href="mailto:info@dechbar.cz">info@dechbar.cz</a>.
        </p>
        <p>
          Porušení těchto podmínek může vést k okamžitému zrušení přístupu bez nároku na
          vrácení peněz a k právní odpovědnosti za způsobenou škodu.
        </p>
      </>
    ),
  },
  {
    id: 'gdpr-odkaz',
    title: 'Ochrana osobních údajů (GDPR)',
    content: (
      <>
        <p>
          Zpracování osobních údajů je podrobně popsáno v samostatném dokumentu{' '}
          <a href="/ochrana-osobnich-udaju">Ochrana osobních údajů</a>.
        </p>
        <p>
          Právním základem zpracování může být zejména plnění smlouvy, oprávněný zájem nebo
          souhlas (například u newsletteru). Poskytnutím e‑mailu a pokračováním bereš na vědomí
          zpracování údajů dle zásad uvedených v Ochraně osobních údajů.
        </p>
      </>
    ),
  },
  {
    id: 'odpovednost',
    title: 'Omezení odpovědnosti',
    content: (
      <>
        <p>
          Službu poskytujeme „tak jak je" (as‑is). Nezaručujeme dosažení konkrétních výsledků,
          protože ty závisí mimo jiné na tvém zdravotním stavu, konzistenci a dalších faktorech,
          které jsou mimo naši kontrolu.
        </p>
        <p>
          <strong>Zakoupením nebo využitím jakéhokoli produktu či služby DechBar na sebe
          uživatel přijímá plnou osobní odpovědnost za průběh, výsledky i případné následky
          svého jednání.</strong> DechBar a jeho provozovatel se v plném rozsahu zříkají
          jakékoli přímé, nepřímé nebo odvozené odpovědnosti za újmy na zdraví, majetku nebo
          jiné škody vzniklé v souvislosti s využíváním služeb.
        </p>
        <p>
          DechBar není zdravotní služba a v žádném případě nenahrazuje lékařskou péči,
          psychologickou pomoc ani jinou odbornou péči. Pokud máš jakékoli zdravotní nebo
          psychické potíže, vždy se nejprve poraď se svým lékařem nebo kvalifikovaným
          zdravotníkem.
        </p>
      </>
    ),
  },
  {
    id: 'bezpecnostni-rizika',
    title: 'Bezpečnostní rizika a kontraindikace',
    content: (
      <>
        <p>
          Dechová cvičení, dechové zádrže a techniky pracující s hyperventilací nebo
          hypoventilací mohou mít intenzivní fyziologické účinky. Některé skupiny osob by tyto
          techniky neměly provádět bez předchozí konzultace s lékařem nebo je nesmí provádět
          vůbec.
        </p>

        <h3 className="legal-subheading">Absolutní kontraindikace (neprovádět bez souhlasu lékaře)</h3>
        <ul>
          <li>Těhotné a kojící ženy</li>
          <li>
            Osoby s kardiovaskulárními onemocněními (srdeční arytmie, ischemická choroba srdeční,
            stav po infarktu, vysoký krevní tlak)
          </li>
          <li>
            Osoby s epilepsií nebo jiným neurologickým onemocněním se záchvatovitými stavy
          </li>
          <li>
            Osoby s respiračními onemocněními (těžké astma, CHOPN, pneumotorax v anamnéze)
          </li>
          <li>
            Osoby s aktivními psychotickými poruchami, těžkou úzkostnou poruchou nebo PTSD
            (aktivní fáze)
          </li>
          <li>
            Osoby po operaci hrudníku nebo s nevyhojěnými úrazy hrudní oblasti
          </li>
          <li>
            Děti a mladiství bez přítomnosti a souhlasu rodiče nebo zákonného zástupce
          </li>
          <li>Osoby pod vlivem alkoholu, omamných nebo psychotropních látek</li>
        </ul>

        <h3 className="legal-subheading">Bezpečnostní instrukce — povinné podmínky pro provádění</h3>
        <ul>
          <li>
            <strong>Nikdy ne při řízení:</strong> dechová cvičení nesmíš provádět během řízení
            jakéhokoli dopravního prostředku.
          </li>
          <li>
            <strong>Nikdy ve vodě ani v její blízkosti:</strong> zádrže dechu ve vodě nebo v
            blízkosti vody mohou způsobit ztrátu vědomí a utonutí.
          </li>
          <li>
            <strong>Nikdy při obsluze strojů nebo ve výškách:</strong> ztráta vědomí nebo
            závratě při nesprávném provádění mohou způsobit vážné zranění.
          </li>
          <li>
            <strong>Vždy v bezpečném prostředí:</strong> cvič vleže na zemi nebo v stabilním
            sedě, na místě, kde případná ztráta vědomí nebo závratě neohrožují tvůj život ani
            zdraví ostatních.
          </li>
        </ul>

        <blockquote className="legal-quote">
          Zakoupením nebo využitím jakéhokoli produktu či služby DechBar uživatel potvrzuje, že
          se seznámil s těmito bezpečnostními informacemi, jedná ze své svobodné a dobrovolné
          vůle a přijímá na sebe veškerou odpovědnost za bezpečné provádění cvičení. Pokud si
          nejsi jistý/á svým zdravotním stavem, vždy se před zahájením cvičení poraď s lékařem.
        </blockquote>
      </>
    ),
  },
  {
    id: 'zmeny',
    title: 'Změny podmínek',
    content: (
      <>
        <p>
          Vyhrazujeme si právo Podmínky upravit. Pokud půjde o změny, které mají dopad na
          tvoje práva a povinnosti, dáme ti vědět přiměřeným způsobem, typicky e‑mailem.
        </p>
        <p>
          Pokračováním ve využívání služby po účinnosti změn vyjadřuješ souhlas s aktualizovaným
          zněním Podmínek.
        </p>
      </>
    ),
  },
  {
    id: 'pravo',
    title: 'Rozhodné právo a řešení sporů',
    content: (
      <>
        <p>Tyto Podmínky se řídí právem České republiky.</p>
        <p>
          Pokud dojde ke spotřebitelskému sporu, který se nepodaří vyřešit dohodou, můžeš
          využít mimosoudní řešení sporu (ADR). Příslušným subjektem ADR je Česká obchodní
          inspekce (více informací na{' '}
          <a href="https://adr.coi.cz" target="_blank" rel="noopener noreferrer">
            adr.coi.cz
          </a>
          ).
        </p>
        <p>
          EU ODR platforma byla ukončena, proto ji zde neuvádíme jako cestu řešení sporů.
        </p>
      </>
    ),
  },
  {
    id: 'kontakt',
    title: 'Kontakt',
    content: (
      <>
        <p>
          E‑mail: <a href="mailto:info@dechbar.cz">info@dechbar.cz</a>
          <br />
          Web: dechbar.cz
        </p>
      </>
    ),
  },
];

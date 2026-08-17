# Investeringskalkulator

Prosjekter hvordan formuen din utvikler seg når du kombinerer **nedbetaling av lån**,
**høyrentekonto** og **indeksfond** (f.eks. DNB Global Indeks) — med norske skatteregler.

Alt kjører i nettleseren (React + Vite), ingen server eller database.

## Funksjoner

- **Klikkbare strategier**: «Nedbetal lånet først», «Alt i indeksfond», «50/50 lån og fond»,
  «Trygg sparing» og en egendefinert fordeling med glidebrytere. Hvert kort viser netto
  formue etter skatt i uttaksåret, så alternativene kan sammenlignes direkte.
- **Tre risikoscenarioer** (pessimistisk / forventet / optimistisk) med redigerbar
  lånerente, sparerente og aksjeavkastning.
- **Norske skatteregler**:
  - Rentefradrag: 22 % av gjeldsrentene godskrives årlig.
  - Høyrentekonto: renteinntekter beskattes med 22 % ved årsslutt.
  - Aksjesparekonto (ASK): ingen løpende skatt; ved uttak beskattes gevinst minus
    skjermingsfradrag med 22 % × 1,72 = 37,84 %. Skjerming tilskrives hvert årsskifte.
- **Uttaksår som parameter**: fondet realiseres ved slutten av valgt år, skatten trekkes,
  og nettobeløpet settes på høyrentekonto ut horisonten.
- Grafer for nettoformue over tid (per strategi eller per scenario), sammensetning av
  formuen (fond, konto, gjeld) og nøkkeltall — pluss tabellvisning av alle tall.

## Kom i gang lokalt

```bash
npm install
npm run dev        # utviklingsserver på http://localhost:5173
npm test           # kjør testene av skatte- og lånemodellen
npm run build      # produksjonsbygg til dist/
```

## Deploy til GitHub Pages

Repoet har en GitHub Actions-workflow (`.github/workflows/deploy.yml`) som bygger og
deployer automatisk:

1. Gå til **Settings → Pages** i repoet på GitHub.
2. Under **Build and deployment → Source**, velg **GitHub Actions**.
3. Push til `main` (eller kjør workflowen manuelt fra **Actions**-fanen med «Run workflow»).

Appen blir liggende på `https://<brukernavn>.github.io/investerings-kalkulator/`.

## Modellen (antakelser og forenklinger)

- Annuitetslån med månedlige terminer (nominell rente delt på 12). Terminbeløpet beregnes
  av lånebeløp, rente og nedbetalingstid — per scenario.
- **Likt totalbeløp per måned**: terminbeløp + sparebeløp er likt for alle strategier i
  samme scenario. Det som ikke går til lånet, investeres etter strategiens fordeling.
  Når lånet er nedbetalt, investeres hele beløpet videre.
- Fondet vokser jevnt (geometrisk månedlig vekst som treffer årsavkastningen eksakt);
  høyrentekontoen kapitaliseres månedlig.
- Rentefradraget godskrives ved årsslutt og brukes etter strategiens fordeling.
- Skjermingsgrunnlaget er innskuddet ved årets start pluss ubenyttet skjerming fra før.
- Alle beløp er nominelle (ikke inflasjonsjustert). Formuesskatt er ikke med i denne
  versjonen. Skattesatsene holdes konstante over horisonten, men kan redigeres i appen.

Standardsatser (redigerbare i appen): kapitalskatt 22 %, oppjusteringsfaktor 1,72
(effektivt 37,84 % på aksjegevinst), skjermingsrente 3,3 % (inntektsåret 2025).
Kilder: [Skatteetaten — skjermingsrente](https://www.skatteetaten.no/satser/skjermingsrente-for-aksjer-og-enkeltpersonforetak/),
[VFF — skatt på fond](https://vff.no/fondshandboken/artikler/skatt).

> **Merk:** Kalkulatoren er en forenklet fremskrivning til illustrasjon, ikke skatte-
> eller investeringsrådgivning.

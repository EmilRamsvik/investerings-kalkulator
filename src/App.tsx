import { useMemo, useState } from 'react'
import { AarsTabell } from './components/AarsTabell'
import { KronerFelt, ProsentFelt, TallFelt } from './components/Felter'
import { NettoformueGraf, type GrafRad } from './components/NettoformueGraf'
import { Nokkeltall } from './components/Nokkeltall'
import { SammensetningGraf } from './components/SammensetningGraf'
import { StrategiKortRad, type EgenFordeling } from './components/StrategiKort'
import type { Serie } from './components/VizBits'
import { pst } from './engine/format'
import { STANDARD_SCENARIOER, STANDARD_SKATT, STRATEGIER, type ScenarioPst } from './engine/presets'
import { simuler } from './engine/simulate'
import type { Scenario, SimInput, SimResultat, Strategi } from './engine/types'
import { useVizTema } from './theme'

type Modus = 'strategier' | 'scenarioer'

export default function App() {
  const tema = useVizTema()

  const [laanebelop, setLaanebelop] = useState(1_000_000)
  const [nedbetalingstid, setNedbetalingstid] = useState(25)
  const [startbelop, setStartbelop] = useState(100_000)
  const [maanedlig, setMaanedlig] = useState(10_000)
  const [horisont, setHorisontRaa] = useState(15)
  const [uttaksAar, setUttaksAar] = useState(15)
  const [skatt, setSkatt] = useState(STANDARD_SKATT)
  const [scenarioer, setScenarioer] = useState<ScenarioPst[]>(STANDARD_SCENARIOER)
  const [egen, setEgen] = useState<EgenFordeling>({ laan: 34, fond: 33 })
  const [aktivStrategi, setAktivStrategi] = useState('fond')
  const [aktivScenario, setAktivScenario] = useState('middels')
  const [modus, setModus] = useState<Modus>('strategier')

  const settHorisont = (h: number) => {
    setHorisontRaa(h)
    setUttaksAar((u) => Math.min(u, h))
  }

  const strategier: Strategi[] = useMemo(
    () =>
      STRATEGIER.map((s) =>
        s.id === 'egen'
          ? {
              ...s,
              ekstraLaan: egen.laan / 100,
              fond: egen.fond / 100,
              sparekonto: (100 - egen.laan - egen.fond) / 100,
            }
          : s,
      ),
    [egen],
  )

  const scenarioerEng: Scenario[] = useMemo(
    () =>
      scenarioer.map((s) => ({
        id: s.id,
        navn: s.navn,
        aksjeavkastning: s.aksjeavkastningPst / 100,
        laanerente: s.laanerentePst / 100,
        sparerente: s.sparerentePst / 100,
      })),
    [scenarioer],
  )

  const simInput: SimInput = useMemo(
    () => ({
      laanebelop,
      nedbetalingstidAar: nedbetalingstid,
      startbelop,
      maanedligSparing: maanedlig,
      horisontAar: horisont,
      uttaksAar,
      skatt: {
        kapitalskatt: skatt.kapitalskattPst / 100,
        oppjustering: skatt.oppjustering,
        skjermingsrente: skatt.skjermingsrentePst / 100,
      },
    }),
    [laanebelop, nedbetalingstid, startbelop, maanedlig, horisont, uttaksAar, skatt],
  )

  const resultater = useMemo(() => {
    const m = new Map<string, SimResultat>()
    for (const strat of strategier) {
      for (const scen of scenarioerEng) {
        m.set(`${strat.id}|${scen.id}`, simuler(simInput, scen, strat))
      }
    }
    return m
  }, [simInput, strategier, scenarioerEng])

  const res = (stratId: string, scenId: string) => resultater.get(`${stratId}|${scenId}`)

  const scenarioNavn = (id: string) => scenarioer.find((s) => s.id === id)?.navn ?? id
  const strategiNavn = (id: string) => strategier.find((s) => s.id === id)?.navn ?? id

  const serier: Serie[] =
    modus === 'strategier'
      ? strategier.map((s, i) => ({ id: s.id, navn: s.navn, farge: tema.serier[i] }))
      : scenarioer.map((s, i) => ({ id: s.id, navn: s.navn, farge: tema.serier[i] }))

  const grafData: GrafRad[] = useMemo(() => {
    const rader: GrafRad[] = []
    for (let aar = 0; aar <= horisont; aar++) {
      const rad = { aar } as GrafRad
      if (modus === 'strategier') {
        for (const s of strategier) {
          rad[s.id] = res(s.id, aktivScenario)?.rows[aar]?.nettoEtterSkatt ?? 0
        }
      } else {
        for (const sc of scenarioer) {
          rad[sc.id] = res(aktivStrategi, sc.id)?.rows[aar]?.nettoEtterSkatt ?? 0
        }
      }
      rader.push(rad)
    }
    return rader
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultater, modus, aktivScenario, aktivStrategi, horisont, strategier, scenarioer])

  const aktivRes = res(aktivStrategi, aktivScenario)
  const oppdaterScenario = (id: string, felt: keyof ScenarioPst, verdi: number) => {
    setScenarioer((prev) => prev.map((s) => (s.id === id ? { ...s, [felt]: verdi } : s)))
  }

  return (
    <div className="ramme">
      <header className="topp">
        <h1>Investeringskalkulator</h1>
        <p>
          Lån, høyrentekonto og indeksfond — med norske skatteregler for rentefradrag og
          aksjesparekonto.
        </p>
      </header>

      <div className="layout">
        <aside className="sidepanel">
          <section className="kort">
            <h2>Lån</h2>
            <KronerFelt label="Lånebeløp" verdi={laanebelop} onEndre={setLaanebelop} />
            <TallFelt
              label="Nedbetalingstid"
              verdi={nedbetalingstid}
              onEndre={setNedbetalingstid}
              min={1}
              maks={40}
              suffiks="år"
            />
          </section>

          <section className="kort">
            <h2>Sparing</h2>
            <KronerFelt label="Startbeløp (engangs)" verdi={startbelop} onEndre={setStartbelop} />
            <KronerFelt label="Månedlig sparebeløp" verdi={maanedlig} onEndre={setMaanedlig} />
            <p className="hint">
              Sparebeløpet kommer i tillegg til terminbeløpet på lånet, og fordeles etter valgt
              strategi.
            </p>
          </section>

          <section className="kort">
            <h2>Tid</h2>
            <TallFelt
              label="Horisont"
              verdi={horisont}
              onEndre={settHorisont}
              min={1}
              maks={40}
              suffiks="år"
            />
            <TallFelt
              label="Uttaksår (fondet realiseres)"
              verdi={uttaksAar}
              onEndre={(v) => setUttaksAar(Math.min(v, horisont))}
              min={1}
              maks={horisont}
              suffiks="år"
            />
            <p className="hint">
              Ved slutten av uttaksåret selges fondet, ASK-skatten betales, og nettobeløpet settes
              på høyrentekonto.
            </p>
          </section>

          <section className="kort">
            <h2>Scenarioer</h2>
            <div className="scenario-grid">
              <span />
              <span className="kolonne-topp">Lånerente</span>
              <span className="kolonne-topp">Sparerente</span>
              <span className="kolonne-topp">Aksjer</span>
              {scenarioer.map((s) => (
                <ScenarioRad key={s.id} scenario={s} onEndre={oppdaterScenario} />
              ))}
            </div>
            <p className="hint">Årlige satser i prosent. Rediger fritt — grafene oppdateres.</p>
          </section>

          <details className="kort seksjon">
            <summary>Skatteregler</summary>
            <ProsentFelt
              label="Skatt på alminnelig inntekt (renter og rentefradrag)"
              verdi={skatt.kapitalskattPst}
              onEndre={(v) => setSkatt({ ...skatt, kapitalskattPst: v })}
              maks={60}
            />
            <ProsentFelt
              label="Oppjusteringsfaktor for aksjeinntekt"
              verdi={skatt.oppjustering}
              onEndre={(v) => setSkatt({ ...skatt, oppjustering: v })}
              min={1}
              maks={3}
              steg={0.01}
              suffiks="×"
            />
            <ProsentFelt
              label="Skjermingsrente (ASK)"
              verdi={skatt.skjermingsrentePst}
              onEndre={(v) => setSkatt({ ...skatt, skjermingsrentePst: v })}
              maks={10}
            />
            <p className="hint">
              Effektiv skatt på aksjegevinst: {pst(skatt.kapitalskattPst * skatt.oppjustering)}.
              Skjermingsrenten fastsettes etterskuddsvis av Skatteetaten (3,3 % for inntektsåret
              2025).
            </p>
          </details>

          <details className="kort seksjon">
            <summary>Om modellen</summary>
            <ul>
              <li>
                Annuitetslån med månedlige terminer. Totalt månedsbeløp (termin + sparing) holdes
                likt for alle strategier, så sammenligningen er rettferdig.
              </li>
              <li>
                Når lånet er nedbetalt, investeres hele månedsbeløpet videre etter strategien
                («Nedbetal lånet først» går videre i indeksfond).
              </li>
              <li>
                Rentefradraget (22 % av årets gjeldsrenter) godskrives ved årsslutt og brukes etter
                strategiens fordeling.
              </li>
              <li>
                Høyrentekonto: månedlig kapitalisering, renteinntektene beskattes med 22 % ved
                årsslutt.
              </li>
              <li>
                Indeksfond på aksjesparekonto (ASK): ingen løpende skatt. Ved uttak beskattes
                gevinst minus skjermingsfradrag med 22 % × 1,72 = 37,84 %. Skjerming tilskrives
                hvert årsskifte.
              </li>
              <li>
                Grafene viser nettoformue <em>etter skatt</em>: fond + sparekonto − lån, fratrukket
                skatten som ville påløpt om fondet ble solgt samme år.
              </li>
              <li>
                Alle beløp er nominelle (ikke inflasjonsjustert). Formuesskatt er ikke med. Jevn
                avkastning uten volatilitet — scenarioene er ment å spenne ut usikkerheten.
              </li>
            </ul>
          </details>
        </aside>

        <main className="hoved">
          <div className="kontroll-rad">
            <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>Scenario:</span>
            <div className="chip-rad" role="group" aria-label="Velg scenario">
              {scenarioer.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="chip"
                  aria-pressed={aktivScenario === s.id}
                  onClick={() => setAktivScenario(s.id)}
                >
                  {s.navn}
                </button>
              ))}
            </div>
          </div>

          <StrategiKortRad
            strategier={strategier}
            farger={tema.serier}
            resultater={(id) => res(id, aktivScenario)}
            aktivId={aktivStrategi}
            onVelg={setAktivStrategi}
            uttaksAar={uttaksAar}
            egen={egen}
            onEgenEndre={setEgen}
          />

          <section className="kort graf-kort">
            <div className="kontroll-rad" style={{ marginBottom: 10 }}>
              <div className="segment" role="group" aria-label="Velg sammenligning">
                <button
                  type="button"
                  aria-pressed={modus === 'strategier'}
                  onClick={() => setModus('strategier')}
                >
                  Sammenlign strategier
                </button>
                <button
                  type="button"
                  aria-pressed={modus === 'scenarioer'}
                  onClick={() => setModus('scenarioer')}
                >
                  Sammenlign scenarioer
                </button>
              </div>
            </div>
            <h3>
              {modus === 'strategier'
                ? `Nettoformue etter skatt — scenario: ${scenarioNavn(aktivScenario)}`
                : `Nettoformue etter skatt — ${strategiNavn(aktivStrategi)}`}
            </h3>
            <p className="under">
              Fond + sparekonto − lån, fratrukket skatt som om fondet ble realisert samme år.
              Beløp i kroner per år.
            </p>
            <NettoformueGraf
              key={modus}
              data={grafData}
              serier={serier}
              uttaksAar={uttaksAar}
              horisont={horisont}
              tema={tema}
            />
            <AarsTabell data={grafData} serier={serier} />
          </section>

          {aktivRes && (
            <>
              <section className="kort graf-kort">
                <h3>
                  Sammensetning — {strategiNavn(aktivStrategi)} · {scenarioNavn(aktivScenario)}
                </h3>
                <p className="under">
                  Eiendeler over nullstreken, gjeld under. Linjen er nettoformue etter skatt.
                </p>
                <SammensetningGraf
                  rows={aktivRes.rows}
                  uttaksAar={uttaksAar}
                  horisont={horisont}
                  tema={tema}
                />
              </section>

              <section>
                <h3 style={{ margin: '0 0 10px', fontSize: 15 }}>
                  Nøkkeltall — {strategiNavn(aktivStrategi)} · {scenarioNavn(aktivScenario)}
                </h3>
                <Nokkeltall
                  res={aktivRes}
                  uttaksAar={uttaksAar}
                  horisont={horisont}
                  harLaan={laanebelop > 0}
                />
              </section>
            </>
          )}
        </main>
      </div>

      <footer className="bunn">
        <p>
          Forenklet fremskrivning til illustrasjon — ikke skatte- eller investeringsrådgivning.
          Skattesatser 2026: kapitalskatt 22 %, aksjeinntekt oppjusteres med 1,72 (effektivt
          37,84 %), skjermingsrente 3,3 % (2025). Satsene endres årlig og kan redigeres under
          «Skatteregler». Kilder:{' '}
          <a
            href="https://www.skatteetaten.no/satser/skjermingsrente-for-aksjer-og-enkeltpersonforetak/"
            target="_blank"
            rel="noreferrer"
          >
            Skatteetaten — skjermingsrente
          </a>{' '}
          ·{' '}
          <a href="https://vff.no/fondshandboken/artikler/skatt" target="_blank" rel="noreferrer">
            VFF — skatt på fond
          </a>
        </p>
      </footer>
    </div>
  )
}

function ScenarioRad(props: {
  scenario: ScenarioPst
  onEndre: (id: string, felt: keyof ScenarioPst, verdi: number) => void
}) {
  const { scenario: s } = props
  const felt = (feltNavn: 'laanerentePst' | 'sparerentePst' | 'aksjeavkastningPst', min: number) => (
    <input
      type="number"
      step={0.1}
      min={min}
      max={30}
      value={s[feltNavn]}
      aria-label={`${s.navn}: ${feltNavn === 'laanerentePst' ? 'lånerente' : feltNavn === 'sparerentePst' ? 'sparerente' : 'aksjeavkastning'} i prosent`}
      onChange={(e) => {
        const v = Number(e.target.value)
        if (Number.isFinite(v)) props.onEndre(s.id, feltNavn, Math.max(min, Math.min(30, v)))
      }}
    />
  )
  return (
    <>
      <span className="scenavn">{s.navn}</span>
      {felt('laanerentePst', 0)}
      {felt('sparerentePst', 0)}
      {felt('aksjeavkastningPst', -15)}
    </>
  )
}

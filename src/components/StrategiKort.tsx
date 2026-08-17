import { nok } from '../engine/format'
import type { SimResultat, Strategi } from '../engine/types'

export interface EgenFordeling {
  laan: number
  fond: number
}

/**
 * Klikkbare strategikort. Hvert kort viser strategiens netto formue etter
 * skatt i uttaksåret for valgt scenario, så alternativene kan sammenlignes
 * direkte. Kortet med høyest verdi merkes.
 */
export function StrategiKortRad(props: {
  strategier: Strategi[]
  farger: string[]
  resultater: (id: string) => SimResultat | undefined
  aktivId: string
  onVelg: (id: string) => void
  uttaksAar: number
  egen: EgenFordeling
  onEgenEndre: (e: EgenFordeling) => void
}) {
  const verdier = props.strategier.map((s) => props.resultater(s.id)?.nettoVedUttak ?? 0)
  const hoyest = Math.max(...verdier)

  return (
    <div className="strategi-grid">
      {props.strategier.map((s, i) => {
        const res = props.resultater(s.id)
        const verdi = res?.nettoVedUttak ?? 0
        const aktiv = s.id === props.aktivId
        const kontoPst = 100 - props.egen.laan - props.egen.fond
        return (
          <div
            key={s.id}
            className={`strategi-kort${aktiv ? ' aktiv' : ''}`}
            style={aktiv ? { borderColor: props.farger[i] } : undefined}
          >
            <button
              type="button"
              className="strategi-velg"
              aria-pressed={aktiv}
              onClick={() => props.onVelg(s.id)}
            >
              <div className="strategi-topp">
                <span className="serie-dot" style={{ background: props.farger[i] }} />
                <span className="strategi-navn">{s.navn}</span>
              </div>
              <div className="strategi-verdi">{nok(verdi)}</div>
              <div className="strategi-under">netto etter skatt i år {props.uttaksAar}</div>
              {verdi === hoyest && verdier.length > 1 && (
                <div className="badge-hoyest">▲ Høyest netto</div>
              )}
              <div className="strategi-besk">{s.beskrivelse}</div>
              <div className="strategi-fordeling">
                Lån {Math.round(s.ekstraLaan * 100)} % · Fond {Math.round(s.fond * 100)} % · Konto{' '}
                {Math.round(s.sparekonto * 100)} %
              </div>
            </button>
            {aktiv && s.id === 'egen' && (
              <div className="egen-panel">
                <div className="felt">
                  <label>
                    Ekstra nedbetaling: <span className="egen-verdi">{props.egen.laan} %</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={props.egen.laan}
                    onChange={(e) => {
                      const laan = Number(e.target.value)
                      props.onEgenEndre({ laan, fond: Math.min(props.egen.fond, 100 - laan) })
                    }}
                  />
                </div>
                <div className="felt">
                  <label>
                    Indeksfond: <span className="egen-verdi">{props.egen.fond} %</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100 - props.egen.laan}
                    value={props.egen.fond}
                    onChange={(e) =>
                      props.onEgenEndre({ ...props.egen, fond: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="hint">Høyrentekonto får resten: {kontoPst} %</div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

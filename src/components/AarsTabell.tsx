import { nok } from '../engine/format'
import type { Serie } from './VizBits'
import type { GrafRad } from './NettoformueGraf'

/** Tabellvisning av grafdataene — tilgjengelighetslaget for hovedgrafen. */
export function AarsTabell(props: { data: GrafRad[]; serier: Serie[] }) {
  return (
    <details className="tabell-boks">
      <summary>Vis tallene som tabell</summary>
      <div className="tabell-scroll">
        <table className="aars-tabell">
          <thead>
            <tr>
              <th scope="col">År</th>
              {props.serier.map((s) => (
                <th key={s.id} scope="col">
                  {s.navn}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {props.data.map((rad) => (
              <tr key={rad.aar}>
                <td>{rad.aar}</td>
                {props.serier.map((s) => (
                  <td key={s.id}>{nok(rad[s.id] ?? 0)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}

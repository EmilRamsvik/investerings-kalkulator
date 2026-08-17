import { aarOgMnd, nok } from '../engine/format'
import type { SimResultat } from '../engine/types'

/** Nøkkeltall for aktiv strategi i aktivt scenario. */
export function Nokkeltall(props: {
  res: SimResultat
  uttaksAar: number
  horisont: number
  harLaan: boolean
}) {
  const { res } = props
  const tiles: Array<{ label: string; verdi: string; hero?: boolean }> = [
    {
      label: `Netto formue etter skatt i år ${props.uttaksAar}`,
      verdi: nok(res.nettoVedUttak),
      hero: true,
    },
    { label: `Netto formue ved horisonten (år ${props.horisont})`, verdi: nok(res.sluttNetto) },
    { label: 'Renter betalt på lånet', verdi: props.harLaan ? nok(res.totRenter) : '—' },
    {
      label: 'Spart skatt (rentefradrag)',
      verdi: props.harLaan ? nok(res.totRentefradrag) : '—',
    },
    { label: 'Skatt ved uttak fra ASK', verdi: nok(res.uttaksskatt) },
    { label: 'Skatt på renteinntekter', verdi: nok(res.totSkattSpareRenter) },
    {
      label: 'Lån nedbetalt',
      verdi: !props.harLaan
        ? '—'
        : res.nedbetaltMnd !== null
          ? `etter ${aarOgMnd(res.nedbetaltMnd)}`
          : 'ikke innen horisonten',
    },
    {
      label: 'Terminbeløp på lånet',
      verdi: props.harLaan ? `${nok(res.terminbelop)}/mnd` : '—',
    },
  ]
  return (
    <div className="tiles">
      {tiles.map((t) => (
        <div key={t.label} className={`tile${t.hero ? ' hero' : ''}`}>
          <div className="t-label">{t.label}</div>
          <div className="t-verdi">{t.verdi}</div>
        </div>
      ))}
    </div>
  )
}

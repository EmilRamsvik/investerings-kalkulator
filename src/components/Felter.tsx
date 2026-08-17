import { useId } from 'react'

export function KronerFelt(props: {
  label: string
  verdi: number
  onEndre: (v: number) => void
  maks?: number
}) {
  const id = useId()
  const maks = props.maks ?? 100_000_000
  const vis = props.verdi.toLocaleString('nb-NO')
  return (
    <div className="felt">
      <label htmlFor={id}>{props.label}</label>
      <div className="felt-rad">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={vis}
          onChange={(e) => {
            const tall = Number(e.target.value.replace(/[^\d]/g, '')) || 0
            props.onEndre(Math.min(tall, maks))
          }}
        />
        <span className="suffiks">kr</span>
      </div>
    </div>
  )
}

export function TallFelt(props: {
  label: string
  verdi: number
  onEndre: (v: number) => void
  min: number
  maks: number
  suffiks?: string
}) {
  const id = useId()
  return (
    <div className="felt">
      <label htmlFor={id}>{props.label}</label>
      <div className="felt-rad">
        <input
          id={id}
          type="number"
          min={props.min}
          max={props.maks}
          value={props.verdi}
          onChange={(e) => {
            const tall = Number(e.target.value)
            if (Number.isFinite(tall)) {
              props.onEndre(Math.max(props.min, Math.min(props.maks, Math.round(tall))))
            }
          }}
        />
        {props.suffiks && <span className="suffiks">{props.suffiks}</span>}
      </div>
    </div>
  )
}

export function ProsentFelt(props: {
  label: string
  verdi: number
  onEndre: (v: number) => void
  min?: number
  maks?: number
  steg?: number
  suffiks?: string
}) {
  const id = useId()
  const min = props.min ?? 0
  const maks = props.maks ?? 30
  return (
    <div className="felt">
      <label htmlFor={id}>{props.label}</label>
      <div className="felt-rad">
        <input
          id={id}
          type="number"
          min={min}
          max={maks}
          step={props.steg ?? 0.1}
          value={props.verdi}
          onChange={(e) => {
            const tall = Number(e.target.value)
            if (Number.isFinite(tall)) props.onEndre(Math.max(min, Math.min(maks, tall)))
          }}
        />
        <span className="suffiks">{props.suffiks ?? '%'}</span>
      </div>
    </div>
  )
}

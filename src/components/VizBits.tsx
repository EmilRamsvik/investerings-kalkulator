import type { VizTema } from '../theme'
import { nok } from '../engine/format'

export interface Serie {
  id: string
  navn: string
  farge: string
}

/** Egen tooltip: sortert liste med fargeprikk, navn og beløp. */
export function VizTooltip(props: {
  active?: boolean
  payload?: Array<{ dataKey?: string | number; name?: string; value?: number; color?: string }>
  label?: number | string
  tema: VizTema
  sorter?: boolean
}) {
  const { active, payload, label, tema } = props
  if (!active || !payload || payload.length === 0) return null
  const rader = props.sorter === false ? payload : [...payload].sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
  return (
    <div
      style={{
        background: tema.surface,
        border: `1px solid ${tema.border}`,
        borderRadius: 8,
        padding: '8px 10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.14)',
        minWidth: 190,
      }}
    >
      <div style={{ color: tema.inkSekundaer, fontSize: 12, marginBottom: 5 }}>År {label}</div>
      {rader.map((p) => (
        <div
          key={String(p.dataKey)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12.5,
            color: tema.ink,
            marginBottom: 2,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: p.color,
              flex: 'none',
            }}
          />
          <span>{p.name}</span>
          <span style={{ marginLeft: 'auto', fontVariantNumeric: 'tabular-nums', paddingLeft: 12 }}>
            {nok(p.value ?? 0)}
          </span>
        </div>
      ))}
    </div>
  )
}

/** Klikkbar legende i fast rekkefølge; fargen følger serien, aldri plassen. */
export function Legende(props: {
  serier: Serie[]
  skjulte: Set<string>
  onToggle?: (id: string) => void
}) {
  return (
    <div className="legende" role="list">
      {props.serier.map((s) => {
        const synlig = !props.skjulte.has(s.id)
        if (!props.onToggle) {
          return (
            <span key={s.id} className="statisk" role="listitem" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--ink-2)', padding: '3px 4px' }}>
              <span className="strek" style={{ background: s.farge }} />
              {s.navn}
            </span>
          )
        }
        return (
          <button
            key={s.id}
            type="button"
            aria-pressed={synlig}
            onClick={() => props.onToggle!(s.id)}
            title={synlig ? `Skjul ${s.navn}` : `Vis ${s.navn}`}
          >
            <span className="strek" style={{ background: s.farge }} />
            {s.navn}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Direktemerking ved linjeslutt (Customized-lag i Recharts). Teksten står i
 * ink (aldri seriefargen); linjeenden ved siden av bærer identiteten.
 * Posisjoner forskyves så etiketter ikke kolliderer.
 */
export function lagEndeEtiketter(opts: {
  serier: Serie[]
  sisteRad: Record<string, number> & { aar: number }
  tema: VizTema
}) {
  return function EndeEtiketter(rp: Record<string, unknown>) {
    const xMapObj = rp.xAxisMap as Record<string, { scale: (v: number) => number }> | undefined
    const yMapObj = rp.yAxisMap as Record<string, { scale: (v: number) => number }> | undefined
    if (!xMapObj || !yMapObj) return <g />
    const xAkse = Object.values(xMapObj)[0]
    const yAkse = Object.values(yMapObj)[0]
    if (!xAkse || !yAkse) return <g />
    const x = xAkse.scale(opts.sisteRad.aar) + 8

    const punkter = opts.serier
      .map((s) => ({ ...s, y: yAkse.scale(opts.sisteRad[s.id] ?? 0) }))
      .sort((a, b) => a.y - b.y)
    for (let i = 1; i < punkter.length; i++) {
      if (punkter[i].y - punkter[i - 1].y < 14) punkter[i].y = punkter[i - 1].y + 14
    }
    return (
      <g>
        {punkter.map((p) => (
          <text
            key={p.id}
            x={x}
            y={p.y}
            fill={opts.tema.ink}
            fontSize={12}
            dominantBaseline="central"
          >
            {p.navn}
          </text>
        ))}
      </g>
    )
  }
}

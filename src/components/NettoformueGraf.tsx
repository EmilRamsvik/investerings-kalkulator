import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  Customized,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { nokKompakt } from '../engine/format'
import type { VizTema } from '../theme'
import { Legende, VizTooltip, lagEndeEtiketter, type Serie } from './VizBits'

export interface GrafRad extends Record<string, number> {
  aar: number
}

/**
 * Hovedgrafen: nettoformue etter skatt per år, én linje per serie
 * (strategier eller scenarioer). Legenden kan skjule serier; med fire eller
 * færre synlige serier direktemerkes linjene ved enden.
 */
export function NettoformueGraf(props: {
  data: GrafRad[]
  serier: Serie[]
  uttaksAar: number
  horisont: number
  tema: VizTema
}) {
  const { tema } = props
  const [skjulte, setSkjulte] = useState<Set<string>>(new Set())

  const synlige = props.serier.filter((s) => !skjulte.has(s.id))
  const merkes = synlige.length <= 4 && props.data.length > 0

  const ticks = useMemo(() => {
    const steg = props.horisont > 24 ? 5 : props.horisont > 12 ? 2 : 1
    const t: number[] = []
    for (let a = 0; a <= props.horisont; a += steg) t.push(a)
    if (t[t.length - 1] !== props.horisont) t.push(props.horisont)
    return t
  }, [props.horisont])

  const toggle = (id: string) => {
    setSkjulte((gamle) => {
      const ny = new Set(gamle)
      if (ny.has(id)) ny.delete(id)
      else if (props.serier.length - ny.size > 1) ny.add(id)
      return ny
    })
  }

  const sisteRad = props.data[props.data.length - 1]

  return (
    <div>
      <Legende serier={props.serier} skjulte={skjulte} onToggle={toggle} />
      <ResponsiveContainer width="100%" height={360}>
        <LineChart
          data={props.data}
          margin={{ top: 12, right: merkes ? 150 : 20, bottom: 4, left: 8 }}
        >
          <CartesianGrid vertical={false} stroke={tema.grid} />
          <XAxis
            dataKey="aar"
            type="number"
            domain={[0, props.horisont]}
            ticks={ticks}
            tickLine={false}
            axisLine={{ stroke: tema.baseline }}
            tick={{ fill: tema.muted, fontSize: 12 }}
          />
          <YAxis
            tickFormatter={nokKompakt}
            width={72}
            tickLine={false}
            axisLine={false}
            tick={{ fill: tema.muted, fontSize: 12 }}
          />
          <Tooltip
            content={<VizTooltip tema={tema} />}
            cursor={{ stroke: tema.muted, strokeDasharray: '3 3' }}
          />
          {props.uttaksAar < props.horisont && (
            <ReferenceLine
              x={props.uttaksAar}
              stroke={tema.muted}
              strokeDasharray="4 4"
              label={{ value: 'Uttak', position: 'insideTopLeft', fill: tema.muted, fontSize: 11 }}
            />
          )}
          {synlige.map((s) => (
            <Line
              key={s.id}
              dataKey={s.id}
              name={s.navn}
              stroke={s.farge}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, stroke: tema.surface, strokeWidth: 2 }}
              isAnimationActive={false}
            />
          ))}
          {merkes && sisteRad && (
            <Customized
              key={synlige.map((s) => s.id).join('|')}
              component={lagEndeEtiketter({ serier: synlige, sisteRad, tema })}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

import { useMemo } from 'react'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { nokKompakt } from '../engine/format'
import type { AarsRad } from '../engine/types'
import type { VizTema } from '../theme'
import { Legende, VizTooltip } from './VizBits'

/**
 * Sammensetningen for én strategi i ett scenario: fond og sparekonto stables
 * over null, gjelden ligger under null, og nettoformuen etter skatt tegnes
 * som linje i ink. 2 px surface-strek gir lufterom mellom feltene.
 */
export function SammensetningGraf(props: {
  rows: AarsRad[]
  uttaksAar: number
  horisont: number
  tema: VizTema
}) {
  const { tema } = props
  const blaa = tema.serier[0]
  const oransje = tema.serier[1]
  const akva = tema.serier[2]

  const data = useMemo(
    () =>
      props.rows.map((r) => ({
        aar: r.aar,
        fond: r.fondVerdi,
        sparekonto: r.sparekonto,
        gjeld: -r.laan,
        netto: r.nettoEtterSkatt,
      })),
    [props.rows],
  )

  const ticks = useMemo(() => {
    const steg = props.horisont > 24 ? 5 : props.horisont > 12 ? 2 : 1
    const t: number[] = []
    for (let a = 0; a <= props.horisont; a += steg) t.push(a)
    if (t[t.length - 1] !== props.horisont) t.push(props.horisont)
    return t
  }, [props.horisont])

  const serier = [
    { id: 'fond', navn: 'Indeksfond (ASK)', farge: blaa },
    { id: 'sparekonto', navn: 'Høyrentekonto', farge: akva },
    { id: 'gjeld', navn: 'Lån (gjeld)', farge: oransje },
    { id: 'netto', navn: 'Netto etter skatt', farge: tema.ink },
  ]

  return (
    <div>
      <Legende serier={serier} skjulte={new Set()} />
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 12, right: 20, bottom: 4, left: 8 }}>
          <CartesianGrid vertical={false} stroke={tema.grid} />
          <XAxis
            dataKey="aar"
            type="number"
            domain={[0, props.horisont]}
            ticks={ticks}
            tickLine={false}
            axisLine={false}
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
            content={<VizTooltip tema={tema} sorter={false} />}
            cursor={{ stroke: tema.muted, strokeDasharray: '3 3' }}
          />
          <ReferenceLine y={0} stroke={tema.baseline} />
          {props.uttaksAar < props.horisont && (
            <ReferenceLine
              x={props.uttaksAar}
              stroke={tema.muted}
              strokeDasharray="4 4"
              label={{ value: 'Uttak', position: 'insideTopLeft', fill: tema.muted, fontSize: 11 }}
            />
          )}
          <Area
            dataKey="fond"
            name="Indeksfond (ASK)"
            stackId="aktiva"
            fill={blaa}
            fillOpacity={1}
            stroke={tema.surface}
            strokeWidth={2}
            isAnimationActive={false}
          />
          <Area
            dataKey="sparekonto"
            name="Høyrentekonto"
            stackId="aktiva"
            fill={akva}
            fillOpacity={1}
            stroke={tema.surface}
            strokeWidth={2}
            isAnimationActive={false}
          />
          <Area
            dataKey="gjeld"
            name="Lån (gjeld)"
            fill={oransje}
            fillOpacity={1}
            stroke={tema.surface}
            strokeWidth={2}
            isAnimationActive={false}
          />
          <Line
            dataKey="netto"
            name="Netto etter skatt"
            stroke={tema.ink}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, stroke: tema.surface, strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

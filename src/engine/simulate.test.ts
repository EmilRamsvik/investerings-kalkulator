import { describe, expect, it } from 'vitest'
import { annuitetsbelop, simuler } from './simulate'
import type { Scenario, SimInput, Strategi } from './types'

const SKATT = { kapitalskatt: 0.22, oppjustering: 1.72, skjermingsrente: 0.03 }

const scenario = (over: Partial<Scenario> = {}): Scenario => ({
  id: 'test',
  navn: 'Test',
  aksjeavkastning: 0.07,
  laanerente: 0.05,
  sparerente: 0.04,
  ...over,
})

const strategi = (over: Partial<Strategi> = {}): Strategi => ({
  id: 'test',
  navn: 'Test',
  beskrivelse: '',
  ekstraLaan: 0,
  fond: 0,
  sparekonto: 1,
  ...over,
})

const input = (over: Partial<SimInput> = {}): SimInput => ({
  laanebelop: 0,
  nedbetalingstidAar: 25,
  startbelop: 0,
  maanedligSparing: 0,
  horisontAar: 10,
  uttaksAar: 10,
  skatt: SKATT,
  ...over,
})

describe('annuitetsbelop', () => {
  it('gir kjent terminbeløp for 1 mill., 5 %, 25 år', () => {
    // Fasit: 5 845,90 kr/mnd (standard annuitetsformel med rente/12)
    expect(annuitetsbelop(1_000_000, 0.05, 25)).toBeCloseTo(5845.9, 1)
  })

  it('håndterer nullrente og null lån', () => {
    expect(annuitetsbelop(120_000, 0, 10)).toBeCloseTo(1000, 6)
    expect(annuitetsbelop(0, 0.05, 25)).toBe(0)
  })
})

describe('lån', () => {
  it('er nedbetalt nøyaktig ved slutten av nedbetalingstiden uten ekstra avdrag', () => {
    const res = simuler(
      input({ laanebelop: 1_000_000, nedbetalingstidAar: 10, horisontAar: 10 }),
      scenario(),
      strategi(),
    )
    expect(res.rows[10].laan).toBeLessThan(1)
    expect(res.nedbetaltMnd).toBe(120)
  })

  it('nedbetales raskere med ekstra avdrag', () => {
    const uten = simuler(
      input({ laanebelop: 1_000_000, nedbetalingstidAar: 25, horisontAar: 25 }),
      scenario(),
      strategi(),
    )
    const med = simuler(
      input({
        laanebelop: 1_000_000,
        nedbetalingstidAar: 25,
        horisontAar: 25,
        maanedligSparing: 5000,
      }),
      scenario(),
      strategi({ ekstraLaan: 1, sparekonto: 0 }),
    )
    expect(uten.nedbetaltMnd).toBe(300)
    expect(med.nedbetaltMnd).not.toBeNull()
    expect(med.nedbetaltMnd!).toBeLessThan(200)
    expect(med.totRenter).toBeLessThan(uten.totRenter)
  })

  it('gir rentefradrag på 22 % av betalte renter', () => {
    const res = simuler(
      input({ laanebelop: 1_000_000, nedbetalingstidAar: 25, horisontAar: 5, uttaksAar: 5 }),
      scenario(),
      strategi(),
    )
    expect(res.totRentefradrag).toBeCloseTo(res.totRenter * 0.22, 6)
    expect(res.totRenter).toBeGreaterThan(0)
  })
})

describe('høyrentekonto', () => {
  it('kapitaliserer månedlig og trekker 22 % skatt av renteinntektene ved årsslutt', () => {
    const res = simuler(
      input({ startbelop: 100_000, horisontAar: 1, uttaksAar: 1 }),
      scenario({ sparerente: 0.04 }),
      strategi({ sparekonto: 1 }),
    )
    // 100 000 × ((1 + 0,04/12)^12 − 1) = 4 074,15 i renter, minus 22 % skatt
    const renter = 100_000 * (Math.pow(1 + 0.04 / 12, 12) - 1)
    expect(res.rows[1].sparekonto).toBeCloseTo(100_000 + renter * 0.78, 0)
    expect(res.totSkattSpareRenter).toBeCloseTo(renter * 0.22, 0)
  })
})

describe('aksjesparekonto (ASK)', () => {
  it('beregner skjerming, oppjustert gevinstskatt og netto ved uttak', () => {
    // 100 000 inn ved t=0, 10 % årlig i 2 år → 121 000.
    // Skjerming: år 1: 100 000 × 3 % = 3 000; år 2: 103 000 × 3 % = 3 090. Sum 6 090.
    // Skatt: (21 000 − 6 090) × 1,72 × 0,22 = 5 641,94. Netto: 115 358,06.
    const res = simuler(
      input({ startbelop: 100_000, horisontAar: 2, uttaksAar: 2 }),
      scenario({ aksjeavkastning: 0.1, sparerente: 0 }),
      strategi({ fond: 1, sparekonto: 0 }),
    )
    expect(res.uttaksskatt).toBeCloseTo(5641.94, 1)
    expect(res.uttakNetto).toBeCloseTo(115_358.06, 1)
    expect(res.rows[2].fondVerdi).toBe(0)
    expect(res.rows[2].sparekonto).toBeCloseTo(115_358.06, 1)
    expect(res.nettoVedUttak).toBeCloseTo(115_358.06, 1)
  })

  it('skattlegger ikke fondet før uttaksåret, men viser latent skatt i nettoEtterSkatt', () => {
    const res = simuler(
      input({ startbelop: 100_000, horisontAar: 5, uttaksAar: 5 }),
      scenario({ aksjeavkastning: 0.1, sparerente: 0 }),
      strategi({ fond: 1, sparekonto: 0 }),
    )
    const r2 = res.rows[2]
    expect(r2.fondVerdi).toBeCloseTo(121_000, 0)
    expect(r2.nettoEtterSkatt).toBeLessThan(r2.nettoFormue)
    expect(r2.nettoEtterSkatt).toBeCloseTo(115_358.06, 1)
  })

  it('gir null skatt når skjermingen dekker gevinsten', () => {
    const res = simuler(
      input({ startbelop: 100_000, horisontAar: 2, uttaksAar: 2 }),
      scenario({ aksjeavkastning: 0.01, sparerente: 0 }),
      strategi({ fond: 1, sparekonto: 0 }),
    )
    // Gevinst 2 010 < skjerming 6 090 → ingen skatt
    expect(res.uttaksskatt).toBe(0)
    expect(res.uttakNetto).toBeCloseTo(102_010, 0)
  })
})

describe('strategier', () => {
  it('holder totalt månedlig utlegg likt på tvers av strategier', () => {
    // Med samme scenario skal sum innbetalt (termin + sparing) være lik, så
    // forskjeller i sluttformue skyldes kun fordelingen — ikke ulikt utlegg.
    const base = input({
      laanebelop: 1_000_000,
      nedbetalingstidAar: 25,
      maanedligSparing: 8000,
      horisontAar: 15,
      uttaksAar: 15,
    })
    const a = simuler(base, scenario(), strategi({ ekstraLaan: 1, sparekonto: 0 }))
    const b = simuler(base, scenario(), strategi({ fond: 1, sparekonto: 0 }))
    expect(a.terminbelop).toBeCloseTo(b.terminbelop, 6)
    // Begge har positiv formue og lånet redusert
    expect(a.rows[15].nettoEtterSkatt).toBeGreaterThan(0)
    expect(b.rows[15].nettoEtterSkatt).toBeGreaterThan(0)
  })

  it('flytter hele beløpet til fond når lånet er nedbetalt i «nedbetal først»', () => {
    const res = simuler(
      input({
        laanebelop: 500_000,
        nedbetalingstidAar: 25,
        maanedligSparing: 10_000,
        horisontAar: 15,
        uttaksAar: 15,
      }),
      scenario(),
      strategi({ ekstraLaan: 1, sparekonto: 0 }),
    )
    expect(res.nedbetaltMnd).not.toBeNull()
    expect(res.rows[15].laan).toBe(0)
    // Etter nedbetaling skal fondet ha fått innskudd
    expect(res.rows[15].sparekonto).toBeGreaterThanOrEqual(0)
    expect(res.rows[14].fondInnskudd).toBeGreaterThan(0)
  })
})

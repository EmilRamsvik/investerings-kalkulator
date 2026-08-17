import type { AarsRad, Scenario, SimInput, SimResultat, Skatteregler, Strategi } from './types'

/** Månedlig terminbeløp for et annuitetslån (nominell rente, rente/12 per måned). */
export function annuitetsbelop(laan: number, aarsrente: number, aar: number): number {
  if (laan <= 0 || aar <= 0) return 0
  const r = aarsrente / 12
  const n = aar * 12
  if (r === 0) return laan / n
  return (laan * r) / (1 - Math.pow(1 + r, -n))
}

/** ASK-skatt ved fullt uttak: (gevinst − skjerming) × oppjustering × kapitalskatt. */
export function askSkatt(
  verdi: number,
  innskudd: number,
  skjerming: number,
  skatt: Skatteregler,
): number {
  const gevinst = verdi - innskudd
  const skattepliktig = Math.max(0, gevinst - skjerming)
  return skattepliktig * skatt.oppjustering * skatt.kapitalskatt
}

/**
 * Simulerer én strategi i ett scenario, måned for måned.
 *
 * Modell:
 * - Totalt månedlig utlegg = terminbeløp + sparebeløp, likt for alle strategier
 *   i samme scenario. Det som ikke går til lånet, investeres etter strategiens
 *   fordeling. Når lånet er nedbetalt, investeres hele beløpet videre.
 * - Fondet vokser geometrisk (årsavkastningen treffes eksakt); lån og
 *   sparekonto bruker nominell rente delt på 12, med månedlig kapitalisering.
 * - Renteinntekter beskattes 22 % ved årsslutt; rentefradraget (22 % av årets
 *   gjeldsrenter) godskrives ved årsslutt og brukes etter strategiens fordeling.
 * - ASK: skjermingsfradrag tilskrives hvert årsskifte (innskudd ved årets start
 *   + ubenyttet skjerming, ganger skjermingsrenten). I uttaksåret selges alt
 *   ved årets slutt, skatten trekkes, og nettobeløpet settes på høyrentekonto.
 */
export function simuler(input: SimInput, scenario: Scenario, strategi: Strategi): SimResultat {
  const { skatt } = input
  const mndAksje = Math.pow(1 + scenario.aksjeavkastning, 1 / 12) - 1
  const mndSpare = scenario.sparerente / 12
  const mndLaan = scenario.laanerente / 12
  const terminbelop = annuitetsbelop(input.laanebelop, scenario.laanerente, input.nedbetalingstidAar)

  let laan = input.laanebelop
  let fondVerdi = 0
  let fondInnskudd = 0
  let skjerming = 0
  let innskuddVedAarsstart = 0
  let sparekonto = 0
  let fondSolgt = false

  let mndNaa = 0
  let nedbetaltMnd: number | null = laan <= 0 ? 0 : null

  let totRenter = 0
  let totRentefradrag = 0
  let totSkattSpareRenter = 0
  let uttaksskatt = 0
  let uttakNetto = 0

  /** Fordeling av investerbare penger mellom fond og sparekonto. */
  const investeringsvekter = (): { f: number; s: number } => {
    let wF = fondSolgt ? 0 : strategi.fond
    let wS = strategi.sparekonto + (fondSolgt ? strategi.fond : 0)
    const sum = wF + wS
    // Ren nedbetalingsstrategi uten investeringsvekter: overskudd går til fond
    // (eller sparekonto etter at fondet er realisert).
    if (sum <= 0) return fondSolgt ? { f: 0, s: 1 } : { f: 1, s: 0 }
    return { f: wF / sum, s: wS / sum }
  }

  const invester = (belop: number) => {
    if (belop <= 0) return
    const { f, s } = investeringsvekter()
    fondVerdi += belop * f
    fondInnskudd += belop * f
    sparekonto += belop * s
  }

  /** Betaler ekstra avdrag, returnerer det som ikke fikk plass på lånet. */
  const ekstraAvdrag = (belop: number): number => {
    if (laan <= 0 || belop <= 0) return belop
    const brukt = Math.min(belop, laan)
    laan -= brukt
    if (laan <= 1e-9) {
      laan = 0
      if (nedbetaltMnd === null) nedbetaltMnd = mndNaa
    }
    return belop - brukt
  }

  /** Fordeler et beløp etter strategien: lånedel først, resten investeres. */
  const fordel = (belop: number) => {
    if (belop <= 0) return
    const tilLaan = belop * strategi.ekstraLaan
    const rest = ekstraAvdrag(tilLaan)
    invester(belop - tilLaan + rest)
  }

  // Startbeløpet plasseres ved t = 0.
  fordel(input.startbelop)
  innskuddVedAarsstart = fondInnskudd

  const lagRad = (aar: number): AarsRad => {
    const latent = fondSolgt ? 0 : askSkatt(fondVerdi, fondInnskudd, skjerming, skatt)
    const bruttoFormue = fondVerdi + sparekonto
    const nettoFormue = bruttoFormue - laan
    return {
      aar,
      laan,
      fondVerdi,
      fondInnskudd,
      sparekonto,
      bruttoFormue,
      nettoFormue,
      nettoEtterSkatt: nettoFormue - latent,
    }
  }

  const rows: AarsRad[] = [lagRad(0)]

  let renterIAar = 0
  let spareRenterIAar = 0

  const antallMnd = input.horisontAar * 12
  for (let m = 1; m <= antallMnd; m++) {
    mndNaa = m

    // 1) Avkastning og renter
    fondVerdi *= 1 + mndAksje
    const spareRente = sparekonto * mndSpare
    sparekonto += spareRente
    spareRenterIAar += spareRente

    // 2) Terminbetaling på lånet. Frigjort terminbeløp investeres.
    let ledig = 0
    if (laan > 0) {
      const rente = laan * mndLaan
      renterIAar += rente
      totRenter += rente
      const betaling = Math.min(terminbelop, laan + rente)
      laan = laan + rente - betaling
      ledig = terminbelop - betaling
      if (laan <= 1e-9) {
        laan = 0
        if (nedbetaltMnd === null) nedbetaltMnd = m
      }
    } else {
      ledig = terminbelop
    }

    // 3) Månedlig sparebeløp etter strategien + frigjort terminbeløp
    fordel(input.maanedligSparing)
    invester(ledig)

    // 4) Årsslutt: skatt, rentefradrag, skjerming og eventuelt uttak
    if (m % 12 === 0) {
      const aar = m / 12

      const skattPaaRenter = spareRenterIAar * skatt.kapitalskatt
      sparekonto -= skattPaaRenter
      totSkattSpareRenter += skattPaaRenter
      spareRenterIAar = 0

      const fradrag = renterIAar * skatt.kapitalskatt
      totRentefradrag += fradrag
      renterIAar = 0
      fordel(fradrag)

      if (!fondSolgt) {
        skjerming += (innskuddVedAarsstart + skjerming) * skatt.skjermingsrente
        innskuddVedAarsstart = fondInnskudd
      }

      if (aar === input.uttaksAar && !fondSolgt) {
        uttaksskatt = askSkatt(fondVerdi, fondInnskudd, skjerming, skatt)
        uttakNetto = fondVerdi - uttaksskatt
        sparekonto += uttakNetto
        fondVerdi = 0
        fondInnskudd = 0
        skjerming = 0
        fondSolgt = true
      }

      rows.push(lagRad(aar))
    }
  }

  const uttaksRad = rows[Math.min(input.uttaksAar, input.horisontAar)]
  return {
    rows,
    terminbelop,
    totRenter,
    totRentefradrag,
    totSkattSpareRenter,
    uttaksskatt,
    uttakNetto,
    nedbetaltMnd,
    nettoVedUttak: uttaksRad ? uttaksRad.nettoEtterSkatt : 0,
    sluttNetto: rows[rows.length - 1].nettoEtterSkatt,
  }
}

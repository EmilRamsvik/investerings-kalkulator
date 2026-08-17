/** Skattesatser. Alle satser er brøker (0.22 = 22 %), oppjustering er en faktor. */
export interface Skatteregler {
  /** Skatt på alminnelig inntekt: renteinntekter, rentefradrag (0.22) */
  kapitalskatt: number
  /** Oppjusteringsfaktor for aksjeinntekt (1.72 → effektivt 37,84 %) */
  oppjustering: number
  /** Skjermingsrente for ASK, fastsettes årlig (0.033 for 2025) */
  skjermingsrente: number
}

/** Et risikoscenario. Renter og avkastning er årlige brøker. */
export interface Scenario {
  id: string
  navn: string
  /** Forventet årlig avkastning i indeksfond */
  aksjeavkastning: number
  /** Nominell årlig lånerente */
  laanerente: number
  /** Nominell årlig rente på høyrentekonto */
  sparerente: number
}

/**
 * En strategi fordeler det månedlige sparebeløpet (og startbeløpet).
 * Vektene er brøker som summerer til 1.
 */
export interface Strategi {
  id: string
  navn: string
  beskrivelse: string
  /** Andel til ekstra nedbetaling av lån */
  ekstraLaan: number
  /** Andel til indeksfond (ASK) */
  fond: number
  /** Andel til høyrentekonto */
  sparekonto: number
}

export interface SimInput {
  laanebelop: number
  nedbetalingstidAar: number
  startbelop: number
  maanedligSparing: number
  horisontAar: number
  /** Året fondet realiseres (1..horisontAar). ASK-skatt betales ved årets slutt. */
  uttaksAar: number
  skatt: Skatteregler
}

/** Tilstanden ved slutten av et år (år 0 = start). */
export interface AarsRad {
  aar: number
  laan: number
  fondVerdi: number
  fondInnskudd: number
  sparekonto: number
  /** fond + sparekonto */
  bruttoFormue: number
  /** fond + sparekonto − lån, uten latent skatt */
  nettoFormue: number
  /** nettoFormue minus latent ASK-skatt hvis fondet ble solgt nå */
  nettoEtterSkatt: number
}

export interface SimResultat {
  rows: AarsRad[]
  /** Månedlig terminbeløp på lånet (annuitet) */
  terminbelop: number
  totRenter: number
  /** Sum spart skatt fra rentefradraget */
  totRentefradrag: number
  /** Sum skatt betalt på renteinntekter fra høyrentekonto */
  totSkattSpareRenter: number
  /** ASK-skatt betalt i uttaksåret */
  uttaksskatt: number
  /** Nettobeløp fra fondssalget i uttaksåret */
  uttakNetto: number
  /** Måned lånet var nedbetalt (null = ikke nedbetalt i perioden) */
  nedbetaltMnd: number | null
  /** Netto formue etter skatt ved slutten av uttaksåret */
  nettoVedUttak: number
  /** Netto formue etter skatt ved horisonten */
  sluttNetto: number
}

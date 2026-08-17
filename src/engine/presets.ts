import type { Strategi } from './types'

/**
 * Standardsatser. Prosentverdier (redigerbare i UI), konverteres til brøker
 * før simulering. Kilder: skatteetaten.no — skjermingsrente 3,3 % for 2025,
 * oppjusteringsfaktor 1,72 og kapitalskatt 22 % for 2026.
 */
export const STANDARD_SKATT = {
  kapitalskattPst: 22,
  oppjustering: 1.72,
  skjermingsrentePst: 3.3,
}

/** Prosentverdier, redigerbare i UI. */
export interface ScenarioPst {
  id: string
  navn: string
  aksjeavkastningPst: number
  laanerentePst: number
  sparerentePst: number
}

export const STANDARD_SCENARIOER: ScenarioPst[] = [
  { id: 'lav', navn: 'Pessimistisk', aksjeavkastningPst: 3, laanerentePst: 6.5, sparerentePst: 5 },
  { id: 'middels', navn: 'Forventet', aksjeavkastningPst: 7, laanerentePst: 5, sparerentePst: 4 },
  { id: 'hoy', navn: 'Optimistisk', aksjeavkastningPst: 10, laanerentePst: 3.5, sparerentePst: 2.5 },
]

export const STRATEGIER: Strategi[] = [
  {
    id: 'nedbetal',
    navn: 'Nedbetal lånet først',
    beskrivelse: 'Alt ekstra går til lånet. Når det er nedbetalt, går hele beløpet i indeksfond.',
    ekstraLaan: 1,
    fond: 0,
    sparekonto: 0,
  },
  {
    id: 'fond',
    navn: 'Alt i indeksfond',
    beskrivelse: 'Betal vanlig termin på lånet, og sett hele sparebeløpet i indeksfond (ASK).',
    ekstraLaan: 0,
    fond: 1,
    sparekonto: 0,
  },
  {
    id: 'femtifemti',
    navn: '50/50 lån og fond',
    beskrivelse: 'Halvparten til ekstra nedbetaling, halvparten i indeksfond.',
    ekstraLaan: 0.5,
    fond: 0.5,
    sparekonto: 0,
  },
  {
    id: 'trygg',
    navn: 'Trygg sparing',
    beskrivelse: 'Betal vanlig termin, og sett sparebeløpet på høyrentekonto.',
    ekstraLaan: 0,
    fond: 0,
    sparekonto: 1,
  },
  {
    id: 'egen',
    navn: 'Egendefinert',
    beskrivelse: 'Velg din egen fordeling mellom lån, fond og høyrentekonto.',
    ekstraLaan: 0.34,
    fond: 0.33,
    sparekonto: 0.33,
  },
]

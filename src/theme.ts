import { useEffect, useState } from 'react'

/**
 * Viz-tema etter dataviz-referansepaletten. Kategoriske farger i fast
 * rekkefølge (validert for CVD-separasjon i begge moduser).
 */
export interface VizTema {
  modus: 'lys' | 'mork'
  surface: string
  page: string
  ink: string
  inkSekundaer: string
  muted: string
  grid: string
  baseline: string
  border: string
  suksess: string
  /** Kategoriske slots 1–5: blå, oransje, akva, gul, magenta */
  serier: string[]
}

export const LYS: VizTema = {
  modus: 'lys',
  surface: '#fcfcfb',
  page: '#f9f9f7',
  ink: '#0b0b0b',
  inkSekundaer: '#52514e',
  muted: '#898781',
  grid: '#e1e0d9',
  baseline: '#c3c2b7',
  border: 'rgba(11,11,11,0.10)',
  suksess: '#006300',
  serier: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4'],
}

export const MORK: VizTema = {
  modus: 'mork',
  surface: '#1a1a19',
  page: '#0d0d0d',
  ink: '#ffffff',
  inkSekundaer: '#c3c2b7',
  muted: '#898781',
  grid: '#2c2c2a',
  baseline: '#383835',
  border: 'rgba(255,255,255,0.10)',
  suksess: '#0ca30c',
  serier: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181'],
}

export function useVizTema(): VizTema {
  const [mork, setMork] = useState(
    () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false,
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const lytter = (e: MediaQueryListEvent) => setMork(e.matches)
    mq.addEventListener('change', lytter)
    return () => mq.removeEventListener('change', lytter)
  }, [])
  return mork ? MORK : LYS
}

export function nok(v: number): string {
  return `${Math.round(v).toLocaleString('nb-NO')} kr`
}

/** Kompakt aksestekst: 1,2 mill. / 250 k / 0 */
export function nokKompakt(v: number): string {
  const abs = Math.abs(v)
  if (abs >= 1e6) {
    return `${(v / 1e6).toLocaleString('nb-NO', { maximumFractionDigits: 1 })} mill.`
  }
  if (abs >= 1000) return `${Math.round(v / 1000).toLocaleString('nb-NO')} k`
  return `${Math.round(v)}`
}

export function pst(v: number): string {
  return `${v.toLocaleString('nb-NO', { maximumFractionDigits: 2 })} %`
}

/** "3 år og 4 mnd." fra antall måneder */
export function aarOgMnd(mnd: number): string {
  const aar = Math.floor(mnd / 12)
  const rest = mnd % 12
  if (aar === 0) return `${rest} mnd.`
  if (rest === 0) return `${aar} år`
  return `${aar} år og ${rest} mnd.`
}

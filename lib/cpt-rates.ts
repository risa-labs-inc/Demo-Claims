/**
 * Relative billing weight by CPT code.
 * Used to distribute a total charge realistically across service lines
 * instead of splitting equally.
 */
const CPT_WEIGHTS: Record<string, number> = {
  // E&M office visits
  '99211': 0.4,
  '99212': 0.8,
  '99213': 1.2,
  '99214': 1.9,
  '99215': 2.8,

  // Hydration
  '96360': 1.4,
  '96361': 0.5,

  // IV infusion (non-chemo)
  '96365': 2.0,
  '96366': 0.6,
  '96367': 0.9,
  '96368': 0.5,

  // Chemo injection/infusion
  '96401': 2.2,
  '96402': 1.1,
  '96409': 3.2,
  '96411': 1.6,
  '96413': 4.5,  // initial chemo infusion (up to 1 hr)
  '96415': 1.6,  // each additional hour
  '96416': 2.8,
  '96417': 2.2,  // sequential infusion
  '96423': 1.1,

  // High-cost drug J-codes
  'J9035': 7.0,   // Bevacizumab (Avastin)
  'J9070': 2.1,   // Cyclophosphamide
  'J9178': 4.2,   // Epirubicin
  'J9190': 1.5,   // Fluorouracil
  'J9355': 18.0,  // Trastuzumab (Herceptin) — very expensive
  'J9999': 5.0,
  'J0129': 8.0,   // Abatacept
  'J0179': 9.0,   // Aflibercept
  'J0897': 6.5,   // Denosumab
}

const DEFAULT_WEIGHT = 2.0

/**
 * Distributes `totalCharge` across `cpts` proportionally by CPT weight.
 * Returns a map of { cpt -> billed amount }. Amounts sum exactly to totalCharge.
 */
export function distributeBilledAmounts(
  cpts: string[],
  totalCharge: number,
): Record<string, number> {
  if (cpts.length === 0) return {}

  const weights = cpts.map((c) => CPT_WEIGHTS[c.toUpperCase()] ?? DEFAULT_WEIGHT)
  const sumWeights = weights.reduce((a, b) => a + b, 0)

  let remaining = totalCharge
  const result: Record<string, number> = {}

  cpts.forEach((cpt, i) => {
    if (i === cpts.length - 1) {
      // Last entry gets the remainder so the total is exact
      result[cpt] = Math.round(remaining * 100) / 100
    } else {
      const amount = Math.round((weights[i] / sumWeights) * totalCharge * 100) / 100
      result[cpt] = amount
      remaining -= amount
    }
  })

  return result
}

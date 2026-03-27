import { ClaimWithAssignee } from './types'

// Converts Prisma's Decimal fields to numbers for client component props
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serializeClaim(claim: any): ClaimWithAssignee {
  return {
    ...claim,
    chargeAmount: Number(claim.chargeAmount),
    paidAmount: claim.paidAmount != null ? Number(claim.paidAmount) : null,
    secondaryPaidAmount: claim.secondaryPaidAmount != null ? Number(claim.secondaryPaidAmount) : null,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serializeClaims(claims: any[]): ClaimWithAssignee[] {
  return claims.map(serializeClaim)
}

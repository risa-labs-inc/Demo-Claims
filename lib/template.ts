import { ClaimWithAssignee } from './types'
import { formatDate } from './utils'

export function generateClaimTemplate(claim: ClaimWithAssignee): string {
  const status = claim.claimStatus || 'UNKNOWN'

  // Always-present fields
  const parts: string[] = [
    `(${status}) RISA:`,
    `DC: ${formatDate(claim.dateOfService)}`,
    `PN: ${claim.primaryInsurance}`,
  ]

  // Conditionally append only when a value exists
  const dcr = claim.claimReceivedDate ? formatDate(claim.claimReceivedDate) : ''
  if (dcr)                          parts.push(`DCR: ${dcr}`)

  const cn = claim.claimNumber ?? ''
  if (cn)                           parts.push(`CN:${cn}`)

  const dcrm = claim.denialCodes ?? ''
  if (dcrm)                         parts.push(`DC/RM: ${dcrm}`)

  const dcd = claim.denialDescription ?? ''
  if (dcd)                          parts.push(`DCD: ${dcd}`)

  const pa = claim.paidAmount != null ? `$${claim.paidAmount}` : ''
  if (pa)                           parts.push(`PA: ${pa}`)

  const ckn = claim.checkNumber ?? ''
  if (ckn)                          parts.push(`CKN:${ckn}`)

  const ckd = claim.checkDate ? formatDate(claim.checkDate) : ''
  if (ckd)                          parts.push(`CKD: ${ckd}`)

  const li = claim.deniedLineItems ?? ''
  if (li)                           parts.push(`LI: ${li}`)

  return parts.join(', ')
}

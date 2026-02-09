import { ClaimWithAssignee } from './types'
import { formatDate } from './utils'

export function generateClaimTemplate(claim: ClaimWithAssignee): string {
  const status = claim.claimStatus || 'UNKNOWN'
  const dateOfService = formatDate(claim.dateOfService)
  const primaryInsurance = claim.primaryInsurance
  const claimReceivedDate = claim.claimReceivedDate ? formatDate(claim.claimReceivedDate) : ''
  const claimNumber = claim.claimNumber || ''
  const denialCodes = claim.denialCodes || ''
  const denialDescription = claim.denialDescription || ''
  const paidAmount = claim.paidAmount !== null ? `$${claim.paidAmount}` : ''
  const checkNumber = claim.checkNumber || ''
  const checkDate = claim.checkDate ? formatDate(claim.checkDate) : ''
  const deniedLineItems = claim.deniedLineItems || ''

  return `(${status}) RISA:, DC: ${dateOfService}, PN: ${primaryInsurance}, DCR: ${claimReceivedDate}, CN:${claimNumber}, DCRM: ${denialCodes}, DCD: ${denialDescription}, PA: ${paidAmount}, CKN:${checkNumber}, CKD: ${checkDate}, LI: ${deniedLineItems}`
}

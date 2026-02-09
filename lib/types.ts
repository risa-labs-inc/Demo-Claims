export type Stage = 'PENDING' | 'PENDING_VALIDATION' | 'VALIDATED' | 'PROCESSED'

export type ClaimStatus =
  | 'PAID'
  | 'DENIED'
  | 'PARTIALLY_PAID'
  | 'IN_PROCESS'
  | 'NOT_ON_FILE'
  | 'PATIENT_NOT_FOUND'
  | 'NO_PORTAL_ACCESS'
  | 'PENDING'

export interface ClaimWithAssignee {
  id: string
  patientFirstName: string
  patientLastName: string
  mrn: string
  dateOfBirth: Date
  dateOfService: Date
  chargeAmount: number
  primaryInsurance: string
  primaryMemberId: string
  secondaryInsurance: string | null
  secondaryMemberId: string | null
  providerFirstName: string
  providerLastName: string
  providerNpi: string
  claimId: string
  stage: Stage
  claimStatus: ClaimStatus | null
  claimNumber: string | null
  claimReceivedDate: Date | null
  checkNumber: string | null
  checkDate: Date | null
  paidAmount: number | null
  paymentDate: Date | null
  denialCodes: string | null
  deniedLineItems: string | null
  denialDescription: string | null
  remarks: string | null
  // Secondary Insurance Claim Details
  secondaryClaimNumber: string | null
  secondaryClaimReceivedDate: Date | null
  secondaryClaimStatus: ClaimStatus | null
  secondaryCheckNumber: string | null
  secondaryCheckDate: Date | null
  secondaryPaidAmount: number | null
  secondaryPaymentDate: Date | null
  secondaryDenialCodes: string | null
  secondaryDeniedLineItems: string | null
  secondaryDenialDescription: string | null
  secondaryRemarks: string | null
  assignedToId: string | null
  assignedTo: {
    id: string
    name: string
    email: string
  } | null
  createdAt: Date
  updatedAt: Date
}

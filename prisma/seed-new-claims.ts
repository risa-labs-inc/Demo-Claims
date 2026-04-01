/**
 * Targeted script — inserts ONLY the two new coding denial claims
 * (CO-4 James Thornton, CO-11 Dorothy Kim) if they don't already exist.
 * Safe to run against production — will not touch any existing data.
 *
 * Usage:
 *   DATABASE_URL="<prod-url>" npx tsx prisma/seed-new-claims.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === '') return null
  const parts = dateStr.split('/')
  if (parts.length !== 3) return null
  const [month, day, year] = parts
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
}

const newClaims = [
  {
    // CO-4: Modifier mismatch — modifier -57 instead of -25 for same-day E&M + infusion
    claimId: 'CIG553891',
    mrn: '584921',
    patientFirstName: 'Jeremy',
    patientLastName: 'Wade',
    dateOfBirth: '05/22/1964',
    providerFirstName: 'Dr. Rachel',
    providerLastName: 'Lee',
    providerNpi: '1847293056',
    primaryInsurance: 'Cigna',
    primaryMemberId: 'CIG7723891',
    dateOfService: '02/14/2026',
    chargeAmount: 6840.00,
    claimReceivedDate: '02/16/2026',
    claimNumber: '2026021400553',
    claimStatus: 'DENIED',
    paidAmount: 0,
    paidDate: null,
    deniedCode: 'CO-4',
    denialDate: '03/05/2026',
    denialDescription: 'The service is inconsistent with the modifier billed.',
    deniedLineItems: '99213, 96413, 96415',
    remarks: 'Cigna denied claim CO-4 — modifier -57 was appended to CPT 99213 (E&M). Modifier -57 is reserved for E&M visits resulting in the decision to perform a major surgical procedure the same or next day. For same-day E&M with infusion (96413, 96415), modifier -25 is required. Full claim denied pending corrected resubmission with modifier -25 on CPT 99213.',
    stage: 'PENDING_VALIDATION',
    secondaryClaimNumber: null,
    secondaryInsurance: null,
    secondaryMemberId: null,
  },
  {
    // CO-11: Diagnosis inconsistent with procedure — Z79.899 does not support chemo per LCD L34587
    claimId: 'BCBS774312',
    mrn: '637452',
    patientFirstName: 'Dorothy',
    patientLastName: 'Kim',
    dateOfBirth: '08/17/1967',
    providerFirstName: 'Dr. James',
    providerLastName: 'Parker',
    providerNpi: '1965748302',
    primaryInsurance: 'Blue Cross Blue Shield',
    primaryMemberId: 'BCBS4492037',
    dateOfService: '02/28/2026',
    chargeAmount: 9340.00,
    claimReceivedDate: '03/02/2026',
    claimNumber: '2026022800774',
    claimStatus: 'DENIED',
    paidAmount: 0,
    paidDate: null,
    deniedCode: 'CO-11',
    denialDate: '03/18/2026',
    denialDescription: 'The diagnosis is inconsistent with the procedure.',
    deniedLineItems: '96413, 96415, J9355',
    remarks: 'BCBS denied CO-11 — primary diagnosis Z79.899 does not support chemotherapy infusion (96413, 96415) or trastuzumab (J9355) per LCD L34587. An active oncologic diagnosis with appropriate ICD-10 specificity (4th–7th character) is required. Resubmit with correct primary diagnosis (e.g., C50.911 — HER2+ right breast cancer) supported by pathology report and oncology treatment records.',
    stage: 'PROCESSED',
    secondaryClaimNumber: null,
    secondaryInsurance: null,
    secondaryMemberId: null,
  },
]

async function main() {
  console.log('Inserting new coding denial claims (safe — skips if already exists)...\n')

  for (const claim of newClaims) {
    const existing = await prisma.claim.findFirst({ where: { claimId: claim.claimId } })
    if (existing) {
      console.log(`SKIP — already exists: ${claim.patientFirstName} ${claim.patientLastName} (${claim.claimId})`)
      continue
    }

    await prisma.claim.create({
      data: {
        mrn: claim.mrn,
        patientFirstName: claim.patientFirstName,
        patientLastName: claim.patientLastName,
        dateOfBirth: parseDate(claim.dateOfBirth),
        providerFirstName: claim.providerFirstName,
        providerLastName: claim.providerLastName,
        providerNpi: claim.providerNpi,
        primaryInsurance: claim.primaryInsurance,
        primaryMemberId: claim.primaryMemberId,
        claimId: claim.claimId,
        dateOfService: parseDate(claim.dateOfService),
        chargeAmount: claim.chargeAmount,
        claimReceivedDate: parseDate(claim.claimReceivedDate),
        claimNumber: claim.claimNumber,
        claimStatus: claim.claimStatus as any,
        paidAmount: claim.paidAmount || null,
        paymentDate: null,
        denialCodes: claim.deniedCode || null,
        denialDate: parseDate(claim.denialDate),
        denialDescription: claim.denialDescription,
        deniedLineItems: claim.deniedLineItems,
        remarks: claim.remarks,
        stage: claim.stage as any,
        secondaryClaimNumber: claim.secondaryClaimNumber,
        secondaryInsurance: claim.secondaryInsurance,
        secondaryMemberId: claim.secondaryMemberId,
      },
    })
    console.log(`INSERTED: ${claim.patientFirstName} ${claim.patientLastName} — ${claim.deniedCode} (${claim.claimId})`)
  }

  console.log('\nDone.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())

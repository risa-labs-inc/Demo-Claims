/**
 * Updates the two partially-paid claims to proper denial categories:
 *   - Linda Castillo (MRN 391045): CO-97 → CO-4 (coding denial, modifier mismatch)
 *   - Robert Vasquez (MRN 468312): CO-50/UHC → CO-27/BCBS (eligibility denial, coverage terminated)
 *
 * Usage:
 *   DATABASE_URL="<prod-url>" npx tsx prisma/update-partial-claims.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function parseDate(dateStr: string): Date {
  const [month, day, year] = dateStr.split('/')
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
}

async function main() {
  // ── Linda Castillo: CO-97 → CO-4 ─────────────────────────────────────────
  const linda = await prisma.claim.updateMany({
    where: { mrn: '391045', claimId: 'AET447829' },
    data: {
      denialCodes: 'CO-4',
      denialDescription: 'The service is inconsistent with the modifier billed.',
      remarks: 'Aetna paid $5,124.00 (EFT #AET-EFT-78321) for CPT codes 96413, 96415, J9355 (infusion services). E&M visit CPT 99215 denied CO-4 — modifier -57 (Decision for Major Surgery) was appended to CPT 99215. Modifier -57 is reserved for E&M visits resulting in the decision to perform major surgery the same or next day; it does not override NCCI bundling edits for same-day E&M with infusion. Modifier -25 is required. Paid CPTs: 96413, 96415, J9355.',
    },
  })
  console.log(`Linda Castillo updated: ${linda.count} record(s) — CO-97 → CO-4`)

  // ── Robert Vasquez: CO-50/UHC → CO-27/BCBS ───────────────────────────────
  const robert = await prisma.claim.updateMany({
    where: { mrn: '468312' },
    data: {
      primaryInsurance: 'Blue Cross Blue Shield',
      primaryMemberId: 'BCBS3829047',
      claimId: 'BCBS883041',
      dateOfService: parseDate('01/06/2026'),
      chargeAmount: 7840.00,
      claimReceivedDate: parseDate('01/08/2026'),
      claimNumber: '2026010600883',
      checkNumber: 'BCBS-EFT-44291',
      checkDate: parseDate('01/28/2026'),
      paidAmount: 285.00,
      paymentDate: parseDate('01/28/2026'),
      denialCodes: 'CO-27',
      denialDate: parseDate('01/28/2026'),
      denialDescription: 'Expenses incurred after coverage terminated.',
      deniedLineItems: '96413, 96415, J9355',
      remarks: 'Blue Cross Blue Shield applied grace period provision for professional service CPT 99215 (paid $285.00, EFT #BCBS-EFT-44291). Infusion services 96413, 96415, J9355 denied CO-27 — member coverage terminated 12/31/2025; DOS 01/06/2026 is 6 days post-termination. BCBS grace period covers office visits only; infusion administration and drug services are excluded from the grace period provision under BCBS plan terms. Paid CPTs: 99215.',
      stage: 'PENDING_VALIDATION' as any,
    },
  })
  console.log(`Robert Vasquez updated: ${robert.count} record(s) — CO-50/UHC → CO-27/BCBS`)

  console.log('\nDone.')
}

main().catch(console.error).finally(() => prisma.$disconnect())

'use client'

import { X, FileText } from 'lucide-react'
import { ClaimWithAssignee } from '@/lib/types'
import { formatDate, formatCurrency } from '@/lib/utils'
import { distributeBilledAmounts } from '@/lib/cpt-rates'

interface Denial {
  denial_code: string
  denial_remark_code: string
  denial_reason: string
  denial_type: string
}

interface DocViewerPopupProps {
  docName: string
  claim: ClaimWithAssignee
  denial: Denial
  onClose: () => void
}

// ── Redaction helpers ─────────────────────────────────────────────────────────
function R({ w = 'w-28' }: { w?: string }) {
  return <span className={`inline-block bg-gray-900 rounded-sm h-3 ${w} align-middle mx-0.5`} />
}
function RLg({ w = 'w-36' }: { w?: string }) {
  return <span className={`inline-block bg-gray-900 rounded-sm h-[13px] ${w} align-middle mx-0.5`} />
}
function RBlock({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-1.5 my-1">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`h-3 bg-gray-900 rounded-sm ${i === lines - 1 ? 'w-3/4' : 'w-full'}`} />
      ))}
    </div>
  )
}

// ── EOB (reused for CO-27, CO-28, CO-97, CO-50) ───────────────────────────────
function EOBDoc({ claim, denial }: { claim: ClaimWithAssignee; denial: Denial }) {
  const code = denial.denial_code
  const payer = claim.primaryInsurance
  const total = Number(claim.chargeAmount)
  const paid = Number(claim.paidAmount) || 0
  const cpts = (claim.deniedLineItems ?? '99215, 96413').split(',').map(s => s.trim())
  const billedByCode = distributeBilledAmounts(cpts, total)
  const paidByCode = paid > 0 ? distributeBilledAmounts(cpts, paid) : {} as Record<string, number>

  return (
    <div className="font-mono text-[11px] text-gray-800 leading-relaxed space-y-3">
      <div className="border-b-2 border-gray-800 pb-2 flex justify-between items-start">
        <div>
          <div className="text-base font-bold">{payer}</div>
          <div className="text-gray-500 text-[10px]">EXPLANATION OF BENEFITS</div>
        </div>
        <div className="text-right text-[10px] text-gray-500">
          <div>EOB Date: <R w="w-16" /></div>
          <div>Check/EFT #: {claim.checkNumber ?? <R w="w-20" />}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 border border-gray-200 rounded p-2 bg-gray-50 text-[10px]">
        <div><span className="font-semibold">Member Name:</span> <R w="w-28" /></div>
        <div><span className="font-semibold">Member ID:</span> <R w="w-24" /></div>
        <div><span className="font-semibold">Group #:</span> <R w="w-20" /></div>
        <div><span className="font-semibold">DOB:</span> <R w="w-16" /></div>
        <div><span className="font-semibold">Provider:</span> {claim.providerLastName}</div>
        <div><span className="font-semibold">NPI:</span> {claim.providerNpi}</div>
        <div><span className="font-semibold">Claim #:</span> {claim.claimNumber ?? claim.claimId}</div>
        <div><span className="font-semibold">DOS:</span> {formatDate(claim.dateOfService)}</div>
      </div>
      <table className="w-full text-[10px] border border-gray-200">
        <thead className="bg-gray-100">
          <tr>{['CPT', 'Billed', 'Allowed', 'Paid', 'Adj Reason'].map(h => (
            <th key={h} className="px-1.5 py-1 text-left font-semibold border-b border-gray-200">{h}</th>
          ))}</tr>
        </thead>
        <tbody>
          {cpts.map((cpt) => {
            const lineBilled = billedByCode[cpt] ?? 0
            const linePaid = paidByCode[cpt] ?? 0
            return (
              <tr key={cpt} className="border-b border-gray-100 bg-red-50">
                <td className="px-1.5 py-1 font-medium">{cpt}</td>
                <td className="px-1.5 py-1">{formatCurrency(lineBilled)}</td>
                <td className="px-1.5 py-1">$0.00</td>
                <td className="px-1.5 py-1">{formatCurrency(linePaid)}</td>
                <td className="px-1.5 py-1 text-red-600">{code || 'CO-22'}</td>
              </tr>
            )
          })}
        </tbody>
        <tfoot className="bg-gray-50 font-semibold">
          <tr>
            <td className="px-1.5 py-1">TOTALS</td>
            <td className="px-1.5 py-1">{formatCurrency(total)}</td>
            <td className="px-1.5 py-1">{formatCurrency(Math.round(total * 0.85 * 100) / 100)}</td>
            <td className="px-1.5 py-1">{formatCurrency(paid)}</td>
            <td />
          </tr>
        </tfoot>
      </table>
      <div className="border border-gray-200 rounded p-2 text-[10px]">
        <div className="font-semibold uppercase text-gray-600 mb-1">Adjustment Reason Code</div>
        <div><span className="font-semibold">{code || 'CO-22'}:</span> {denial.denial_reason || 'See denial reason on file.'}</div>
      </div>
      <div className="text-[9px] text-gray-400 border-t border-dashed border-gray-300 pt-2 text-center">
        This EOB is not a bill. Keep for your records. · {payer} · Page 1 of 1 · Ref: <R w="w-16" />
      </div>
    </div>
  )
}

// ── Medicare EOMB ─────────────────────────────────────────────────────────────
function MedicareEOMBDoc({ claim }: { claim: ClaimWithAssignee }) {
  const paid = Number(claim.paidAmount) || 0
  const total = Number(claim.chargeAmount)
  const cpts = (claim.deniedLineItems ?? '99213, 96401').split(',').map(s => s.trim())
  const mcBilledByCode = distributeBilledAmounts(cpts, total)

  return (
    <div className="font-mono text-[11px] text-gray-800 leading-relaxed space-y-3">
      <div className="border-b-2 border-blue-800 pb-2 flex justify-between">
        <div>
          <div className="text-base font-bold text-blue-800">MEDICARE</div>
          <div className="text-[10px] text-gray-600">EXPLANATION OF MEDICARE BENEFITS (EOMB)</div>
          <div className="text-[10px] text-gray-500">Centers for Medicare &amp; Medicaid Services</div>
        </div>
        <div className="text-right text-[10px]">
          <div className="font-semibold">Medicare EFT</div>
          <div>{claim.checkNumber ?? <R w="w-20" />}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 text-[10px] border border-blue-100 bg-blue-50 rounded p-2">
        <div><span className="font-semibold">Beneficiary:</span> <R w="w-28" /></div>
        <div><span className="font-semibold">Medicare ID:</span> <R w="w-24" /></div>
        <div><span className="font-semibold">HIC Number:</span> <R w="w-20" /></div>
        <div><span className="font-semibold">DOS:</span> {formatDate(claim.dateOfService)}</div>
        <div><span className="font-semibold">Provider:</span> {claim.providerLastName}</div>
        <div><span className="font-semibold">NPI:</span> {claim.providerNpi}</div>
      </div>
      <table className="w-full text-[10px] border border-gray-200">
        <thead className="bg-blue-50">
          <tr>{['CPT', 'Submitted', 'MC Approved', 'MC Paid (80%)', 'Patient Resp (20%)'].map(h => (
            <th key={h} className="px-1.5 py-1 text-left font-semibold border-b border-gray-200">{h}</th>
          ))}</tr>
        </thead>
        <tbody>
          {cpts.map((cpt) => {
            const billed = mcBilledByCode[cpt] ?? 0
            const approved = Math.round(billed * 0.85 * 100) / 100
            const mcPaid = Math.round(approved * 0.80 * 100) / 100
            return (
              <tr key={cpt} className="border-b border-gray-100">
                <td className="px-1.5 py-1 font-medium">{cpt}</td>
                <td className="px-1.5 py-1">{formatCurrency(billed)}</td>
                <td className="px-1.5 py-1">{formatCurrency(approved)}</td>
                <td className="px-1.5 py-1 text-blue-700 font-semibold">{formatCurrency(mcPaid)}</td>
                <td className="px-1.5 py-1">{formatCurrency(Math.round(approved * 0.20 * 100) / 100)}</td>
              </tr>
            )
          })}
        </tbody>
        <tfoot className="bg-blue-50 font-semibold">
          <tr>
            <td className="px-1.5 py-1">TOTALS</td>
            <td className="px-1.5 py-1">{formatCurrency(total)}</td>
            <td className="px-1.5 py-1">{formatCurrency(Math.round(total * 0.85 * 100) / 100)}</td>
            <td className="px-1.5 py-1 text-blue-700">{formatCurrency(paid)}</td>
            <td className="px-1.5 py-1">{formatCurrency(Math.round(total * 0.85 * 0.20 * 100) / 100)}</td>
          </tr>
        </tfoot>
      </table>
      <div className="text-[9px] text-gray-400 border-t border-dashed border-gray-300 pt-2 text-center">
        Medicare EOMB · CMS Form 1450 · EFT Ref: {claim.checkNumber ?? <R w="w-16" />} · Page 1 of 1
      </div>
    </div>
  )
}

// ── Eligibility Verification ──────────────────────────────────────────────────
function EligibilityVerificationDoc({ claim }: { claim: ClaimWithAssignee }) {
  const payer = claim.primaryInsurance
  return (
    <div className="font-mono text-[11px] text-gray-800 leading-relaxed space-y-3">
      <div className="border-b-2 border-gray-800 pb-2">
        <div className="text-base font-bold">ELIGIBILITY VERIFICATION RESPONSE</div>
        <div className="text-[10px] text-gray-500">{payer} · Electronic Verification System (EVS)</div>
      </div>
      <div className="text-right text-[10px] text-gray-500">
        Query Date: <R w="w-24" /> · Response Time: 0.3s · Trace ID: <R w="w-28" />
      </div>
      <div className="border border-gray-300 rounded p-3 bg-gray-50 space-y-1.5 text-[10px]">
        <div className="font-semibold text-gray-700 uppercase text-[9px] tracking-wider mb-2">Subscriber Information</div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1">
          <div><span className="font-semibold">Subscriber Name:</span> <R w="w-28" /></div>
          <div><span className="font-semibold">Member ID:</span> <R w="w-24" /></div>
          <div><span className="font-semibold">Group Number:</span> <R w="w-20" /></div>
          <div><span className="font-semibold">Date of Birth:</span> <R w="w-20" /></div>
          <div><span className="font-semibold">Plan Name:</span> {payer}</div>
          <div><span className="font-semibold">NPI Queried:</span> {claim.providerNpi}</div>
        </div>
      </div>
      <div className="border-2 border-red-300 rounded p-3 bg-red-50 space-y-1 text-[10px]">
        <div className="font-bold text-red-700 text-xs uppercase flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-red-600" />
          COVERAGE STATUS: INACTIVE
        </div>
        <div><span className="font-semibold">Effective Date:</span> <R w="w-24" /></div>
        <div><span className="font-semibold">Termination Date:</span> <R w="w-24" /></div>
        <div><span className="font-semibold">Date of Service Queried:</span> {formatDate(claim.dateOfService)}</div>
        <div><span className="font-semibold">Coverage on DOS:</span> <span className="text-red-700 font-bold">NOT ACTIVE</span></div>
        <div><span className="font-semibold">Payer Response Code:</span> 60 – "Member Not Found / Inactive"</div>
      </div>
      <div className="border border-gray-200 rounded p-3 text-[10px] space-y-1">
        <div className="font-semibold text-gray-700 mb-1">Plan Benefits Summary (as of query date)</div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1">
          <div><span className="font-semibold">Deductible:</span> <R w="w-16" /></div>
          <div><span className="font-semibold">Deductible Met:</span> <R w="w-16" /></div>
          <div><span className="font-semibold">Out-of-Pocket Max:</span> <R w="w-16" /></div>
          <div><span className="font-semibold">Copay (Specialist):</span> <R w="w-12" /></div>
          <div><span className="font-semibold">Coinsurance:</span> <R w="w-12" /></div>
          <div><span className="font-semibold">In-Network Only:</span> <R w="w-10" /></div>
        </div>
      </div>
      <div className="text-[9px] text-gray-400 border-t border-dashed border-gray-300 pt-2 text-center">
        Eligibility Verification · {payer} EVS · Query Ref: <R w="w-20" /> · Page 1 of 1
      </div>
    </div>
  )
}

// ── Patient Re-Enrollment Confirmation ────────────────────────────────────────
function ReEnrollmentDoc({ claim }: { claim: ClaimWithAssignee }) {
  const payer = claim.primaryInsurance
  return (
    <div className="font-mono text-[11px] text-gray-800 leading-relaxed space-y-4">
      <div className="border-b-2 border-gray-800 pb-3">
        <div className="text-base font-bold">{payer}</div>
        <div className="text-gray-600">Member Enrollment Services</div>
        <div className="text-gray-500 text-[10px]"><R w="w-40" /></div>
      </div>
      <div className="text-right text-[10px] text-gray-500">Date: <R w="w-24" /></div>
      <div className="space-y-0.5">
        <div><R w="w-32" /> <R w="w-24" /></div>
        <div><R w="w-48" /></div>
        <div><R w="w-36" /></div>
      </div>
      <div className="border border-gray-300 bg-gray-50 px-3 py-2 rounded">
        <div><span className="font-bold">RE:</span> Enrollment Confirmation Notice</div>
        <div><span className="font-semibold">Member:</span> <R w="w-32" /> <R w="w-24" /></div>
        <div><span className="font-semibold">Member ID:</span> <R w="w-28" /></div>
        <div><span className="font-semibold">Previous Termination Date:</span> <R w="w-24" /></div>
        <div><span className="font-semibold">New Effective Date:</span> 01/01/2026</div>
      </div>
      <div>Dear <R w="w-24" />,</div>
      <p>
        We are pleased to confirm that your enrollment in <span className="font-semibold">{payer}</span> has been
        reinstated effective <span className="font-semibold">January 1, 2026</span>. Your prior coverage period ended
        on <R w="w-24" />, and your new enrollment began following your open-enrollment election during the
        Annual Enrollment Period (AEP).
      </p>
      <p>
        Please note that retroactive coverage reinstatement is subject to payer review and applicable grace period
        provisions. If you believe services rendered prior to your new effective date should be covered, please
        contact Member Services at the number listed on the back of your insurance card.
      </p>
      <p>
        Your new Member ID card will be mailed to the address on file within 7–10 business days.
        In the meantime, this letter may be used as proof of enrollment confirmation.
      </p>
      <div className="border-t border-gray-300 pt-3 mt-4 space-y-1">
        <div>Sincerely,</div>
        <div className="mt-4"><R w="w-36" /></div>
        <div><R w="w-48" /></div>
        <div>Member Enrollment Services</div>
        <div>{payer}</div>
      </div>
      <div className="text-[9px] text-gray-400 border-t border-dashed border-gray-300 pt-2 text-center">
        Enrollment Confirmation · {payer} · Ref: <R w="w-20" /> · Page 1 of 1
      </div>
    </div>
  )
}

// ── Premium Payment History ───────────────────────────────────────────────────
function PremiumPaymentHistoryDoc({ claim }: { claim: ClaimWithAssignee }) {
  const payer = claim.primaryInsurance
  const months = ['Jul 2025', 'Aug 2025', 'Sep 2025', 'Oct 2025', 'Nov 2025', 'Dec 2025']
  return (
    <div className="font-mono text-[11px] text-gray-800 leading-relaxed space-y-3">
      <div className="border-b-2 border-gray-800 pb-2">
        <div className="text-base font-bold">{payer}</div>
        <div className="text-gray-500 text-[10px]">PREMIUM PAYMENT HISTORY STATEMENT</div>
      </div>
      <div className="border border-gray-200 rounded p-2 bg-gray-50 text-[10px] grid grid-cols-2 gap-x-4 gap-y-1">
        <div><span className="font-semibold">Subscriber:</span> <R w="w-28" /></div>
        <div><span className="font-semibold">Member ID:</span> <R w="w-24" /></div>
        <div><span className="font-semibold">Group:</span> <R w="w-20" /></div>
        <div><span className="font-semibold">Statement Date:</span> <R w="w-20" /></div>
      </div>
      <table className="w-full text-[10px] border border-gray-200">
        <thead className="bg-gray-100">
          <tr>
            {['Coverage Month', 'Premium Due', 'Amount Paid', 'Payment Date', 'Status'].map(h => (
              <th key={h} className="px-2 py-1 text-left font-semibold border-b border-gray-200">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {months.map((month, i) => {
            const isLast = i === months.length - 1
            return (
              <tr key={month} className={`border-b border-gray-100 ${isLast ? 'bg-yellow-50' : ''}`}>
                <td className="px-2 py-1">{month}</td>
                <td className="px-2 py-1"><R w="w-14" /></td>
                <td className="px-2 py-1"><R w="w-14" /></td>
                <td className="px-2 py-1"><R w="w-20" /></td>
                <td className={`px-2 py-1 font-semibold ${isLast ? 'text-yellow-700' : 'text-green-700'}`}>
                  {isLast ? 'PENDING VERIFICATION' : 'PAID'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <div className="border border-yellow-200 bg-yellow-50 rounded p-2 text-[10px]">
        <div className="font-semibold text-yellow-800 mb-1">Note</div>
        <p>December 2025 premium payment status is pending verification. Payment was received but not posted
          prior to the coverage termination processing date. Contact Member Services to confirm posting and
          retroactive reinstatement eligibility.</p>
      </div>
      <div className="text-[9px] text-gray-400 border-t border-dashed border-gray-300 pt-2 text-center">
        Premium History · {payer} · Ref: <R w="w-20" /> · Page 1 of 1
      </div>
    </div>
  )
}

// ── Patient Insurance Update Form ─────────────────────────────────────────────
function InsuranceUpdateFormDoc({ claim }: { claim: ClaimWithAssignee }) {
  return (
    <div className="font-mono text-[11px] text-gray-800 leading-relaxed space-y-3">
      <div className="border-b-2 border-gray-800 pb-2">
        <div className="text-base font-bold">PATIENT INSURANCE UPDATE FORM</div>
        <div className="text-gray-500 text-[10px]">Medical Oncology Billing Services · Complete all fields</div>
      </div>
      <div className="border border-gray-200 rounded p-3 bg-gray-50 text-[10px] space-y-2">
        <div className="font-semibold text-gray-600 uppercase text-[9px] tracking-wider">Patient Information</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <div><span className="font-semibold">Patient Name:</span> <R w="w-36" /></div>
          <div><span className="font-semibold">Date of Birth:</span> <R w="w-24" /></div>
          <div><span className="font-semibold">MRN:</span> {claim.mrn}</div>
          <div><span className="font-semibold">Phone:</span> <R w="w-28" /></div>
        </div>
      </div>
      <div className="border border-gray-200 rounded p-3 text-[10px] space-y-2">
        <div className="font-semibold text-gray-600 uppercase text-[9px] tracking-wider">Previous Insurance (as of DOS)</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <div><span className="font-semibold">Payer Name:</span> {claim.primaryInsurance}</div>
          <div><span className="font-semibold">Member ID:</span> <R w="w-28" /></div>
          <div><span className="font-semibold">Group #:</span> <R w="w-20" /></div>
          <div><span className="font-semibold">Coverage Status on DOS:</span> <span className="text-red-700 font-bold">INACTIVE</span></div>
        </div>
      </div>
      <div className="border-2 border-blue-300 rounded p-3 bg-blue-50 text-[10px] space-y-2">
        <div className="font-semibold text-blue-800 uppercase text-[9px] tracking-wider">Updated Insurance Information</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <div>
            <div className="text-gray-500 mb-0.5">New Payer Name</div>
            <div className="border-b border-gray-400 h-5"><R w="w-36" /></div>
          </div>
          <div>
            <div className="text-gray-500 mb-0.5">New Member ID</div>
            <div className="border-b border-gray-400 h-5"><R w="w-28" /></div>
          </div>
          <div>
            <div className="text-gray-500 mb-0.5">New Group Number</div>
            <div className="border-b border-gray-400 h-5"><R w="w-24" /></div>
          </div>
          <div>
            <div className="text-gray-500 mb-0.5">Effective Date</div>
            <div className="border-b border-gray-400 h-5">01/01/2026</div>
          </div>
        </div>
      </div>
      <div className="border border-gray-200 rounded p-3 text-[10px] space-y-2">
        <div className="font-semibold text-gray-600 mb-1">Patient Signature &amp; Authorization</div>
        <p className="text-gray-600">I authorize the release of medical information necessary to process this claim and
          certify that the above insurance information is accurate to the best of my knowledge.</p>
        <div className="grid grid-cols-2 gap-4 mt-3">
          <div>
            <div className="text-gray-500 mb-0.5">Patient Signature</div>
            <div className="border-b border-gray-800 h-6"><R w="w-32" /></div>
          </div>
          <div>
            <div className="text-gray-500 mb-0.5">Date Signed</div>
            <div className="border-b border-gray-800 h-6"><R w="w-20" /></div>
          </div>
        </div>
      </div>
      <div className="text-[9px] text-gray-400 border-t border-dashed border-gray-300 pt-2 text-center">
        Insurance Update Form · Medical Oncology Billing · DOS: {formatDate(claim.dateOfService)} · Page 1 of 1
      </div>
    </div>
  )
}

// ── HETS Medicare Eligibility Query ──────────────────────────────────────────
function HETSQueryDoc({ claim }: { claim: ClaimWithAssignee }) {
  return (
    <div className="font-mono text-[11px] text-gray-800 leading-relaxed space-y-3">
      <div className="border-b-2 border-blue-800 pb-2">
        <div className="text-base font-bold text-blue-800">CMS HETS — MEDICARE ELIGIBILITY RESPONSE</div>
        <div className="text-[10px] text-gray-500">HIPAA Eligibility Transaction System (HETS) · 270/271 Transaction</div>
      </div>
      <div className="text-right text-[10px] text-gray-500">
        Transaction Date: <R w="w-24" /> · Transaction ID: <R w="w-32" />
      </div>
      <div className="border border-blue-200 rounded p-2 bg-blue-50 text-[10px] grid grid-cols-2 gap-x-4 gap-y-1">
        <div><span className="font-semibold">Beneficiary Name:</span> <R w="w-28" /></div>
        <div><span className="font-semibold">Medicare ID (MBI):</span> <R w="w-24" /></div>
        <div><span className="font-semibold">HIC Number:</span> <R w="w-24" /></div>
        <div><span className="font-semibold">Date of Birth:</span> <R w="w-20" /></div>
        <div><span className="font-semibold">Provider NPI:</span> {claim.providerNpi}</div>
        <div><span className="font-semibold">DOS Queried:</span> {formatDate(claim.dateOfService)}</div>
      </div>
      <div className="space-y-2 text-[10px]">
        <div className="border border-gray-200 rounded p-2">
          <div className="font-semibold text-gray-600 uppercase text-[9px] mb-1">Medicare Part A</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div><span className="font-semibold">Eligibility:</span> <span className="text-green-700 font-bold">ACTIVE</span></div>
            <div><span className="font-semibold">Effective Date:</span> <R w="w-20" /></div>
            <div><span className="font-semibold">Deductible Remaining:</span> <R w="w-16" /></div>
            <div><span className="font-semibold">Benefit Period:</span> <R w="w-24" /></div>
          </div>
        </div>
        <div className="border border-gray-200 rounded p-2">
          <div className="font-semibold text-gray-600 uppercase text-[9px] mb-1">Medicare Part B</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div><span className="font-semibold">Eligibility:</span> <span className="text-green-700 font-bold">ACTIVE</span></div>
            <div><span className="font-semibold">Effective Date:</span> <R w="w-20" /></div>
            <div><span className="font-semibold">Annual Deductible:</span> <R w="w-16" /></div>
            <div><span className="font-semibold">Deductible Met:</span> <R w="w-14" /></div>
          </div>
        </div>
        <div className="border border-gray-200 rounded p-2">
          <div className="font-semibold text-gray-600 uppercase text-[9px] mb-1">Medicare Secondary Payer (MSP)</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div><span className="font-semibold">MSP Type:</span> Not on file</div>
            <div><span className="font-semibold">Crossover Plan:</span> <R w="w-24" /></div>
            <div><span className="font-semibold">Other Insurance on File:</span> Unknown</div>
            <div><span className="font-semibold">Action Required:</span> Verify with patient</div>
          </div>
        </div>
      </div>
      <div className="text-[9px] text-gray-400 border-t border-dashed border-gray-300 pt-2 text-center">
        HETS 270/271 · CMS Medicare · Trace ID: <R w="w-24" /> · Page 1 of 1
      </div>
    </div>
  )
}

// ── Clinical Progress Note ────────────────────────────────────────────────────
function ProgressNoteDoc({ claim, denial }: { claim: ClaimWithAssignee; denial: Denial }) {
  const dos = formatDate(claim.dateOfService)
  const deniedCpt = claim.deniedLineItems?.split(',')[0]?.trim() ?? '99215'
  return (
    <div className="font-mono text-[11px] text-gray-800 leading-relaxed space-y-3">
      <div className="border-b-2 border-gray-800 pb-2">
        <div className="text-base font-bold">CLINICAL PROGRESS NOTE</div>
        <div className="text-gray-500 text-[10px]">Medical Oncology · Attending: {claim.providerFirstName} {claim.providerLastName}, MD · NPI: {claim.providerNpi}</div>
      </div>
      <div className="border border-gray-200 rounded p-2 bg-gray-50 text-[10px] grid grid-cols-3 gap-x-4">
        <div><span className="font-semibold">Patient:</span> <R w="w-24" /></div>
        <div><span className="font-semibold">DOB:</span> <R w="w-20" /></div>
        <div><span className="font-semibold">MRN:</span> {claim.mrn}</div>
        <div><span className="font-semibold">Date of Service:</span> {dos}</div>
        <div><span className="font-semibold">Visit Type:</span> Oncology Follow-Up</div>
        <div><span className="font-semibold">CPT Billed:</span> {deniedCpt}</div>
      </div>
      <div className="space-y-3 text-[10px]">
        <div>
          <div className="font-bold text-gray-700 uppercase text-[9px] tracking-wider border-b border-gray-200 pb-1 mb-1.5">S — Subjective (Chief Complaint)</div>
          <p>Patient presents for oncology follow-up visit. <RBlock lines={2} /> Patient reports <R w="w-32" /> since last visit. Denies fever, chills, or acute distress. Current treatment tolerance assessed.</p>
        </div>
        <div>
          <div className="font-bold text-gray-700 uppercase text-[9px] tracking-wider border-b border-gray-200 pb-1 mb-1.5">O — Objective (Examination)</div>
          <p>Vitals: BP <R w="w-16" />, HR <R w="w-10" />, Temp <R w="w-12" />, SpO2 <R w="w-10" />.</p>
          <p className="mt-1">General: Patient appears <R w="w-20" />. Well-nourished, well-hydrated. Alert and oriented × 3.</p>
          <p className="mt-1">ECOG Performance Status: <R w="w-8" />. Weight: <R w="w-12" />. BSA: <R w="w-12" />.</p>
          <RBlock lines={2} />
        </div>
        <div>
          <div className="font-bold text-gray-700 uppercase text-[9px] tracking-wider border-b border-gray-200 pb-1 mb-1.5">A — Assessment</div>
          <div><span className="font-semibold">Dx 1:</span> <R w="w-40" /> · ICD-10: <R w="w-12" /></div>
          <div><span className="font-semibold">Dx 2:</span> <R w="w-36" /> · ICD-10: <R w="w-12" /></div>
          <p className="mt-1.5"><RBlock lines={2} /></p>
        </div>
        <div>
          <div className="font-bold text-gray-700 uppercase text-[9px] tracking-wider border-b border-gray-200 pb-1 mb-1.5">P — Plan (Medical Decision-Making)</div>
          <p>
            Clinical decision-making today was of <span className="font-semibold">high complexity</span>, independently
            addressing <R w="w-28" /> distinct from the infusion administration scheduled this date.
            Evaluation included review of recent labs, toxicity assessment, and modification of treatment protocol.
          </p>
          <p className="mt-1.5">Treatment modifications: <RBlock lines={1} /></p>
          <p className="mt-1">Follow-up: <R w="w-32" />. Return to clinic in <R w="w-10" /> weeks.</p>
        </div>
      </div>
      <div className="border-t border-gray-300 pt-2 text-[10px]">
        <div className="font-semibold">Attestation:</div>
        <p className="text-gray-600 mt-1">I certify that the above constitutes an accurate record of the services rendered on {dos},
          and that the E&amp;M service was separately identifiable from the infusion procedure performed on the same date (CPT {denial.denial_code === 'CO-97' ? claim.deniedLineItems : deniedCpt}).</p>
        <div className="mt-3"><R w="w-36" /></div>
        <div className="text-gray-500">{claim.providerFirstName} {claim.providerLastName}, MD · {dos}</div>
      </div>
      <div className="text-[9px] text-gray-400 border-t border-dashed border-gray-300 pt-2 text-center">
        Progress Note · Medical Oncology · DOS: {dos} · Page 1 of 2
      </div>
    </div>
  )
}

// ── Corrected Claim (837P) ────────────────────────────────────────────────────
function CorrectedClaimDoc({ claim, denial }: { claim: ClaimWithAssignee; denial: Denial }) {
  const dos = formatDate(claim.dateOfService)
  const deniedCpt = claim.deniedLineItems?.split(',')[0]?.trim() ?? '99215'
  return (
    <div className="font-mono text-[11px] text-gray-800 leading-relaxed space-y-3">
      <div className="border-b-2 border-gray-800 pb-2">
        <div className="text-base font-bold">CORRECTED CLAIM — 837P PROFESSIONAL</div>
        <div className="text-gray-500 text-[10px]">Claim Frequency Code: 7 (Replacement of Prior Claim) · Submission Type: Electronic EDI</div>
      </div>
      <div className="border-2 border-orange-300 bg-orange-50 rounded p-2 text-[10px]">
        <div className="font-bold text-orange-800 mb-1">Correction Detail</div>
        <div><span className="font-semibold">Original Claim #:</span> {claim.claimNumber ?? claim.claimId}</div>
        <div><span className="font-semibold">Correction Type:</span> Modifier Added</div>
        <div><span className="font-semibold">CPT Modified:</span> {deniedCpt} → <span className="font-bold text-green-700">{deniedCpt}-25</span></div>
        <div><span className="font-semibold">Reason:</span> Modifier 25 added per NCCI — separately identifiable E&amp;M service</div>
        <div><span className="font-semibold">Original Denial:</span> {denial.denial_code}</div>
      </div>
      <div className="border border-gray-200 rounded p-2 text-[10px] space-y-2">
        <div className="font-semibold text-gray-600 uppercase text-[9px]">Loop 2000A — Billing Provider</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <div><span className="font-semibold">Provider Name:</span> MEDICAL ONCOLOGY BILLING</div>
          <div><span className="font-semibold">NPI:</span> {claim.providerNpi}</div>
          <div><span className="font-semibold">Tax ID:</span> <R w="w-20" /></div>
          <div><span className="font-semibold">Address:</span> <R w="w-36" /></div>
        </div>
      </div>
      <div className="border border-gray-200 rounded p-2 text-[10px] space-y-2">
        <div className="font-semibold text-gray-600 uppercase text-[9px]">Loop 2010BA — Subscriber</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <div><span className="font-semibold">Subscriber Name:</span> <R w="w-28" /></div>
          <div><span className="font-semibold">Member ID:</span> <R w="w-24" /></div>
          <div><span className="font-semibold">Payer:</span> {claim.primaryInsurance}</div>
          <div><span className="font-semibold">Relationship:</span> 18 (Self)</div>
        </div>
      </div>
      <div className="border border-gray-200 rounded p-2 text-[10px]">
        <div className="font-semibold text-gray-600 uppercase text-[9px] mb-1.5">Loop 2400 — Service Lines</div>
        <table className="w-full text-[10px]">
          <thead className="bg-gray-100">
            <tr>{['CPT / Modifier', 'DOS', 'Units', 'Billed', 'Dx Ptr', 'Note'].map(h => (
              <th key={h} className="px-1.5 py-1 text-left font-semibold border-b border-gray-200">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100 bg-green-50">
              <td className="px-1.5 py-1 font-bold text-green-700">{deniedCpt}-25</td>
              <td className="px-1.5 py-1">{dos}</td>
              <td className="px-1.5 py-1">1</td>
              <td className="px-1.5 py-1"><R w="w-14" /></td>
              <td className="px-1.5 py-1">A, B</td>
              <td className="px-1.5 py-1 text-green-700 text-[9px]">Modifier 25 added</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="text-[9px] text-gray-400 border-t border-dashed border-gray-300 pt-2 text-center">
        Corrected Claim 837P · Frequency Code 7 · Payer: {claim.primaryInsurance} · Page 1 of 1
      </div>
    </div>
  )
}

// ── NCCI Edit Reference ───────────────────────────────────────────────────────
function NCCIEditDoc({ claim }: { claim: ClaimWithAssignee }) {
  const deniedCpt = claim.deniedLineItems?.split(',')[0]?.trim() ?? '99215'
  const paidCpt = (claim.remarks?.match(/Paid CPTs?:\s*([^,.\n]+)/)?.[1] ?? '96413').trim()
  return (
    <div className="font-mono text-[11px] text-gray-800 leading-relaxed space-y-3">
      <div className="border-b-2 border-gray-800 pb-2">
        <div className="text-base font-bold">NCCI — NATIONAL CORRECT CODING INITIATIVE</div>
        <div className="text-gray-500 text-[10px]">CMS Procedure-to-Procedure Edit Reference · Column 1/Column 2 Edits</div>
      </div>
      <div className="border border-blue-200 bg-blue-50 rounded p-2 text-[10px] space-y-1">
        <div className="font-semibold text-blue-800 mb-1">Edit Lookup Result</div>
        <div><span className="font-semibold">Column 1 (Comprehensive):</span> {paidCpt}</div>
        <div><span className="font-semibold">Column 2 (Component):</span> {deniedCpt}</div>
        <div><span className="font-semibold">Edit Effective Date:</span> 01/01/2020</div>
        <div><span className="font-semibold">Edit Deletion Date:</span> Still Active</div>
        <div><span className="font-semibold">Modifier Indicator:</span> <span className="font-bold text-green-700">1 — Modifier Allowed</span></div>
      </div>
      <table className="w-full text-[10px] border border-gray-200">
        <thead className="bg-gray-100">
          <tr>{['Field', 'Value', 'Interpretation'].map(h => (
            <th key={h} className="px-2 py-1 text-left font-semibold border-b border-gray-200">{h}</th>
          ))}</tr>
        </thead>
        <tbody>
          {[
            ['Col 1 (Pays)', paidCpt, 'Comprehensive code — billed and paid'],
            ['Col 2 (Denied)', deniedCpt, 'Component code — bundled by default'],
            ['Modifier Indicator', '1', 'Bundle can be bypassed with Modifier 25'],
            ['Applicable Modifier', '25', 'Significant, separately identifiable E&M'],
            ['Override Condition', 'Mod 25 on E&M', 'E&M address distinct problem from procedure'],
          ].map(([f, v, i]) => (
            <tr key={f as string} className="border-b border-gray-100">
              <td className="px-2 py-1 font-medium">{f}</td>
              <td className="px-2 py-1">{v}</td>
              <td className="px-2 py-1 text-gray-600">{i}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border border-green-200 bg-green-50 rounded p-2 text-[10px]">
        <div className="font-semibold text-green-800 mb-1">Action</div>
        <p>Modifier indicator "1" confirms the bundling edit CAN be overridden by appending modifier 25 to
          CPT {deniedCpt}. Resubmit as {deniedCpt}-25 with supporting clinical documentation demonstrating
          a separately identifiable E&amp;M service on the same date as {paidCpt}.</p>
      </div>
      <div className="text-[9px] text-gray-400 border-t border-dashed border-gray-300 pt-2 text-center">
        NCCI Edit Reference · CMS · Col1: {paidCpt} / Col2: {deniedCpt} · Page 1 of 1
      </div>
    </div>
  )
}

// ── Oncology Treatment Protocol ───────────────────────────────────────────────
function TreatmentProtocolDoc({ claim }: { claim: ClaimWithAssignee }) {
  const dos = formatDate(claim.dateOfService)
  return (
    <div className="font-mono text-[11px] text-gray-800 leading-relaxed space-y-3">
      <div className="border-b-2 border-gray-800 pb-2">
        <div className="text-base font-bold">ONCOLOGY TREATMENT PROTOCOL / CARE PLAN</div>
        <div className="text-gray-500 text-[10px]">Medical Oncology · Approved Treatment Plan</div>
      </div>
      <div className="border border-gray-200 rounded p-2 bg-gray-50 text-[10px] grid grid-cols-2 gap-x-4 gap-y-1">
        <div><span className="font-semibold">Patient:</span> <R w="w-28" /></div>
        <div><span className="font-semibold">DOB:</span> <R w="w-20" /></div>
        <div><span className="font-semibold">MRN:</span> {claim.mrn}</div>
        <div><span className="font-semibold">Treatment Date:</span> {dos}</div>
        <div><span className="font-semibold">Oncologist:</span> {claim.providerFirstName} {claim.providerLastName}, MD</div>
        <div><span className="font-semibold">NPI:</span> {claim.providerNpi}</div>
      </div>
      <div className="border border-gray-200 rounded p-3 text-[10px] space-y-2">
        <div className="font-semibold text-gray-700 uppercase text-[9px] tracking-wider">Primary Diagnosis</div>
        <div><span className="font-semibold">Diagnosis:</span> <R w="w-48" /></div>
        <div><span className="font-semibold">ICD-10 Code:</span> <R w="w-16" /></div>
        <div><span className="font-semibold">Stage:</span> <R w="w-20" /></div>
        <div><span className="font-semibold">Date of Initial Diagnosis:</span> <R w="w-24" /></div>
      </div>
      <div className="border border-gray-200 rounded p-3 text-[10px] space-y-2">
        <div className="font-semibold text-gray-700 uppercase text-[9px] tracking-wider">Approved Treatment Regimen</div>
        <div><span className="font-semibold">Protocol Name:</span> <R w="w-36" /></div>
        <div><span className="font-semibold">Cycle Number:</span> <R w="w-10" /> of <R w="w-10" /></div>
        <div><span className="font-semibold">Drugs / CPTs:</span> {claim.deniedLineItems ?? '96415, 96417, J9355'}</div>
        <div><span className="font-semibold">Infusion Duration:</span> <R w="w-20" /></div>
        <div><span className="font-semibold">Frequency:</span> <R w="w-32" /></div>
        <div><span className="font-semibold">Total Planned Cycles:</span> <R w="w-10" /></div>
      </div>
      <div className="border border-gray-200 rounded p-3 text-[10px] space-y-1.5">
        <div className="font-semibold text-gray-700 uppercase text-[9px] tracking-wider">Medical Necessity Statement</div>
        <p>The services rendered on {dos} are medically necessary for the treatment of the above diagnosis.
          The treatment protocol was selected based on <RBlock lines={2} />
          Clinical evidence supports the use of extended infusion duration and the specified drug regimen
          for this patient's disease state and response to prior therapy.</p>
        <div className="mt-2"><span className="font-semibold">Physician Signature:</span> <R w="w-32" /></div>
        <div><span className="font-semibold">Date:</span> {dos}</div>
      </div>
      <div className="text-[9px] text-gray-400 border-t border-dashed border-gray-300 pt-2 text-center">
        Treatment Protocol · Medical Oncology · DOS: {dos} · Page 1 of 2
      </div>
    </div>
  )
}

// ── LCD / Coverage Policy Reference ──────────────────────────────────────────
function LCDDoc({ claim }: { claim: ClaimWithAssignee }) {
  return (
    <div className="font-mono text-[11px] text-gray-800 leading-relaxed space-y-3">
      <div className="border-b-2 border-gray-800 pb-2">
        <div className="text-base font-bold">LOCAL COVERAGE DETERMINATION (LCD)</div>
        <div className="text-gray-500 text-[10px]">CMS Medicare · Applicable Coverage Policy Reference</div>
      </div>
      <div className="border border-gray-200 rounded p-2 bg-gray-50 text-[10px]">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <div><span className="font-semibold">LCD Number:</span> L<R w="w-16" /></div>
          <div><span className="font-semibold">Contractor:</span> <R w="w-28" /></div>
          <div><span className="font-semibold">Title:</span> Chemotherapy Administration Services</div>
          <div><span className="font-semibold">Effective Date:</span> <R w="w-20" /></div>
          <div><span className="font-semibold">CPTs Covered:</span> {claim.deniedLineItems ?? '96415, 96417, J9355'}</div>
          <div><span className="font-semibold">Revision Date:</span> <R w="w-20" /></div>
        </div>
      </div>
      <div className="border border-gray-200 rounded p-3 text-[10px] space-y-2">
        <div className="font-semibold text-gray-700 uppercase text-[9px] tracking-wider">Coverage Indications (Excerpt)</div>
        <p>The services identified above are covered when medically reasonable and necessary for treatment of
          the following diagnoses:</p>
        <ul className="list-disc ml-4 space-y-1 text-gray-700">
          <li>Active malignancy requiring chemotherapy or immunotherapy administration</li>
          <li>Physician-documented oncological treatment plan with appropriate ICD-10 diagnosis codes</li>
          <li>Services rendered in an outpatient or office-based infusion setting</li>
          <li>Infusion duration and drug dosage consistent with approved clinical protocols</li>
        </ul>
      </div>
      <div className="border border-gray-200 rounded p-3 text-[10px] space-y-2">
        <div className="font-semibold text-gray-700 uppercase text-[9px] tracking-wider">Applicable ICD-10 Codes</div>
        <div className="flex flex-wrap gap-1.5">
          {['C34.10', 'C34.11', 'C34.12', 'C34.90', 'C50.911', 'C50.912', 'C61', 'C18.9', 'C20', 'Z51.11'].map(code => (
            <span key={code} className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px]">{code}</span>
          ))}
          <span className="px-1.5 py-0.5 bg-gray-50 border border-dashed border-gray-300 rounded text-[10px] text-gray-500">+ others per LCD</span>
        </div>
        <p className="text-gray-500 mt-1">Patient diagnosis codes must map to covered ICD-10 codes listed in the LCD.
          Include matching Dx codes on the claim in Boxes 21 and 24E (837P Loop 2300/2400).</p>
      </div>
      <div className="text-[9px] text-gray-400 border-t border-dashed border-gray-300 pt-2 text-center">
        LCD Reference · CMS · CPTs: {claim.deniedLineItems ?? '96415, 96417'} · Page 1 of 3
      </div>
    </div>
  )
}

// ── Retrospective Authorization Request ───────────────────────────────────────
function RetroAuthDoc({ claim, denial }: { claim: ClaimWithAssignee; denial: Denial }) {
  const dos = formatDate(claim.dateOfService)
  return (
    <div className="font-mono text-[11px] text-gray-800 leading-relaxed space-y-3">
      <div className="border-b-2 border-gray-800 pb-2">
        <div className="text-base font-bold">RETROSPECTIVE AUTHORIZATION REQUEST</div>
        <div className="text-gray-500 text-[10px]">{claim.primaryInsurance} Utilization Management · Retro Auth Request Form</div>
      </div>
      <div className="border-2 border-orange-300 bg-orange-50 rounded p-2 text-[10px] space-y-0.5">
        <div className="font-bold text-orange-800">RETROSPECTIVE REVIEW — Urgent Request</div>
        <div><span className="font-semibold">Denial Code:</span> {denial.denial_code} — {denial.denial_reason}</div>
        <div><span className="font-semibold">Denied Services:</span> {claim.deniedLineItems}</div>
        <div><span className="font-semibold">DOS:</span> {dos}</div>
      </div>
      <div className="border border-gray-200 rounded p-2 text-[10px] space-y-1.5">
        <div className="font-semibold text-gray-700 uppercase text-[9px] mb-1">Patient &amp; Claim Information</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <div><span className="font-semibold">Patient Name:</span> <R w="w-28" /></div>
          <div><span className="font-semibold">Member ID:</span> <R w="w-24" /></div>
          <div><span className="font-semibold">Group #:</span> <R w="w-20" /></div>
          <div><span className="font-semibold">DOB:</span> <R w="w-20" /></div>
          <div><span className="font-semibold">Claim #:</span> {claim.claimNumber ?? claim.claimId}</div>
          <div><span className="font-semibold">Billed Amount:</span> {formatCurrency(Number(claim.chargeAmount))}</div>
        </div>
      </div>
      <div className="border border-gray-200 rounded p-3 text-[10px] space-y-2">
        <div className="font-semibold text-gray-700 uppercase text-[9px] tracking-wider">Clinical Justification</div>
        <p>The following services were rendered on {dos} without prior authorization due to the urgent and
          ongoing nature of the patient's oncological treatment. The services were medically necessary and
          consistent with the patient's approved treatment plan:</p>
        <ul className="list-disc ml-4 space-y-0.5 text-gray-700">
          <li>Services: {claim.deniedLineItems ?? '96415, 96417, J9355'}</li>
          <li>Clinical indication: <RBlock lines={1} /></li>
          <li>Authorization was not obtained due to: <R w="w-36" /></li>
        </ul>
      </div>
      <div className="border border-gray-200 rounded p-3 text-[10px] space-y-2">
        <div className="font-semibold text-gray-700 uppercase text-[9px] mb-1">Supporting Documents Attached</div>
        {['Physician order for {dos}', 'Oncology treatment protocol', 'Progress note', 'Diagnosis confirmation (ICD-10 codes)'].map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-3 h-3 border border-gray-700 rounded-sm flex-shrink-0 bg-gray-700" />
            <span>{d.replace('{dos}', dos)}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-300 pt-2 text-[10px]">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-gray-500 mb-0.5">Requesting Provider Signature</div>
            <div className="border-b border-gray-800 h-6"><R w="w-32" /></div>
            <div className="text-gray-500 mt-0.5">{claim.providerFirstName} {claim.providerLastName}, MD</div>
          </div>
          <div>
            <div className="text-gray-500 mb-0.5">Date Submitted</div>
            <div className="border-b border-gray-800 h-6"><R w="w-24" /></div>
          </div>
        </div>
      </div>
      <div className="text-[9px] text-gray-400 border-t border-dashed border-gray-300 pt-2 text-center">
        Retro Auth Request · {claim.primaryInsurance} UM · Claim: {claim.claimNumber ?? claim.claimId} · Page 1 of 1
      </div>
    </div>
  )
}

// ── Original Secondary Claim (CO-22) ──────────────────────────────────────────
function SecondaryClaimDoc({ claim, denial }: { claim: ClaimWithAssignee; denial: Denial }) {
  const dos = formatDate(claim.dateOfService)
  return (
    <div className="font-mono text-[11px] text-gray-800 leading-relaxed space-y-3">
      <div className="border-b-2 border-gray-800 pb-2">
        <div className="text-base font-bold">SECONDARY CLAIM — CMS-1500 / 837P</div>
        <div className="text-gray-500 text-[10px]">Original Submission · Denied with {denial.denial_code}</div>
      </div>
      <div className="border-2 border-red-200 bg-red-50 rounded p-2 text-[10px]">
        <div className="font-bold text-red-700">DENIAL NOTICE: {denial.denial_code}</div>
        <div className="text-gray-700">{denial.denial_reason || 'COB documentation missing — Medicare EOMB not attached'}</div>
        <div><span className="font-semibold">Adjudication Date:</span> <R w="w-24" /></div>
      </div>
      <div className="border border-gray-200 rounded p-2 text-[10px] space-y-2">
        <div className="font-semibold text-gray-600 uppercase text-[9px]">Box 1a — Subscriber / Secondary Insured</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <div><span className="font-semibold">Secondary Payer:</span> {claim.secondaryInsurance ?? claim.primaryInsurance}</div>
          <div><span className="font-semibold">Secondary Member ID:</span> <R w="w-24" /></div>
          <div><span className="font-semibold">Group #:</span> <R w="w-20" /></div>
          <div><span className="font-semibold">Payer Responsibility:</span> S (Secondary)</div>
        </div>
      </div>
      <div className="border border-gray-200 rounded p-2 text-[10px] space-y-1.5">
        <div className="font-semibold text-gray-600 uppercase text-[9px]">Box 21 — Diagnosis Codes</div>
        <div className="flex gap-2 flex-wrap">
          {['A: ', 'B: ', 'C: '].map(l => (
            <span key={l} className="text-gray-700">{l}<R w="w-14" /></span>
          ))}
        </div>
      </div>
      <div className="border border-gray-200 rounded p-2 text-[10px]">
        <div className="font-semibold text-gray-600 uppercase text-[9px] mb-1.5">Box 24 — Service Lines</div>
        <table className="w-full text-[10px]">
          <thead className="bg-gray-100">
            <tr>{['DOS', 'CPT', 'Modifier', 'Dx Ptr', 'Billed', 'Status'].map(h => (
              <th key={h} className="px-1.5 py-1 text-left font-semibold border-b border-gray-200">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {(claim.deniedLineItems ?? '99213, 96401').split(',').map((cpt, i) => (
              <tr key={i} className="border-b border-gray-100 bg-red-50">
                <td className="px-1.5 py-1">{dos}</td>
                <td className="px-1.5 py-1 font-medium">{cpt.trim()}</td>
                <td className="px-1.5 py-1">—</td>
                <td className="px-1.5 py-1">A</td>
                <td className="px-1.5 py-1"><R w="w-14" /></td>
                <td className="px-1.5 py-1 text-red-600 font-semibold">DENIED</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border border-orange-200 bg-orange-50 rounded p-2 text-[10px]">
        <div className="font-semibold text-orange-800 mb-1">Resubmission Required</div>
        <p>Resubmit this claim with Medicare EOMB attached (Loop 2320 COB segments populated).
          Include Medicare allowed amount, Medicare paid amount, and patient responsibility in the 837P COB data.</p>
      </div>
      <div className="text-[9px] text-gray-400 border-t border-dashed border-gray-300 pt-2 text-center">
        Secondary Claim · CMS-1500 · Payer: {claim.secondaryInsurance ?? claim.primaryInsurance} · Denied: {denial.denial_code} · Page 1 of 1
      </div>
    </div>
  )
}

// ── MSP Questionnaire ─────────────────────────────────────────────────────────
function MSPQuestionnaireDoc({ claim }: { claim: ClaimWithAssignee }) {
  return (
    <div className="font-mono text-[11px] text-gray-800 leading-relaxed space-y-3">
      <div className="border-b-2 border-blue-800 pb-2">
        <div className="text-base font-bold text-blue-800">MEDICARE SECONDARY PAYER (MSP) QUESTIONNAIRE</div>
        <div className="text-gray-500 text-[10px]">CMS Form · Required for Coordination of Benefits Verification</div>
      </div>
      <div className="border border-blue-200 rounded p-2 bg-blue-50 text-[10px] space-y-1">
        <div className="font-semibold text-blue-800 mb-1">Patient Information</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <div><span className="font-semibold">Patient Name:</span> <R w="w-28" /></div>
          <div><span className="font-semibold">Medicare ID (MBI):</span> <R w="w-24" /></div>
          <div><span className="font-semibold">Date of Birth:</span> <R w="w-20" /></div>
          <div><span className="font-semibold">Date of Service:</span> {formatDate(claim.dateOfService)}</div>
        </div>
      </div>
      <div className="space-y-3 text-[10px]">
        {[
          { q: '1. Are you currently employed?', a: 'No', sub: null },
          { q: '2. Is your spouse currently employed?', a: 'No', sub: null },
          { q: '3. Do you have coverage through a current employer group health plan?', a: 'No', sub: null },
          { q: '4. Do you have End-Stage Renal Disease (ESRD)?', a: 'No', sub: null },
          { q: '5. Have you been in an automobile accident or had any injuries?', a: 'No', sub: null },
          { q: '6. Do you have Workers\' Compensation coverage?', a: 'No', sub: null },
          { q: '7. Do you have any other health insurance in addition to Medicare?', a: 'Yes', sub: `Secondary payer: ${claim.secondaryInsurance ?? claim.primaryInsurance} · Member ID: [redacted]` },
          { q: '8. Is Medicare the primary payer for services on the date of service?', a: 'Yes', sub: null },
        ].map(({ q, a, sub }, i) => (
          <div key={i} className="border-b border-gray-100 pb-2">
            <div className="flex items-start gap-2">
              <span className="text-gray-700">{q}</span>
              <span className={`ml-auto font-bold flex-shrink-0 ${a === 'Yes' ? 'text-green-700' : 'text-gray-700'}`}>{a}</span>
            </div>
            {sub && <div className="mt-1 ml-3 text-gray-500 italic">{sub}</div>}
          </div>
        ))}
      </div>
      <div className="border-t border-gray-300 pt-2 text-[10px]">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-gray-500 mb-0.5">Patient / Authorized Signature</div>
            <div className="border-b border-gray-800 h-6"><R w="w-32" /></div>
          </div>
          <div>
            <div className="text-gray-500 mb-0.5">Date</div>
            <div className="border-b border-gray-800 h-6"><R w="w-20" /></div>
          </div>
        </div>
      </div>
      <div className="text-[9px] text-gray-400 border-t border-dashed border-gray-300 pt-2 text-center">
        MSP Questionnaire · CMS · Patient: <R w="w-20" /> · Page 1 of 1
      </div>
    </div>
  )
}

// ── Medicare Eligibility Confirmation ────────────────────────────────────────
function MedicareEligConfirmDoc({ claim }: { claim: ClaimWithAssignee }) {
  return (
    <div className="font-mono text-[11px] text-gray-800 leading-relaxed space-y-3">
      <div className="border-b-2 border-blue-800 pb-2">
        <div className="text-base font-bold text-blue-800">MEDICARE ELIGIBILITY CONFIRMATION</div>
        <div className="text-gray-500 text-[10px]">CMS HETS Dual-Coverage Verification · Primary/Secondary COB Confirmation</div>
      </div>
      <div className="border-2 border-green-300 bg-green-50 rounded p-2 text-[10px]">
        <div className="font-bold text-green-800 mb-1">COVERAGE STATUS: ACTIVE — DUAL COVERAGE CONFIRMED</div>
        <div><span className="font-semibold">DOS:</span> {formatDate(claim.dateOfService)}</div>
        <div><span className="font-semibold">Medicare Status on DOS:</span> <span className="text-green-700 font-bold">ACTIVE (Part B)</span></div>
        <div><span className="font-semibold">Commercial Plan Status on DOS:</span> <span className="text-green-700 font-bold">ACTIVE (Secondary)</span></div>
      </div>
      <div className="border border-gray-200 rounded p-2 text-[10px] space-y-1.5">
        <div className="font-semibold text-gray-700 uppercase text-[9px]">Medicare (Primary)</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <div><span className="font-semibold">Medicare ID (MBI):</span> <R w="w-24" /></div>
          <div><span className="font-semibold">Effective Date:</span> <R w="w-20" /></div>
          <div><span className="font-semibold">Part B Active:</span> <span className="text-green-700">Yes</span></div>
          <div><span className="font-semibold">Payer Responsibility:</span> P (Primary)</div>
        </div>
      </div>
      <div className="border border-gray-200 rounded p-2 text-[10px] space-y-1.5">
        <div className="font-semibold text-gray-700 uppercase text-[9px]">Commercial Plan (Secondary)</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <div><span className="font-semibold">Payer:</span> {claim.secondaryInsurance ?? claim.primaryInsurance}</div>
          <div><span className="font-semibold">Member ID:</span> <R w="w-24" /></div>
          <div><span className="font-semibold">Group #:</span> <R w="w-20" /></div>
          <div><span className="font-semibold">Payer Responsibility:</span> S (Secondary)</div>
        </div>
      </div>
      <div className="border border-blue-200 bg-blue-50 rounded p-2 text-[10px]">
        <div className="font-semibold text-blue-800 mb-1">COB Summary</div>
        <p>Both plans were active on the date of service. Medicare processed as primary payer.
          The secondary claim to {claim.secondaryInsurance ?? claim.primaryInsurance} was denied (CO-22)
          because the Medicare EOMB was not attached. Resubmit secondary claim with EOMB included.</p>
      </div>
      <div className="text-[9px] text-gray-400 border-t border-dashed border-gray-300 pt-2 text-center">
        Medicare Eligibility Confirmation · HETS · DOS: {formatDate(claim.dateOfService)} · Page 1 of 1
      </div>
    </div>
  )
}

// ── Document router ───────────────────────────────────────────────────────────
function renderDoc(docName: string, claim: ClaimWithAssignee, denial: Denial): React.ReactNode {
  const n = docName.toLowerCase()

  if (n.includes('explanation of benefits') || n.includes('eob') || n.includes('original eob')) {
    if (n.includes('medicare eomb') || n.includes('eft payment')) return <MedicareEOMBDoc claim={claim} />
    return <EOBDoc claim={claim} denial={denial} />
  }
  if (n.includes('medicare eomb') || n.includes('eft payment')) return <MedicareEOMBDoc claim={claim} />
  if (n.includes('eligibility verification') || n.includes('real-time eligibility')) return <EligibilityVerificationDoc claim={claim} />
  if (n.includes('re-enrollment') || n.includes('reenrollment')) return <ReEnrollmentDoc claim={claim} />
  if (n.includes('premium payment')) return <PremiumPaymentHistoryDoc claim={claim} />
  if (n.includes('insurance update') || n.includes('patient insurance update')) return <InsuranceUpdateFormDoc claim={claim} />
  if (n.includes('hets') || n.includes('medicare eligibility query')) return <HETSQueryDoc claim={claim} />
  if (n.includes('progress note')) return <ProgressNoteDoc claim={claim} denial={denial} />
  if (n.includes('corrected claim') || n.includes('837p')) return <CorrectedClaimDoc claim={claim} denial={denial} />
  if (n.includes('ncci')) return <NCCIEditDoc claim={claim} />
  if (n.includes('treatment protocol') || n.includes('care plan') || n.includes('oncology treatment')) return <TreatmentProtocolDoc claim={claim} />
  if (n.includes('lcd') || n.includes('coverage policy')) return <LCDDoc claim={claim} />
  if (n.includes('retrospective') || n.includes('authorization request')) return <RetroAuthDoc claim={claim} denial={denial} />
  if (n.includes('secondary claim') || n.includes('original secondary')) return <SecondaryClaimDoc claim={claim} denial={denial} />
  if (n.includes('msp questionnaire')) return <MSPQuestionnaireDoc claim={claim} />
  if (n.includes('medicare eligibility confirmation')) return <MedicareEligConfirmDoc claim={claim} />

  // Fallback — generic redacted document
  return (
    <div className="font-mono text-[11px] text-gray-800 leading-relaxed space-y-3">
      <div className="border-b-2 border-gray-800 pb-2">
        <div className="text-base font-bold">{docName.toUpperCase()}</div>
        <div className="text-gray-500 text-[10px]">Medical Oncology Billing Services · Redacted Document</div>
      </div>
      <div className="text-right text-[10px] text-gray-500">Document Date: <R w="w-24" /></div>
      <div className="border border-gray-200 rounded p-3 bg-gray-50 text-[10px] space-y-1.5">
        <div className="font-semibold text-gray-600 uppercase text-[9px] tracking-wider mb-2">Document Details</div>
        <div><span className="font-semibold">Reference:</span> <R w="w-36" /></div>
        <div><span className="font-semibold">Patient:</span> <R w="w-32" /></div>
        <div><span className="font-semibold">Claim #:</span> {claim.claimNumber ?? claim.claimId}</div>
        <div><span className="font-semibold">DOS:</span> {formatDate(claim.dateOfService)}</div>
        <div><span className="font-semibold">Payer:</span> {claim.primaryInsurance}</div>
      </div>
      <div className="space-y-2">
        <RBlock lines={4} />
        <RBlock lines={3} />
        <RBlock lines={2} />
      </div>
      <div className="text-[9px] text-gray-400 border-t border-dashed border-gray-300 pt-2 text-center">
        {docName} · Redacted · Page 1 of 1
      </div>
    </div>
  )
}

// ── Main popup ────────────────────────────────────────────────────────────────
export function DocViewerPopup({ docName, claim, denial, onClose }: DocViewerPopupProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-[80]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[90] w-[680px] max-h-[88vh] bg-white rounded-xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-9 bg-gray-100 border border-gray-200 rounded flex flex-col items-center justify-center flex-shrink-0">
              <FileText className="h-4 w-4 text-gray-500" />
              <span className="text-[7px] text-gray-400 mt-0.5">PDF</span>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">{docName}</div>
              <div className="text-[10px] text-gray-400">Redacted · Mock document for demo</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Document content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            {renderDoc(docName, claim, denial)}
          </div>
        </div>
      </div>
    </>
  )
}

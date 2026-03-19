'use client'

import { useState } from 'react'
import { FileText, ChevronRight, X } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import { ClaimWithAssignee } from '@/lib/types'

interface Denial {
  denial_code: string
  denial_remark_code: string
  denial_reason: string
  denial_type: string
}

interface MockDocumentsTabProps {
  claim: ClaimWithAssignee
  denial: Denial
}

// ── Redaction helpers ────────────────────────────────────────────────────────
function Redacted({ width = 'w-28' }: { width?: string }) {
  return <span className={`inline-block bg-gray-900 rounded-sm h-3 ${width} align-middle mx-0.5`} />
}
function RedactedLg({ width = 'w-36' }: { width?: string }) {
  return <span className={`inline-block bg-gray-900 rounded-sm h-3.5 ${width} align-middle mx-0.5`} />
}

// ── Document type definitions ────────────────────────────────────────────────
interface MockDoc {
  id: string
  title: string
  type: string
  date: string
  pages: number
  badge?: string
  badgeColor?: string
  render: () => React.ReactNode
}

// ── Denial Letter ────────────────────────────────────────────────────────────
function DenialLetterContent({ claim, denial }: MockDocumentsTabProps) {
  const payer = claim.primaryInsurance
  const dos = formatDate(claim.dateOfService)
  const code = denial.denial_code

  const payerAddress = (() => {
    const ins = payer?.toLowerCase() ?? ''
    if (ins.includes('united')) return ['United Healthcare', 'Member Services', 'P.O. Box 30432', 'Salt Lake City, UT 84130']
    if (ins.includes('cigna')) return ['Cigna Healthcare', 'Claims Department', 'P.O. Box 188004', 'Chattanooga, TN 37422']
    if (ins.includes('aetna')) return ['Aetna', 'Member Services Department', 'P.O. Box 14463', 'Lexington, KY 40512']
    if (ins.includes('medicare')) return ['Medicare Administrative Contractor', 'Claims Department', 'P.O. Box 6703', 'Indianapolis, IN 46206']
    if (ins.includes('blue cross') || ins.includes('bcbs')) return ['Blue Cross Blue Shield', 'Appeals Department', 'P.O. Box 2924', 'Fargo, ND 58108']
    return [payer, 'Claims Department']
  })()

  const denialBody = (() => {
    if (code === 'CO-27') return 'After careful review of the claim referenced above, we regret to inform you that the claim has been denied. Our records indicate that the member\'s coverage terminated prior to the date of service. Benefits are not payable for services rendered after the coverage termination date per the terms of the member\'s benefit plan.'
    if (code === 'CO-28') return 'After review of the above-referenced claim, we are unable to process this claim as submitted. Our eligibility records do not reflect active coverage for this member on the date of service indicated. The member ID provided was not found as an active subscriber in our plan records on the date of service.'
    if (code === 'CO-97') return 'The claim referenced above has been partially processed. The evaluation and management service (CPT 99215) billed on the same date as an infusion procedure has been denied per our payment policy. Per NCCI guidelines, the E&M service is considered bundled with the infusion administration and is not separately reimbursable without modifier 25.'
    if (code === 'CO-50') return 'The claim referenced above has been partially processed. The additional infusion hours and drug administration services billed have been denied as not medically necessary. Our clinical review determined that the services as billed do not meet the medical necessity criteria established under the member\'s benefit plan. A prior authorization was not on file for the denied services.'
    return 'After review of the above-referenced claim, we have determined that this claim requires coordination of benefits processing. Our records indicate the member may have coverage under another plan which should be billed as the primary payer. Please resubmit this claim with the primary payer\'s Explanation of Benefits attached.'
  })()

  return (
    <div className="font-mono text-[11px] text-gray-800 leading-relaxed space-y-4">
      {/* Letterhead */}
      <div className="border-b-2 border-gray-800 pb-3 mb-4">
        <div className="text-base font-bold tracking-wide">{payerAddress[0]}</div>
        {payerAddress.slice(1).map((line, i) => (
          <div key={i} className="text-gray-600">{line}</div>
        ))}
      </div>

      {/* Date */}
      <div className="text-right text-gray-600">
        Date: <Redacted width="w-24" />
      </div>

      {/* Recipient block */}
      <div className="space-y-0.5">
        <div><Redacted width="w-32" /> <Redacted width="w-24" /></div>
        <div><Redacted width="w-48" /></div>
        <div><Redacted width="w-36" /></div>
        <div><Redacted width="w-40" /></div>
      </div>

      {/* RE line */}
      <div className="border border-gray-300 bg-gray-50 px-3 py-2 rounded space-y-1">
        <div><span className="font-bold">RE:</span> Claim Determination Notice</div>
        <div><span className="font-semibold">Patient:</span> <Redacted width="w-32" /> <Redacted width="w-24" /></div>
        <div><span className="font-semibold">Member ID:</span> <Redacted width="w-28" /></div>
        <div><span className="font-semibold">Claim #:</span> {claim.claimNumber ?? claim.claimId}</div>
        <div><span className="font-semibold">Date of Service:</span> {dos}</div>
        <div><span className="font-semibold">Billed Amount:</span> {formatCurrency(Number(claim.chargeAmount))}</div>
        <div><span className="font-semibold">Denial Code:</span> {code || 'CO-22'}</div>
      </div>

      <div>Dear <Redacted width="w-24" />,</div>

      <p>{denialBody}</p>

      <p>
        If you believe this determination is incorrect, you have the right to appeal this decision.
        Appeals must be submitted in writing within <span className="font-semibold">180 days</span> of
        the date of this letter. Please include a copy of this notice and any supporting documentation
        with your appeal submission.
      </p>

      <p>
        For questions regarding this determination, please contact our Provider Services department
        at the number listed on the back of the member's insurance card, or visit our provider portal.
        Reference your claim number when contacting us.
      </p>

      <div className="border-t border-gray-300 pt-3 mt-4 space-y-1">
        <div>Sincerely,</div>
        <div className="mt-4"><Redacted width="w-36" /></div>
        <div><Redacted width="w-48" /></div>
        <div>Claims Adjudication Department</div>
        <div>{payerAddress[0]}</div>
      </div>

      <div className="border-t border-dashed border-gray-300 pt-2 text-[9px] text-gray-400 text-center">
        This is an official determination notice. Retain for your records. · Ref: <Redacted width="w-20" /> · Page 1 of 1
      </div>
    </div>
  )
}

// ── EOB Document ─────────────────────────────────────────────────────────────
function EOBContent({ claim, denial }: MockDocumentsTabProps) {
  const code = denial.denial_code
  const payer = claim.primaryInsurance
  const dos = formatDate(claim.dateOfService)
  const total = Number(claim.chargeAmount)
  const paid = Number(claim.paidAmount) || 0
  const isPartial = claim.claimStatus === 'PARTIALLY_PAID'

  const deniedCpts = ((claim.deniedLineItems ?? '99215, 96413')).split(',').map(s => s.trim())
  const paidCptMatch = isPartial ? (claim.remarks ?? '').match(/Paid CPTs?:\s*([^.\n]+)/) : null
  const paidCpts = paidCptMatch ? paidCptMatch[1].split(',').map(s => s.trim()) : []
  const allCpts = isPartial && paidCpts.length ? [...paidCpts, ...deniedCpts] : deniedCpts
  const perCpt = Math.round((total / (allCpts.length || 1)) * 100) / 100

  return (
    <div className="font-mono text-[11px] text-gray-800 leading-relaxed space-y-3">
      {/* Header */}
      <div className="border-b-2 border-gray-800 pb-2 flex justify-between items-start">
        <div>
          <div className="text-base font-bold">{payer}</div>
          <div className="text-gray-500 text-[10px]">EXPLANATION OF BENEFITS</div>
        </div>
        <div className="text-right text-[10px] text-gray-500">
          <div>EOB Date: <Redacted width="w-16" /></div>
          <div>Check/EFT #: {claim.checkNumber ? <span>{claim.checkNumber}</span> : <Redacted width="w-20" />}</div>
        </div>
      </div>

      {/* Member info */}
      <div className="grid grid-cols-2 gap-x-4 border border-gray-200 rounded p-2 bg-gray-50 text-[10px]">
        <div><span className="font-semibold">Member Name:</span> <Redacted width="w-28" /></div>
        <div><span className="font-semibold">Member ID:</span> <Redacted width="w-24" /></div>
        <div><span className="font-semibold">Group #:</span> <Redacted width="w-20" /></div>
        <div><span className="font-semibold">DOB:</span> <Redacted width="w-16" /></div>
        <div><span className="font-semibold">Provider:</span> {claim.providerLastName}</div>
        <div><span className="font-semibold">NPI:</span> {claim.providerNpi}</div>
        <div><span className="font-semibold">Claim #:</span> {claim.claimNumber ?? claim.claimId}</div>
        <div><span className="font-semibold">DOS:</span> {dos}</div>
      </div>

      {/* Service lines table */}
      <table className="w-full text-[10px] border border-gray-200">
        <thead className="bg-gray-100">
          <tr>
            {['CPT', 'Billed', 'Allowed', 'Paid', 'Adj Reason'].map(h => (
              <th key={h} className="px-1.5 py-1 text-left font-semibold border-b border-gray-200">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {allCpts.map((cpt, i) => {
            const isPaid = isPartial && paidCpts.includes(cpt)
            const isDenied = deniedCpts.includes(cpt) && !(isPartial && paidCpts.includes(cpt))
            const linePaid = isPaid ? Math.round((paid / paidCpts.length) * 100) / 100
              : (!isPartial && paid > 0) ? Math.round((paid / allCpts.length) * 100) / 100
              : 0
            return (
              <tr key={i} className={`border-b border-gray-100 ${isDenied ? 'bg-red-50' : ''}`}>
                <td className="px-1.5 py-1 font-medium">{cpt}</td>
                <td className="px-1.5 py-1">{formatCurrency(perCpt)}</td>
                <td className="px-1.5 py-1">{isDenied ? '$0.00' : formatCurrency(Math.round(perCpt * 0.85 * 100) / 100)}</td>
                <td className="px-1.5 py-1">{formatCurrency(linePaid)}</td>
                <td className="px-1.5 py-1 text-red-600">{isDenied ? (code || 'CO-22') : (linePaid > 0 ? '—' : code || '—')}</td>
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
            <td className="px-1.5 py-1" />
          </tr>
        </tfoot>
      </table>

      {/* Adjustment reason codes */}
      <div className="border border-gray-200 rounded p-2 text-[10px] space-y-1">
        <div className="font-semibold uppercase text-gray-600 mb-1">Adjustment Reason Codes</div>
        {code === 'CO-27' && <div><span className="font-semibold">CO-27:</span> Expenses incurred after coverage terminated.</div>}
        {code === 'CO-28' && <div><span className="font-semibold">CO-28:</span> Coverage not in effect at the time the service was provided.</div>}
        {code === 'CO-97' && <div><span className="font-semibold">CO-97:</span> The benefit for this service is included in the payment/allowance for another service already adjudicated.</div>}
        {code === 'CO-50' && <div><span className="font-semibold">CO-50:</span> These are non-covered services because this is not deemed a medical necessity by the payer.</div>}
        {(!code || code === 'CO-22') && <div><span className="font-semibold">CO-22:</span> This care may be covered by another payer per coordination of benefits.</div>}
      </div>

      {/* Totals summary */}
      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div className="border border-gray-200 rounded p-2 space-y-1">
          <div className="font-semibold text-gray-600 uppercase">Payment Summary</div>
          <div className="flex justify-between"><span>Total Billed:</span><span>{formatCurrency(total)}</span></div>
          <div className="flex justify-between"><span>Total Allowed:</span><span>{formatCurrency(Math.round(total * 0.85 * 100) / 100)}</span></div>
          <div className="flex justify-between"><span>Plan Paid:</span><span className="font-semibold text-green-700">{formatCurrency(paid)}</span></div>
          <div className="flex justify-between border-t border-gray-200 pt-1 font-semibold"><span>Member Responsibility:</span><span>{formatCurrency(Math.round((total - paid) * 100) / 100)}</span></div>
        </div>
        <div className="border border-gray-200 rounded p-2 space-y-1">
          <div className="font-semibold text-gray-600 uppercase">Member Info</div>
          <div className="flex justify-between"><span>Deductible Applied:</span><span>$0.00</span></div>
          <div className="flex justify-between"><span>Copay:</span><span>$0.00</span></div>
          <div className="flex justify-between"><span>Coinsurance:</span><span><Redacted width="w-10" /></span></div>
          <div className="flex justify-between"><span>Not Covered:</span><span>{formatCurrency(Math.round((total - paid) * 100) / 100)}</span></div>
        </div>
      </div>

      <div className="text-[9px] text-gray-400 border-t border-dashed border-gray-300 pt-2 text-center">
        This EOB is not a bill. Keep for your records. · {payer} · Page 1 of 1 · Ref: <Redacted width="w-16" />
      </div>
    </div>
  )
}

// ── Medicare EOMB (for CO-22) ─────────────────────────────────────────────────
function MedicareEOMBContent({ claim }: { claim: ClaimWithAssignee }) {
  const dos = formatDate(claim.dateOfService)
  const paid = Number(claim.paidAmount) || 0
  const total = Number(claim.chargeAmount)
  const deniedCpts = ((claim.secondaryDeniedLineItems ?? claim.deniedLineItems ?? '99213, 96401, 85730')).split(',').map(s => s.trim())

  return (
    <div className="font-mono text-[11px] text-gray-800 leading-relaxed space-y-3">
      <div className="border-b-2 border-blue-800 pb-2 flex justify-between">
        <div>
          <div className="text-base font-bold text-blue-800">MEDICARE</div>
          <div className="text-[10px] text-gray-600">EXPLANATION OF MEDICARE BENEFITS (EOMB)</div>
          <div className="text-[10px] text-gray-500">Centers for Medicare & Medicaid Services</div>
        </div>
        <div className="text-right text-[10px]">
          <div className="font-semibold">Medicare EFT</div>
          <div>{claim.checkNumber ?? <Redacted width="w-20" />}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 text-[10px] border border-blue-100 bg-blue-50 rounded p-2">
        <div><span className="font-semibold">Beneficiary:</span> <Redacted width="w-28" /></div>
        <div><span className="font-semibold">Medicare ID:</span> <Redacted width="w-24" /></div>
        <div><span className="font-semibold">HIC Number:</span> <Redacted width="w-20" /></div>
        <div><span className="font-semibold">DOS:</span> {dos}</div>
        <div><span className="font-semibold">Provider:</span> {claim.providerLastName}</div>
        <div><span className="font-semibold">NPI:</span> {claim.providerNpi}</div>
      </div>

      <table className="w-full text-[10px] border border-gray-200">
        <thead className="bg-blue-50">
          <tr>
            {['CPT', 'Submitted', 'Medicare Approved', 'Medicare Paid (80%)', 'Patient Resp (20%)'].map(h => (
              <th key={h} className="px-1.5 py-1 text-left font-semibold border-b border-gray-200">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {deniedCpts.map((cpt, i) => {
            const billed = Math.round((total / deniedCpts.length) * 100) / 100
            const approved = Math.round(billed * 0.85 * 100) / 100
            const mcPaid = Math.round(approved * 0.80 * 100) / 100
            const patResp = Math.round(approved * 0.20 * 100) / 100
            return (
              <tr key={i} className="border-b border-gray-100">
                <td className="px-1.5 py-1 font-medium">{cpt}</td>
                <td className="px-1.5 py-1">{formatCurrency(billed)}</td>
                <td className="px-1.5 py-1">{formatCurrency(approved)}</td>
                <td className="px-1.5 py-1 text-blue-700 font-semibold">{formatCurrency(mcPaid)}</td>
                <td className="px-1.5 py-1">{formatCurrency(patResp)}</td>
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

      <div className="text-[10px] border border-blue-200 bg-blue-50 rounded p-2">
        <div className="font-semibold mb-1">Medicare Payment Notice</div>
        <p>Medicare has processed this claim as the primary payer under CMS Medicare Secondary Payer (MSP) rules. Payment of {formatCurrency(paid)} has been issued via Electronic Funds Transfer. The remaining patient responsibility of {formatCurrency(Math.round(total * 0.85 * 0.20 * 100) / 100)} (20% coinsurance) may be covered by a secondary payer. This EOMB must be submitted with the secondary claim.</p>
      </div>

      <div className="text-[9px] text-gray-400 border-t border-dashed border-gray-300 pt-2 text-center">
        Medicare EOMB · CMS Form 1450 · EFT Ref: {claim.checkNumber ?? <Redacted width="w-16" />} · Page 1 of 1
      </div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────
export function MockDocumentsTab({ claim, denial }: MockDocumentsTabProps) {
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null)

  const code = denial.denial_code || 'CO-22'
  const isCO22 = code === 'CO-22' || (!denial.denial_code && claim.secondaryDenialCodes?.includes('CO-22'))

  // Build document list based on denial type
  const docs: MockDoc[] = [
    {
      id: 'denial-letter',
      title: 'Denial Letter',
      type: 'Payer Correspondence',
      date: claim.denialDate ? formatDate(claim.denialDate) : formatDate(claim.claimReceivedDate ?? claim.dateOfService),
      pages: 1,
      badge: 'Denial',
      badgeColor: 'bg-red-100 text-red-700',
      render: () => <DenialLetterContent claim={claim} denial={denial} />,
    },
    {
      id: 'eob',
      title: 'Explanation of Benefits (EOB)',
      type: 'Payer EOB',
      date: claim.checkDate ? formatDate(claim.checkDate) : formatDate(claim.claimReceivedDate ?? claim.dateOfService),
      pages: 1,
      badge: claim.claimStatus === 'PARTIALLY_PAID' ? 'Partial Pay' : 'Denied',
      badgeColor: claim.claimStatus === 'PARTIALLY_PAID' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700',
      render: () => <EOBContent claim={claim} denial={denial} />,
    },
    ...(isCO22 ? [{
      id: 'medicare-eomb',
      title: 'Medicare EOMB',
      type: 'Medicare Adjudication',
      date: claim.checkDate ? formatDate(claim.checkDate) : formatDate(claim.dateOfService),
      pages: 1,
      badge: 'Medicare',
      badgeColor: 'bg-blue-100 text-blue-700',
      render: () => <MedicareEOMBContent claim={claim} />,
    }] : []),
  ]

  const active = docs.find(d => d.id === selectedDoc)

  if (active) {
    return (
      <div className="flex flex-col h-full">
        {/* Back bar */}
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
          <button
            onClick={() => setSelectedDoc(null)}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
          >
            ← Back to documents
          </button>
          <span className="text-gray-300">|</span>
          <span className="text-xs text-gray-600 font-medium">{active.title}</span>
          <span className={`ml-auto px-2 py-0.5 rounded text-[10px] font-medium ${active.badgeColor}`}>
            {active.badge}
          </span>
        </div>

        {/* Document preview */}
        <div className="flex-1 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          {active.render()}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 mb-4">
        {docs.length} document{docs.length !== 1 ? 's' : ''} associated with this claim.
        Documents contain redacted patient information.
      </p>

      {docs.map((doc) => (
        <button
          key={doc.id}
          onClick={() => setSelectedDoc(doc.id)}
          className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-left group"
        >
          {/* Icon */}
          <div className="flex-shrink-0 w-10 h-12 bg-gray-100 rounded border border-gray-200 flex flex-col items-center justify-center group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors">
            <FileText className="h-5 w-5 text-gray-400 group-hover:text-blue-500" />
            <span className="text-[8px] text-gray-400 mt-0.5">PDF</span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-medium text-gray-900 truncate">{doc.title}</span>
              {doc.badge && (
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${doc.badgeColor} flex-shrink-0`}>
                  {doc.badge}
                </span>
              )}
            </div>
            <div className="text-[10px] text-gray-500">{doc.type}</div>
            <div className="text-[10px] text-gray-400">{doc.date} · {doc.pages} page{doc.pages !== 1 ? 's' : ''} · Redacted</div>
          </div>

          <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0" />
        </button>
      ))}
    </div>
  )
}

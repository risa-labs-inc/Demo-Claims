'use client'

import { useState, useEffect } from 'react'
import { ChevronRight, ChevronDown, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ClaimWithAssignee } from '@/lib/types'
import { formatDate, formatCurrency } from '@/lib/utils'
import { MockDocumentsTab } from './MockDocumentsTab'
import { DocViewerPopup } from './DocViewerPopup'
import { distributeBilledAmounts } from '@/lib/cpt-rates'

// ─── Types ────────────────────────────────────────────────────────────────────

interface RuleResult {
  rule_name: string
  decision_question: string
  status: 'PASSED' | 'FAILED' | 'WARNING' | 'MANUAL' | 'SKIPPED'
  explanation: string
  data_used: Record<string, unknown>
  section_header?: string
  sources?: string[]
}

interface ActionPlan {
  recommended_action: string
  flags: Record<string, string>
  documents_collected: string[]
}

interface ClaimCase {
  patient_name: string
  mrn: string
  insurance_name: string
  dob: string
  plan: string
  dos: string
  billed_amount: number
  claim_received_date: string
  claim_number: string
  denial_age_days: number
  denial: {
    denial_code: string
    denial_remark_code: string
    denial_reason: string
    denial_type: string
    diagnosis_codes: string[]
  }
  service_lines: Array<{
    line_number: number
    dos: string
    cpt_code: string
    modifiers: string[]
    billed_amount: number
    allowed_amount: number
    paid_amount: number
    remark_codes: string[]
    carc_codes: string[]
  }>
}

// ─── Status badge styles ───────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  PASSED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
  WARNING: 'bg-yellow-100 text-yellow-700',
  MANUAL: 'bg-gray-100 text-gray-600',
  SKIPPED: 'bg-gray-100 text-gray-400',
}

// ─── Rule row ─────────────────────────────────────────────────────────────────

function RuleRow({ result }: { result: RuleResult }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        className="w-full flex items-center justify-between py-3.5 px-1 text-left hover:bg-gray-50"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-800">{result.rule_name}</span>
          <span
            className={`px-2 py-0.5 rounded text-xs font-semibold ${
              STATUS_STYLES[result.status] ?? STATUS_STYLES.MANUAL
            }`}
          >
            {result.status}
          </span>
        </div>
        <span className="text-gray-400">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </span>
      </button>

      {open && (
        <div className="pb-3 px-1 space-y-2">
          <div className="border-l-2 border-gray-200 pl-3 py-0.5">
            <p className="text-xs text-gray-600 leading-relaxed">{result.explanation}</p>
          </div>

          {Object.keys(result.data_used ?? {}).length > 0 && (
            <div className="bg-gray-50 rounded p-2 mt-1">
              <div className="text-xs font-medium text-gray-500 mb-1">Data Used</div>
              {Object.entries(result.data_used).map(([k, v]) => (
                <div key={k} className="flex text-xs gap-2 py-0.5">
                  <span className="text-gray-500 shrink-0 w-44">{k}:</span>
                  <span className="text-gray-700 break-all">
                    {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {result.sources && result.sources.length > 0 && (
            <div className="mt-2">
              <div className="text-xs font-medium text-gray-500 mb-1.5">Source</div>
              <div className="flex flex-wrap gap-1.5">
                {result.sources.map((src) => {
                  const SOURCE_URLS: Record<string, string> = {
                    'OncoEMR': 'https://www.oncoemr.com',
                    'Availity API': 'https://www.availity.com',
                    'Optum API': 'https://www.optum.com',
                    'Candid PMS': 'https://www.candidhealth.com',
                    'CMS NCCI': 'https://www.cms.gov/medicare/coding-billing/national-correct-coding-initiative-ncci-edits',
                    'CMS MUE': 'https://www.cms.gov/medicare/coding-billing/national-correct-coding-initiative-ncci-edits/medicare-ncci-policy-manual',
                    'AMA CPT': 'https://www.ama-assn.org/practice-management/cpt',
                  }
                  const url = SOURCE_URLS[src]
                  return (
                    <a
                      key={src}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 transition-colors"
                    >
                      {src}
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Cover Letter Modal ────────────────────────────────────────────────────────

function CoverLetterModal({
  claim,
  denial,
  actionPlan,
  onClose,
}: {
  claim: ClaimWithAssignee
  denial: { denial_code: string; denial_remark_code: string; denial_reason: string; denial_type: string; diagnosis_codes: string[] }
  actionPlan: ActionPlan | null
  onClose: () => void
}) {
  const [pmsStatus, setPmsStatus] = useState<'idle' | 'sending' | 'sent'>('idle')

  const handleSendToPMS = () => {
    setPmsStatus('sending')
    setTimeout(() => setPmsStatus('sent'), 2200)
  }
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const dos = formatDate(claim.dateOfService)
  const code = denial.denial_code

  // For CO-22, the appeal is sent to the secondary payer (who denied); otherwise use primary
  const appealPayer = code === 'CO-22'
    ? (claim.secondaryInsurance ?? claim.primaryInsurance)
    : claim.primaryInsurance

  const payerAddress = (() => {
    const ins = appealPayer?.toLowerCase() ?? ''
    if (ins.includes('united')) return 'United Healthcare\nAppeals Department\nP.O. Box 30432\nSalt Lake City, UT 84130'
    if (ins.includes('cigna')) return 'Cigna Healthcare\nAppeals & Grievance Department\nP.O. Box 188004\nChattanooga, TN 37422'
    if (ins.includes('aetna')) return 'Aetna\nMedical Appeals Unit\nP.O. Box 14463\nLexington, KY 40512'
    if (ins.includes('medicare')) return 'Medicare Administrative Contractor\nAppeals Department\nP.O. Box 6703\nIndianapolis, IN 46206'
    if (ins.includes('blue cross') || ins.includes('bcbs')) return 'Blue Cross Blue Shield\nAppeals Department\nP.O. Box 2924\nFargo, ND 58108'
    return `${appealPayer}\nAppeals Department`
  })()

  const subject = (() => {
    if (code === 'CO-27') return `Appeal of Claim Denial – Coverage Termination (CO-27)\nPatient: ${claim.patientFirstName} ${claim.patientLastName} | Claim #: ${claim.claimNumber ?? claim.claimId} | DOS: ${dos}`
    if (code === 'CO-28') return `Appeal of Claim Denial – Coverage Not in Effect (CO-28)\nPatient: ${claim.patientFirstName} ${claim.patientLastName} | Claim #: ${claim.claimNumber ?? claim.claimId} | DOS: ${dos}`
    if (code === 'CO-97') return `Appeal of Partial Denial – Coding Denial (CO-97)\nPatient: ${claim.patientFirstName} ${claim.patientLastName} | Claim #: ${claim.claimNumber ?? claim.claimId} | DOS: ${dos}`
    if (code === 'CO-50') return `Appeal of Partial Denial – Eligibility Denial (CO-50)\nPatient: ${claim.patientFirstName} ${claim.patientLastName} | Claim #: ${claim.claimNumber ?? claim.claimId} | DOS: ${dos}`
    {
      const appealClaimNum = claim.secondaryClaimNumber ?? (claim.claimNumber ?? claim.claimId)
      return `Appeal of Secondary Claim Denial – Missing Primary EOB (CO-22)\nPatient: ${claim.patientFirstName} ${claim.patientLastName} | Secondary Claim #: ${appealClaimNum} | DOS: ${dos}`
    }
  })()

  const body = (() => {
    const name = `${claim.patientFirstName} ${claim.patientLastName}`
    const memberId = claim.primaryMemberId
    const provider = `${claim.providerFirstName} ${claim.providerLastName}`
    const npi = claim.providerNpi
    const claimNum = claim.claimNumber ?? claim.claimId
    const charge = formatCurrency(Number(claim.chargeAmount))

    if (code === 'CO-27') return `
Dear Appeals Department,

We are writing to formally appeal the denial of the above-referenced claim for patient ${name} (Member ID: ${memberId}, MRN: ${claim.mrn}). Services were rendered on ${dos} by ${provider} (NPI: ${npi}). The claim (Claim #: ${claimNum}, Billed Amount: ${charge}) was denied under CARC code CO-27, citing expenses incurred after coverage termination.

We respectfully contest this determination on the following grounds:

1. Retroactive Eligibility: The patient re-enrolled in ${claim.primaryInsurance} effective January 1, 2026. We respectfully request that your enrollment department confirm whether a retroactive reinstatement has been processed, which would bring the date of service within the coverage period.

2. Grace Period Provision: The date of service falls within six (6) days of the policy termination date (December 31, 2025). Per the terms of the subscriber agreement, a thirty (30)-day grace period applies to claims incurred immediately following a policy termination when the member has re-enrolled. The services rendered on ${dos} fall within this window.

3. Medical Necessity: The services billed (${claim.deniedLineItems ?? 'as itemized on the attached claim'}) were medically necessary and consistent with the patient's ongoing treatment plan. Denial of these services would create an interruption in a clinically active care protocol.

We are enclosing the following supporting documentation:
  • Copy of original claim and Explanation of Benefits (EOB)
  • Proof of re-enrollment effective January 1, 2026
  • Premium payment confirmation for December 2025
  • Clinical notes evidencing medical necessity

We respectfully request that this claim be reconsidered and approved for payment at the contracted rate. Please respond within the timeframe required by applicable state and federal regulations. If additional information is needed, contact our billing department at the address below.`

    if (code === 'CO-28') return `
Dear Appeals Department,

We are writing regarding the denial of the claim for patient ${name} (Member ID: ${memberId}, MRN: ${claim.mrn}). The claim (Claim #: ${claimNum}, DOS: ${dos}, Billed Amount: ${charge}) was denied under CARC code CO-28, indicating that coverage was not in effect at the time of service. We believe this denial may be the result of an enrollment discrepancy and respectfully request a formal review.

Basis for Appeal:

1. Enrollment Discrepancy: Our records indicate that the patient was insured under ${claim.primaryInsurance} at the time of service. We request that your eligibility department verify whether a plan change during the November–December open enrollment period caused the member ID on file (${memberId}) to be superseded by a new subscriber ID. If so, please advise us of the correct member information so we may resubmit accordingly.

2. Continuity of Care: ${name} is an established patient currently undergoing active treatment. The services rendered on ${dos} (${claim.deniedLineItems ?? 'as itemized'}) constitute a continuation of an existing care plan. Any disruption in coverage processing creates risk to the patient's clinical outcomes.

3. Good Faith Billing: This claim was submitted in good faith based on the insurance information provided by the patient at the time of service. We request that the payer apply the coordination of benefits rules applicable to enrollment discrepancies and adjudicate this claim accordingly.

Enclosed documentation:
  • Original claim submission
  • Patient's insurance card presented at time of service
  • Eligibility verification response from date of service
  • Clinical notes confirming active treatment plan

We ask that this claim be reviewed and adjudicated based on the patient's actual coverage status. Please contact our office if additional clarification is required.`

    if (code === 'CO-97') {
      const paidCpts97 = (claim.remarks ?? '').match(/Paid CPTs?:\s*([^.\n]+)/)?.[1] ?? '96413, 96415, J9355'
      const paidAmt97 = Number(claim.paidAmount) > 0 ? formatCurrency(Number(claim.paidAmount)) : 'as noted on EOB'
      const ins97 = claim.primaryInsurance
      return `
Dear Appeals Department,

We are writing to appeal the partial denial of the above-referenced claim for patient ${name} (Member ID: ${memberId}, MRN: ${claim.mrn}). Services were rendered on ${dos} by ${provider} (NPI: ${npi}). The claim (Claim #: ${claimNum}, Billed Amount: ${charge}) was partially adjudicated: ${ins97} paid ${paidAmt97} for CPT codes ${paidCpts97}, but denied CPT ${claim.deniedLineItems ?? ''} under CARC code CO-97 (bundling).

Basis for Appeal:

1. Modifier 25 — Separately Identifiable E&M: CPT ${claim.deniedLineItems ?? ''} represents a significant, separately identifiable evaluation and management service rendered on ${dos} that addressed clinical concerns distinct from the infusion administration. Per CMS and NCCI guidelines, modifier 25 allows separate reimbursement of an E&M service on the same day as a procedure when the E&M is documented as distinct. We are resubmitting CPT ${claim.deniedLineItems ?? ''} with modifier 25 appended.

2. NCCI Modifier Indicator: The NCCI edit applicable to this CPT pair carries a modifier indicator of "1," confirming that the bundling edit is bypassable with the appropriate modifier. CO-97 denials for this CPT pair are therefore correctable upon proper resubmission.

3. Clinical Documentation: The progress note for ${dos} confirms that the treating physician conducted a separately identifiable evaluation — including review of labs, assessment of treatment response, and modification of the care plan — independent of infusion administration. A copy is enclosed.

We respectfully request that ${ins97} reprocess CPT ${claim.deniedLineItems ?? ''}-25 as a separately reimbursable service. Enclosed documentation:
  • Corrected claim with modifier 25 on CPT ${claim.deniedLineItems ?? ''}
  • Progress note for ${dos} (supporting separate E&M documentation)
  • NCCI edit reference confirming modifier bypass eligibility`
    }

    if (code === 'CO-50') {
      const paidCpts50 = (claim.remarks ?? '').match(/Paid CPTs?:\s*([^.\n]+)/)?.[1] ?? '99215, 96413'
      const paidAmt50 = Number(claim.paidAmount) > 0 ? formatCurrency(Number(claim.paidAmount)) : 'as noted on EOB'
      const deniedCpts50 = claim.deniedLineItems ?? '96415, 96417, J9355'
      const ins50 = claim.primaryInsurance
      return `
Dear Appeals Department,

We are writing to appeal the partial denial of the above-referenced claim for patient ${name} (Member ID: ${memberId}, MRN: ${claim.mrn}). Services were rendered on ${dos} by ${provider} (NPI: ${npi}). The claim (Claim #: ${claimNum}, Billed Amount: ${charge}) was partially adjudicated: ${ins50} paid ${paidAmt50} for ${paidCpts50}, but denied ${deniedCpts50} under CARC code CO-50, citing lack of medical necessity.

Basis for Appeal:

1. Medical Necessity Established: ${name} is an established oncology patient currently undergoing an active treatment protocol. The services rendered on ${dos} (${deniedCpts50}) were ordered and administered under the direct supervision of ${provider} as a clinically necessary component of the patient's ongoing treatment plan. The extended infusion duration and drug selection were directly responsive to the patient's diagnosis and treatment response data documented in the enclosed clinical notes.

2. Clinical Documentation: The treating physician's progress note for ${dos}, along with the oncology treatment protocol on file, confirms the medical necessity of ${deniedCpts50}. The clinical decision to extend the infusion duration was based on the patient's active oncological diagnosis and is consistent with accepted oncology treatment guidelines (NCCN/ASCO).

3. Prior Authorization / Retrospective Review: We respectfully request that ${ins50}'s Utilization Management department conduct a retrospective medical necessity review for ${deniedCpts50}. If a retrospective authorization is available, we request approval so this claim may be resubmitted. If not, we request a formal clinical appeal review.

We believe the denied services meet ${ins50}'s medical necessity criteria and respectfully request reconsideration. Enclosed:
  • Original EOB with CO-50 denial
  • Physician order for ${dos}
  • Oncology treatment protocol / care plan
  • Progress note documenting clinical decision-making
  • Applicable diagnosis-to-drug LCD reference`
    }

    // CO-22 — appeal to secondary (commercial) payer: Medicare paid, EOB not attached
    {
      const isMedicarePrimary = claim.primaryInsurance?.toLowerCase().includes('medicare')
      const commercialPayerCL = isMedicarePrimary ? (claim.secondaryInsurance ?? claim.primaryInsurance) : claim.primaryInsurance
      const commercialMemberIdCL = isMedicarePrimary ? (claim.secondaryMemberId ?? memberId) : memberId
      const medicareMemberIdCL = isMedicarePrimary ? claim.primaryMemberId : (claim.secondaryMemberId ?? 'on file')
      const deniedItemsCL = claim.secondaryDeniedLineItems ?? claim.deniedLineItems ?? 'as itemized on the claim'
      const medicarePaidCL = Number(claim.paidAmount) > 0 ? formatCurrency(Number(claim.paidAmount)) : 'as noted on the enclosed EOMB'
      const medicareEFTCL = claim.checkNumber ?? 'see enclosed EOMB'
      const medicarePaidDateCL = claim.checkDate ? formatDate(claim.checkDate) : 'see enclosed EOMB'
      const secondaryClaimNumCL = claim.secondaryClaimNumber ?? claimNum
      const remainingCL = Number(claim.paidAmount) > 0
        ? formatCurrency(Math.round((Number(claim.chargeAmount) - Number(claim.paidAmount)) * 100) / 100)
        : 'as shown on the enclosed EOMB'

      return `
Dear Appeals Department,

We are writing to appeal the denial of secondary claim #${secondaryClaimNumCL} for patient ${name} (Member ID: ${commercialMemberIdCL}, MRN: ${claim.mrn}). The claim (DOS: ${dos}, Billed Amount: ${charge}) was submitted to ${commercialPayerCL} as secondary payer following Medicare adjudication and was denied under CARC code CO-22 / RARC N104, indicating that the primary payer Explanation of Benefits was not included with the submission.

We acknowledge this documentation oversight and are resubmitting with the required supporting materials as detailed below.

Basis for Appeal:

1. Medicare Has Already Adjudicated and Paid as Primary Payer: Medicare (Member ID: ${medicareMemberIdCL}) processed this claim as the correct primary payer under CMS Medicare Secondary Payer (MSP) rules and issued payment of ${medicarePaidCL} via EFT (EFT #${medicareEFTCL}, dated ${medicarePaidDateCL}). A copy of the Medicare EOMB is enclosed with this appeal.

2. Secondary Claim Submitted Without Primary EOMB: The original secondary claim submitted to ${commercialPayerCL} on ${medicarePaidDateCL} did not include the Medicare EOMB as required for COB processing. This documentation omission — not a coverage or eligibility issue — caused the CO-22 denial. The patient's coverage under ${commercialPayerCL} (Member ID: ${commercialMemberIdCL}) was and remains active.

3. Request for Secondary Adjudication: We respectfully request that ${commercialPayerCL} process this claim as a COB crossover claim, applying the secondary benefit to the remaining patient responsibility of ${remainingCL} following Medicare's payment of ${medicarePaidCL}. The services rendered (${deniedItemsCL}) are covered under the ${commercialPayerCL} plan per the COB coordination agreement.

Enclosed documentation:
  • Medicare EOMB (EFT #${medicareEFTCL}, payment date ${medicarePaidDateCL})
  • Original secondary claim and denial EOB (CO-22 / N104)
  • Medicare eligibility verification
  • MSP Questionnaire confirming Medicare as primary payer

Please reprocess this claim as a secondary COB claim upon receipt of the enclosed Medicare EOMB. We appreciate your prompt attention to this matter.`
    }
  })()

  const handleDownload = () => {
    const printContent = document.getElementById('cover-letter-print-area')
    if (!printContent) return
    const win = window.open('', '_blank', 'width=850,height=1100')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head>
      <title>Cover Letter – ${claim.patientFirstName} ${claim.patientLastName}</title>
      <style>
        body { font-family: 'Times New Roman', serif; font-size: 12pt; color: #111; margin: 0; padding: 40px 60px; line-height: 1.6; }
        h1 { font-size: 14pt; margin-bottom: 2px; }
        .subtitle { font-size: 10pt; color: #555; margin-bottom: 20px; }
        pre { font-family: inherit; white-space: pre-wrap; font-size: 11pt; }
        .letterhead { border-bottom: 2px solid #1a1a2e; padding-bottom: 12px; margin-bottom: 24px; }
        .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 10pt; margin-bottom: 20px; background: #f8f8f8; padding: 12px; border-radius: 4px; }
        .meta-grid div span { font-weight: bold; display: block; font-size: 9pt; color: #555; text-transform: uppercase; letter-spacing: 0.05em; }
        .no-print { display: none !important; }
        @media print { body { padding: 20px 40px; } .no-print { display: none !important; } }
      </style>
    </head><body>
      ${printContent.innerHTML}
      <script>window.onload = function(){ window.print(); }<\/script>
    </body></html>`)
    win.document.close()
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="font-semibold text-gray-900">Cover Letter</h3>
            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
              {claim.patientFirstName} {claim.patientLastName}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PDF
            </button>
            {pmsStatus === 'idle' && (
              <button
                onClick={handleSendToPMS}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Send to PMS
              </button>
            )}
            {pmsStatus === 'sending' && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-600 rounded animate-pulse">
                <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Pushing to PMS…
              </span>
            )}
            {pmsStatus === 'sent' && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-100 text-green-700 rounded">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Sent to PMS
              </span>
            )}
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* PMS push banner */}
        {pmsStatus === 'sent' && (
          <div className="mx-6 mt-4 flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <svg className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <p className="text-xs font-semibold text-green-800">Template automatically pushed to PMS</p>
              <p className="text-xs text-green-700 mt-0.5">
                The appeal letter for <strong>{claim.patientFirstName} {claim.patientLastName}</strong> has been automatically inserted into the PMS under claim <strong>{claim.claimNumber ?? claim.claimId}</strong>. No manual copy-paste required.
              </p>
            </div>
          </div>
        )}

        {/* Letter content */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
          <div
            id="cover-letter-print-area"
            className="bg-white shadow-sm rounded-lg p-10 max-w-2xl mx-auto font-serif text-sm text-gray-900 leading-relaxed"
            style={{ fontFamily: "'Times New Roman', serif" }}
          >
            {/* Letterhead */}
            <div className="border-b-2 border-gray-900 pb-4 mb-6">
              <div className="text-base font-bold tracking-wide">MEDICAL ONCOLOGY BILLING SERVICES</div>
              <div className="text-xs text-gray-500 mt-0.5">123 Medical Plaza, Suite 400 · San Francisco, CA 94107 · Tel: (415) 555-0100 · Fax: (415) 555-0199</div>
            </div>

            {/* Date & Payer */}
            <div className="mb-6 text-sm">
              <p>{today}</p>
              <div className="mt-4 whitespace-pre-line">{payerAddress}</div>
            </div>

            {/* RE: line */}
            <div className="mb-6 text-sm">
              <p className="font-bold">RE: {subject.split('\n').map((l, i) => (
                <span key={i}>{l}{i === 0 ? <br /> : null}</span>
              ))}</p>
            </div>

            {/* Salutation + body */}
            <div className="text-sm whitespace-pre-line">{body.trim()}</div>

            {/* Closing */}
            <div className="mt-8 text-sm">
              <p>Sincerely,</p>
              <div className="mt-6 mb-1 border-b border-gray-400 w-48" />
              <p className="font-semibold">{claim.providerFirstName} {claim.providerLastName}</p>
              <p className="text-xs text-gray-500">Attending Physician | NPI: {claim.providerNpi}</p>
              <p className="text-xs text-gray-500 mt-1">Medical Oncology Billing Services</p>
            </div>

            {/* Footer note */}
            <div className="mt-8 pt-4 border-t border-gray-200 text-xs text-gray-400">
              This letter was generated on {today} for appeal/resubmission purposes. Denial code: {denial.denial_code}{denial.denial_remark_code ? ` / ${denial.denial_remark_code}` : ''}.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Automated Analysis panel ─────────────────────────────────────────────────

function AutomatedAnalysis({
  ruleResults,
  actionPlan,
  loading,
  onViewCoverLetter,
  onDocClick,
}: {
  ruleResults: RuleResult[] | null
  actionPlan: ActionPlan | null
  loading: boolean
  onViewCoverLetter: () => void
  onDocClick: (docName: string) => void
}) {
  const [activeTab, setActiveTab] = useState(0)

  const totalCount = ruleResults?.length ?? 0
  const checkedCount = ruleResults?.filter((r) => r.status !== 'SKIPPED').length ?? 0
  const passedCount = ruleResults?.filter((r) => r.status === 'PASSED').length ?? 0

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-gray-900">Automated Analysis</h2>
            {loading && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs font-medium rounded animate-pulse">
                Running…
              </span>
            )}
            {!loading && totalCount > 0 && (
              <>
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                  {checkedCount}/{totalCount} checked
                </span>
                <span className="px-2 py-0.5 bg-green-600 text-white text-xs font-medium rounded">
                  {passedCount} passed
                </span>
              </>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Step-by-step validation results</p>
        </div>
        <button
          onClick={onViewCoverLetter}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          View Cover Letter
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        {['Rule Engine Verification', 'Recommended Action Plan'].map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`pb-2 px-1 mr-6 text-sm font-medium border-b-2 transition-colors ${
              activeTab === i
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading && !ruleResults ? (
        <div className="flex-1 flex flex-col gap-3 pt-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="flex-1">
          {activeTab === 0 && (
            <div>
              {(ruleResults ?? []).map((r, i) => (
                <div key={i}>
                  {r.section_header && (
                    <div className={`px-1 pb-1.5 ${i === 0 ? 'pt-0' : 'pt-5'}`}>
                      <span className="text-xs font-semibold text-gray-400 tracking-wider uppercase">
                        {r.section_header}
                      </span>
                    </div>
                  )}
                  <RuleRow result={r} />
                </div>
              ))}
            </div>
          )}
          {activeTab === 1 && actionPlan && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                <div className="text-sm font-semibold text-gray-800 mb-3">Recommended Action</div>
                {(() => {
                  const text = actionPlan.recommended_action
                  const parts = text.split(/\s*\(\d+\)\s*/)
                  const intro = parts[0]?.trim()
                  const steps = parts.slice(1).filter(Boolean)
                  return (
                    <div className="space-y-3">
                      {intro && <p className="text-sm text-gray-600">{intro}</p>}
                      {steps.length > 0 && (
                        <ol className="space-y-2">
                          {steps.map((step, i) => (
                            <li key={i} className="flex gap-2.5 text-sm text-gray-700">
                              <span className="shrink-0 w-5 h-5 rounded-full bg-green-200 text-green-800 text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                              <span className="leading-relaxed">{step.trim().replace(/\.$/, '')}</span>
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  )
                })()}
                {Object.keys(actionPlan.flags ?? {}).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-green-100 space-y-1">
                    {Object.entries(actionPlan.flags ?? {}).map(([key, val]) => (
                      <div key={key} className="flex items-start gap-2 text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0 mt-1.5" />
                        <span>
                          <span className="font-medium text-gray-700">{key}:</span>{' '}
                          <span className="text-gray-600">{val}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {(actionPlan.documents_collected?.length ?? 0) > 0 && (
                <div>
                  <div className="text-sm font-semibold text-gray-700 mb-2">Documents Collected:</div>
                  <div className="flex flex-wrap gap-2">
                    {actionPlan.documents_collected.map((doc) => (
                      <button
                        key={doc}
                        onClick={() => onDocClick(doc)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors group"
                      >
                        <svg className="h-3.5 w-3.5 text-gray-400 group-hover:text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {doc}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
          {activeTab === 1 && !actionPlan && !loading && (
            <p className="text-sm text-gray-400 pt-4">No action plan available.</p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Denial Summary ───────────────────────────────────────────────────────────

function DenialSummary({ denial }: { denial: ClaimCase['denial'] }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-sm font-semibold text-gray-800">Denial Summary</span>
        {denial.denial_type && (
          <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded">
            {denial.denial_type}
          </span>
        )}
      </div>

      <div className="grid grid-cols-[auto_1fr_auto] gap-x-4 gap-y-1 text-xs text-gray-500">
        <div>Denial Code</div>
        <div>Denial Reason</div>
        <div>Diagnosis Codes (Dx)</div>

        <div className="flex items-center gap-1.5 mt-1">
          {denial.denial_code && (
            <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs font-bold">
              {denial.denial_code}
            </span>
          )}
          {denial.denial_remark_code && (
            <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-bold">
              {denial.denial_remark_code}
            </span>
          )}
          {!denial.denial_code && !denial.denial_remark_code && (
            <span className="text-gray-400">—</span>
          )}
        </div>

        <div className="text-xs text-gray-700 mt-1 font-medium uppercase">
          {denial.denial_reason || '—'}
        </div>

        <div className="flex flex-wrap gap-1.5 mt-1">
          {denial.diagnosis_codes?.map((dx) => (
            <span key={dx} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
              {dx}
            </span>
          ))}
          {(!denial.diagnosis_codes || denial.diagnosis_codes.length === 0) && (
            <span className="text-gray-400">—</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Service Lines Table ───────────────────────────────────────────────────────

interface ServiceLine {
  dos: string
  cpt_code: string
  modifiers: string[]
  billed_amount: number
  allowed_amount: number
  paid_amount: number
  primary_paid_amount: number
  tmr: number
  copay: number
  deductible: number
  coinsurance: number
  remark_codes: { code: string; description: string }[]
  carc_codes: { code: string; description: string }[]
}

function LineRow({ line }: { line: ServiceLine }) {
  const [open, setOpen] = useState(false)

  const fmt = (n: number) => `$${n.toFixed(2)}`

  return (
    <>
      <tr
        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <td className="py-3 px-3 text-gray-400">
          {open
            ? <ChevronDown className="h-3.5 w-3.5" />
            : <ChevronRight className="h-3.5 w-3.5" />}
        </td>
        <td className="py-3 px-2 text-xs text-gray-700">{line.dos}</td>
        <td className="py-3 px-2 text-xs font-medium text-gray-900">{line.cpt_code}</td>
        <td className="py-3 px-2 text-xs text-gray-600">
          {line.modifiers?.length ? line.modifiers.join(', ') : '-'}
        </td>
        <td className="py-3 px-2 text-xs text-gray-700">{fmt(line.billed_amount)}</td>
        <td className="py-3 px-2 text-xs text-gray-700">{fmt(line.allowed_amount)}</td>
        <td className="py-3 px-2 text-xs text-gray-700">{fmt(line.paid_amount)}</td>
      </tr>

      {open && (
        <tr className="bg-gray-50 border-b border-gray-200">
          <td colSpan={7} className="px-8 py-4">
            {/* Financial breakdown */}
            <div className="grid grid-cols-6 gap-4 text-xs mb-4 border-b border-gray-200 pb-4">
              {([
                ['Primary Paid Amount', fmt(line.primary_paid_amount)],
                ['Allowed Amount',      fmt(line.allowed_amount)],
                ['TMR',                 fmt(line.tmr)],
                ['Copay',               fmt(line.copay)],
                ['Deductible',          fmt(line.deductible)],
                ['Coinsurance',         fmt(line.coinsurance)],
              ] as [string, string][]).map(([label, val]) => (
                <div key={label}>
                  <div className="text-gray-500 mb-0.5">{label}</div>
                  <div className="font-medium text-gray-800">{val}</div>
                </div>
              ))}
            </div>

            {/* Remark codes */}
            {line.remark_codes?.length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-bold text-gray-700 uppercase mb-1">Remark Codes</div>
                {line.remark_codes.map((rc, i) => (
                  <p key={i} className="text-xs text-gray-600 mb-0.5">
                    <span className="font-semibold">{rc.code}:</span> {rc.description}
                  </p>
                ))}
              </div>
            )}

            {/* CARC codes */}
            {line.carc_codes?.length > 0 && (
              <div>
                <div className="text-xs font-bold text-gray-700 uppercase mb-1">
                  Claim Adjustment Reason Codes
                </div>
                {line.carc_codes.map((c, i) => (
                  <p key={i} className="text-xs text-gray-600 mb-0.5">
                    <span className="font-semibold">{c.code}:</span> {c.description}
                  </p>
                ))}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

function ServiceLinesTable({ lines }: { lines: ServiceLine[] }) {
  if (!lines || lines.length === 0) {
    return <p className="text-sm text-gray-400">No service lines available.</p>
  }

  return (
    <div className="overflow-x-auto rounded border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-white">
            <th className="w-8" />
            {['DOS', 'CPT Code', 'Modifiers', 'Billed amount', 'Allowed amount', 'Paid amount'].map((h) => (
              <th key={h} className="py-2.5 px-2 text-left text-xs font-medium text-gray-500 whitespace-nowrap">
                {h} <span className="text-gray-300">⇅</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lines.map((line, i) => <LineRow key={i} line={line} />)}
        </tbody>
      </table>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface DenialManagementModalProps {
  claim: ClaimWithAssignee
  onBack: () => void
  onSave: () => void
}

type DenialStage = 'REVIEWED' | 'RESOLVED'

export function DenialManagementModal({ claim, onBack, onSave }: DenialManagementModalProps) {
  const [activeTab, setActiveTab] = useState<'primary' | 'secondary'>('primary')
  const [contentTab, setContentTab] = useState<'service-lines' | 'documents'>('service-lines')

  const [ruleResults, setRuleResults] = useState<RuleResult[] | null>(null)
  const [actionPlan, setActionPlan] = useState<ActionPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<DenialStage | null>(null)
  const [currentDenialStage, setCurrentDenialStage] = useState<string | null>(claim.denialStage ?? null)
  const [showCoverLetter, setShowCoverLetter] = useState(false)
  const [viewingDoc, setViewingDoc] = useState<string | null>(null)

  const currentPlan = activeTab === 'primary' ? claim.primaryInsurance : claim.secondaryInsurance

  // Derive denial info — prefer the active tab's denial fields
  const denialCode = (activeTab === 'primary'
    ? claim.denialCodes
    : (claim.secondaryDenialCodes ?? claim.denialCodes)) ?? ''
  const denialDescription = (activeTab === 'primary'
    ? claim.denialDescription
    : (claim.secondaryDenialDescription ?? claim.denialDescription)) ?? ''

  const denial = {
    denial_code: denialCode.split(',')[0]?.trim() ?? '',
    denial_remark_code: denialCode.split(',')[1]?.trim() ?? '',
    denial_reason: denialDescription || 'Patient ineligible for service',
    denial_type: (() => {
      const c = denialCode.split(',')[0]?.trim() ?? ''
      if (c === 'CO-97') return 'Coding Denial'
      if (c === 'CO-50') return 'Eligibility Denial'
      if (c === 'CO-4' || c === 'CO-11') return 'Coding Denial'
      return 'Eligibility Denial'
    })(),
    diagnosis_codes: ['C34.12', 'C50.911', 'Z51.11'],
  }

  const claimNumber = activeTab === 'primary'
    ? (claim.claimNumber ?? claim.claimId ?? '')
    : (claim.secondaryClaimNumber ?? claim.claimId ?? '')
  const claimReceivedDate = activeTab === 'primary'
    ? (claim.claimReceivedDate ? formatDate(claim.claimReceivedDate) : '')
    : (claim.secondaryClaimReceivedDate ? formatDate(claim.secondaryClaimReceivedDate) : '')
  const billedAmount = Number(claim.chargeAmount) ?? 0
  const denialAge = (() => {
    const base = activeTab === 'primary' ? claim.claimReceivedDate : (claim.secondaryClaimReceivedDate ?? claim.claimReceivedDate)
    return base ? Math.floor((Date.now() - new Date(base).getTime()) / 86400000) : 14
  })()
  const primaryPaidAmount = Number(claim.paidAmount) || 0

  // Remark + CARC codes per denial type
  const { remarkCode, carcCode } = (() => {
    const code = denial.denial_code
    if (code === 'CO-27') return {
      remarkCode: { code: 'S1', description: 'Benefits for this service are denied. The service was provided after the member\'s coverage ended.' },
      carcCode:   { code: '27', description: 'Expenses incurred after coverage terminated.' },
    }
    if (code === 'CO-28') return {
      remarkCode: { code: 'N30', description: 'Patient ineligible for this service on the date of service. Member ID not found as active subscriber.' },
      carcCode:   { code: '28', description: 'Coverage not in effect at the time the service was provided.' },
    }
    if (code === 'CO-97') return {
      remarkCode: { code: 'B15', description: 'This procedure code is included in the allowance for another service/procedure that has already been adjudicated. Modifier 25 required for separate E&M reimbursement on same day as procedure.' },
      carcCode:   { code: '97', description: 'The benefit for this service is included in the payment/allowance for another service/procedure that has already been adjudicated.' },
    }
    if (code === 'CO-50') return {
      remarkCode: { code: 'M115', description: 'This item or service has been denied as not reasonable and necessary. Pre-authorization was not obtained for the additional infusion hours and drug administered.' },
      carcCode:   { code: '50', description: 'These are non-covered services because this is not deemed a medical necessity by the payer.' },
    }
    // CO-22 default
    return {
      remarkCode: { code: 'N104', description: 'This care may be covered by another payer per coordination of benefits. Resubmit with primary payer EOB.' },
      carcCode:   { code: '22',  description: 'This care may be covered by another payer per coordination of benefits.' },
    }
  })()

  const totalCharge = Number(claim.chargeAmount) || 600
  const deniedCptList = ((activeTab === 'primary'
    ? claim.deniedLineItems
    : (claim.secondaryDeniedLineItems ?? claim.deniedLineItems)) ?? '99215, 96413')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  // For partially paid claims, parse the paid CPTs from remarks
  const isPartiallyPaid = claim.claimStatus === 'PARTIALLY_PAID'
  const paidCptMatch = isPartiallyPaid ? (claim.remarks ?? '').match(/Paid CPTs?:\s*([^.\n]+)/) : null
  const paidCptList = paidCptMatch ? paidCptMatch[1].split(',').map((s) => s.trim()).filter(Boolean) : []

  // Full list: paid CPTs first, then denied CPTs
  const cptList = isPartiallyPaid && paidCptList.length > 0
    ? [...paidCptList, ...deniedCptList]
    : deniedCptList

  // Distribute charge by CPT rate weight so each line has a realistic distinct amount
  const billedByCode = distributeBilledAmounts(cptList, totalCharge)
  const isCO22WithPayment = denial.denial_code === 'CO-22' && primaryPaidAmount > 0
  const mockServiceLines: ServiceLine[] = cptList.map((cpt, i) => {
    const billed = billedByCode[cpt] ?? 0

    // Paid CPT lines for partially paid claims — show actual payment, no denial codes
    if (isPartiallyPaid && paidCptList.includes(cpt)) {
      const perPaidCpt = Math.round((primaryPaidAmount / paidCptList.length) * 100) / 100
      const allowed = Math.round(billed * 0.85 * 100) / 100
      const coinsurance = Math.round((allowed - perPaidCpt) * 100) / 100
      return {
        dos: formatDate(claim.dateOfService),
        cpt_code: cpt,
        modifiers: [],
        billed_amount: billed,
        allowed_amount: allowed,
        paid_amount: perPaidCpt,
        primary_paid_amount: perPaidCpt,
        tmr: 0.00,
        copay: 0.00,
        deductible: 0.00,
        coinsurance: Math.max(0, coinsurance),
        remark_codes: [],
        carc_codes: [],
      }
    }

    let allowed = 0, primaryPaid = 0, deductible = 0, coinsurance = 0

    if (isCO22WithPayment) {
      // Distribute Medicare payment proportionally by billed amount
      const ratio = billed / totalCharge
      primaryPaid = Math.round(primaryPaidAmount * ratio * 100) / 100
      // Allowed = primary paid / 0.80 (Medicare pays 80%)
      allowed = Math.round((primaryPaid / 0.80) * 100) / 100
      coinsurance = Math.round((allowed - primaryPaid) * 100) / 100
    }

    return {
      dos: formatDate(claim.dateOfService),
      cpt_code: cpt,
      modifiers: [],
      billed_amount: billed,
      allowed_amount: allowed,
      paid_amount: primaryPaid,
      primary_paid_amount: primaryPaid,
      tmr: 0.00,
      copay: 0.00,
      deductible: deductible,
      coinsurance: coinsurance,
      remark_codes: [remarkCode],
      carc_codes: [carcCode],
    }
  })

  // Build contextual rule results based on the actual denial code
  const buildMockAnalysis = () => {
    const code = denial.denial_code
    const dos = formatDate(claim.dateOfService)
    const memberId = activeTab === 'primary' ? claim.primaryMemberId : (claim.secondaryMemberId ?? '')
    const payer = currentPlan ?? ''

    if (code === 'CO-27') {
      // Coverage terminated before DOS — policy lapsed at year end
      return {
        rules: [
          {
            rule_name: 'Eligibility Denial Confirmed',
            decision_question: 'Is this claim denied due to an eligibility issue?',
            status: 'PASSED' as const,
            explanation: `CARC code CO-27 ("Expenses incurred after coverage terminated") confirms this is an eligibility-based denial. The payer's adjudication system detected that the member's policy end date preceded the date of service ${dos}.`,
            data_used: {
              denialCode: 'CO-27',
              denialCategory: 'Eligibility Denial',
              claimStatus: 'DENIED',
              dateOfService: dos,
              lineItemsDenied: claim.deniedLineItems ?? '',
            },
            sources: ['Availity API', 'Candid PMS'],
          },
          {
            rule_name: 'Date of Service Coverage Verification',
            decision_question: 'Was the patient covered under an active policy on the date of service?',
            status: 'FAILED' as const,
            explanation: `EV response confirms the policy for member ${memberId} terminated on 12/31/2025. The date of service ${dos} falls outside the active coverage window. No active plan period covers this DOS.`,
            data_used: {
              memberId,
              payer,
              coverageStartDate: '01/01/2025',
              coverageEndDate: '12/31/2025',
              dateOfService: dos,
              policyStatus: 'Terminated',
            },
            sources: ['Availity API'],
          },
          {
            rule_name: 'Retro-Eligibility Check',
            decision_question: 'Has the patient been retroactively reinstated, or is retro-enrollment pending?',
            status: 'WARNING' as const,
            explanation: `The DOS is within 45 days of the termination date (12/31/2025). ${payer} allows retroactive reinstatement requests within 60 days of termination if the member re-enrolled during open enrollment. Call ${payer} eligibility line to verify if retro reinstatement has been processed or is pending.`,
            data_used: {
              terminationDate: '12/31/2025',
              dateOfService: dos,
              daysSinceTermination: '6',
              retroWindowDays: '60',
              retroReinstatementPossible: 'Yes — within retro window',
            },
            sources: ['Availity API', 'Candid PMS'],
          },
          {
            rule_name: 'Patient-Policy Link Validation',
            decision_question: 'Does the member ID, name, and date of birth match payer records?',
            status: 'PASSED' as const,
            explanation: `Member ID ${memberId}, patient name, and date of birth all match the payer's subscriber records exactly. The denial is not due to a demographic mismatch — the member was a valid subscriber whose coverage has since lapsed.`,
            data_used: {
              memberId,
              nameOnFile: `${claim.patientFirstName} ${claim.patientLastName}`,
              dobOnFile: formatDate(claim.dateOfBirth),
              demographicMatch: 'Confirmed',
            },
            sources: ['Availity API', 'Candid PMS'],
          },
          {
            rule_name: 'Service Coverage Analysis',
            decision_question: 'Were the billed services covered under the plan prior to termination?',
            status: 'PASSED' as const,
            explanation: `CPT codes ${claim.deniedLineItems ?? ''} (oncology E&M and infusion administration) are covered services under the ${payer} plan. The denial is strictly due to the policy lapse — there is no coverage exclusion for these service types.`,
            data_used: {
              cptCodes: claim.deniedLineItems ?? '',
              coveredUnderPlan: 'Yes (when eligible)',
              exclusionFound: 'No',
              priorAuthRequired: 'No',
            },
            sources: ['Availity API'],
          },
          {
            rule_name: 'Billing Payer Validation',
            decision_question: 'Was the claim submitted to the correct payer?',
            status: 'PASSED' as const,
            explanation: `Claim was correctly submitted to ${payer} as the primary payer on file. No billing routing error detected.`,
            data_used: {
              submittedPayer: payer,
              payerOnFile: payer,
              routingCorrect: 'Yes',
            },
            sources: ['Candid PMS'],
          },
          {
            rule_name: 'Medicare Plan Check',
            decision_question: 'Is Medicare involved as primary or secondary payer for this patient?',
            status: 'PASSED' as const,
            explanation: 'No Medicare enrollment found for this patient at the time of service. Medicare MSP rules do not apply. This denial is solely related to commercial plan termination.',
            data_used: {
              medicareEnrolled: 'No',
              mspApplicable: 'No',
              cobWithMedicare: 'Not applicable',
            },
            sources: ['Availity API'],
          },
          {
            rule_name: 'Patient Grace Period Check',
            decision_question: 'Does the plan offer a grace period that covers the date of service?',
            status: 'WARNING' as const,
            explanation: `The DOS falls 6 days after the policy termination date. Many commercial plans, including ${payer}, offer a 30-day grace period for claims incurred shortly after termination, particularly when premiums were paid through the termination month. Contact ${payer} to confirm grace period eligibility before submitting an appeal.`,
            data_used: {
              terminationDate: '12/31/2025',
              dateOfService: dos,
              daysAfterTermination: '6',
              typicalGracePeriod: '30 days',
              gracePeriodConfirmed: 'Pending — needs payer verification',
            },
            sources: ['Availity API', 'Candid PMS'],
          },
        ] as RuleResult[],
        plan: {
          recommended_action:
            `CO-27 denial — coverage terminated before DOS. Recommended steps: (1) Call ${payer} eligibility line to confirm if retro reinstatement is available; patient re-enrolled on 01/01/2026 which may trigger retro coverage. (2) If retro coverage confirmed, resubmit the claim with updated eligibility start date on file. (3) If grace period applies, submit a written appeal citing the grace period provision with evidence of premium payment through December 2025. (4) If all options are exhausted, bill the patient as self-pay and apply any financial assistance programs available.`,
          flags: {
            RetroEligibilityWindow: 'Open (6 days post-termination, within 60-day retro window)',
            GracePeriodApplicable: 'Verify with payer',
            PatientReEnrolled: 'Yes — effective 01/01/2026',
            AppealDeadline: `90 days from denial date (${claim.claimReceivedDate ? formatDate(claim.claimReceivedDate) : 'see EOB'})`,
          },
          documents_collected: [
            'Explanation of Benefits (CO-27)',
            'Eligibility Verification – Pre-DOS',
            'Patient Re-Enrollment Confirmation',
            'Premium Payment History',
          ],
        } as ActionPlan,
      }
    }

    if (code === 'CO-28') {
      // Coverage not in effect — member ID not found active in plan on DOS
      return {
        rules: [
          {
            rule_name: 'Eligibility Denial Confirmed',
            decision_question: 'Is this claim denied due to an eligibility issue?',
            status: 'PASSED' as const,
            explanation: `CARC code CO-28 ("Coverage not in effect at the time the service was provided") confirms an eligibility denial. The payer's enrollment system did not return an active subscriber record for member ${memberId} on ${dos}.`,
            data_used: {
              denialCode: 'CO-28',
              denialCategory: 'Eligibility Denial',
              claimStatus: 'DENIED',
              memberId,
              dateOfService: dos,
            },
            sources: ['Availity API', 'Candid PMS'],
          },
          {
            rule_name: 'Date of Service Coverage Verification',
            decision_question: 'Was the patient covered under an active policy on the date of service?',
            status: 'FAILED' as const,
            explanation: `Real-time eligibility verification returned no active coverage for member ${memberId} under ${payer} on ${dos}. The subscriber record exists in the system but shows a plan status of "Inactive / Disenrolled." Patient may have switched plans during open enrollment (Nov–Dec 2025) and the new carrier ID was not updated in our system.`,
            data_used: {
              memberId,
              payer,
              evResponseStatus: 'No Active Coverage Found',
              subscriberRecordStatus: 'Inactive / Disenrolled',
              dateOfService: dos,
              possibleCause: 'Plan change during open enrollment period',
            },
            sources: ['Availity API'],
          },
          {
            rule_name: 'Retro-Eligibility Check',
            decision_question: 'Has a retroactive eligibility update been filed with the payer?',
            status: 'MANUAL' as const,
            explanation: `Cannot auto-determine retro eligibility for CO-28 denials without a confirmed new plan number or updated subscriber ID. Manual verification required: contact the patient directly to obtain their current insurance card, then re-verify eligibility with the correct carrier and member ID.`,
            data_used: {
              retroStatus: 'Cannot auto-verify',
              action: 'Contact patient for updated insurance information',
              alternateCarrierOnFile: 'Unknown',
            },
            sources: ['Availity API'],
          },
          {
            rule_name: 'Patient-Policy Link Validation',
            decision_question: 'Does the member ID and demographic data match any active plan on file?',
            status: 'FAILED' as const,
            explanation: `Member ID ${memberId} is not linked to any active ${payer} plan as of ${dos}. The demographic lookup (name + DOB) also returned no active plan. This suggests the patient is either enrolled under a different plan or a different member ID was issued after open enrollment.`,
            data_used: {
              memberId,
              demographicLookupResult: 'No active plan found',
              nameSearch: `${claim.patientFirstName} ${claim.patientLastName}`,
              dobSearch: formatDate(claim.dateOfBirth),
              alternativePlanFound: 'No',
            },
            sources: ['Availity API', 'Candid PMS'],
          },
          {
            rule_name: 'Service Coverage Analysis',
            decision_question: 'Are the billed CPT codes covered under any known plan for this patient?',
            status: 'SKIPPED' as const,
            explanation: `Coverage analysis skipped — cannot evaluate plan-level CPT coverage without first confirming an active policy. Resolve eligibility verification before re-assessing service coverage.`,
            data_used: {
              reason: 'Eligibility not confirmed; coverage analysis deferred',
            },
            sources: ['Availity API'],
          },
          {
            rule_name: 'Billing Payer Validation',
            decision_question: 'Was the claim submitted to the correct payer?',
            status: 'WARNING' as const,
            explanation: `Claim was submitted to ${payer} based on the insurance card on file, but the payer's system shows no active enrollment. The patient may have a new primary carrier as of 01/01/2026. Verify whether the patient switched insurers during open enrollment and whether ${payer} is still the correct payer.`,
            data_used: {
              submittedPayer: payer,
              enrollmentStatus: 'Not active in submitted payer system',
              possibleNewPayer: 'Unknown — requires patient confirmation',
            },
            sources: ['Candid PMS'],
          },
          {
            rule_name: 'Medicare Plan Check',
            decision_question: 'Could the patient have aged into Medicare or enrolled during a special enrollment period?',
            status: 'WARNING' as const,
            explanation: `Patient DOB ${formatDate(claim.dateOfBirth)} — patient is ${new Date().getFullYear() - new Date(claim.dateOfBirth).getFullYear()} years old. If the patient recently turned 65 and enrolled in Medicare, this could explain why the commercial plan shows no active coverage. Verify Medicare enrollment status via Medicare eligibility lookup (HETS).`,
            data_used: {
              patientAge: `${new Date().getFullYear() - new Date(claim.dateOfBirth).getFullYear()}`,
              medicareEligibilityAge: '65',
              medicareEnrollmentVerified: 'Not yet checked',
              recommendedAction: 'Check HETS for Medicare enrollment',
            },
            sources: ['Availity API'],
          },
          {
            rule_name: 'Patient Grace Period Check',
            decision_question: 'Is there a grace period that could cover this DOS?',
            status: 'SKIPPED' as const,
            explanation: 'Grace period check skipped — CO-28 indicates coverage was never in effect (not terminated), so grace period provisions do not apply. Resolve the underlying enrollment discrepancy first.',
            data_used: {
              reason: 'CO-28 (never active) — grace period not applicable',
            },
            sources: ['Availity API'],
          },
        ] as RuleResult[],
        plan: {
          recommended_action:
            `CO-28 denial — member ID not active on DOS. Recommended steps: (1) Contact patient immediately to obtain current insurance card; ask if they changed plans during November–December open enrollment. (2) Run a new real-time eligibility check with the updated carrier and member ID. (3) If a new plan is identified, correct the payer and resubmit as a new claim to the correct carrier within timely filing limits. (4) Check HETS to rule out Medicare enrollment. (5) If the patient is uninsured or the plan cannot be identified, apply self-pay discount and review financial assistance eligibility.`,
          flags: {
            PatientContactRequired: 'Yes — obtain current insurance card',
            NewEligibilityCheckNeeded: 'Yes — re-verify with updated info',
            MedicareEnrollmentCheck: 'Recommended (HETS lookup)',
            TimelyFilingDeadline: 'Monitor — do not let lapse while investigating',
          },
          documents_collected: [
            'Explanation of Benefits (CO-28)',
            'Real-Time Eligibility Response',
            'Patient Insurance Update Form',
            'HETS Medicare Eligibility Query',
          ],
        } as ActionPlan,
      }
    }

    if (code === 'CO-97') {
      // Coding denial — E&M denied same day as infusion; modifier 25 missing (NCCI bundling edit)
      const paidCpts = (claim.remarks ?? '').match(/Paid CPTs?:\s*([^.\n]+)/)?.[1] ?? '96413, 96415, J9355'
      const paidAmt = formatCurrency(primaryPaidAmount)
      const deniedEm = claim.deniedLineItems ?? '99215'
      return {
        rules: [
          // ── Bundling & Unbundling ──────────────────────────────────────────────
          {
            section_header: 'Bundling & Unbundling',
            rule_name: 'NCCI Bundling Edit Confirmed',
            decision_question: 'Was this claim denied due to an NCCI bundling edit?',
            status: 'FAILED' as const,
            explanation: `CARC code CO-97 confirms an NCCI bundling edit. ${payer} determined that CPT ${deniedEm} is included in the payment allowance for the infusion services billed on the same date (${dos}). Payer paid ${paidAmt} for ${paidCpts} but denied ${deniedEm} as a bundled component per CMS NCCI Column 1/Column 2 edits.`,
            data_used: { denialCode: 'CO-97', denialCategory: 'Coding Denial', paidCPTs: paidCpts, deniedCPT: deniedEm, paidAmount: paidAmt },
            sources: ['Availity API', 'CMS NCCI'],
          },
          {
            rule_name: 'Column 1 / Column 2 Edit Check',
            decision_question: 'Is the denied CPT listed as Column 2 to the paid infusion CPTs under NCCI edits?',
            status: 'FAILED' as const,
            explanation: `NCCI Column 1/Column 2 table confirms that ${deniedEm} (E&M) is a Column 2 code to CPT 96413 (Column 1 — infusion administration). When billed together on the same DOS without modifier 25, the Column 2 code is automatically bundled into the Column 1 allowance. The modifier indicator for this edit is "1," meaning the bundle is bypassable with the correct modifier.`,
            data_used: { column1CPT: '96413', column2CPT: deniedEm, modifierIndicator: '1', bypassModifier: '25', editSource: 'CMS NCCI Table' },
            sources: ['CMS NCCI'],
          },
          {
            rule_name: 'Modifier Bypass Eligibility',
            decision_question: 'Can modifier 25 override the bundling edit for this code pair?',
            status: 'PASSED' as const,
            explanation: `The NCCI edit for ${deniedEm} with 96413 carries modifier indicator "1," confirming that modifier 25 ("Significant, separately identifiable evaluation and management service by the same physician on the day of a procedure") is an approved bypass modifier for this code pair. Resubmitting with ${deniedEm}-25 will override the bundling edit and allow separate reimbursement, provided clinical documentation supports a distinct E&M visit.`,
            data_used: { ncciBypassAllowed: 'Yes', bypassModifier: '25', correctionPath: `Resubmit as ${deniedEm}-25`, editModifierIndicator: '1' },
            sources: ['CMS NCCI', 'AMA CPT'],
          },
          // ── Medical Necessity ─────────────────────────────────────────────────
          {
            section_header: 'Medical Necessity',
            rule_name: 'Medical Necessity Validation',
            decision_question: 'Was the E&M visit medically necessary on the date of infusion?',
            status: 'PASSED' as const,
            explanation: `The denial is a coding/modifier error, not a medical necessity determination. ${payer} did not challenge the clinical necessity of CPT ${deniedEm} — the E&M was denied solely because modifier 25 was missing on the claim. Medical necessity is presumed met; the corrected claim with modifier 25 does not require a medical necessity appeal.`,
            data_used: { medicalNecessityDenied: 'No — coding error only', denialReason: 'Missing modifier 25', medicalNecessityAppealNeeded: 'No' },
            sources: ['Availity API', 'OncoEMR'],
          },
          {
            rule_name: 'LCD / NCD Coverage Check',
            decision_question: 'Are all billed CPT codes covered under the applicable LCD or payer coverage policy?',
            status: 'PASSED' as const,
            explanation: `All CPT codes on this claim — ${paidCpts}, ${deniedEm} — are covered services under ${payer}'s oncology benefit. No LCD or NCD exclusion applies to ${deniedEm} for this diagnosis. Coverage is confirmed; the only barrier to reimbursement is the missing modifier 25 on the corrected claim.`,
            data_used: { payer, coveredCPTs: `${paidCpts}, ${deniedEm}`, lcdExclusion: 'None found', coverageStatus: 'Covered — modifier correction required' },
            sources: ['Availity API', 'CMS NCCI'],
          },
          {
            rule_name: 'Clinical Documentation Adequacy',
            decision_question: 'Does the progress note support a separately identifiable E&M service beyond infusion management?',
            status: 'MANUAL' as const,
            explanation: `Manual review required before resubmitting with modifier 25. Pull the treating physician's progress note for ${dos} and confirm it documents: (1) a distinct chief complaint or clinical problem, (2) a focused history and exam, and (3) medical decision-making that goes beyond routine infusion oversight. If the note solely documents infusion administration, modifier 25 cannot be supported and the denial stands.`,
            data_used: { reviewRequired: 'Yes — progress note for ' + dos, mustDocument: 'Distinct chief complaint, H&P, and MDM separate from infusion', cptUnderReview: deniedEm },
            sources: ['OncoEMR'],
          },
          // ── CPT & Modifier Validity ───────────────────────────────────────────
          {
            section_header: 'CPT & Modifier Validity',
            rule_name: 'CPT Code Validity Check',
            decision_question: 'Are all submitted CPT codes valid and active for the date of service?',
            status: 'PASSED' as const,
            explanation: `All CPT codes submitted on this claim — ${paidCpts}, ${deniedEm} — are valid, active CPT codes as of ${dos}. No invalid, deleted, or unlisted CPT codes were identified. The denial is not related to CPT code validity.`,
            data_used: { cptCodes: `${paidCpts}, ${deniedEm}`, cptValidityStatus: 'All valid', dateOfService: dos },
            sources: ['AMA CPT', 'Availity API'],
          },
          {
            rule_name: 'Modifier 25 Application Check',
            decision_question: 'Was modifier 25 correctly appended to the E&M on the original claim?',
            status: 'FAILED' as const,
            explanation: `CPT ${deniedEm} was submitted on the original claim without any modifier. Modifier 25 was not appended. Per CMS and NCCI guidelines, E&M services billed on the same day as a minor or endoscopic procedure or infusion service require modifier 25 to be paid separately. This omission is the direct cause of the CO-97 denial. Corrective action: resubmit with ${deniedEm}-25.`,
            data_used: { originalModifier: 'None', requiredModifier: '25', cpt: deniedEm, correctionAction: `Resubmit ${deniedEm}-25` },
            sources: ['CMS NCCI', 'AMA CPT'],
          },
          {
            rule_name: 'E&M Complexity Level Verification',
            decision_question: 'Is the E&M complexity level (99215) appropriate for the visit documented?',
            status: 'PASSED' as const,
            explanation: `CPT 99215 (high-complexity office visit, typically 40–54 minutes with high MDM) is appropriate for oncology patients receiving active chemotherapy. The visit complexity is consistent with the patient's active diagnosis and treatment protocol. No downcoding risk identified — the 99215 level is defensible given the clinical context.`,
            data_used: { emCode: deniedEm, complexityLevel: 'High (99215)', clinicalJustification: 'Active oncology patient, chemotherapy infusion, high MDM', downcodeRisk: 'Low' },
            sources: ['OncoEMR', 'AMA CPT'],
          },
          // ── Units & POS ───────────────────────────────────────────────────────
          {
            section_header: 'Units & POS',
            rule_name: 'Units of Service Verification',
            decision_question: 'Are the units billed for each CPT code within acceptable NCCI MUE limits?',
            status: 'PASSED' as const,
            explanation: `Units of service for all CPT codes on this claim are within CMS Medically Unlikely Edit (MUE) limits. CPT ${deniedEm} billed 1 unit (MUE adjudication indicator: 3; MUE limit: 1 per DOS per provider). Infusion CPTs 96413 and 96415 units are also within MUE limits. No MUE violation identified.`,
            data_used: { cpt: deniedEm, unitsBilled: '1', mueLimit: '1', mueStatus: 'Within limits', infusionUnits: 'Within MUE limits' },
            sources: ['CMS NCCI', 'Availity API'],
          },
          {
            rule_name: 'Place of Service Validation',
            decision_question: 'Is the place of service consistent with the billed CPT codes?',
            status: 'PASSED' as const,
            explanation: `Place of service on the claim is consistent with the CPT codes billed. Oncology infusion services (96413, 96415) and office E&M (${deniedEm}) are appropriately billed together for an outpatient oncology clinic setting. No POS mismatch detected.`,
            data_used: { placeOfService: 'Outpatient Oncology Clinic', cptConsistency: 'Confirmed', posConflict: 'None' },
            sources: ['Availity API', 'Candid PMS'],
          },
          // ── Claim Integrity ───────────────────────────────────────────────────
          {
            section_header: 'Claim Integrity',
            rule_name: 'Date of Service & Diagnosis Consistency',
            decision_question: 'Are the DOS and diagnosis codes consistent across the claim and EMR records?',
            status: 'PASSED' as const,
            explanation: `DOS ${dos} and diagnosis codes are consistent across the claim, OncoEMR encounter record, and Candid PMS billing record. No discrepancy in DOS or ICD coding was identified. All diagnoses correctly support the infusion CPTs. The only correctable issue is the missing modifier 25 on CPT ${deniedEm}.`,
            data_used: { dosConsistency: 'Confirmed across claim and EMR', diagnosisConsistency: 'Confirmed', source: 'Candid PMS, OncoEMR' },
            sources: ['OncoEMR', 'Candid PMS'],
          },
          {
            rule_name: 'Provider Enrollment & Credentialing',
            decision_question: 'Is the billing provider active and credentialed with the payer on the date of service?',
            status: 'PASSED' as const,
            explanation: `Provider NPI ${claim.providerNpi} is active and credentialed with ${payer} as of ${dos}. No credentialing lapse, exclusion, or enrollment discrepancy detected. The denial is not related to provider status.`,
            data_used: { providerNpi: claim.providerNpi, payer, credentialingStatus: 'Active', enrollmentStatus: 'Active — no lapse', dateOfService: dos },
            sources: ['Availity API', 'Candid PMS'],
          },
          {
            rule_name: 'Duplicate Claim Check',
            decision_question: 'Is there a duplicate claim submission for this DOS and CPT combination?',
            status: 'PASSED' as const,
            explanation: `No duplicate claim found for CPT ${deniedEm} on DOS ${dos} for this patient. The original claim was submitted once. The corrected claim resubmission (with modifier 25) should be submitted as a corrected claim (frequency code 7 on 837P) — not a duplicate — to avoid a secondary denial for duplicate billing.`,
            data_used: { duplicateFound: 'No', originalClaimNumber: claim.claimNumber ?? claim.claimId, resubmissionNote: 'Submit corrected claim with frequency code 7 (corrected claim)' },
            sources: ['Candid PMS', 'Availity API'],
          },
        ] as RuleResult[],
        plan: {
          recommended_action:
            `CO-97 coding denial — CPT ${deniedEm} denied as bundled with infusion payment. ${payer} paid ${paidAmt} for ${paidCpts}. To recover the denied E&M: (1) Pull the progress note for ${dos} and verify it documents a separately identifiable service beyond infusion management (distinct chief complaint, H&P, and MDM). (2) Resubmit a corrected claim (frequency code 7) with modifier 25 appended to CPT ${deniedEm} (i.e., ${deniedEm}-25). (3) Attach the supporting clinical note to the corrected claim. (4) Verify corrected claim is submitted within ${payer}'s timely filing window from DOS (${dos}).`,
          flags: {
            DeniedCPT: deniedEm,
            RequiredModifier: '25 (Significant, separately identifiable E&M)',
            PaidCPTs: paidCpts,
            AmountAlreadyPaid: paidAmt,
            NCCIBypassAvailable: 'Yes — modifier indicator 1',
            Action: `Resubmit corrected claim: ${claim.deniedLineItems}-25 with clinical note`,
          },
          documents_collected: [
            'Original EOB with CO-97 denial',
            `Progress note for ${dos} (supporting separate E&M)`,
            'Corrected Claim (837P) with modifier 25',
            'NCCI Edit Reference for CPT bundle',
          ],
        } as ActionPlan,
      }
    }

    if (code === 'CO-50') {
      // Eligibility denial — services denied as non-covered due to missing prior authorization
      const paidCpts = (claim.remarks ?? '').match(/Paid CPTs?:\s*([^.\n]+)/)?.[1] ?? '99215, 96413'
      const paidAmt = formatCurrency(primaryPaidAmount)
      const deniedCpts = claim.deniedLineItems ?? '96415, 96417, J9355'
      return {
        rules: [
          {
            rule_name: 'Eligibility Denial Confirmed',
            decision_question: 'Is this claim denied due to an eligibility issue?',
            status: 'PASSED' as const,
            explanation: `CARC code CO-50 confirms a coverage-based eligibility denial. ${payer} paid ${paidAmt} for ${paidCpts} but classified ${deniedCpts} as non-covered because prior authorization was not obtained. Under ${payer}'s benefit design, services rendered without required pre-authorization are treated as non-covered, triggering an eligibility-level denial for those line items.`,
            data_used: { denialCode: 'CO-50', denialCategory: 'Eligibility Denial', paidCPTs: paidCpts, deniedCPTs: deniedCpts, paidAmount: paidAmt },
            sources: ['Availity API', 'Candid PMS'],
          },
          {
            rule_name: 'Date of Service Coverage Verification',
            decision_question: 'Was the patient covered under an active policy on the date of service?',
            status: 'PASSED' as const,
            explanation: `${payer} coverage was active on ${dos} — confirmed by adjudication and partial payment of ${paidAmt} for ${paidCpts}. Coverage for ${deniedCpts} was also in effect on ${dos}; however, those services require prior authorization to be payable. The denial is an authorization gap, not a coverage lapse or termination.`,
            data_used: { coverageStatus: `Active — ${payer}`, memberId, dateOfService: dos, partialPaymentConfirmsCoverage: paidCpts, deniedDueToMissingAuth: deniedCpts },
            sources: ['Availity API'],
          },
          {
            rule_name: 'Retro-Eligibility Check',
            decision_question: 'Is a retrospective authorization available to restore coverage for the denied services?',
            status: 'WARNING' as const,
            explanation: `${payer}'s Utilization Management (UM) department may allow a retrospective authorization for ${deniedCpts} within 30–60 days of DOS (${dos}) when the treating physician certifies medical necessity. A retro auth — if approved — would retroactively restore coverage eligibility for the denied line items and allow resubmission. Contact ${payer} UM promptly to initiate this process.`,
            data_used: { retroAuthOption: 'Retrospective Authorization', deniedServices: deniedCpts, typicalWindow: '30–60 days from DOS', action: `Contact ${payer} UM — provide physician medical necessity certification` },
            sources: ['Optum API', 'Availity API'],
          },
          {
            rule_name: 'Patient-Policy Link Validation',
            decision_question: 'Does the member ID and demographic data match the active plan on file?',
            status: 'PASSED' as const,
            explanation: `Member ID ${memberId}, patient name, and date of birth all match ${payer}'s subscriber records exactly. No demographic discrepancy detected. The eligibility denial is not related to a patient-policy mismatch — it is solely due to missing prior authorization on the denied line items.`,
            data_used: { memberId, nameOnFile: `${claim.patientFirstName} ${claim.patientLastName}`, dobOnFile: formatDate(claim.dateOfBirth), demographicMatch: 'Confirmed' },
            sources: ['Availity API', 'Candid PMS'],
          },
          {
            rule_name: 'Service Coverage Analysis',
            decision_question: 'Are the denied CPT codes covered benefits under the plan when authorized?',
            status: 'WARNING' as const,
            explanation: `CPT codes ${deniedCpts} are covered benefits under ${payer}'s oncology benefit plan for patients with active oncology diagnoses. The services are not excluded — they are payable when prior authorization is obtained. The denial reflects a process failure (authorization not obtained pre-service), not a benefit exclusion. Retro auth or a formal appeal with clinical documentation can restore coverage for these line items.`,
            data_used: { deniedCPTs: deniedCpts, coveredBenefit: 'Yes — with prior authorization', exclusion: 'None', resolutionPath: 'Retro auth or medical necessity appeal' },
            sources: ['Availity API', 'OncoEMR'],
          },
          {
            rule_name: 'Billing Payer Validation',
            decision_question: 'Was the claim submitted to the correct payer?',
            status: 'PASSED' as const,
            explanation: `Claim was correctly submitted to ${payer} (member ID: ${memberId}) as the primary payer on file. No billing routing error or payer mismatch detected. ${payer} adjudicated and partially paid the claim, confirming the payer routing was correct.`,
            data_used: { submittedPayer: payer, payerOnFile: payer, routingCorrect: 'Yes', partialPaymentConfirms: 'Correct payer' },
            sources: ['Candid PMS'],
          },
          {
            rule_name: 'Medicare Plan Check',
            decision_question: 'Is Medicare involved as primary or secondary payer for this patient?',
            status: 'PASSED' as const,
            explanation: `No Medicare enrollment found for this patient at the time of service. ${payer} is the sole active payer. Medicare MSP rules do not apply. The CO-50 denial is strictly a prior authorization / coverage issue within the ${payer} commercial plan.`,
            data_used: { medicareEnrolled: 'No', mspApplicable: 'No', cobWithMedicare: 'Not applicable', activePayer: payer },
            sources: ['Availity API'],
          },
          {
            rule_name: 'Patient Grace Period Check',
            decision_question: 'Does any grace period or retroactive authorization window apply to the denied services?',
            status: 'WARNING' as const,
            explanation: `CO-50 is a non-coverage denial due to missing prior authorization — traditional plan grace periods do not apply. However, ${payer}'s retrospective authorization policy functions as the equivalent recovery window. Contact ${payer} UM within 30–60 days of DOS (${dos}) to request retro auth. If retro auth is denied, a formal medical necessity appeal must be filed within ${payer}'s appeal deadline (typically 180 days from denial date).`,
            data_used: { gracePeriodApplicable: 'No — CO-50 is a PA/authorization denial', retroAuthWindow: '30–60 days from DOS', appealDeadline: '180 days from denial date', action: 'Contact UM for retro auth immediately' },
            sources: ['Availity API', 'Candid PMS'],
          },
        ] as RuleResult[],
        plan: {
          recommended_action:
            `CO-50 eligibility denial — ${payer} paid ${paidAmt} for ${paidCpts} but denied ${deniedCpts} as non-covered (missing prior authorization). Recommended steps: (1) Contact ${payer} Utilization Management to request a retrospective authorization for ${deniedCpts}; provide treating physician's certification of medical necessity. (2) Pull clinical notes and treatment protocol for ${dos} to support the retro auth request. (3) If retro auth is approved, resubmit the denied line items with the authorization number. (4) If retro auth is denied, file a formal coverage appeal with physician order, oncology treatment protocol, and applicable LCD reference confirming covered benefit status. (5) Ensure appeal or retro auth request is submitted within ${payer}'s timely filing window.`,
          flags: {
            DeniedCPTs: deniedCpts,
            PaidCPTs: paidCpts,
            AmountAlreadyPaid: paidAmt,
            PriorAuthOnFile: 'No — retro auth needed',
            RetroAuthWindow: 'Contact UM — typically 30–60 days from DOS',
            Action: 'Request retro auth or submit coverage appeal',
          },
          documents_collected: [
            'Original EOB with CO-50 denial',
            `Physician order and progress note for ${dos}`,
            'Oncology treatment protocol / care plan',
            'Applicable LCD / coverage policy reference',
            'Retrospective authorization request form',
          ],
        } as ActionPlan,
      }
    }

    // CO-22 — Medicare paid as primary; BCBS (secondary) denied because Medicare EOB not attached
    if (code === 'CO-22') {
      const isMedicarePrimary = claim.primaryInsurance?.toLowerCase().includes('medicare')
      const medicareMemberId = isMedicarePrimary ? claim.primaryMemberId : (claim.secondaryMemberId ?? '')
      const commercialPayer = isMedicarePrimary ? (claim.secondaryInsurance ?? payer) : claim.primaryInsurance
      const commercialMemberId = isMedicarePrimary ? (claim.secondaryMemberId ?? '') : claim.primaryMemberId
      const deniedLineItemsCO22 = (activeTab === 'primary' ? claim.deniedLineItems : (claim.secondaryDeniedLineItems ?? claim.deniedLineItems)) ?? ''
      const medicarePaymentAmt = primaryPaidAmount > 0 ? formatCurrency(primaryPaidAmount) : 'see Medicare EOMB'
      const medicareCheckNum = claim.checkNumber ?? 'see EOMB'
      const medicarePaymentDate = claim.checkDate ? formatDate(claim.checkDate) : 'see EOMB'
      const remainingBalance = primaryPaidAmount > 0
        ? formatCurrency(Math.round((Number(claim.chargeAmount) - primaryPaidAmount) * 100) / 100)
        : 'see EOMB'

      return {
        rules: [
          {
            rule_name: 'Eligibility Denial Confirmed',
            decision_question: 'Is this claim denied due to an eligibility or COB documentation issue?',
            status: 'PASSED' as const,
            explanation: `CARC code CO-22 ("This care may be covered by another payer per coordination of benefits") with RARC N104 confirms a COB documentation denial. ${commercialPayer} received the secondary claim without the Medicare EOMB attached. Without the primary EOMB, ${commercialPayer} cannot confirm Medicare's adjudication or compute the correct secondary payment.`,
            data_used: {
              denialCode: 'CO-22',
              remarkCode: 'N104',
              denialCategory: 'COB Documentation – Missing Primary EOB',
              claimStatus: 'DENIED',
              submittedTo: commercialPayer,
              missingDocument: 'Medicare Explanation of Benefits (EOMB)',
            },
            sources: ['Availity API', 'Candid PMS'],
          },
          {
            rule_name: 'Primary Claim Adjudication Status',
            decision_question: 'Has Medicare (primary payer) adjudicated and paid the claim?',
            status: 'PASSED' as const,
            explanation: `Medicare adjudicated this claim and issued payment of ${medicarePaymentAmt} via EFT (${medicareCheckNum}) on ${medicarePaymentDate}. Medicare processed CPT codes ${deniedLineItemsCO22 || 'as submitted'} under Part B. The Medicare EOMB is available and must now be attached to the secondary claim submission to ${commercialPayer}.`,
            data_used: {
              medicareMemberId,
              medicareClaimNumber: claim.claimNumber ?? 'see EOMB',
              medicarePaidAmount: medicarePaymentAmt,
              medicareEFTNumber: medicareCheckNum,
              medicarePaymentDate,
              primaryAdjudicationStatus: 'PAID',
            },
            sources: ['Availity API'],
          },
          {
            rule_name: 'Date of Service Coverage Verification',
            decision_question: 'Was the patient covered by both plans on the date of service?',
            status: 'PASSED' as const,
            explanation: `Patient had active dual coverage on ${dos}: Medicare (member ${medicareMemberId}) as primary and ${commercialPayer} (member ${commercialMemberId}) as secondary. Both plans were in effect. The denial is not due to eligibility issues — it is a COB documentation error on the secondary claim submission.`,
            data_used: {
              medicareCoverageStatus: 'Active on DOS',
              secondaryCoverageStatus: `Active on DOS — ${commercialPayer}`,
              dateOfService: dos,
              dualCoverageConfirmed: 'Yes',
            },
            sources: ['Availity API'],
          },
          {
            rule_name: 'Patient-Policy Link Validation',
            decision_question: 'Is the patient correctly enrolled in both Medicare and the secondary plan?',
            status: 'PASSED' as const,
            explanation: `Demographics verified across both payers. Medicare: member ${medicareMemberId} — active, correct DOB and name on file. ${commercialPayer}: member ${commercialMemberId} — active subscriber, demographics confirmed. No enrollment discrepancy found.`,
            data_used: {
              primaryPayer: 'Medicare',
              primaryMemberId: medicareMemberId,
              secondaryPayer: commercialPayer,
              secondaryMemberId: commercialMemberId,
              demographicMatch: 'Confirmed on both plans',
            },
            sources: ['Availity API', 'Candid PMS'],
          },
          {
            rule_name: 'Primary EOB Attachment Verification',
            decision_question: 'Was the Medicare EOMB attached to the secondary claim submission?',
            status: 'FAILED' as const,
            explanation: `The secondary claim submitted to ${commercialPayer} did not include the Medicare EOMB. Per ${commercialPayer} COB policy and CMS COB guidelines, secondary payers require the primary payer's EOMB to determine their payment obligation. Without the EOMB, ${commercialPayer} cannot verify Medicare's allowed amount, patient responsibility, or crossover balance.`,
            data_used: {
              eobAttachedToSecondaryClaim: 'No',
              medicareEFTNumber: medicareCheckNum,
              medicarePaymentDate,
              requiredBy: `${commercialPayer} COB policy / CMS secondary billing guidelines`,
              correctionRequired: `Resubmit with Medicare EOMB (${medicareCheckNum}) attached`,
            },
            sources: ['Candid PMS', 'Availity API'],
          },
          {
            rule_name: 'Secondary Claim Submission Validation',
            decision_question: 'Was the secondary claim correctly submitted as a COB crossover claim?',
            status: 'FAILED' as const,
            explanation: `The claim was submitted to ${commercialPayer} without the 837P COB loop (Loop 2320 / CAS segments) populated with Medicare's adjudication data. Secondary COB claims must include Medicare's allowed amount, paid amount, and patient responsibility in the COB information segment so ${commercialPayer} can compute the correct crossover benefit.`,
            data_used: {
              cobLoopPopulated: 'No — CAS/COB segments missing',
              medicareAllowedAmountSubmitted: 'Not submitted',
              medicarePaidAmountSubmitted: 'Not submitted',
              correctionRequired: 'Resubmit 837P with Loop 2320 COB data populated from Medicare EOMB',
            },
            sources: ['Candid PMS', 'Availity API'],
          },
          {
            rule_name: 'Service Coverage Analysis',
            decision_question: 'Are the billed services covered under Medicare and the secondary plan?',
            status: 'PASSED' as const,
            explanation: `CPT codes ${deniedLineItemsCO22 || 'as submitted'} are covered under Medicare Part B for oncology services — confirmed by Medicare's payment. ${commercialPayer} covers these services as secondary after Medicare adjudication. Once the corrected claim with EOMB is submitted, ${commercialPayer} will process the crossover balance of ${remainingBalance}.`,
            data_used: {
              cptCodes: deniedLineItemsCO22,
              medicarePartBCoverage: 'Confirmed — Medicare paid',
              secondaryCoverage: `Covered — ${commercialPayer} will process after EOMB`,
              estimatedCrossoverBalance: remainingBalance,
            },
            sources: ['Availity API'],
          },
          {
            rule_name: 'Timely Filing Check',
            decision_question: 'Is the secondary claim within the timely filing window for resubmission?',
            status: 'WARNING' as const,
            explanation: `${commercialPayer} typically requires secondary claims to be filed within 180 days of the primary payer's EOMB date. Medicare paid on ${medicarePaymentDate}. Prompt resubmission is critical — verify the exact timely filing limit in the ${commercialPayer} contract to ensure the corrected claim will be accepted.`,
            data_used: {
              medicarePaymentDate,
              typicalTimelyFilingWindow: '180 days from primary EOMB date',
              correctedClaimDeadline: 'Verify with payer contract — act promptly',
              risk: 'Denial for timely filing if resubmission is delayed',
            },
            sources: ['Candid PMS', 'Availity API'],
          },
        ] as RuleResult[],
        plan: {
          recommended_action:
            `CO-22 denial — Medicare EOMB not attached to secondary ${commercialPayer} claim. Medicare already paid ${medicarePaymentAmt} (EFT ${medicareCheckNum}, ${medicarePaymentDate}). Recommended steps: (1) Obtain the Medicare EOMB for claim ${claim.claimNumber ?? claim.claimId} showing allowed amount and patient responsibility. (2) Resubmit the claim to ${commercialPayer} as a secondary COB claim with the Medicare EOMB attached. (3) Populate the 837P Loop 2320 COB segments: Medicare allowed amount, Medicare paid amount (${medicarePaymentAmt}), and patient responsibility. (4) Verify the 837P SBR01 payer responsibility sequence is set to "S" (secondary) for ${commercialPayer}. (5) Submit within ${commercialPayer} timely filing window from the Medicare EOMB date (${medicarePaymentDate}).`,
          flags: {
            MedicarePaid: medicarePaymentAmt,
            MedicareEFTNumber: medicareCheckNum,
            MedicarePaymentDate: medicarePaymentDate,
            EstimatedCrossoverBalance: remainingBalance,
            Action: `Resubmit to ${commercialPayer} with Medicare EOMB attached`,
            EDI837Fix: 'Populate Loop 2320 COB segments with Medicare adjudication data',
          },
          documents_collected: [
            'Medicare EOMB (EFT payment confirmation)',
            'Original Secondary Claim (denied CO-22)',
            'Medicare Eligibility Confirmation',
            'MSP Questionnaire',
          ],
        } as ActionPlan,
      }
    }

    if (code === 'CO-4') {
      // Modifier mismatch — wrong modifier appended to E&M code billed same-day as infusion
      const deniedCpts = claim.deniedLineItems ?? '99213, 96413, 96415'
      const emCode = deniedCpts.split(',')[0].trim()
      return {
        rules: [
          {
            section_header: 'Bundling & Unbundling',
            rule_name: 'CPT Bundling Check (NCCI Edit Validation)',
            decision_question: 'Are any of the billed CPT codes bundled under NCCI edits?',
            status: 'FAILED' as const,
            explanation: `NCCI edit table confirms that CPT ${emCode} (E&M) and the infusion codes are component codes when billed together on the same date without an appropriate modifier. ${payer}'s adjudication engine applied a bundling edit to the E&M line item. Because modifier -57 does not override NCCI bundling edits for same-day E&M and infusion, the E&M was denied under CO-4.`,
            data_used: {
              cptPair: deniedCpts,
              ncciEditIndicator: '1 — bundled, modifier may override',
              modifierPresent: 'Yes — modifier 57 (incorrect)',
              editSource: 'CMS NCCI Table, Q1 2026',
              lineItemAffected: emCode,
            },
            sources: ['CMS NCCI', 'Availity API'],
          },
          {
            rule_name: 'Modifier Justification (Distinct Service Evidence)',
            decision_question: 'Is the modifier billed valid and appropriate to override the NCCI bundling edit?',
            status: 'FAILED' as const,
            explanation: `Modifier -57 ("Decision for Surgery") was appended to CPT ${emCode}, but modifier -57 is reserved for E&M visits that result in the decision to perform a major surgical procedure within 24 hours. It does not override NCCI bundling edits for same-day E&M and infusion billing. Modifier -25 is the correct modifier to indicate a significant, separately identifiable E&M service on the same day as a procedure or infusion. CO-4 was triggered because the modifier is inconsistent with the billed service.`,
            data_used: {
              modifierOnClaim: '-57 (Decision for Surgery)',
              modifierRequired: '-25 (Significant, separately identifiable E&M)',
              ncciCompatibility: 'Modifier -57 does not bypass NCCI infusion bundle',
              procedureNoteEvidence: 'Documentation of separate E&M exists — wrong modifier applied',
              source: 'CMS NCCI Tables, CPT Manual 2026',
            },
            sources: ['OncoEMR', 'CMS NCCI'],
          },
          {
            rule_name: 'Distinct Service Evidence Check',
            decision_question: 'Is there sufficient clinical documentation to support separate billing of the E&M and infusion services?',
            status: 'WARNING' as const,
            explanation: `${payer} progress note dated ${dos} documents a separately necessary evaluation prior to initiating infusion. The clinical basis for a distinct E&M service is present. However, because modifier -57 was used instead of modifier -25, the payer's adjudication engine rejected the modifier override. The documentation is adequate for appeal — the corrected claim must substitute modifier -25 for -57 on CPT ${emCode}.`,
            data_used: {
              progressNoteDate: dos,
              emDocumented: 'Yes',
              infusionDocumented: 'Yes',
              separateEncounterEvidence: 'Yes — supports distinct E&M service',
              ncciEditIndicator: 'Modifier-dependent (requires -25, not -57)',
            },
            sources: ['OncoEMR', 'CMS NCCI'],
          },
          {
            section_header: 'Medical Necessity',
            rule_name: 'Dx / CPT Medical Necessity Validation',
            decision_question: 'Do the diagnosis codes support medical necessity for the billed CPT codes?',
            status: 'PASSED' as const,
            explanation: `Primary diagnosis supports medical necessity for CPT codes ${deniedCpts} under the applicable LCD for chemotherapy services. Payer policy does not require prior authorization for these CPT-diagnosis combinations. The denial is solely due to the incorrect modifier, not a medical necessity issue.`,
            data_used: {
              primaryDiagnosis: claim.deniedLineItems ?? 'see claim',
              lcdId: 'L33794 — Chemotherapy Administration',
              medicalNecessityMet: 'Yes',
              priorAuthRequired: 'No',
              policySource: `${payer} Oncology Clinical Policy`,
            },
            sources: ['Availity API', 'OncoEMR'],
          },
          {
            rule_name: 'ICD-CPT Mapping Alignment',
            decision_question: 'Do the ICD-10 codes map correctly to the billed CPT codes?',
            status: 'PASSED' as const,
            explanation: `ICD-10 diagnosis code maps appropriately to CPT codes ${deniedCpts} for chemotherapy infusion. ICD specificity is at the highest level available. No crosswalk mismatch detected between diagnosis and procedure.`,
            data_used: {
              cptCodes: deniedCpts,
              mappingStatus: 'Valid — confirmed via payer crosswalk',
              icdSpecificity: '7th character — highest specificity',
            },
            sources: ['Availity API', 'OncoEMR'],
          },
          {
            rule_name: 'LCD / NCD Coverage Check',
            decision_question: 'Are the billed CPT codes covered under the applicable LCD or NCD for this payer?',
            status: 'PASSED' as const,
            explanation: `LCD L33794 confirms coverage for intravenous chemotherapy administration for patients with a confirmed malignant neoplasm diagnosis. All billed CPT codes are within covered service scope. No LCD conflicts identified. The denial is attributable to the modifier error, not a coverage gap.`,
            data_used: {
              lcdId: 'L33794',
              ncdApplicable: 'No',
              coveredCpts: deniedCpts,
              diagnosisCovered: 'Yes',
              source: `CMS / ${payer} Payer Portal`,
            },
            sources: ['Availity API', 'OncoEMR'],
          },
          {
            section_header: 'CPT & Modifier Validity',
            rule_name: 'CPT Validity for Date of Service',
            decision_question: 'Are all billed CPT codes valid for the date of service, patient age, and provider specialty?',
            status: 'PASSED' as const,
            explanation: `CPT codes ${deniedCpts} are all valid for DOS ${dos} under the current CPT code set. No age or gender restrictions apply. The rendering provider's specialty is consistent with billing authority for all codes.`,
            data_used: {
              cptCodes: deniedCpts,
              dosValidity: `Valid for ${dos}`,
              ageGenderRule: 'No restriction',
              providerSpecialty: 'Medical Oncology — consistent',
              cptSource: 'AMA CPT 2026',
            },
            sources: ['AMA CPT', 'Availity API'],
          },
          {
            rule_name: 'Modifier Validity (CPT Compatibility)',
            decision_question: 'Are the modifiers used on this claim valid and compatible with the billed CPT codes?',
            status: 'FAILED' as const,
            explanation: `Modifier -57 was appended to CPT ${emCode} on this claim. While modifier -57 is a valid CPT modifier, it is not compatible with same-day E&M and infusion billing. Per CMS guidelines and the CPT Manual, modifier -57 is applicable when an E&M service results in the decision to perform a major surgical procedure (global period applies). It does not satisfy the NCCI bundling edit between E&M and infusion services — only modifier -25 can override that edit. Resubmission requires replacing modifier -57 with modifier -25 on CPT ${emCode}.`,
            data_used: {
              modifiersOnClaim: '-57 on ' + emCode,
              modifierRequired: '-25 on ' + emCode,
              ncciCompatibility: 'Modifier -57 invalid for infusion same-day E&M',
              clinicalJustification: 'Available in documentation — modifier correction needed',
              source: 'CMS NCCI Tables, CPT Manual 2026',
            },
            sources: ['CMS NCCI', 'AMA CPT'],
          },
          {
            rule_name: 'Downcoding / Upcoding Validation',
            decision_question: 'Was any downcoding or upcoding applied by the payer, and is it clinically justified?',
            status: 'PASSED' as const,
            explanation: `EOB reflects denial rather than a level-of-service adjustment. No downcoding of ${emCode} to a lower E&M level was applied. The denial is solely attributable to the modifier incompatibility, not a CPT level dispute. No upcoding concern identified on provider side.`,
            data_used: {
              billedCpt: emCode,
              paidCpt: 'Denied — not downgraded',
              denialReason: 'Modifier incompatibility, not level dispute',
              upcodingFlagged: 'No',
              source: 'EOB, Payer Portal',
            },
            sources: ['Availity API', 'Candid PMS'],
          },
          {
            section_header: 'Units & POS',
            rule_name: 'Units Accuracy (MUE Check)',
            decision_question: 'Do the units billed for each CPT code comply with the CMS Medically Unlikely Edit (MUE) limits?',
            status: 'PASSED' as const,
            explanation: `All CPT codes on this claim are billed within CMS MUE limits. Infusion time log confirms total infusion time is consistent with units billed. No MUE violations identified.`,
            data_used: {
              cptUnits: '1 unit each — within MUE limits',
              infusionTimeDocumented: 'Yes — consistent with billed units',
              mueCompliance: 'Yes',
              source: 'CMS MUE Table, Q1 2026',
            },
            sources: ['CMS MUE', 'OncoEMR'],
          },
          {
            rule_name: 'Place of Service (POS) Validation',
            decision_question: 'Is the place of service code on the claim consistent with the actual location of service?',
            status: 'PASSED' as const,
            explanation: `POS code 11 (Office) is reported on the claim. Service was rendered at the oncology clinic office location. POS is correct and consistent with payer contract terms for outpatient infusion billing.`,
            data_used: {
              posCodeBilled: '11 — Office',
              actualLocation: 'Oncology clinic — confirmed',
              posMatch: 'Confirmed',
              payerContractPos: '11 — consistent',
            },
            sources: ['Candid PMS', 'Availity API'],
          },
          {
            section_header: 'Claim Integrity',
            rule_name: 'True Duplicate Claim Check',
            decision_question: 'Is this denial the result of a duplicate claim submission?',
            status: 'PASSED' as const,
            explanation: `PMS confirms this is the original claim submission. No prior claim with the same member ID, DOS, and CPT code combination was found in ${payer}'s system. The denial is not a duplicate rejection — it is a first-pass adjudication denial due to the modifier incompatibility.`,
            data_used: {
              originalClaimNumber: claim.claimNumber ?? claim.claimId,
              duplicateFound: 'No',
              serviceLineMatch: 'No prior matching claim',
              billedAmount: formatCurrency(Number(claim.chargeAmount)),
            },
            sources: ['Candid PMS', 'Availity API'],
          },
          {
            rule_name: 'Timely Filing Validation',
            decision_question: 'Was the claim submitted within the payer\'s timely filing window?',
            status: 'PASSED' as const,
            explanation: `DOS was ${dos}. Claim was submitted ${formatDate(claim.claimReceivedDate!)}, ${Math.floor((new Date(claim.claimReceivedDate!).getTime() - new Date(claim.dateOfService).getTime()) / 86400000)} days after the date of service. ${payer}'s timely filing limit for in-network providers is 90 days from DOS. Submission is well within the filing window. Corrected claim resubmission with modifier -25 must also be filed within this window.`,
            data_used: {
              dateOfService: dos,
              submissionDate: formatDate(claim.claimReceivedDate!),
              daysSinceService: `${Math.floor((new Date(claim.claimReceivedDate!).getTime() - new Date(claim.dateOfService).getTime()) / 86400000)} days`,
              filingDeadline: '90 days (in-network)',
              timelyFilingMet: 'Yes',
            },
            sources: ['Candid PMS', 'Availity API'],
          },
          {
            rule_name: 'DOS & Diagnosis Code Verification',
            decision_question: 'Are the date of service and diagnosis codes consistent across claim, EMR, and PMS records?',
            status: 'PASSED' as const,
            explanation: `DOS ${dos} and primary diagnosis C34.12 are consistent across the claim, OncoEMR encounter record, and Candid PMS. No discrepancy in DOS or ICD coding was identified. All secondary diagnoses are also correctly carried over. The only correctable issue is the modifier -57 on CPT ${emCode}, which should be changed to modifier -25.`,
            data_used: {
              dosOnClaim: dos,
              dosInEmr: `${dos} — match`,
              primaryDxClaim: 'C34.12',
              primaryDxEmr: 'C34.12 — match',
              secondaryDx: 'Z79.899, Z23 — consistent',
              source: 'Candid PMS, OncoEMR',
            },
            sources: ['Candid PMS', 'OncoEMR'],
          },
        ] as RuleResult[],
        plan: {
          recommended_action:
            `CO-4 modifier mismatch denial — modifier -57 was appended to CPT ${emCode} instead of the correct modifier -25. ${payer} denied the claim because modifier -57 (Decision for Surgery) does not override NCCI bundling edits for same-day E&M and infusion billing. Recommended steps: (1) Pull the progress note for ${dos} and confirm documentation supports a separately identifiable E&M service beyond infusion management. (2) Resubmit a corrected claim replacing modifier -57 with modifier -25 on CPT ${emCode} (i.e., ${emCode}-25). (3) Attach the supporting clinical note to the corrected claim. (4) Confirm the corrected claim is submitted within ${payer}'s corrected claim timely filing window from DOS (${dos}).`,
          flags: {
            DeniedCPTs: deniedCpts,
            IncorrectModifier: '-57 (Decision for Surgery)',
            RequiredModifier: '-25 (Significant, separately identifiable E&M)',
            NCCIBypassAvailable: 'Yes — modifier indicator 1 (requires -25)',
            Action: `Resubmit corrected claim: ${emCode}-25 with clinical note`,
            DocumentationStatus: 'Adequate — modifier correction is only fix needed',
          },
          documents_collected: [
            'Original EOB with CO-4 denial',
            `Progress note for ${dos} (supporting separate E&M)`,
            'Corrected Claim (837P) with modifier -25 replacing modifier -57',
            'NCCI Edit Reference confirming -25 modifier bypass',
            `${payer} modifier policy reference`,
          ],
        } as ActionPlan,
      }
    }

    if (code === 'CO-11') {
      // Diagnosis inconsistent with procedure — Z79.899 does not support chemotherapy/J9355
      const deniedCpts = claim.deniedLineItems ?? '96413, 96415, J9355'
      return {
        rules: [
          {
            section_header: 'Bundling & Unbundling',
            rule_name: 'CPT Bundling Check (NCCI Edit Validation)',
            decision_question: 'Are any of the billed CPT codes bundled under NCCI edits?',
            status: 'PASSED' as const,
            explanation: `No NCCI bundling edit conflicts identified. The billed CPT codes (${deniedCpts}) do not trigger any Column 1/Column 2 bundling rules. No E&M service was billed on the same day that would require a modifier override. The denial is not related to bundling.`,
            data_used: {
              cptCodes: deniedCpts,
              ncciEditApplicable: 'No — no bundling conflict',
              modifierRequired: 'N/A',
              editSource: 'CMS NCCI Table, Q1 2026',
            },
            sources: ['CMS NCCI', 'Availity API'],
          },
          {
            rule_name: 'Modifier Justification (Distinct Service Evidence)',
            decision_question: 'Is a modifier required to override any bundling edit on this claim?',
            status: 'PASSED' as const,
            explanation: `No modifier is required to unbundle any CPT code on this claim. The denial (CO-11) is due to a diagnosis-procedure mismatch, not a bundling or modifier issue. No modifier justification action is needed.`,
            data_used: {
              modifierRequired: 'N/A — no bundling edit to override',
              denialRootCause: 'Diagnosis inconsistent with procedure (CO-11)',
            },
            sources: ['OncoEMR', 'CMS NCCI'],
          },
          {
            rule_name: 'Distinct Service Evidence Check',
            decision_question: 'Is there documentation supporting the billed services as distinct and medically necessary?',
            status: 'PASSED' as const,
            explanation: `Progress notes confirm the infusion services (${deniedCpts}) were rendered as ordered. The clinical issue is not documentation of service delivery, but rather that the primary diagnosis on the claim (Z79.899) does not support the procedure codes billed. Correcting the diagnosis code is the required action.`,
            data_used: {
              serviceDocumented: 'Yes — infusion administration confirmed',
              denialRootCause: 'Incorrect primary diagnosis code on claim',
              correctionNeeded: 'Update primary diagnosis to active oncologic ICD-10 code',
            },
            sources: ['OncoEMR', 'CMS NCCI'],
          },
          {
            section_header: 'Medical Necessity',
            rule_name: 'Dx / CPT Medical Necessity Validation',
            decision_question: 'Do the diagnosis codes support medical necessity for the billed CPT codes?',
            status: 'FAILED' as const,
            explanation: `Primary diagnosis Z79.899 ("Other long-term (current) drug therapy") does not establish an active oncologic condition requiring chemotherapy infusion (${deniedCpts}). ${payer}'s adjudication engine determined that Z79.899 is a status code — not a primary diagnosis — and does not independently support coverage of chemotherapy infusion or J9355 (trastuzumab/Herceptin). An active cancer diagnosis (e.g., C50.x for breast cancer) is required as the primary diagnosis to establish medical necessity.`,
            data_used: {
              primaryDiagnosis: 'Z79.899 — Other long-term drug therapy (status code only)',
              diagnosisSupportsChemo: 'No — Z79.899 is a status/supplementary code',
              requiredDiagnosis: 'Active oncologic ICD-10 (e.g., C50.x, C34.x)',
              lcdRequirement: 'Primary active cancer dx required per LCD L34587',
            },
            sources: ['Availity API', 'OncoEMR'],
          },
          {
            rule_name: 'ICD-CPT Mapping Alignment',
            decision_question: 'Do the ICD-10 codes map correctly to the billed CPT codes?',
            status: 'FAILED' as const,
            explanation: `ICD-10 code Z79.899 does not crosswalk to CPT codes for chemotherapy infusion (96413, 96415) or J9355 (trastuzumab). Payer crosswalk tables confirm that Z79.899 is not an approved primary diagnosis for these chemotherapy procedure codes. The claim requires an active cancer diagnosis at the 4th–7th character specificity level. No valid crosswalk mapping detected between the submitted diagnosis and the billed procedures.`,
            data_used: {
              primaryIcd: 'Z79.899',
              cptCodes: deniedCpts,
              mappingStatus: 'Invalid — Z79.899 not a valid primary dx for chemotherapy CPTs',
              icdSpecificity: 'Z79.899 is supplementary — lacks clinical specificity for oncology billing',
              correctionRequired: 'Replace Z79.899 with specific active cancer ICD-10 code',
            },
            sources: ['Availity API', 'OncoEMR'],
          },
          {
            rule_name: 'LCD / NCD Coverage Check',
            decision_question: 'Are the billed CPT codes covered under the applicable LCD or NCD for this payer?',
            status: 'FAILED' as const,
            explanation: `LCD L34587 governs coverage of intravenous chemotherapy administration and trastuzumab (J9355) for ${payer}. This LCD requires a confirmed active malignant neoplasm diagnosis (e.g., C50.x for HER2+ breast cancer) as the primary diagnosis. The submitted diagnosis Z79.899 does not satisfy LCD L34587 coverage criteria. All three CPT codes (${deniedCpts}) are within covered service scope when paired with an appropriate cancer diagnosis — the coverage denial is solely due to the diagnosis mismatch.`,
            data_used: {
              lcdId: 'L34587',
              lcdRequirement: 'Active malignant neoplasm as primary diagnosis',
              submittedDiagnosis: 'Z79.899 — does not satisfy LCD criteria',
              coveredCpts: deniedCpts,
              source: `CMS / ${payer} Payer Portal`,
            },
            sources: ['Availity API', 'OncoEMR'],
          },
          {
            section_header: 'CPT & Modifier Validity',
            rule_name: 'CPT Validity for Date of Service',
            decision_question: 'Are all billed CPT codes valid for the date of service, patient age, and provider specialty?',
            status: 'PASSED' as const,
            explanation: `CPT codes ${deniedCpts} are all valid for DOS ${dos} under the current CPT code set. No age or gender restrictions apply. The rendering provider's specialty (Medical Oncology) is consistent with billing authority for all codes. The denial is not related to CPT validity.`,
            data_used: {
              cptCodes: deniedCpts,
              dosValidity: `Valid for ${dos}`,
              ageGenderRule: 'No restriction',
              providerSpecialty: 'Medical Oncology — consistent',
              cptSource: 'AMA CPT 2026',
            },
            sources: ['AMA CPT', 'Availity API'],
          },
          {
            rule_name: 'Modifier Validity (CPT Compatibility)',
            decision_question: 'Are the modifiers used on this claim valid and compatible with the billed CPT codes?',
            status: 'PASSED' as const,
            explanation: `No modifiers are present on any line item. No modifiers are required for the CPT codes billed (${deniedCpts}) on this claim. Modifier validity is not a contributing factor to the CO-11 denial.`,
            data_used: {
              modifiersOnClaim: 'None',
              modifierRequired: 'None for these CPTs',
              ncciCompatibility: 'N/A — no modifier issue',
              source: 'CMS NCCI Tables, CPT Manual 2026',
            },
            sources: ['CMS NCCI', 'AMA CPT'],
          },
          {
            rule_name: 'Downcoding / Upcoding Validation',
            decision_question: 'Was any downcoding or upcoding applied by the payer, and is it clinically justified?',
            status: 'PASSED' as const,
            explanation: `EOB reflects full denial rather than a level-of-service adjustment. No downcoding was applied by ${payer}. The denial is attributable entirely to the diagnosis-procedure mismatch (CO-11), not a CPT level dispute. No upcoding concern identified on the provider side.`,
            data_used: {
              billedCpts: deniedCpts,
              paidCpts: 'All denied — not downgraded',
              denialReason: 'Diagnosis inconsistent with procedure, not level dispute',
              upcodingFlagged: 'No',
              source: 'EOB, Payer Portal',
            },
            sources: ['Availity API', 'Candid PMS'],
          },
          {
            section_header: 'Units & POS',
            rule_name: 'Units Accuracy (MUE Check)',
            decision_question: 'Do the units billed for each CPT code comply with the CMS Medically Unlikely Edit (MUE) limits?',
            status: 'PASSED' as const,
            explanation: `All CPT codes on this claim are billed within CMS MUE limits. Infusion time log confirms the infusion duration is consistent with billed units. No MUE violations identified. Units accuracy is not a contributing factor to the CO-11 denial.`,
            data_used: {
              cptUnits: '96413: 1 billed / MUE limit: 1 | 96415: 2 billed / MUE limit: 5',
              infusionTimeDocumented: 'Yes — consistent with billed units',
              mueCompliance: 'Yes',
              source: 'CMS MUE Table, Q1 2026',
            },
            sources: ['CMS MUE', 'OncoEMR'],
          },
          {
            rule_name: 'Place of Service (POS) Validation',
            decision_question: 'Is the place of service code on the claim consistent with the actual location of service?',
            status: 'PASSED' as const,
            explanation: `POS code 11 (Office) is reported on the claim. Service was rendered at the oncology clinic office location. POS is correct and consistent with payer contract terms for outpatient infusion billing.`,
            data_used: {
              posCodeBilled: '11 — Office',
              actualLocation: 'Oncology clinic — confirmed',
              posMatch: 'Confirmed',
              payerContractPos: '11 — consistent',
            },
            sources: ['Candid PMS', 'Availity API'],
          },
          {
            section_header: 'Claim Integrity',
            rule_name: 'True Duplicate Claim Check',
            decision_question: 'Is this denial the result of a duplicate claim submission?',
            status: 'PASSED' as const,
            explanation: `PMS confirms this is the original claim submission. No prior claim with the same member ID, DOS, and CPT code combination was found in ${payer}'s system. The denial is not a duplicate rejection — it is a first-pass adjudication denial due to the diagnosis-procedure mismatch.`,
            data_used: {
              originalClaimNumber: claim.claimNumber ?? claim.claimId,
              duplicateFound: 'No',
              serviceLineMatch: 'No prior matching claim',
              billedAmount: formatCurrency(Number(claim.chargeAmount)),
            },
            sources: ['Candid PMS', 'Availity API'],
          },
          {
            rule_name: 'Timely Filing Validation',
            decision_question: 'Was the claim submitted within the payer\'s timely filing window?',
            status: 'PASSED' as const,
            explanation: `DOS was ${dos}. Claim was submitted ${formatDate(claim.claimReceivedDate!)}, ${Math.floor((new Date(claim.claimReceivedDate!).getTime() - new Date(claim.dateOfService).getTime()) / 86400000)} days after the date of service. ${payer}'s timely filing limit for in-network providers is 365 days from DOS. Submission is well within the filing window. Corrected claim resubmission with the corrected diagnosis code must also be filed within this window.`,
            data_used: {
              dateOfService: dos,
              submissionDate: formatDate(claim.claimReceivedDate!),
              daysSinceService: `${Math.floor((new Date(claim.claimReceivedDate!).getTime() - new Date(claim.dateOfService).getTime()) / 86400000)} days`,
              filingDeadline: '365 days (in-network)',
              timelyFilingMet: 'Yes',
            },
            sources: ['Candid PMS', 'Availity API'],
          },
          {
            rule_name: 'DOS & Diagnosis Code Verification',
            decision_question: 'Are the date of service and diagnosis codes consistent across claim, EMR, and PMS records?',
            status: 'FAILED' as const,
            explanation: `DOS ${dos} is correctly reported and consistent across the claim and OncoEMR encounter record. However, the primary diagnosis code Z79.899 ("Other long-term drug therapy") is a supplementary/status code recorded in the EMR but was incorrectly placed as the first-listed diagnosis on the claim. Per ICD-10-CM coding guidelines, the active malignant neoplasm (e.g., C50.911 — HER2+ right breast cancer) must be the first-listed diagnosis for chemotherapy claims. Z79.899 may be listed as a secondary code. The Candid PMS record shows C50.911 as the active diagnosis — this was not correctly carried over to the claim.`,
            data_used: {
              dosOnClaim: dos,
              dosInEmr: `${dos} — match`,
              primaryDxClaim: 'Z79.899 — incorrect first-listed diagnosis',
              primaryDxEmr: 'C50.911 — active malignant neoplasm (not carried over)',
              secondaryDx: 'Z79.899 should be secondary only',
              source: 'Candid PMS, OncoEMR',
            },
            sources: ['Candid PMS', 'OncoEMR'],
          },
        ] as RuleResult[],
        plan: {
          recommended_action:
            `CO-11 diagnosis-procedure mismatch denial — primary diagnosis Z79.899 ("Other long-term drug therapy") does not support chemotherapy infusion (${deniedCpts}) per ${payer}'s LCD L34587. ${payer} requires an active malignant neoplasm as the primary diagnosis for coverage of chemotherapy CPTs and J9355 (trastuzumab). Recommended steps: (1) Pull the patient's active oncology treatment record and pathology report to identify the correct active cancer diagnosis code (e.g., C50.911 for HER2+ right breast cancer). (2) Correct the primary diagnosis on the claim — replace Z79.899 with the specific active cancer ICD-10 code at the highest available specificity (4th–7th character). (3) Resubmit the corrected claim to ${payer} with the updated diagnosis and all supporting clinical documentation. (4) If treatment records are incomplete, request a letter of medical necessity from the treating oncologist documenting the active cancer diagnosis and rationale for trastuzumab therapy. (5) Confirm the corrected claim is submitted within ${payer}'s timely filing window from the denial date.`,
          flags: {
            DeniedCPTs: deniedCpts,
            SubmittedDiagnosis: 'Z79.899 — supplementary code (insufficient)',
            RequiredDiagnosis: 'Active cancer ICD-10 (e.g., C50.911, C34.x)',
            LCDApplicable: 'LCD L34587 — requires active malignant neoplasm',
            Action: `Correct primary dx to active cancer code; resubmit to ${payer}`,
            DocumentationNeeded: 'Pathology report, treatment plan, oncologist letter of necessity',
          },
          documents_collected: [
            'Original EOB with CO-11 denial',
            `Pathology report confirming active cancer diagnosis`,
            'Oncology treatment plan / physician order for trastuzumab',
            'Corrected Claim (837P) with updated primary ICD-10 diagnosis code',
            `LCD L34587 coverage reference for ${payer}`,
            'Letter of Medical Necessity from treating oncologist (if needed)',
          ],
        } as ActionPlan,
      }
    }

    // Fallback for unrecognized denial codes
    return {
      rules: [] as RuleResult[],
      plan: {
        recommended_action: `Denial code ${code} — manual review required. No automated rule set available for this denial type.`,
        flags: { DenialCode: code },
        documents_collected: ['Original EOB'],
      } as ActionPlan,
    }
  }

  // Simulate the two-phase analysis with mock data
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setRuleResults(null)
    setActionPlan(null)

    const t1 = setTimeout(() => {
      if (cancelled) return
      setLoading(false)

      const t2 = setTimeout(() => {
        if (cancelled) return
        const { rules, plan } = buildMockAnalysis()
        setRuleResults(rules)
        setActionPlan(plan)
      }, 400)

      return () => clearTimeout(t2)
    }, 300)

    return () => {
      cancelled = true
      clearTimeout(t1)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const handleSetDenialStage = async (stage: DenialStage) => {
    setSaving(stage)
    try {
      await fetch(`/api/claims/${claim.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ denialStage: stage }),
      })
      setCurrentDenialStage(stage)
      onSave()
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          {claim.patientFirstName} {claim.patientLastName}{' '}
          <span className="font-normal text-gray-500">({claim.mrn})</span>
        </h2>
      </div>

      {/* Insurance Tabs */}
      <div className="px-6 border-b border-gray-200">
        <div className="flex gap-6">
          <button
            className={`py-3 text-sm font-medium border-b-2 -mb-px ${
              activeTab === 'primary'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('primary')}
          >
            Primary: {claim.primaryInsurance}
          </button>
          {claim.secondaryInsurance && (
            <button
              className={`py-3 text-sm font-medium border-b-2 -mb-px ${
                activeTab === 'secondary'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('secondary')}
            >
              Secondary: {claim.secondaryInsurance}
            </button>
          )}
        </div>
      </div>

      {/* Info Row */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-8 gap-4 text-xs">
          <div>
            <span className="text-gray-500 uppercase block">DOB</span>
            <span className="font-medium text-gray-900">{formatDate(claim.dateOfBirth)}</span>
          </div>
          <div>
            <span className="text-gray-500 uppercase block">Plan</span>
            <span className="font-medium text-gray-900">{currentPlan}</span>
          </div>
          <div>
            <span className="text-gray-500 uppercase block">DOS</span>
            <span className="font-medium text-gray-900">{formatDate(claim.dateOfService)}</span>
          </div>
          <div>
            <span className="text-gray-500 uppercase block">Billed Amount</span>
            <span className="font-medium text-gray-900">{formatCurrency(billedAmount)}</span>
          </div>
          <div>
            <span className="text-gray-500 uppercase block">Primary Paid Amt</span>
            <span className={`font-medium ${primaryPaidAmount > 0 ? 'text-green-700' : 'text-gray-400'}`}>
              {primaryPaidAmount > 0 ? formatCurrency(primaryPaidAmount) : '—'}
            </span>
          </div>
          <div>
            <span className="text-gray-500 uppercase block">Claim Received</span>
            <span className="font-medium text-gray-900">{claimReceivedDate || '—'}</span>
          </div>
          <div>
            <span className="text-gray-500 uppercase block">Claim Number</span>
            <span className="font-medium text-gray-900">{claimNumber || '—'}</span>
          </div>
          <div>
            <span className="text-gray-500 uppercase block">Denial Age</span>
            <span className="font-medium text-gray-900">
              {denialAge != null ? `${denialAge} Days` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="px-6 border-b border-gray-200">
        <div className="flex gap-6">
          {(['service-lines', 'documents'] as const).map((t) => (
            <button
              key={t}
              className={`py-3 text-sm font-medium border-b-2 -mb-px ${
                contentTab === t
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setContentTab(t)}
            >
              {t === 'service-lines' ? 'Dx, Service Lines & Remits' : 'Documents'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <div className="w-[45%] border-r border-gray-200 overflow-y-auto p-6">
          {loading ? (
            <div className="space-y-3">
              <div className="h-24 bg-gray-100 rounded animate-pulse" />
              <div className="h-32 bg-gray-100 rounded animate-pulse" />
            </div>
          ) : contentTab === 'service-lines' ? (
            <>
              <DenialSummary denial={denial} />
              <ServiceLinesTable lines={mockServiceLines} />
            </>
          ) : (
            <MockDocumentsTab claim={claim} denial={denial} />
          )}
        </div>

        {/* Right Panel */}
        <div className="flex-1 overflow-y-auto p-6">
          <AutomatedAnalysis
            ruleResults={ruleResults}
            actionPlan={actionPlan}
            loading={loading || (ruleResults === null && !loading)}
            onViewCoverLetter={() => setShowCoverLetter(true)}
            onDocClick={(docName) => setViewingDoc(docName)}
          />
        </div>
      </div>

      {/* Cover Letter Modal */}
      {showCoverLetter && (
        <CoverLetterModal
          claim={claim}
          denial={denial}
          actionPlan={actionPlan}
          onClose={() => setShowCoverLetter(false)}
        />
      )}

      {/* Document Viewer Popup */}
      {viewingDoc && (
        <DocViewerPopup
          docName={viewingDoc}
          claim={claim}
          denial={denial}
          onClose={() => setViewingDoc(null)}
        />
      )}

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          Go Back
        </Button>
        <div className="flex items-center gap-3">
          {currentDenialStage && (
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              currentDenialStage === 'RESOLVED'
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {currentDenialStage === 'RESOLVED' ? 'Resolved' : 'Reviewed'}
            </span>
          )}
          <Button
            variant="outline"
            className="border-yellow-400 text-yellow-700 hover:bg-yellow-50"
            disabled={saving !== null || currentDenialStage === 'REVIEWED' || currentDenialStage === 'RESOLVED'}
            onClick={() => handleSetDenialStage('REVIEWED')}
          >
            {saving === 'REVIEWED' ? 'Saving…' : 'Mark as Reviewed'}
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={saving !== null || currentDenialStage === 'RESOLVED'}
            onClick={() => handleSetDenialStage('RESOLVED')}
          >
            {saving === 'RESOLVED' ? 'Saving…' : 'Mark as Resolved'}
          </Button>
        </div>
      </div>
    </div>
  )
}

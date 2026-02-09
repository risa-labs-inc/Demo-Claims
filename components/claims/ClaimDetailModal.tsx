'use client'

import { useState } from 'react'
import { Copy, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from './StatusBadge'
import { MarkCompleteModal } from './MarkCompleteModal'
import { ClaimWithAssignee, Stage, ClaimStatus } from '@/lib/types'
import { formatDate, formatCurrency } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

interface ClaimDetailModalProps {
  claim: ClaimWithAssignee
  onClose: () => void
  onUpdate: () => void
}

interface AddClaimDetailsModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: ClaimDetailsFormData) => void
  isSecondary?: boolean
}

interface ClaimDetailsFormData {
  claimReceivedDate: string
  claimNumber: string
  claimStatus: string
  paymentDate: string
  paidAmount: string
  checkDate: string
  checkNumber: string
  denialCodes: string
  deniedLineItems: string
  denialDescription: string
  remarks: string
}

function AddClaimDetailsModal({ open, onClose, onSave, isSecondary }: AddClaimDetailsModalProps) {
  const [formData, setFormData] = useState<ClaimDetailsFormData>({
    claimReceivedDate: '',
    claimNumber: '',
    claimStatus: 'PENDING',
    paymentDate: '',
    paidAmount: '',
    checkDate: '',
    checkNumber: '',
    denialCodes: '',
    deniedLineItems: '',
    denialDescription: '',
    remarks: '',
  })

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
    onClose()
  }

  const handleChange = (field: keyof ClaimDetailsFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[60]" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-[70] w-[680px] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Add Claim Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Received Date</label>
              <div className="flex gap-1">
                <input
                  type="text"
                  placeholder="MM"
                  className="w-14 px-2 py-2 border border-gray-300 rounded text-sm"
                  maxLength={2}
                  value={formData.claimReceivedDate.split('/')[0] || ''}
                  onChange={(e) => {
                    const parts = formData.claimReceivedDate.split('/')
                    parts[0] = e.target.value
                    handleChange('claimReceivedDate', parts.join('/'))
                  }}
                />
                <input
                  type="text"
                  placeholder="DD"
                  className="w-14 px-2 py-2 border border-gray-300 rounded text-sm"
                  maxLength={2}
                  value={formData.claimReceivedDate.split('/')[1] || ''}
                  onChange={(e) => {
                    const parts = formData.claimReceivedDate.split('/')
                    parts[1] = e.target.value
                    handleChange('claimReceivedDate', parts.join('/'))
                  }}
                />
                <input
                  type="text"
                  placeholder="YYYY"
                  className="w-16 px-2 py-2 border border-gray-300 rounded text-sm"
                  maxLength={4}
                  value={formData.claimReceivedDate.split('/')[2] || ''}
                  onChange={(e) => {
                    const parts = formData.claimReceivedDate.split('/')
                    parts[2] = e.target.value
                    handleChange('claimReceivedDate', parts.join('/'))
                  }}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Claim Number</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                value={formData.claimNumber}
                onChange={(e) => handleChange('claimNumber', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Claim Status</label>
              <select
                className="w-full px-3 py-2 border border-red-300 rounded text-sm text-red-600"
                value={formData.claimStatus}
                onChange={(e) => handleChange('claimStatus', e.target.value)}
              >
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="DENIED">Denied</option>
                <option value="PARTIALLY_PAID">Partially Paid</option>
                <option value="IN_PROCESS">In Process</option>
                <option value="NOT_ON_FILE">Not on File</option>
                <option value="PATIENT_NOT_FOUND">Patient Not Found</option>
                <option value="NO_PORTAL_ACCESS">No Portal Access</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
              <div className="flex gap-1">
                <input
                  type="text"
                  placeholder="MM"
                  className="w-10 px-1 py-2 border border-gray-300 rounded text-sm"
                  maxLength={2}
                />
                <input
                  type="text"
                  placeholder="DD"
                  className="w-10 px-1 py-2 border border-gray-300 rounded text-sm"
                  maxLength={2}
                />
                <input
                  type="text"
                  placeholder="YYYY"
                  className="w-14 px-1 py-2 border border-gray-300 rounded text-sm"
                  maxLength={4}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Paid Amount</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                value={formData.paidAmount}
                onChange={(e) => handleChange('paidAmount', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Check Date</label>
              <div className="flex gap-1">
                <input
                  type="text"
                  placeholder="MM"
                  className="w-10 px-1 py-2 border border-gray-300 rounded text-sm"
                  maxLength={2}
                />
                <input
                  type="text"
                  placeholder="DD"
                  className="w-10 px-1 py-2 border border-gray-300 rounded text-sm"
                  maxLength={2}
                />
                <input
                  type="text"
                  placeholder="YYYY"
                  className="w-14 px-1 py-2 border border-gray-300 rounded text-sm"
                  maxLength={4}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Check Number</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                value={formData.checkNumber}
                onChange={(e) => handleChange('checkNumber', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Denial Codes</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                value={formData.denialCodes}
                onChange={(e) => handleChange('denialCodes', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Denied Line Items</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                value={formData.deniedLineItems}
                onChange={(e) => handleChange('deniedLineItems', e.target.value)}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Denial Description</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              value={formData.denialDescription}
              onChange={(e) => handleChange('denialDescription', e.target.value)}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              rows={3}
              value={formData.remarks}
              onChange={(e) => handleChange('remarks', e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" className="bg-gray-900 hover:bg-gray-800 text-white px-8">
              Save
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}

export function ClaimDetailModal({ claim, onClose, onUpdate }: ClaimDetailModalProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<'primary' | 'secondary'>('primary')
  const [showMarkComplete, setShowMarkComplete] = useState(false)
  const [showAddClaimDetails, setShowAddClaimDetails] = useState(false)
  const [templateCopied, setTemplateCopied] = useState(false)

  // Determine if we have claim details for the current tab
  const hasClaimDetails = activeTab === 'primary'
    ? Boolean(claim.claimNumber || claim.checkNumber || claim.paidAmount || claim.denialCodes)
    : Boolean(claim.secondaryClaimNumber || claim.secondaryCheckNumber || claim.secondaryPaidAmount || claim.secondaryDenialCodes)

  // Get the appropriate data based on active tab
  const getClaimData = () => {
    if (activeTab === 'primary') {
      return {
        claimNumber: claim.claimNumber,
        claimReceivedDate: claim.claimReceivedDate,
        claimStatus: claim.claimStatus,
        checkNumber: claim.checkNumber,
        checkDate: claim.checkDate,
        paidAmount: claim.paidAmount,
        paymentDate: claim.paymentDate,
        denialCodes: claim.denialCodes,
        deniedLineItems: claim.deniedLineItems,
        denialDescription: claim.denialDescription,
        plan: claim.primaryInsurance,
        memberId: claim.primaryMemberId,
      }
    }
    return {
      claimNumber: claim.secondaryClaimNumber,
      claimReceivedDate: claim.secondaryClaimReceivedDate,
      claimStatus: claim.secondaryClaimStatus || 'PENDING',
      checkNumber: claim.secondaryCheckNumber,
      checkDate: claim.secondaryCheckDate,
      paidAmount: claim.secondaryPaidAmount,
      paymentDate: claim.secondaryPaymentDate,
      denialCodes: claim.secondaryDenialCodes,
      deniedLineItems: claim.secondaryDeniedLineItems,
      denialDescription: claim.secondaryDenialDescription,
      plan: claim.secondaryInsurance,
      memberId: claim.secondaryMemberId,
    }
  }

  const currentData = getClaimData()

  const generateTemplate = () => {
    const status = currentData.claimStatus || 'Unknown'
    const dos = formatDate(claim.dateOfService)
    const plan = currentData.plan
    const dcr = currentData.claimReceivedDate ? formatDate(currentData.claimReceivedDate) : ''
    const cn = currentData.claimNumber || ''
    const denialCodes = currentData.denialCodes || ''
    const denialDesc = currentData.denialDescription || ''
    const paidAmount = currentData.paidAmount ? `$${currentData.paidAmount}` : ''
    const checkNumber = currentData.checkNumber || ''
    const checkDate = currentData.checkDate ? formatDate(currentData.checkDate) : ''
    const lineItems = currentData.deniedLineItems || ''

    return `(${status}) RISA:_ DC: ${dos}_ PN: ${plan}_ DCR: ${dcr}_ CN:${cn}_ DC/RM: ${denialCodes}_ DCD: ${denialDesc}_ PA: ${paidAmount}_ CKN:${checkNumber} _ CKD: ${checkDate}_ LI: ${lineItems}`
  }

  const copyTemplate = async () => {
    try {
      await navigator.clipboard.writeText(generateTemplate())
      setTemplateCopied(true)
      toast({
        title: 'Template copied!',
        variant: 'success',
      })
      setTimeout(() => setTemplateCopied(false), 2000)
    } catch {
      toast({
        title: 'Failed to copy',
        variant: 'destructive',
      })
    }
  }

  const handleMarkComplete = async (stage: Stage) => {
    const response = await fetch(`/api/claims/${claim.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage }),
    })

    if (!response.ok) {
      throw new Error('Failed to update stage')
    }

    toast({
      title: 'Stage updated',
      description: `Claim marked as ${stage.toLowerCase().replace('_', ' ')}`,
      variant: 'success',
    })

    onUpdate()
  }

  const handleSaveClaimDetails = async (data: ClaimDetailsFormData) => {
    const prefix = activeTab === 'secondary' ? 'secondary' : ''

    const updateData: Record<string, any> = {}
    if (data.claimNumber) updateData[prefix ? 'secondaryClaimNumber' : 'claimNumber'] = data.claimNumber
    if (data.claimStatus) updateData[prefix ? 'secondaryClaimStatus' : 'claimStatus'] = data.claimStatus
    if (data.checkNumber) updateData[prefix ? 'secondaryCheckNumber' : 'checkNumber'] = data.checkNumber
    if (data.paidAmount) updateData[prefix ? 'secondaryPaidAmount' : 'paidAmount'] = parseFloat(data.paidAmount)
    if (data.denialCodes) updateData[prefix ? 'secondaryDenialCodes' : 'denialCodes'] = data.denialCodes
    if (data.deniedLineItems) updateData[prefix ? 'secondaryDeniedLineItems' : 'deniedLineItems'] = data.deniedLineItems
    if (data.denialDescription) updateData[prefix ? 'secondaryDenialDescription' : 'denialDescription'] = data.denialDescription
    if (data.remarks) updateData[prefix ? 'secondaryRemarks' : 'remarks'] = data.remarks

    try {
      const response = await fetch(`/api/claims/${claim.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        throw new Error('Failed to save claim details')
      }

      toast({
        title: 'Claim details saved',
        variant: 'success',
      })

      onUpdate()
    } catch {
      toast({
        title: 'Failed to save',
        variant: 'destructive',
      })
    }
  }

  const handleValidate = () => {
    toast({
      title: 'Validate',
      description: 'Opening validation workflow...',
    })
  }

  const handleReportInaccuracy = () => {
    toast({
      title: 'Report Inaccuracy',
      description: 'Opening inaccuracy report...',
    })
  }

  // Related claims in sidebar
  const relatedClaims = [
    {
      id: claim.id,
      claimNumber: activeTab === 'primary' ? (claim.claimNumber || claim.claimId) : (claim.secondaryClaimNumber || claim.claimId),
      amount: claim.chargeAmount,
      status: activeTab === 'primary' ? claim.claimStatus : (claim.secondaryClaimStatus || 'PENDING')
    },
  ]

  return (
    <div className="flex-1 flex flex-col h-screen bg-white">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {claim.patientFirstName} {claim.patientLastName}{' '}
            <span className="font-normal text-gray-500">({claim.mrn})</span>
          </h2>
        </div>

        {/* Tabs */}
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
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-6 gap-6">
            <div>
              <span className="text-xs text-gray-500 uppercase">DOB</span>
              <p className="text-sm font-medium">{formatDate(claim.dateOfBirth)}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase">Plan</span>
              <p className="text-sm font-medium">{currentData.plan}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase">Member ID</span>
              <p className="text-sm font-medium">{currentData.memberId}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase">Provider</span>
              <p className="text-sm font-medium">
                MD {claim.providerFirstName.replace('Dr. ', '')} {claim.providerLastName}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase">Provider NPI</span>
              <p className="text-sm font-medium">{claim.providerNpi}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase">DOS</span>
              <p className="text-sm font-medium">{formatDate(claim.dateOfService)}</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Claim Items */}
          <div className="w-72 border-r border-gray-200 overflow-y-auto bg-gray-50">
            {hasClaimDetails ? (
              relatedClaims.map((relatedClaim, index) => (
                <div
                  key={relatedClaim.id}
                  className={`p-4 border-b border-gray-200 cursor-pointer ${
                    index === 0
                      ? 'bg-white border-l-4 border-l-blue-600'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-gray-900">{relatedClaim.claimNumber}</p>
                      <p className="text-sm text-gray-500">{formatCurrency(Number(relatedClaim.amount))}</p>
                    </div>
                    <StatusBadge status={relatedClaim.status as ClaimStatus} />
                  </div>
                </div>
              ))
            ) : null}

            {/* Add Claim Details Button */}
            <div className="p-4">
              <Button
                className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                onClick={() => setShowAddClaimDetails(true)}
              >
                Add Claim Details
              </Button>
            </div>
          </div>

          {/* Right Content - Claim Details */}
          <div className="flex-1 overflow-y-auto p-6">
            {hasClaimDetails ? (
              <>
                {/* Claim Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">
                      Claim No: {currentData.claimNumber || claim.claimId}
                    </h3>
                    {currentData.claimReceivedDate && (
                      <span className="text-gray-500">({formatDate(currentData.claimReceivedDate)})</span>
                    )}
                    <StatusBadge status={currentData.claimStatus as ClaimStatus} />
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      onClick={handleValidate}
                    >
                      Validate
                    </button>
                    <button
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                      onClick={handleReportInaccuracy}
                    >
                      Report Inaccuracy
                    </button>
                  </div>
                </div>

                {/* Dashed Separator */}
                <div className="border-t border-dashed border-gray-300 my-6" />

                {/* Payment Details */}
                {(currentData.checkNumber || currentData.paidAmount) && (
                  <>
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-4">Payment Details</h4>
                      <div className="grid grid-cols-4 gap-6">
                        <div>
                          <span className="text-xs text-gray-500 uppercase">Check Number</span>
                          <p className="text-sm font-medium">{currentData.checkNumber || '-'}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 uppercase">Check Date</span>
                          <p className="text-sm font-medium">{currentData.checkDate ? formatDate(currentData.checkDate) : '-'}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 uppercase">Paid Amount</span>
                          <p className="text-sm font-medium">{currentData.paidAmount ? formatCurrency(Number(currentData.paidAmount)) : '-'}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 uppercase">Payment Date</span>
                          <p className="text-sm font-medium">{currentData.paymentDate ? formatDate(currentData.paymentDate) : '-'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Dashed Separator */}
                    <div className="border-t border-dashed border-gray-300 my-6" />
                  </>
                )}

                {/* Denial Details */}
                {(currentData.denialCodes || currentData.denialDescription) && (
                  <>
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-4">Denial Details</h4>
                      <div className="grid grid-cols-2 gap-6 mb-4">
                        <div>
                          <span className="text-xs text-gray-500 uppercase">Denial Code</span>
                          <p className="text-sm font-medium">{currentData.denialCodes || '-'}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 uppercase">Denial Line Items</span>
                          <p className="text-sm font-medium">{currentData.deniedLineItems || '-'}</p>
                        </div>
                      </div>
                      {currentData.denialDescription && (
                        <div>
                          <span className="text-xs text-gray-500 uppercase">Denial Description</span>
                          <div className="mt-1 p-3 bg-gray-100 rounded-md">
                            <p className="text-sm">{currentData.denialDescription}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Dashed Separator */}
                    <div className="border-t border-dashed border-gray-300 my-6" />
                  </>
                )}

                {/* Template */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="font-semibold text-gray-900">Template</h4>
                    <button
                      onClick={copyTemplate}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      {templateCopied ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  <div className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap break-all">
                      {generateTemplate()}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              /* No Details Found */
              <div className="flex-1 flex items-center justify-center h-full">
                <p className="text-gray-500 text-lg">No Details Found</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Go Back
          </Button>
          <Button
            className="bg-gray-900 hover:bg-gray-800 text-white"
            onClick={() => setShowMarkComplete(true)}
          >
            Mark as Completed
          </Button>
        </div>

        {/* Mark Complete Modal */}
        <MarkCompleteModal
          open={showMarkComplete}
          onClose={() => setShowMarkComplete(false)}
          onMarkComplete={handleMarkComplete}
          currentStage={claim.stage}
        />

        {/* Add Claim Details Modal */}
        <AddClaimDetailsModal
          open={showAddClaimDetails}
          onClose={() => setShowAddClaimDetails(false)}
          onSave={handleSaveClaimDetails}
          isSecondary={activeTab === 'secondary'}
        />
      </div>
  )
}

'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ClaimStatus } from '@/lib/types'

interface AddClaimDetailsModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: ClaimDetailsData) => Promise<void>
  claimId: string
}

export interface ClaimDetailsData {
  claimNumber: string
  claimReceivedDate: string
  claimStatus: ClaimStatus
  checkNumber?: string
  checkDate?: string
  paidAmount?: string
  paymentDate?: string
  denialCodes?: string
  deniedLineItems?: string
  denialDescription?: string
  remarks?: string
}

export function AddClaimDetailsModal({
  open,
  onClose,
  onSave,
  claimId,
}: AddClaimDetailsModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ClaimDetailsData>({
    claimNumber: '',
    claimReceivedDate: '',
    claimStatus: 'IN_PROCESS',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave(formData)
      onClose()
      setFormData({
        claimNumber: '',
        claimReceivedDate: '',
        claimStatus: 'IN_PROCESS',
      })
    } finally {
      setLoading(false)
    }
  }

  const showPaymentFields = formData.claimStatus === 'PAID' || formData.claimStatus === 'PARTIALLY_PAID'
  const showDenialFields = formData.claimStatus === 'DENIED' || formData.claimStatus === 'PARTIALLY_PAID'

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Claim Details</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="claimNumber">Claim Number</Label>
              <Input
                id="claimNumber"
                value={formData.claimNumber}
                onChange={(e) =>
                  setFormData({ ...formData, claimNumber: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="claimReceivedDate">Claim Received Date</Label>
              <Input
                id="claimReceivedDate"
                type="date"
                value={formData.claimReceivedDate}
                onChange={(e) =>
                  setFormData({ ...formData, claimReceivedDate: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="claimStatus">Claim Status</Label>
            <Select
              value={formData.claimStatus}
              onValueChange={(v) =>
                setFormData({ ...formData, claimStatus: v as ClaimStatus })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="DENIED">Denied</SelectItem>
                <SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
                <SelectItem value="IN_PROCESS">In Process</SelectItem>
                <SelectItem value="NOT_ON_FILE">Not on File</SelectItem>
                <SelectItem value="PATIENT_NOT_FOUND">Patient Not Found</SelectItem>
                <SelectItem value="NO_PORTAL_ACCESS">No Portal Access</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {showPaymentFields && (
            <>
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Payment Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="checkNumber">Check Number</Label>
                    <Input
                      id="checkNumber"
                      value={formData.checkNumber || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, checkNumber: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="checkDate">Check Date</Label>
                    <Input
                      id="checkDate"
                      type="date"
                      value={formData.checkDate || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, checkDate: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paidAmount">Paid Amount</Label>
                    <Input
                      id="paidAmount"
                      type="number"
                      step="0.01"
                      value={formData.paidAmount || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, paidAmount: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentDate">Payment Date</Label>
                    <Input
                      id="paymentDate"
                      type="date"
                      value={formData.paymentDate || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, paymentDate: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {showDenialFields && (
            <>
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Denial Details</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="denialCodes">Denial Codes</Label>
                    <Input
                      id="denialCodes"
                      value={formData.denialCodes || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, denialCodes: e.target.value })
                      }
                      placeholder="e.g., CO-4, PR-1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deniedLineItems">Denied Line Items</Label>
                    <Input
                      id="deniedLineItems"
                      value={formData.deniedLineItems || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, deniedLineItems: e.target.value })
                      }
                      placeholder="e.g., 1, 2, 3"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="denialDescription">Denial Description</Label>
                    <Textarea
                      id="denialDescription"
                      value={formData.denialDescription || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, denialDescription: e.target.value })
                      }
                      placeholder="Enter denial description..."
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              value={formData.remarks || ''}
              onChange={(e) =>
                setFormData({ ...formData, remarks: e.target.value })
              }
              placeholder="Enter any additional remarks..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Details'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

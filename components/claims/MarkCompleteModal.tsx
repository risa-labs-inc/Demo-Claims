'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Stage } from '@/lib/types'

interface MarkCompleteModalProps {
  open: boolean
  onClose: () => void
  onMarkComplete: (stage: Stage) => Promise<void>
  currentStage: Stage
}

export function MarkCompleteModal({
  open,
  onClose,
  onMarkComplete,
  currentStage,
}: MarkCompleteModalProps) {
  const [validated, setValidated] = useState(false)
  const [pastedTemplate, setPastedTemplate] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!open) return null

  const handleMarkAsValidated = async () => {
    setLoading(true)
    try {
      await onMarkComplete('VALIDATED')
      onClose()
      resetState()
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsProcessed = async () => {
    setLoading(true)
    try {
      await onMarkComplete('PROCESSED')
      onClose()
      resetState()
    } finally {
      setLoading(false)
    }
  }

  const resetState = () => {
    setValidated(false)
    setPastedTemplate(false)
  }

  const handleClose = () => {
    onClose()
    resetState()
  }

  const canMarkValidated = validated
  const canMarkProcessed = validated && pastedTemplate

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-[60]" onClick={handleClose} />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Mark as completed</h3>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-md"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <p className="text-sm text-gray-600 mb-6">
            Please select the following to mark the claim as processed
          </p>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="validated"
                checked={validated}
                onCheckedChange={(checked) => setValidated(checked === true)}
                className="mt-0.5"
              />
              <Label htmlFor="validated" className="text-sm text-gray-700 cursor-pointer">
                Have you validated the Claim from Payer Portal?
              </Label>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="pastedTemplate"
                checked={pastedTemplate}
                onCheckedChange={(checked) => setPastedTemplate(checked === true)}
                className="mt-0.5"
              />
              <Label htmlFor="pastedTemplate" className="text-sm text-gray-700 cursor-pointer">
                Have you pasted the Claim Template on PMS?
              </Label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleMarkAsValidated}
            disabled={!canMarkValidated || loading}
          >
            Mark as Validated
          </Button>
          <Button
            className="bg-gray-900 hover:bg-gray-800 text-white"
            onClick={handleMarkAsProcessed}
            disabled={!canMarkProcessed || loading}
          >
            Mark as Processed
          </Button>
        </div>
      </div>
    </>
  )
}

import { ClaimStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: ClaimStatus | null
}

const statusConfig: Record<ClaimStatus, { label: string; className: string }> = {
  PAID: {
    label: 'Paid',
    className: 'bg-white text-green-700 border-green-500',
  },
  DENIED: {
    label: 'Denied',
    className: 'bg-white text-gray-700 border-gray-300',
  },
  PARTIALLY_PAID: {
    label: 'Partially Paid',
    className: 'bg-yellow-50 text-yellow-700 border-yellow-300',
  },
  IN_PROCESS: {
    label: 'In Process',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  NOT_ON_FILE: {
    label: 'Not on File',
    className: 'bg-gray-100 text-gray-700 border-gray-200',
  },
  PATIENT_NOT_FOUND: {
    label: 'Patient Not Found',
    className: 'bg-yellow-50 text-yellow-700 border-yellow-300',
  },
  NO_PORTAL_ACCESS: {
    label: 'No Portal Access',
    className: 'bg-gray-100 text-gray-600 border-gray-200',
  },
  PENDING: {
    label: 'Pending',
    className: 'bg-red-100 text-red-700 border-red-200',
  },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  if (!status) return <span className="text-gray-400">-</span>

  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-700 border-gray-200' }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border whitespace-nowrap',
        config.className
      )}
    >
      {config.label}
    </span>
  )
}

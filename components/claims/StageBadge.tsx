import { Stage } from '@/lib/types'
import { cn } from '@/lib/utils'

interface StageBadgeProps {
  stage: Stage
}

const stageConfig: Record<Stage, { label: string; className: string }> = {
  PENDING: {
    label: 'Pending',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  PENDING_VALIDATION: {
    label: 'Pending Validation',
    className: 'bg-orange-100 text-orange-700 border-orange-200',
  },
  VALIDATED: {
    label: 'Validated',
    className: 'bg-green-50 text-green-700 border-green-500',
  },
  PROCESSED: {
    label: 'Processed',
    className: 'bg-green-100 text-green-700 border-green-200',
  },
}

export function StageBadge({ stage }: StageBadgeProps) {
  const config = stageConfig[stage] || { label: stage, className: 'bg-gray-100 text-gray-700' }

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

'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Stage } from '@/lib/types'

interface StageFilterProps {
  value: Stage | 'ALL'
  onChange: (value: Stage | 'ALL') => void
}

export function StageFilter({ value, onChange }: StageFilterProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as Stage | 'ALL')}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Filter by stage" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">All Stages</SelectItem>
        <SelectItem value="PENDING">Pending</SelectItem>
        <SelectItem value="PENDING_VALIDATION">Pending Validation</SelectItem>
        <SelectItem value="VALIDATED">Validated</SelectItem>
        <SelectItem value="PROCESSED">Processed</SelectItem>
      </SelectContent>
    </Select>
  )
}

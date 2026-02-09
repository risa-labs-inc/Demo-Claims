'use client'

import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Provider {
  name: string
  npi: string
}

interface FilterModalProps {
  isOpen: boolean
  onClose: () => void
  onApply: (filters: FilterState) => void
  initialFilters: FilterState
  users: { id: string; name: string }[]
  providers: Provider[]
}

export interface FilterState {
  dateOfService: { from: string; to: string } | null
  primaryPlan: string[]
  provider: string[]
  secondaryPlan: string[]
  stage: string[]
  status: string[]
  assignedTo: string[]
}

const filterCategories = [
  { key: 'dateOfService', label: 'Date of Service' },
  { key: 'primaryPlan', label: 'Primary Plan' },
  { key: 'provider', label: 'Provider' },
  { key: 'secondaryPlan', label: 'Secondary Plan' },
  { key: 'stage', label: 'Stage' },
  { key: 'status', label: 'Status' },
  { key: 'assignedTo', label: 'Assigned to' },
] as const

const primaryPlanOptions = [
  'Blue Cross Blue Shield',
  'United Healthcare',
  'Aetna',
  'Cigna',
  'Medicare',
  'Medicaid',
]

const stageOptions = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'PENDING_VALIDATION', label: 'Pending Validation' },
  { value: 'VALIDATED', label: 'Validated' },
  { value: 'PROCESSED', label: 'Processed' },
]

const statusOptions = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'PAID', label: 'Paid' },
  { value: 'DENIED', label: 'Denied' },
  { value: 'PARTIALLY_PAID', label: 'Partially Paid' },
  { value: 'IN_PROCESS', label: 'In Process' },
  { value: 'NOT_ON_FILE', label: 'Not on File' },
]

export function FilterModal({ isOpen, onClose, onApply, initialFilters, users, providers }: FilterModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('dateOfService')
  const [filters, setFilters] = useState<FilterState>(initialFilters)
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [selectingDate, setSelectingDate] = useState<'from' | 'to' | null>(null)

  useEffect(() => {
    if (isOpen) {
      setFilters(initialFilters)
    }
  }, [isOpen, initialFilters])

  if (!isOpen) return null

  const handleClearSelection = () => {
    if (selectedCategory === 'dateOfService') {
      setFilters(prev => ({ ...prev, dateOfService: null }))
    } else {
      setFilters(prev => ({ ...prev, [selectedCategory]: [] }))
    }
  }

  const handleClearAll = () => {
    setFilters({
      dateOfService: null,
      primaryPlan: [],
      provider: [],
      secondaryPlan: [],
      stage: [],
      status: [],
      assignedTo: [],
    })
  }

  const handleToggleOption = (category: string, value: string) => {
    setFilters(prev => {
      const current = prev[category as keyof FilterState] as string[]
      if (current.includes(value)) {
        return { ...prev, [category]: current.filter(v => v !== value) }
      } else {
        return { ...prev, [category]: [...current, value] }
      }
    })
  }

  const handleDateSelect = (day: number) => {
    const date = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day)
    const dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    const isoStr = date.toISOString().split('T')[0] // Store ISO format for API

    if (selectingDate === 'from') {
      setFilters(prev => ({
        ...prev,
        dateOfService: {
          from: isoStr,
          to: prev.dateOfService?.to || '',
          fromDisplay: dateStr,
          toDisplay: prev.dateOfService?.toDisplay || ''
        } as any
      }))
      setSelectingDate('to')
    } else if (selectingDate === 'to') {
      setFilters(prev => ({
        ...prev,
        dateOfService: {
          from: prev.dateOfService?.from || '',
          to: isoStr,
          fromDisplay: (prev.dateOfService as any)?.fromDisplay || '',
          toDisplay: dateStr
        } as any
      }))
      setSelectingDate(null)
    }
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1 // Adjust for Monday start
    return { firstDay: adjustedFirstDay, daysInMonth }
  }

  const { firstDay, daysInMonth } = getDaysInMonth(calendarDate)

  const getActiveFilterCount = () => {
    let count = 0
    if (filters.dateOfService?.from || filters.dateOfService?.to) count++
    if (filters.primaryPlan.length > 0) count++
    if (filters.provider.length > 0) count++
    if (filters.secondaryPlan.length > 0) count++
    if (filters.stage.length > 0) count++
    if (filters.status.length > 0) count++
    if (filters.assignedTo.length > 0) count++
    return count
  }

  const renderFilterContent = () => {
    switch (selectedCategory) {
      case 'dateOfService':
        return (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Date of Service</h3>
              <button
                onClick={handleClearSelection}
                className="text-sm text-red-500 hover:text-red-600"
              >
                Clear Selection
              </button>
            </div>

            <div className="flex gap-4 mb-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">From</label>
                <button
                  onClick={() => setSelectingDate('from')}
                  className={cn(
                    "px-3 py-2 border rounded-md text-sm w-32 text-left",
                    selectingDate === 'from' ? 'border-gray-900' : 'border-gray-300'
                  )}
                >
                  {(filters.dateOfService as any)?.fromDisplay || filters.dateOfService?.from || 'Select date'}
                </button>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">To</label>
                <button
                  onClick={() => setSelectingDate('to')}
                  className={cn(
                    "px-3 py-2 border rounded-md text-sm w-32 text-left",
                    selectingDate === 'to' ? 'border-gray-900' : 'border-gray-300'
                  )}
                >
                  {(filters.dateOfService as any)?.toDisplay || filters.dateOfService?.to || 'Select date'}
                </button>
              </div>
            </div>

            {/* Calendar */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1))}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="font-medium">
                  {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1))}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(day => (
                  <div key={day} className="py-1 text-gray-500 font-medium">{day}</div>
                ))}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const isToday = new Date().getDate() === day &&
                    new Date().getMonth() === calendarDate.getMonth() &&
                    new Date().getFullYear() === calendarDate.getFullYear()

                  return (
                    <button
                      key={day}
                      onClick={() => handleDateSelect(day)}
                      className={cn(
                        "py-1.5 rounded-full text-sm hover:bg-gray-100",
                        isToday && "bg-gray-900 text-white hover:bg-gray-800"
                      )}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )

      case 'primaryPlan':
      case 'secondaryPlan':
        return (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">
                {selectedCategory === 'primaryPlan' ? 'Primary Plan' : 'Secondary Plan'}
              </h3>
              <button
                onClick={handleClearSelection}
                className="text-sm text-red-500 hover:text-red-600"
              >
                Clear Selection
              </button>
            </div>
            <div className="space-y-2">
              {primaryPlanOptions.map(plan => (
                <label key={plan} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(filters[selectedCategory as keyof FilterState] as string[]).includes(plan)}
                    onChange={() => handleToggleOption(selectedCategory, plan)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{plan}</span>
                </label>
              ))}
            </div>
          </div>
        )

      case 'stage':
        return (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Stage</h3>
              <button
                onClick={handleClearSelection}
                className="text-sm text-red-500 hover:text-red-600"
              >
                Clear Selection
              </button>
            </div>
            <div className="space-y-2">
              {stageOptions.map(option => (
                <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.stage.includes(option.value)}
                    onChange={() => handleToggleOption('stage', option.value)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        )

      case 'status':
        return (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Status</h3>
              <button
                onClick={handleClearSelection}
                className="text-sm text-red-500 hover:text-red-600"
              >
                Clear Selection
              </button>
            </div>
            <div className="space-y-2">
              {statusOptions.map(option => (
                <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.status.includes(option.value)}
                    onChange={() => handleToggleOption('status', option.value)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        )

      case 'assignedTo':
        return (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Assigned to</h3>
              <button
                onClick={handleClearSelection}
                className="text-sm text-red-500 hover:text-red-600"
              >
                Clear Selection
              </button>
            </div>
            <div className="space-y-2">
              {users.map(user => (
                <label key={user.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.assignedTo.includes(user.name)}
                    onChange={() => handleToggleOption('assignedTo', user.name)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{user.name}</span>
                </label>
              ))}
            </div>
          </div>
        )

      case 'provider':
        return (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Provider</h3>
              <button
                onClick={handleClearSelection}
                className="text-sm text-red-500 hover:text-red-600"
              >
                Clear Selection
              </button>
            </div>
            <div className="space-y-2 max-h-64 overflow-auto">
              {providers.map(provider => (
                <label key={provider.npi} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.provider.includes(provider.npi)}
                    onChange={() => handleToggleOption('provider', provider.npi)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{provider.name}</span>
                </label>
              ))}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-[600px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Filters</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left sidebar - Categories */}
          <div className="w-48 border-r bg-gray-50 py-2">
            <div className="px-4 py-2 text-xs text-gray-500 uppercase font-medium">Filter By:</div>
            {filterCategories.map(category => (
              <button
                key={category.key}
                onClick={() => setSelectedCategory(category.key)}
                className={cn(
                  "w-full px-4 py-2.5 text-left text-sm flex items-center justify-between hover:bg-gray-100",
                  selectedCategory === category.key && "bg-white font-medium"
                )}
              >
                {category.label}
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </button>
            ))}
          </div>

          {/* Right content - Filter options */}
          <div className="flex-1 p-6 overflow-auto">
            {renderFilterContent()}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
          <button
            onClick={handleClearAll}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Clear All
          </button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => onApply(filters)} className="bg-gray-900 hover:bg-gray-800">
              Apply
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

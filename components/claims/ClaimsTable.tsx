'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Filter, RefreshCw, Copy, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { StageBadge } from './StageBadge'
import { StatusBadge } from './StatusBadge'
import { ClaimDetailModal } from './ClaimDetailModal'
import { FilterModal, FilterState } from './FilterModal'
import { ClaimWithAssignee, Stage } from '@/lib/types'
import { formatDate, formatCurrency } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface User {
  id: string
  name: string
  email: string
}

interface Provider {
  name: string
  npi: string
}

interface ClaimsTableProps {
  title: string
  filterByAssignee?: string
  filterByStage?: Stage[]
  filterByClaimStatus?: string[]
  emptyState?: boolean
}

const emptyFilters: FilterState = {
  dateOfService: null,
  primaryPlan: [],
  provider: [],
  secondaryPlan: [],
  stage: [],
  status: [],
  assignedTo: [],
}

export function ClaimsTable({
  title,
  filterByAssignee,
  filterByStage,
  filterByClaimStatus,
  emptyState = false
}: ClaimsTableProps) {
  const { toast } = useToast()
  const [claims, setClaims] = useState<ClaimWithAssignee[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClaim, setSelectedClaim] = useState<ClaimWithAssignee | null>(null)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [filters, setFilters] = useState<FilterState>(emptyFilters)

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

  const fetchClaims = useCallback(async () => {
    if (emptyState) {
      setClaims([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)

      // Combine prop filters with modal filters
      const allStages = [...(filterByStage || []), ...filters.stage]
      const allStatuses = [...(filterByClaimStatus || []), ...filters.status]

      if (allStages.length > 0) params.set('stages', allStages.join(','))
      if (allStatuses.length > 0) params.set('statuses', allStatuses.join(','))
      if (filterByAssignee) params.set('assignee', filterByAssignee)
      if (filters.assignedTo.length > 0) params.set('assignee', filters.assignedTo[0])
      if (filters.primaryPlan.length > 0) params.set('primaryPlan', filters.primaryPlan.join(','))
      if (filters.secondaryPlan.length > 0) params.set('secondaryPlan', filters.secondaryPlan.join(','))
      if (filters.dateOfService?.from) {
        // Parse date like "06 Jul 2023" to ISO format
        const fromDate = new Date(filters.dateOfService.from)
        if (!isNaN(fromDate.getTime())) {
          params.set('dateFrom', fromDate.toISOString())
        }
      }
      if (filters.dateOfService?.to) {
        const toDate = new Date(filters.dateOfService.to)
        if (!isNaN(toDate.getTime())) {
          params.set('dateTo', toDate.toISOString())
        }
      }
      if (filters.provider.length > 0) {
        params.set('providerNpi', filters.provider.join(','))
      }

      const response = await fetch(`/api/claims?${params}`)
      const data = await response.json()
      setClaims(data)
    } catch (error) {
      console.error('Failed to fetch claims:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch claims',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [searchQuery, filters, filterByAssignee, filterByStage, filterByClaimStatus, emptyState, toast])

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/users')
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }, [])

  const fetchProviders = useCallback(async () => {
    try {
      const response = await fetch('/api/providers')
      const data = await response.json()
      setProviders(data)
    } catch (error) {
      console.error('Failed to fetch providers:', error)
    }
  }, [])

  useEffect(() => {
    fetchClaims()
    fetchUsers()
    fetchProviders()
  }, [fetchClaims, fetchUsers, fetchProviders])

  const handleAssign = async (claimId: string, userId: string) => {
    try {
      const response = await fetch(`/api/claims/${claimId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedToId: userId || null }),
      })

      if (!response.ok) throw new Error('Failed to assign')

      toast({
        title: 'Success',
        description: 'Claim assigned successfully',
        variant: 'success',
      })

      fetchClaims()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to assign claim',
        variant: 'destructive',
      })
    }
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)

      const response = await fetch(`/api/claims/export?${params}`)
      const blob = await response.blob()

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `claims-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: 'Export complete',
        description: 'Claims exported successfully',
        variant: 'success',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export claims',
        variant: 'destructive',
      })
    }
  }

  const copyToClipboard = async (text: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: 'Copied!',
        description: 'Copied to clipboard',
        variant: 'success',
        duration: 2000,
      })
    } catch {
      toast({
        title: 'Failed to copy',
        variant: 'destructive',
      })
    }
  }

  const handleApplyFilters = (newFilters: FilterState) => {
    setFilters(newFilters)
    setIsFilterModalOpen(false)
  }

  const activeFilterCount = getActiveFilterCount()

  if (selectedClaim) {
    return (
      <ClaimDetailModal
        claim={selectedClaim}
        onClose={() => setSelectedClaim(null)}
        onUpdate={() => {
          fetchClaims()
          if (selectedClaim) {
            fetch(`/api/claims/${selectedClaim.id}`)
              .then((res) => res.json())
              .then((data) => setSelectedClaim(data))
              .catch(console.error)
          }
        }}
      />
    )
  }

  return (
    <div className="flex-1 flex flex-col h-screen bg-white overflow-hidden">
      {/* Fixed Header */}
      <div className="flex-shrink-0">
        {/* Title */}
        <div className="px-4 py-3 border-b border-gray-200">
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        </div>

        {/* Toolbar */}
        <div className="px-4 py-2 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                placeholder="Search by Patient Name, Member ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-56 h-8 text-xs bg-white border-gray-300"
              />
            </div>

            {/* Filters Button */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs border-gray-300"
              onClick={() => setIsFilterModalOpen(true)}
            >
              <Filter className="h-3.5 w-3.5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-gray-900 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8 border-gray-300" onClick={fetchClaims}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs border-gray-300" onClick={handleExport}>
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Scrollable Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr className="border-b border-gray-200">
              <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Patient Details <ChevronDown className="inline h-2.5 w-2.5 ml-0.5" />
              </th>
              <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                DOB <ChevronDown className="inline h-2.5 w-2.5 ml-0.5" />
              </th>
              <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                DOS <ChevronDown className="inline h-2.5 w-2.5 ml-0.5" />
              </th>
              <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Primary Plan <ChevronDown className="inline h-2.5 w-2.5 ml-0.5" />
              </th>
              <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Claim ID <ChevronDown className="inline h-2.5 w-2.5 ml-0.5" />
              </th>
              <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Provider <ChevronDown className="inline h-2.5 w-2.5 ml-0.5" />
              </th>
              <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Secondary Plan <ChevronDown className="inline h-2.5 w-2.5 ml-0.5" />
              </th>
              <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Charge <ChevronDown className="inline h-2.5 w-2.5 ml-0.5" />
              </th>
              <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Stage <ChevronDown className="inline h-2.5 w-2.5 ml-0.5" />
              </th>
              <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Status <ChevronDown className="inline h-2.5 w-2.5 ml-0.5" />
              </th>
              <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Assigned <ChevronDown className="inline h-2.5 w-2.5 ml-0.5" />
              </th>
              <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan={12} className="px-2 py-6 text-center text-gray-500 text-xs">
                  Loading claims...
                </td>
              </tr>
            ) : claims.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-2 py-6 text-center text-gray-500 text-xs">
                  No claims found
                </td>
              </tr>
            ) : (
              claims.map((claim) => (
                <tr
                  key={claim.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedClaim(claim)}
                >
                  <td className="px-2 py-1.5">
                    <div className="font-medium text-gray-900 text-xs">
                      {claim.patientFirstName} {claim.patientLastName}
                    </div>
                    <div className="text-[10px] text-gray-500">MRN{claim.mrn}</div>
                  </td>
                  <td className="px-2 py-1.5 text-gray-600 whitespace-nowrap text-xs">
                    {formatDate(claim.dateOfBirth)}
                  </td>
                  <td className="px-2 py-1.5 text-gray-600 whitespace-nowrap text-xs">
                    {formatDate(claim.dateOfService)}
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="text-gray-900 text-xs">{claim.primaryInsurance}</div>
                    <div className="text-[10px] text-gray-500">{claim.primaryMemberId}</div>
                  </td>
                  <td className="px-2 py-1.5 text-gray-900 font-medium text-xs">
                    {claim.claimId}
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="text-gray-900 text-xs">
                      Dr. {claim.providerFirstName} {claim.providerLastName}
                    </div>
                    <div className="text-[10px] text-gray-500">ID: {claim.providerNpi}</div>
                  </td>
                  <td className="px-2 py-1.5">
                    {claim.secondaryInsurance ? (
                      <>
                        <div className="text-gray-900 text-xs">{claim.secondaryInsurance}</div>
                        <div className="text-[10px] text-gray-500">{claim.secondaryMemberId}</div>
                      </>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-2 py-1.5 text-gray-900 whitespace-nowrap text-xs">
                    {formatCurrency(Number(claim.chargeAmount))}
                  </td>
                  <td className="px-2 py-1.5">
                    <StageBadge stage={claim.stage} />
                  </td>
                  <td className="px-2 py-1.5">
                    <StatusBadge status={claim.claimStatus} />
                  </td>
                  <td className="px-2 py-1.5" onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={claim.assignedToId || 'unassigned'}
                      onValueChange={(value) => handleAssign(claim.id, value === 'unassigned' ? '' : value)}
                    >
                      <SelectTrigger className="w-32 h-6 text-[10px] border-gray-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned" className="text-xs">Unassigned</SelectItem>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id} className="text-xs">
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-2 py-1.5" onClick={(e) => e.stopPropagation()}>
                    {(claim.stage === 'PROCESSED' || claim.stage === 'VALIDATED') ? (
                      <button
                        className="p-1 hover:bg-gray-100 rounded"
                        onClick={(e) => copyToClipboard(claim.claimId, e)}
                      >
                        <Copy className="h-3.5 w-3.5 text-gray-400" />
                      </button>
                    ) : (
                      <button
                        className="p-1 rounded cursor-not-allowed opacity-30"
                        disabled
                      >
                        <Copy className="h-3.5 w-3.5 text-gray-400" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Filter Modal */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApply={handleApplyFilters}
        initialFilters={filters}
        users={users}
        providers={providers}
      />
    </div>
  )
}

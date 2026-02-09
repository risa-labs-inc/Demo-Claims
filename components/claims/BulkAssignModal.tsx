'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface User {
  id: string
  name: string
  email: string
}

interface BulkAssignModalProps {
  open: boolean
  onClose: () => void
  onAssign: (userId: string) => Promise<void>
  selectedCount: number
}

export function BulkAssignModal({
  open,
  onClose,
  onAssign,
  selectedCount,
}: BulkAssignModalProps) {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      fetch('/api/users')
        .then((res) => res.json())
        .then((data) => setUsers(data))
        .catch(console.error)
    }
  }, [open])

  const handleAssign = async () => {
    if (!selectedUserId) return
    setLoading(true)
    try {
      await onAssign(selectedUserId)
      onClose()
      setSelectedUserId('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Claims</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-gray-600">
            Assign {selectedCount} selected claim{selectedCount > 1 ? 's' : ''} to:
          </p>

          <div className="space-y-2">
            <Label htmlFor="user">Select Annotator</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an annotator" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={!selectedUserId || loading}>
            {loading ? 'Assigning...' : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '@/components/ui/use-toast'

interface CopyableFieldProps {
  value: string
  label?: string
}

export function CopyableField({ value, label }: CopyableFieldProps) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      toast({
        title: 'Copied!',
        description: label ? `${label} copied to clipboard` : 'Copied to clipboard',
        variant: 'success',
        duration: 2000,
      })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({
        title: 'Failed to copy',
        description: 'Please try again',
        variant: 'destructive',
      })
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 text-left"
    >
      <span>{value}</span>
      {copied ? (
        <Check className="h-3 w-3 text-green-600" />
      ) : (
        <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </button>
  )
}

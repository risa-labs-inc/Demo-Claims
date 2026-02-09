'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { isAuthenticated } from '@/lib/client-auth'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  const [isAuthed, setIsAuthed] = useState(false)

  useEffect(() => {
    const authed = isAuthenticated()
    if (!authed) {
      router.replace('/login')
    } else {
      setIsAuthed(true)
    }
    setIsChecking(false)
  }, [router])

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthed) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <main className="flex-1 ml-[256px]">
        {children}
      </main>
    </div>
  )
}

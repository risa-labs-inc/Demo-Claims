'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutList,
  LogOut,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getAuthUser, clearAuthUser } from '@/lib/client-auth'

interface NavItem {
  label: string
  href: string
  badge?: number
}

const worklistItems: NavItem[] = [
  { label: 'All Claims', href: '/' },
  { label: 'My Cases', href: '/my-cases' },
  { label: 'Completed Cases', href: '/completed' },
  { label: 'Marked In-Accuracy', href: '/inaccuracy' },
  { label: 'My Denied Cases', href: '/denied' },
]

export function Sidebar() {
  const pathname = usePathname()
  const user = getAuthUser()

  const handleSignOut = () => {
    clearAuthUser()
    window.location.href = '/login'
  }

  return (
    <aside className="flex h-screen fixed left-0 top-0 z-20">
      {/* Dark Icon Column */}
      <div className="w-20 bg-gray-900 flex flex-col items-center py-4">
        {/* RISA Logo */}
        <div className="mb-8">
          <div className="w-11 h-11 bg-black rounded-lg flex items-center justify-center">
            <img src="/risa-logo.svg" alt="RISA" className="w-10 h-10" />
          </div>
        </div>

        {/* Nav Icons with Labels */}
        <nav className="flex-1 flex flex-col items-center gap-4">
          <Link
            href="/"
            className={cn(
              'flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-colors',
              pathname === '/' || pathname.startsWith('/my-cases') || pathname.startsWith('/completed') || pathname.startsWith('/inaccuracy') || pathname.startsWith('/denied')
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            )}
          >
            <LayoutList className="h-5 w-5" />
            <span className="text-[10px] font-medium">Worklists</span>
          </Link>
        </nav>

        {/* Bottom Icons */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <button
            onClick={handleSignOut}
            className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors"
            title="Sign out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* White Navigation Column */}
      <div className="w-44 bg-white border-r border-gray-200 flex flex-col">
        {/* Header with Logo and Title */}
        <div className="px-3 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-md flex items-center justify-center flex-shrink-0">
              <img src="/risa-logo.svg" alt="RISA" className="w-7 h-7" />
            </div>
            <span className="font-semibold text-gray-900 text-sm leading-tight">RISA Claims Dashboard</span>
          </div>
        </div>

        {/* Worklists Header */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 text-sm">Worklists</span>
            <FileText className="h-4 w-4 text-gray-400" />
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1">
          {worklistItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center justify-between px-4 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-gray-50 text-gray-900 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span className="bg-yellow-400 text-yellow-900 text-xs font-medium px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}

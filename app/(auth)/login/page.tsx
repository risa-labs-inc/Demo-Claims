'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { setAuthUser, isAuthenticated } from '@/lib/client-auth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      router.replace('/')
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Call our own login API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Invalid email or password')
      } else {
        // Store user in localStorage
        setAuthUser({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
        })
        // Navigate to dashboard
        window.location.href = '/'
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-900 items-center justify-center p-12">
        <div className="text-center">
          <div className="w-24 h-24 bg-black rounded-xl flex items-center justify-center mx-auto mb-6">
            <img src="/risa-logo.svg" alt="RISA" className="w-20 h-20" />
          </div>
          <p className="text-gray-400 text-lg">Claims Processing Dashboard</p>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center mx-auto mb-4">
              <img src="/risa-logo.svg" alt="RISA" className="w-14 h-14" />
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Sign in</h2>
          <p className="text-gray-600 mb-8">Enter your credentials to access the dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-gray-900 hover:bg-gray-800"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 font-medium mb-2">Demo Credentials</p>
            <div className="text-sm text-gray-500 space-y-1">
              <p><span className="font-mono">john@risalabs.ai</span></p>
              <p><span className="font-mono">risa@2026</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

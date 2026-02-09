'use client'

const AUTH_KEY = 'risa-claims-auth'

export interface AuthUser {
  id: string
  name: string
  email: string
}

export function setAuthUser(user: AuthUser): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user))
  }
}

export function getAuthUser(): AuthUser | null {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(AUTH_KEY)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return null
      }
    }
  }
  return null
}

export function clearAuthUser(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_KEY)
  }
}

export function isAuthenticated(): boolean {
  return getAuthUser() !== null
}

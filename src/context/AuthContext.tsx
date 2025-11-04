/**
 * AuthContext.tsx
 * Lightweight client-side auth using localStorage.
 * Identifies admin by email: adi.halicki@gmail.com
 */

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

/** Represents a logged-in user. */
export interface User {
  email: string
  name?: string
  isAdmin?: boolean
}

/** Context shape for auth. */
interface AuthContextValue {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

/** Storage keys for persistence. */
const USER_KEY = 'chronos.user'
const USERS_DB_KEY = 'chronos.users.db'

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

/**
 * AuthProvider wraps the app to provide authentication state and actions.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem(USER_KEY)
    if (raw) {
      setUser(JSON.parse(raw))
    }
  }, [])

  const login = async (email: string, _password: string) => {
    const dbRaw = localStorage.getItem(USERS_DB_KEY)
    const db = dbRaw ? (JSON.parse(dbRaw) as Record<string, { name?: string; password: string }>) : {}
    const record = db[email]
    if (!record) {
      throw new Error('User not found')
    }
    // Password check omitted for demo; do not use in production.
    const u: User = { email, name: record.name, isAdmin: email === 'adi.halicki@gmail.com' }
    localStorage.setItem(USER_KEY, JSON.stringify(u))
    setUser(u)
  }

  const register = async (name: string, email: string, password: string) => {
    const dbRaw = localStorage.getItem(USERS_DB_KEY)
    const db = dbRaw ? (JSON.parse(dbRaw) as Record<string, { name?: string; password: string }>) : {}
    if (db[email]) throw new Error('User already exists')
    db[email] = { name, password }
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(db))
    const u: User = { email, name, isAdmin: email === 'adi.halicki@gmail.com' }
    localStorage.setItem(USER_KEY, JSON.stringify(u))
    setUser(u)
  }

  const logout = () => {
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }

  const value = useMemo(() => ({ user, login, register, logout }), [user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/** Hook to use auth. */
export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

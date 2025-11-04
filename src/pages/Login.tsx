/**
 * Login.tsx
 * Simple local login form (demo only). In production, use a real backend auth.
 */

import React, { useState } from 'react'
import Header from '../components/Header'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { Link, useNavigate } from 'react-router'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'

/** Login page. */
const LoginPage: React.FC = () => {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await login(email, password)
      navigate('/chat')
    } catch (err: any) {
      setError(err.message || 'Error')
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50">
      <Header />
      <main className="mx-auto max-w-md px-4 py-10">
        <h1 className="text-2xl font-semibold mb-6">{t('login')}</h1>
        <form onSubmit={onSubmit} className="grid gap-3">
          <Input type="email" placeholder={t('email')!} value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input
            type="password"
            placeholder={t('password')!}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <div className="text-sm text-rose-600">{error}</div>}
          <Button type="submit">{t('login')}</Button>
        </form>
        <p className="text-sm mt-4">
          {t('noAccount')} <Link to="/register" className="underline">{t('goRegister')}</Link>
        </p>
      </main>
    </div>
  )
}

export default LoginPage

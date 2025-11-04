/**
 * Register.tsx
 * Simple local registration form (demo only).
 */

import React, { useState } from 'react'
import Header from '../components/Header'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { Link, useNavigate } from 'react-router'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'

/** Registration page. */
const RegisterPage: React.FC = () => {
  const { t } = useTranslation()
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await register(name, email, password)
      navigate('/chat')
    } catch (err: any) {
      setError(err.message || 'Error')
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50">
      <Header />
      <main className="mx-auto max-w-md px-4 py-10">
        <h1 className="text-2xl font-semibold mb-6">{t('register')}</h1>
        <form onSubmit={onSubmit} className="grid gap-3">
          <Input placeholder={t('name')!} value={name} onChange={(e) => setName(e.target.value)} />
          <Input type="email" placeholder={t('email')!} value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input
            type="password"
            placeholder={t('password')!}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <div className="text-sm text-rose-600">{error}</div>}
          <Button type="submit">{t('register')}</Button>
        </form>
        <p className="text-sm mt-4">
          {t('haveAccount')} <Link to="/login" className="underline">{t('goLogin')}</Link>
        </p>
      </main>
    </div>
  )
}

export default RegisterPage

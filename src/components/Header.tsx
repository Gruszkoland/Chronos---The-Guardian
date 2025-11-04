/**
 * Header.tsx
 * App header with branding, language switch, contact dialog, support dialog, and admin settings icon.
 */

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Mail, Heart, Settings, MessageSquareText, Languages } from 'lucide-react'
import { Link } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Separator } from '../components/ui/separator'

/** Header with interactive actions. */
const Header: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuth()

  const switchLang = () => {
    const next = i18n.language === 'pl' ? 'en' : 'pl'
    i18n.changeLanguage(next)
  }

  return (
    <header className="w-full border-b bg-white/70 dark:bg-neutral-900/70 backdrop-blur supports-[backdrop-filter]:bg-white/50 sticky top-0 z-40">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2">
          <img src="https://pub-cdn.sider.ai/u/U09GHJWRWE/web-coder/6901d0e561d18d6576f5ff8a/resource/72ec3579-d01f-464d-888f-55dba352f9ac.jpg" alt="logo" className="w-9 h-9 rounded object-cover" />
          <div className="flex flex-col leading-tight">
            <span className="text-lg font-semibold">{t('appName')}</span>
            <span className="text-xs text-neutral-500">{i18n.language.toUpperCase()}</span>
          </div>
        </Link>

        <nav className="ml-6 flex-1 flex items-center gap-2">
          <Link to="/chat" className="px-3 py-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-sm">
            {t('chat')}
          </Link>
          <Link to="/forum" className="px-3 py-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-sm">
            {t('forum')}
          </Link>
          <div className="flex-1" />
          <button
            onClick={switchLang}
            className="p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
            aria-label={t('language')}
            title={t('language')}
          >
            <Languages className="w-5 h-5" />
          </button>

          <Dialog>
            <DialogTrigger asChild>
              <button className="p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800" aria-label={t('contact')}>
                <Mail className="w-5 h-5" />
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{t('contact')}</DialogTitle>
              </DialogHeader>
              <div className="text-center py-4">
                <p className="text-sm text-neutral-600 mb-2">Skontaktuj się z nami pod adresem:</p>
                <a 
                  href="mailto:adi.halicki@gmail.com" 
                  className="text-blue-600 hover:text-blue-700 hover:underline text-lg font-medium"
                >
                  adi.halicki@gmail.com
                </a>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <button className="p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800" aria-label={t('support')}>
                <Heart className="w-5 h-5 text-rose-500" />
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{t('support')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <p className="text-sm text-neutral-600">
                  Dziękujemy za wsparcie! Wybierz preferowaną walutę i przejdź do bezpiecznej płatności Stripe.
                </p>
                <Separator />
                <div className="grid gap-2">
                  <a
                    className="inline-flex items-center justify-between rounded border px-3 py-2 hover:bg-neutral-50"
                    href="https://donate.stripe.com/00wfZh3mNckj18xdE6bEA01"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span>{t('donateUSD')}</span>
                    <span className="text-xs text-neutral-500">stripe.com</span>
                  </a>
                  <a
                    className="inline-flex items-center justify-between rounded border px-3 py-2 hover:bg-neutral-50"
                    href="https://donate.stripe.com/aFa5kD3mN6ZZcRfcA2bEA02"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span>{t('donateEUR')}</span>
                    <span className="text-xs text-neutral-500">stripe.com</span>
                  </a>
                  <a
                    className="inline-flex items-center justify-between rounded border px-3 py-2 hover:bg-neutral-50"
                    href="https://donate.stripe.com/14A9ATcXn6ZZ2cB1VobEA00"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span>{t('donatePLN')}</span>
                    <span className="text-xs text-neutral-500">stripe.com</span>
                  </a>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {user?.isAdmin && (
            <Link
              to="/admin"
              className="p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
              aria-label={t('admin')}
              title={t('admin')}
            >
              <Settings className="w-5 h-5" />
            </Link>
          )}

          {user ? (
            <button
              onClick={logout}
              className="ml-2 px-3 py-1.5 rounded bg-neutral-900 text-white text-sm hover:bg-neutral-800"
            >
              {t('logout')}
            </button>
          ) : (
            <Link to="/login" className="ml-2 px-3 py-1.5 rounded bg-neutral-900 text-white text-sm hover:bg-neutral-800">
              {t('login')}
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}

export default Header

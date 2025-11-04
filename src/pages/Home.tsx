/**
 * Home.tsx
 * Dark-themed landing page with a full-bleed background image and readable overlay.
 * Provides clear entrances to Login/Register/Chat with high-contrast CTAs.
 */

import React from 'react'
import '../i18n'
import Header from '../components/Header'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useAuth } from '../context/AuthContext'

/**
 * Home page with visible background image layered under soft, high-contrast overlays.
 * Fix: Use positive z-index ordering to ensure the image is not hidden by the container background.
 */
const HomePage: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()

  /** Background image used across the hero; high-res Andromeda. */
  const heroImage =
    'https://pub-cdn.sider.ai/u/U09GHJWRWE/web-coder/6901d0e561d18d6576f5ff8a/resource/55f4de49-10cb-409f-a1be-22145d8020d0.png'

  return (
    <div className="relative min-h-screen bg-neutral-950 text-neutral-50">
      {/* Background image (z-0) */}
      <img
        src={heroImage}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 z-0 h-full w-full object-cover"
      />
      {/* Overlays for readability (z-10) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(80%_60%_at_50%_30%,rgba(0,0,0,0.20),rgba(0,0,0,0.65))]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-black/30 via-black/50 to-black/70"
      />

      {/* Content (z-20) */}
      <div className="relative z-20">
        <Header />

        <main className="mx-auto max-w-5xl px-4 py-16">
          <section className="max-w-3xl">
            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight drop-shadow-sm">
              {t('appName')}
            </h1>
            <p className="mt-5 text-sm md:text-base leading-7 whitespace-pre-wrap text-neutral-200">
              {t('homeLongDescription')}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              {!user && (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 rounded bg-white text-neutral-900 hover:bg-neutral-200 text-sm font-medium transition-colors"
                  >
                    {t('login')}
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 rounded border border-white/40 text-neutral-50 hover:bg-white/10 text-sm transition-colors"
                  >
                    {t('register')}
                  </Link>
                </>
              )}
              <Link
                to="/chat"
                className="px-4 py-2 rounded bg-white text-neutral-900 hover:bg-neutral-200 text-sm font-medium transition-colors"
              >
                {t('enterSpace')}
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

export default HomePage

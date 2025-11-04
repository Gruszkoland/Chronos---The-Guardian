/**
 * SettingsContext.tsx
 * Stores admin-configurable settings for Gemini: persona, temperature, max tokens, default language,
 * API key, and selected model. Provides persistence in localStorage and a simple updater.
 */

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

/** Gemini settings controlled by admin or adjusted in chat. */
export interface GeminiSettings {
  /** System persona prompt injected as system_instruction. */
  persona: string
  /** Sampling temperature. */
  temperature: number
  /** Max output tokens for the model. */
  maxOutputTokens: number
  /** Default response language hint for the model. */
  defaultResponseLanguage: 'pl' | 'en'
  /** API key for Google Generative Language API (demo only, store on backend in prod). */
  apiKey: string
  /** Selected Gemini model id, e.g. "gemini-2.0-flash-exp". */
  model: string
}

/** Storage key for persistence. */
const SETTINGS_KEY = 'chronos.settings'

/**
 * defaultSettings
 * Creates default settings using i18n strings where appropriate.
 */
const defaultSettings = (t: (k: string) => string): GeminiSettings => ({
  persona: t('chronosPersona'),
  temperature: 0.7,
  maxOutputTokens: 1024,
  defaultResponseLanguage: 'pl',
  // API key is now handled by secure proxy - field kept for compatibility
  apiKey: '',
  // Updated to Gemini 2.0 models
  model: 'gemini-2.0-flash-exp',
})

interface SettingsContextValue {
  settings: GeminiSettings
  /** Merge-partial updater that persists to localStorage. */
  update: (partial: Partial<GeminiSettings>) => void
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined)

/**
 * SettingsProvider
 * Loads/saves settings to localStorage and exposes them to the app. Missing fields are patched
 * with defaults to remain forward-compatible when we add new settings (e.g., model).
 */
export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation()

  const [settings, setSettings] = useState<GeminiSettings>(() => {
    const def = defaultSettings(t)
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Partial<GeminiSettings>
        // Patch with defaults for any missing keys
        const merged = { ...def, ...parsed }
        // Persist patched structure to keep storage up-to-date
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged))
        return merged
      } catch {
        // Corrupted storage → reset
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(def))
        return def
      }
    }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(def))
    return def
  })

  // When language changes, patch defaults (e.g., persona text) but do not override user changes.
  useEffect(() => {
    const def = defaultSettings(t)
    setSettings((prev) => {
      const merged = { ...def, ...prev }
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged))
      return merged
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t])

  /** Merge update settings and persist. */
  const update = (partial: Partial<GeminiSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial }
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
      return next
    })
  }

  const value = useMemo(() => ({ settings, update }), [settings])

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

/** Hook to use settings. */
export const useSettings = () => {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
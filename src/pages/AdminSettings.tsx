/**
 * AdminSettings.tsx
 * Admin-only page to configure persona and Gemini parameters. Also stores API key locally.
 * Now includes model selection.
 */

import React, { useEffect, useState } from 'react'
import Header from '../components/Header'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Button } from '../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Slider } from '../components/ui/slider'

/** Admin settings page component. */
const AdminSettingsPage: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { settings, update } = useSettings()

  const [persona, setPersona] = useState(settings.persona)
  const [apiKey, setApiKey] = useState(settings.apiKey)
  const [temperature, setTemperature] = useState(settings.temperature)
  const [maxTokens, setMaxTokens] = useState(settings.maxOutputTokens)
  const [lang, setLang] = useState<'pl' | 'en'>(settings.defaultResponseLanguage)
  const [model, setModel] = useState<string>(settings.model || 'gemini-1.5-flash')
  const [savedAt, setSavedAt] = useState<number | null>(null)

  useEffect(() => {
    setPersona(settings.persona)
    setApiKey(settings.apiKey)
    setTemperature(settings.temperature)
    setMaxTokens(settings.maxOutputTokens)
    setLang(settings.defaultResponseLanguage)
    setModel(settings.model || 'gemini-1.5-flash')
  }, [settings])

  /** Save current fields to SettingsContext and persist. */
  const onSave = () => {
    update({
      persona,
      apiKey,
      temperature,
      maxOutputTokens: maxTokens,
      defaultResponseLanguage: lang,
      model,
    })
    setSavedAt(Date.now())
    setTimeout(() => setSavedAt(null), 2000)
  }

  if (!user || !user.isAdmin) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50">
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-10">
          <p className="text-sm">{t('accessDenied')}</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-10 grid gap-6">
        <h1 className="text-2xl font-semibold">{t('admin')}</h1>

        <div className="grid gap-2">
          <label className="text-sm font-medium">{t('adminPersona')}</label>
          <Textarea rows={8} value={persona} onChange={(e) => setPersona(e.target.value)} />
        </div>

        <div className="grid gap-2">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                Bezpieczne Proxy Aktywne
              </span>
            </div>
            <p className="text-xs text-emerald-700 dark:text-emerald-300">
              Klucz API jest bezpiecznie przechowywany po stronie serwera na subdomenie api.vibemirror.eu
            </p>
          </div>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">{t('adminTemperature')}</label>
          <div className="flex items-center gap-3">
            <Slider
              value={[temperature]}
              onValueChange={(v) => setTemperature(v[0])}
              min={0}
              max={1.5}
              step={0.05}
              className="w-full"
            />
            <span className="text-sm w-16 text-right">{temperature.toFixed(2)}</span>
          </div>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">{t('adminMaxTokens')}</label>
          <Input
            type="number"
            min={128}
            max={8192}
            step={64}
            value={maxTokens}
            onChange={(e) => setMaxTokens(parseInt(e.target.value || '0', 10))}
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">{t('adminDefaultLang')}</label>
          <Select value={lang} onValueChange={(v) => setLang(v as 'pl' | 'en')}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pl">{t('polish')}</SelectItem>
              <SelectItem value="en">{t('english')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Model selection for Gemini */}
        <div className="grid gap-2">
          <label className="text-sm font-medium">Model</label>
          <Select value={model} onValueChange={(v) => setModel(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="gemini-2.0-flash-exp">gemini-2.0-flash-exp (najnowszy, eksperymentalny)</SelectItem>
              <SelectItem value="gemini-2.0-flash-thinking-exp">gemini-2.0-flash-thinking-exp (z rozszerzonym myśleniem)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-neutral-500">
            Wybór modelu wpływa na koszt i dokładność. Flash jest szybszy, Pro dokładniejszy.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={onSave}>{t('save')}</Button>
          {savedAt && <span className="text-sm text-emerald-600">{t('saved')}</span>}
        </div>
      </main>
    </div>
  )
}

export default AdminSettingsPage

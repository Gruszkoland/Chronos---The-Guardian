/**
 * gemini.ts
 * Client for Google Generative Language API (Gemini) with persona and user context support.
 * Uses settings from SettingsContext for model configuration.
 */

import { GeminiSettings } from '../context/SettingsContext'

// --- DEFINICJE TYPÓW ---

/** Role w wiadomościach dla API Gemini. */
type Role = 'user' | 'model'

/** Struktura wiadomości w API Gemini. */
export interface Message {
  role: Role
  parts: { text: string }[]
}

/** Struktura wiadomości w aplikacji. */
export interface ChatMessage {
  role: 'user' | 'model'
  content: string
  createdAt: number
}

/** Kontekst użytkownika i jego postów na forum. */
export interface UserContext {
  user: {
    id: string | number
    name: string
  }
  forumPosts: Array<{
    content: string
    // Można dodać więcej pól, np. title, date
  }>
}

/** Odpowiedź z API generateContent. */
interface GenerateContentResponse {
  candidates?: Array<{
    content: {
      parts: Array<{ text: string }>
    }
    finishReason: string
  }>
  promptFeedback?: {
    blockReason?: string
  }
}

// --- FUNKCJA POMOCNICZA ---

/**
 * Generuje odpowiedź Gemini, zachowując kompatybilność ze starym kodem.
 */
export async function generateGeminiResponse(
  messages: ChatMessage[],
  settings: GeminiSettings,
  userContext: UserContext | null
): Promise<string> {
  const client = new GeminiClient(settings)
  
  const geminiMessages: Message[] = messages.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.content }]
  }))

  return client.generateResponse(geminiMessages, userContext)
}

// --- KLASA GŁÓWNA ---

export class GeminiClient {
  private settings: GeminiSettings

  constructor(settings: GeminiSettings) {
    this.settings = settings
  }

  /**
   * Tworzy wiadomość systemową z kontekstem użytkownika.
   * @param userContext - Dane użytkownika i jego posty.
   * @returns Wiadomość systemowa w formacie Gemini API.
   */
  private createSystemContextMessage(userContext: UserContext): Message {
    const postSnippets = userContext.forumPosts.map(
      post => `- "${post.content.substring(0, 150)}..."` // Ograniczamy długość dla zwięzłości
    ).join('\n')

    const contextText = `
      ---
      **KONTEKST UŻYTKOWNIKA (PAMIĘTAJ O NIM W TRAKCIE ROZMOWY):**
      - **ID Użytkownika:** ${userContext.user.id}
      - **Imię Użytkownika:** ${userContext.user.name}
      - **Fragmenty jego postów z forum:**
      ${postSnippets || 'Brak postów na forum.'}
      ---
    `
    
    return {
      role: 'user', // Traktujemy to jako instrukcję od użytkownika na początku
      parts: [{ text: contextText.replace(/\s+/g, ' ').trim() }]
    }
  }

  /**
   * Generuje odpowiedź z API Gemini przez bezpieczne proxy.
   * @param messages - Historia czatu.
   * @param userContext - Opcjonalny kontekst użytkownika.
   * @returns Wygenerowany tekst odpowiedzi.
   */
  async generateResponse(
    messages: Message[],
    userContext: UserContext | null
  ): Promise<string> {
    const { persona, temperature, maxOutputTokens, model } = this.settings

    const filteredMessages = messages.filter(msg => 
      msg.parts.some(part => part.text.trim().length > 0)
    )

    if (filteredMessages.length === 0) {
      throw new Error('Brak prawidłowych wiadomości do wysłania.')
    }

    let finalMessages = [...filteredMessages]

    // Wstrzyknij kontekst użytkownika jako pierwszą wiadomość
    if (userContext) {
      const contextMessage = this.createSystemContextMessage(userContext)
      finalMessages.unshift(contextMessage)
    }

    const url = `https://YOUR_VERCEL_DEPLOYMENT_URL.vercel.app/api/gemini` // ZASTĄP TEN ADRES URL!

    // Ostatnia wiadomość to prompt, reszta to historia
    const promptMessage = finalMessages[finalMessages.length - 1];
    const historyMessages = finalMessages.slice(0, finalMessages.length - 1);

    const requestBody: any = {
      prompt: promptMessage.parts[0].text,
      history: historyMessages.map(msg => ({
        role: msg.role,
        parts: msg.parts.map(part => ({ text: part.text }))
      })),
      // Ustawienia modelu będą obsługiwane po stronie serwera,
      // ale możemy je przekazać, jeśli chcemy dynamicznie zmieniać
      // na podstawie ustawień użytkownika. Na razie upraszczamy.
      // model: model,
      // generationConfig: {
      //   temperature,
      //   maxOutputTokens,
      //   topP: 0.8,
      //   topK: 40,
      // },
      // persona: persona, // Persona również będzie obsługiwana po stronie serwera
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = `API error: ${response.status} ${response.statusText}`
        
        try {
          const errorJson = JSON.parse(errorText)
          errorMessage = errorJson.error?.message || errorMessage
        } catch {
          errorMessage = errorText || errorMessage
        }
        
        throw new Error(errorMessage)
      }

      const data: GenerateContentResponse = await response.json()

      if (data.promptFeedback?.blockReason) {
        throw new Error(`Content blocked: ${data.promptFeedback.blockReason}`)
      }

      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response candidates from Gemini')
      }

      const candidate = data.candidates[0]
      
      if (candidate.finishReason !== 'STOP') {
        console.warn(`Generation finished with reason: ${candidate.finishReason}`)
      }

      return candidate.content.parts[0]?.text || 'No response generated'
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unknown error occurred while communicating with Gemini API')
    }
  }

  /**
   * Validate API key and model access.
   * @returns Promise resolving to validation result
   */
  async validateAccess(): Promise<{ valid: boolean; error?: string }> {
    try {
      // Test with a simple prompt to verify access
      const testMessage: Message = {
        role: 'user',
        parts: [{ text: 'Hello' }]
      }
      
      await this.generateResponse([testMessage])
      return { valid: true }
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Unknown validation error' 
      }
    }
  }
}
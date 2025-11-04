import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req: Request) {
  // Ustawienia nagłówków CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // W produkcji warto zmienić na konkretną domenę
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Obsługa zapytania CORS preflight (przed właściwym zapytaniem POST)
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
  }

  const { prompt, history } = await req.json();

  if (!prompt) {
    return new Response('Missing prompt parameter', { status: 400, headers: corsHeaders });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response('Gemini API Key not configured', { status: 500, headers: corsHeaders });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  try {
    const chat = model.startChat({
      history: history || [],
      generationConfig: {
        maxOutputTokens: 200,
      },
    });

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const text = response.text();

    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Gemini API error:', error);
    return new Response(JSON.stringify({ error: 'Failed to get response from Gemini API' }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
}
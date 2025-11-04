export default async function handler(req: Request) {
  // Ustawienia nagłówków CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // W produkcji warto zmienić na konkretną domenę
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Obsługa zapytania CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (req.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
  }

  // Symulacja pobierania postów z forum dla danego użytkownika
  // W prawdziwej aplikacji, tutaj byłaby logika łączenia się z bazą danych
  // i filtrowania postów po ID użytkownika.
  const userId = req.url ? new URL(req.url).searchParams.get('userId') : null;

  const mockForumPosts = [
    {
      id: '1',
      userId: 'user123',
      username: 'JanKowalski',
      title: 'Problem z logowaniem',
      content: 'Nie mogę się zalogować na konto od wczoraj. Czy ktoś ma podobny problem?',
      timestamp: new Date().toISOString(),
    },
    {
      id: '2',
      userId: 'user123',
      username: 'JanKowalski',
      title: 'Sugestia nowej funkcji',
      content: 'Czy można dodać opcję edycji wiadomości na czacie?',
      timestamp: new Date().toISOString(),
    },
    {
      id: '3',
      userId: 'user456',
      username: 'AnnaNowak',
      title: 'Pytanie o Chronosa',
      content: 'Jakie są możliwości integracji Chronosa z innymi systemami?',
      timestamp: new Date().toISOString(),
    },
  ];

  const userPosts = userId 
    ? mockForumPosts.filter(post => post.userId === userId) 
    : mockForumPosts;

  return new Response(JSON.stringify(userPosts), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}
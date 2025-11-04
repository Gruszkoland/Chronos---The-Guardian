<?php
/**
 * gemini_proxy.php
 * Bezpieczny proxy dla API Gemini z weryfikacją sesji i CORS
 */

// Włącz obsługę błędów (wyłączyć w produkcji)
ini_set('display_errors', 0);
error_reporting(0);

// Konfiguracja sesji cross-subdomain
session_set_cookie_params([
    'lifetime' => 86400,
    'path' => '/',
    'domain' => '.vibemirror.eu',
    'secure' => true,
    'httponly' => true,
    'samesite' => 'None'
]);

session_start();

// Klucz API Gemini (bezpiecznie odczytywany ze zmiennych środowiskowych)
$geminiApiKey = getenv('GEMINI_API_KEY');
if (!$geminiApiKey) {
    http_response_code(500);
    echo json_encode(['error' => 'API key not configured on the server']);
    exit;
}

define('GEMINI_BASE_URL', 'https://generativelanguage.googleapis.com/v1beta/models/');

// Dozwolone domeny
$allowed_origins = [
    'https://vibemirror.eu',
    'https://www.vibemirror.eu'
];

// Nagłówki CORS
if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
} else {
    header('Access-Control-Allow-Origin: https://vibemirror.eu');
}

header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

// Obsługa preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Sprawdź czy użytkownik jest zalogowany
if (!isset($_SESSION['user_id']) && !isset($_SESSION['user'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized - Please log in']);
    exit;
}

// Sprawdź metodę
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Odczytaj dane wejściowe
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

// Walidacja wymaganych pól
if (!isset($data['model']) || !isset($data['contents']) || !isset($data['generationConfig'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit;
}

// Przygotuj dane dla Gemini API
$geminiData = [
    'contents' => $data['contents'],
    'generationConfig' => $data['generationConfig']
];

// Dodaj system instruction jeśli istnieje
if (isset($data['systemInstruction']) && !empty($data['systemInstruction'])) {
    $geminiData['systemInstruction'] = $data['systemInstruction'];
}

// URL dla Gemini API
$model = urlencode($data['model']);
$url = GEMINI_BASE_URL . $model . ':generateContent?key=' . $geminiApiKey;

// Wywołanie Gemini API
$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($geminiData),
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
    ],
    CURLOPT_TIMEOUT => 30,
    CURLOPT_SSL_VERIFYPEER => true
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($response === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Proxy error: ' . $curlError]);
    exit;
}

// Zwróć odpowiedź od Gemini
http_response_code($httpCode);
echo $response;
?>
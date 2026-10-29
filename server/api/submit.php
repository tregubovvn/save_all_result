<?php
/**
 * Student Tracker API - PHP версия
 * 
 * Принимает зашифрованные данные от клиента и записывает в CSV файл.
 * Разместите в директории /results/ на сервере 194.87.103.77
 * 
 * URL: http://194.87.103.77/results/api/submit.php?file=archive.csv
 */

// CORS заголовки
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Request-Token, X-Request-Time, X-CSV-Filename');
header('Content-Type: application/json; charset=utf-8');

// Обработка preflight запроса
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Только POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Ключ шифрования (должен совпадать с клиентом)
define('ENCRYPTION_KEY', 'StGr@2024!SecKey');

// Базовая директория для CSV файлов
$base_dir = __DIR__ . '/data/';

// Получаем имя файла из query параметра или заголовка
$filename = $_GET['file'] 
    ?? $_SERVER['HTTP_X_CSV_FILENAME'] 
    ?? 'archive.csv';

// Защита от path traversal - только безопасные символы
$filename = preg_replace('/[^a-zA-Z0-9.\-_]/', '', $filename);

// Если пустое имя - используем archive.csv
if (empty($filename) || $filename === '.') {
    $filename = 'archive.csv';
}

// Убеждаемся что расширение .csv
if (!str_ends_with(strtolower($filename), '.csv')) {
    $filename .= '.csv';
}

// Создаём директорию если не существует
if (!is_dir($base_dir)) {
    mkdir($base_dir, 0755, true);
}

$csv_file = $base_dir . $filename;

// Проверяем токен
$token = $_SERVER['HTTP_X_REQUEST_TOKEN'] ?? null;
if (!$token) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Токен отсутствует']);
    exit;
}

// Дешифрование токена для проверки
$decoded_token = xor_decrypt($token);
if (!$decoded_token) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Невалидный токен']);
    exit;
}

// Проверяем что токен не устарел (24 часа)
$parts = explode(':', $decoded_token);
if (count($parts) !== 2) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Невалидный формат токена']);
    exit;
}

$timestamp = (int)$parts[0];
if (time() - $timestamp > 86400) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Токен устарел']);
    exit;
}

// Читаем тело запроса
$body = file_get_contents('php://input');
if (empty($body)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Пустое тело запроса']);
    exit;
}

// Дешифруем данные
$decrypted = xor_decrypt($body);
if (!$decrypted) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Ошибка дешифрования']);
    exit;
}

// Создаём файл с заголовком если его нет
if (!file_exists($csv_file)) {
    file_put_contents($csv_file, "Student ID,Activity,Grade,Comment,Date/Time\n");
}

// Добавляем запись
$result = file_put_contents($csv_file, $decrypted . "\n", FILE_APPEND);

if ($result === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Ошибка записи в файл']);
    exit;
}

// Успешный ответ
echo json_encode([
    'success' => true, 
    'message' => "Запись сохранена в $filename"
]);

/**
 * Дешифрование XOR + Base64
 */
function xor_decrypt($encoded) {
    $data = base64_decode($encoded);
    if ($data === false) return null;
    
    $key = ENCRYPTION_KEY;
    $result = '';
    $key_len = strlen($key);
    
    for ($i = 0; $i < strlen($data); $i++) {
        $result .= chr(ord($data[$i]) ^ ord($key[$i % $key_len]));
    }
    
    return $result;
}
?>

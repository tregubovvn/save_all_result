<?php
/**
 * Student Tracker API - PHP версия
 * Запись данных в archive.csv
 */

// CORS заголовки
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// Обработка preflight запроса
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Только POST запросы
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Путь к CSV файлу
$csv_file = __DIR__ . '/../archive.csv';

// Читаем данные из тела запроса
$data = file_get_contents('php://input');

if (empty($data)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'No data']);
    exit;
}

// Создаём файл с заголовком если его нет
if (!file_exists($csv_file)) {
    $header = "Student ID,Activity,Grade,Comment,Date/Time\n";
    file_put_contents($csv_file, $header);
}

// Дописываем данные в файл
$result = file_put_contents($csv_file, $data . "\n", FILE_APPEND);

if ($result === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Cannot write to file']);
    exit;
}

// Успешный ответ
echo json_encode(['success' => true]);

<?php
// Простой API для записи в archive.csv
// Разместите в /var/www/html/results/api/submit.php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: PUT, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$file = __DIR__ . '/../archive.csv';

// Создаём файл с заголовком если его нет
if (!file_exists($file)) {
    file_put_contents($file, "Student ID,Activity,Grade,Comment,Date/Time\n");
}

// Читаем данные
$data = file_get_contents('php://input');

// Дописываем в файл
file_put_contents($file, $data . "\n", FILE_APPEND);

echo json_encode(['success' => true]);
?>

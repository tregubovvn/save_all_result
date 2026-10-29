/**
 * Серверный скрипт для обработки данных от Student Tracker
 * Запуск: node server.js
 * 
 * Этот скрипт принимает зашифрованные данные от клиента,
 * дешифрует их и сохраняет в CSV файл на сервере.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const CSV_DIR = path.join(__dirname, 'data');
const CSV_FILE = path.join(CSV_DIR, 'student_records.csv');
const ENCRYPTION_KEY = 'StGr@2024!SecKey';

// Убедимся, что директория для данных существует
if (!fs.existsSync(CSV_DIR)) {
  fs.mkdirSync(CSV_DIR, { recursive: true });
}

// Дешифрование данных (XOR + Base64)
function decrypt(encoded) {
  const data = Buffer.from(encoded, 'base64').toString('binary');
  let decrypted = '';
  for (let i = 0; i < data.length; i++) {
    const charCode = data.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
    decrypted += String.fromCharCode(charCode);
  }
  return decrypted;
}

// Валидация токена
function validateToken(token) {
  try {
    const decoded = decrypt(token);
    const parts = decoded.split(':');
    if (parts.length !== 2) return false;
    const timestamp = parseInt(parts[0]);
    return Date.now() - timestamp < 24 * 60 * 60 * 1000; // 24 часа
  } catch {
    return false;
  }
}

// Экранирование CSV значений
function escapeCSV(value) {
  if (!value) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Создание CSV заголовка если файл новый
function ensureCSVHeader() {
  if (!fs.existsSync(CSV_FILE)) {
    const header = 'Student ID,Activity,Grade,Comment,Date/Time,File URL\n';
    fs.writeFileSync(CSV_FILE, header, 'utf-8');
    console.log('[INFO] Создан новый CSV файл:', CSV_FILE);
  }
}

// Обработка POST запроса
function handleSubmit(req, res) {
  let body = '';
  
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    try {
      // Проверка токена
      const token = req.headers['x-request-token'];
      if (!token || !validateToken(token)) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Invalid or expired token' }));
        return;
      }

      // Парсинг и дешифрование данных
      const payload = JSON.parse(body);
      const decryptedData = decrypt(payload.data);
      const record = JSON.parse(decryptedData);

      // Валидация обязательных полей
      if (!record.studentId || !record.activity || !record.grade) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Missing required fields' }));
        return;
      }

      // Запись в CSV
      ensureCSVHeader();
      const csvLine = [
        escapeCSV(record.studentId),
        escapeCSV(record.activity),
        escapeCSV(record.grade),
        escapeCSV(record.comment),
        escapeCSV(record.dateTime),
        escapeCSV(record.fileUrl)
      ].join(',') + '\n';

      fs.appendFileSync(CSV_FILE, csvLine, 'utf-8');
      console.log(`[OK] Запись добавлена для студента: ${record.studentId}`);

      // Ответ клиенту
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Request-Token, X-Request-Time'
      });
      res.end(JSON.stringify({ 
        success: true, 
        message: 'Запись успешно сохранена' 
      }));

    } catch (error) {
      console.error('[ERROR]', error.message);
      res.writeHead(500, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ success: false, message: 'Server error: ' + error.message }));
    }
  });
}

// Обработка GET запроса (получение записей)
function handleGetRecords(req, res) {
  try {
    const token = req.headers['x-request-token'];
    if (!token || !validateToken(token)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Invalid token' }));
      return;
    }

    if (!fs.existsSync(CSV_FILE)) {
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify([]));
      return;
    }

    const content = fs.readFileSync(CSV_FILE, 'utf-8');
    const lines = content.trim().split('\n');
    
    if (lines.length <= 1) {
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify([]));
      return;
    }

    const records = lines.slice(1).map(line => {
      const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
      return {
        studentId: (values[0] || '').replace(/"/g, ''),
        activity: (values[1] || '').replace(/"/g, ''),
        grade: (values[2] || '').replace(/"/g, ''),
        comment: (values[3] || '').replace(/"/g, ''),
        dateTime: (values[4] || '').replace(/"/g, ''),
        fileUrl: (values[5] || '').replace(/"/g, '')
      };
    });

    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify(records));

  } catch (error) {
    console.error('[ERROR]', error.message);
    res.writeHead(500, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ success: false, message: error.message }));
  }
}

// HTTP сервер
const server = http.createServer((req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Request-Token, X-Request-Time',
      'Access-Control-Max-Age': '86400'
    });
    res.end();
    return;
  }

  // Роутинг
  if (req.method === 'POST' && req.url === '/api/submit') {
    handleSubmit(req, res);
  } else if (req.method === 'GET' && req.url === '/api/records') {
    handleGetRecords(req, res);
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, message: 'Not found' }));
  }
});

server.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`  Student Tracker API Server`);
  console.log(`  Running on port ${PORT}`);
  console.log(`  CSV file: ${CSV_FILE}`);
  console.log(`========================================\n`);
});

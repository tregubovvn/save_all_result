# Student Grade Tracker

Приложение для учёта оценок и активностей студентов. Чистый JavaScript, без серверной части. Nginx с Lua-модулем напрямую записывает данные в CSV файл.

## 🚀 Возможности

- **Форма ввода**: ИД студента, активность, оценка (0-5), комментарий, дата/время, URL файла
- **QR-сканирование**: Через камеру устройства (html5-qrcode)
- **QR-генерация**: Создание QR-кодов для студентов (qrcode.js)
- **Шифрование**: XOR + Base64 перед отправкой на сервер
- **CSV хранение**: Nginx + Lua записывает напрямую в CSV файл
- **Без серверной части**: Не нужен Node.js, Python или PHP
- **Адаптивный дизайн**: Работает на мобильных и десктопных устройствах

## 📦 Установка

### 1. Сборка фронтенда

```bash
npm install
npm run build

# Файлы будут в папке dist/
# Скопируйте на сервер:
sudo cp -r dist/* /var/www/student-tracker/
```

### 2. Установка OpenResty (nginx + Lua)

```bash
# Ubuntu/Debian
wget -O - https://openresty.org/package/pubkey.gpg | sudo apt-key add -
echo "deb http://openresty.org/package/ubuntu $(lsb_release -sc) main" | sudo tee /etc/apt/sources.list.d/openresty.list
sudo apt-get update
sudo apt-get install -y openresty

# Или используйте обычный nginx + lua-nginx-module
```

### 3. Настройка Nginx

```bash
# Скопируйте конфигурацию
sudo cp server/nginx-lua.conf /etc/openresty/nginx.conf
# или
sudo cp server/nginx-lua.conf /etc/nginx/sites-available/student-tracker
sudo ln -s /etc/nginx/sites-available/student-tracker /etc/nginx/sites-enabled/

# Отредактируйте:
# - server_name (ваш домен или IP)
# - ssl_certificate пути
# - root путь к файлам

# Создайте директорию для CSV
sudo mkdir -p /var/www/student-tracker/data
sudo chown -R www-data:www-data /var/www/student-tracker/data

# Проверьте конфигурацию
sudo nginx -t

# Перезапустите
sudo systemctl reload nginx
```

### 4. SSL сертификат (опционально)

```bash
# Self-signed для тестирования
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/student-tracker.key \
  -out /etc/ssl/certs/student-tracker.crt

# Или Let's Encrypt
sudo certbot --nginx -d your-domain.com
```

## 🔐 Безопасность

### Шифрование
- Данные шифруются XOR с ключом + Base64 на клиенте
- Ключ должен совпадать в `public/js/crypto.js` и `nginx-lua.conf`
- Каждый запрос содержит временный токен (24 часа)

### Серверная защита
- SSL/TLS (HTTPS)
- Rate limiting (5 запросов/сек)
- CORS заголовки
- Валидация токенов через Lua
- Безопасные HTTP заголовки

### ⚠️ Важно!
- **Смените ключ шифрования** в `public/js/crypto.js` и `server/nginx-lua.conf`
- Используйте настоящие SSL сертификаты для продакшена
- Настройте firewall

## 📱 Использование через URL

После развёртывания:
```
https://your-domain.com
```

На мобильных можно добавить на рабочий стол.

## 🔌 Интеграция в другие приложения

Приложение можно встроить в другие HTML-страницы через iframe с гибкой настройкой полей.

### Режимы работы

**Standalone** (полноценное приложение):
```
https://your-domain.com
```

**Embed** (встраиваемый режим без header/footer):
```
https://your-domain.com?mode=embed
```

### Выбор полей

URL-параметр `fields` определяет, какие поля показывать:

```html
<!-- Только ИД студента с QR -->
<iframe src="index.html?mode=embed&fields=studentId"></iframe>

<!-- ИД и оценка -->
<iframe src="index.html?mode=embed&fields=studentId,grade"></iframe>

<!-- Все поля -->
<iframe src="index.html?mode=embed&fields=studentId,activity,grade,comment,fileUrl"></iframe>
```

**Доступные поля:**
- `studentId` — ИД студента (с QR-сканированием)
- `activity` — Название активности
- `grade` — Оценка (0-5)
- `comment` — Комментарий
- `fileUrl` — URL файла

### Получение событий

Приложение отправляет события через `postMessage` и `CustomEvent`:

```javascript
// Слушаем события от iframe
window.addEventListener('message', function(event) {
  if (event.data.type === 'studentRecordSaved') {
    console.log('Запись сохранена:', event.data.record);
    // event.data.record = { studentId, activity, grade, comment, dateTime, fileUrl }
  }
  
  if (event.data.type === 'studentRecordError') {
    console.error('Ошибка:', event.data.message);
  }
});
```

### Программное управление

```javascript
const iframe = document.getElementById('student-tracker-frame');

// Установить ИД студента
iframe.contentWindow.App.setStudentId('STU12345');

// Получить все записи
const records = iframe.contentWindow.App.getRecords();

// Очистить записи
iframe.contentWindow.App.clearRecords();

// Изменить конфигурацию
iframe.contentWindow.App.setConfig({
  fields: ['studentId', 'grade'],
  onSuccess: function(record) {
    console.log('Сохранено:', record);
  },
  onError: function(message) {
    console.error('Ошибка:', message);
  }
});
```

### Полный пример интеграции

См. файл `public/embed-example.html` — демонстрационная страница с:
- Встроенным приложением (только ИД студента)
- Логом событий в реальном времени
- Примерами кода

Откройте `embed-example.html` в браузере для интерактивной демонстрации.

## 📊 Формат CSV

Файл создаётся автоматически при первой записи:

```csv
Student ID,Activity,Grade,Comment,Date/Time,File URL
STU001,Лабораторная работа №1,5,Отличная работа,2024-01-15T10:30,https://files.example.com/lab1.pdf
STU002,Курсовой проект,4,Хорошая работа,2024-01-15T11:00,
```

## 🛠 Технологии

- **Frontend**: Чистый HTML/CSS/JavaScript (без фреймворков)
- **QR**: html5-qrcode (сканирование), qrcode.js (генерация)
- **Backend**: Nginx + Lua-nginx-module (OpenResty)
- **Хранение**: CSV файлы на диске
- **Сборка**: Vite (для минификации)

## 📁 Структура

```
├── index.html              # Главная страница
├── public/
│   ├── css/
│   │   └── style.css       # Стили приложения
│   └── js/
│       ├── crypto.js       # Модуль шифрования
│       └── app.js          # Основная логика
├── src/
│   ├── main.tsx            # Entry point для Vite
│   └── index.css           # Tailwind импорт
├── server/
│   └── nginx-lua.conf      # Конфигурация nginx + Lua
└── data/                   # CSV файлы (на сервере)
    └── records.csv         # Автоматически создаётся
```

## 🔄 Как это работает

1. Пользователь заполняет форму в браузере
2. Данные шифруются (XOR + Base64) на клиенте
3. Отправляются через POST на `/api/submit`
4. Nginx принимает запрос, Lua скрипт:
   - Проверяет токен
   - Дешифрует данные
   - Записывает CSV строку в файл
5. Если файла нет — создаётся новый с заголовком
6. Если файл есть — запись добавляется в конец

## ⚙️ Переменные

| Переменная | Где | Описание |
|-----------|-----|----------|
| `ENCRYPTION_KEY` | crypto.js, nginx-lua.conf | Ключ шифрования |
| `csv_file` | nginx-lua.conf | Путь к CSV файлу |
| `serverUrl` | localStorage | URL сервера (настраивается в UI) |

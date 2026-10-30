# Student Tracker

Приложение для записи оценок студентов. Работает с Supabase (облачная база данных).

## 🚀 Быстрый старт

### 1. Настройка Supabase

Следуйте инструкции в файле `SUPABASE_SETUP.md`:

1. Создайте таблицу `records` в Supabase
2. Получите `anon key`
3. Укажите его в коде или через URL параметры

### 2. Использование

Откройте приложение с параметрами:

```
index.html?supabaseUrl=https://nfoynqfjkvgtqsgwxves.supabase.co&supabaseKey=YOUR_ANON_KEY
```

Или настройте в коде `index.html`:

```javascript
supabaseUrl: 'https://nfoynqfjkvgtqsgwxves.supabase.co',
supabaseKey: 'YOUR_ANON_KEY',
```

### 3. Развертывание

**GitHub Pages** (рекомендуется):
```bash
npm run build
# Загрузите dist/index.html на GitHub Pages
```

**Любой статический хостинг**:
```bash
npm run build
# Загрузите содержимое dist/ на хостинг
```

## 🔌 Интеграция в другие приложения

Приложение можно встраивать в другие HTML-страницы через iframe с гибкой настройкой полей.

### Способ 1: URL параметры

```html
<!-- Только ИД студента -->
<iframe src="index.html?mode=embed&fields=studentId"></iframe>

<!-- ИД и оценка -->
<iframe src="index.html?mode=embed&fields=studentId,grade"></iframe>

<!-- Все поля -->
<iframe src="index.html?mode=embed&fields=studentId,activity,grade,comment"></iframe>
```

**Доступные поля:**
- `studentId` — ИД студента (с QR-сканированием)
- `activity` — Название активности
- `grade` — Оценка (0-5)
- `comment` — Комментарий

**Параметры:**
- `mode=embed` — компактный режим без заголовка и фона
- `fields=...` — список полей через запятую
- `server=...` — URL API (по умолчанию `/api/submit`)

### Способ 2: Значения по умолчанию через URL

```html
<iframe src="index.html?mode=embed&fields=studentId,grade&studentId=STU001&grade=5"></iframe>
```

### Способ 3: Программное управление

```javascript
const iframe = document.getElementById('myIframe');
const tracker = iframe.contentWindow.StudentTracker;

// Установить значение поля
tracker.setFieldValue('studentId', 'STU12345');
tracker.setGrade('5');

// Получить значение
const grade = tracker.getFieldValue('grade');

// Сбросить форму
tracker.resetForm();

// Изменить конфигурацию
tracker.setConfig({
  fields: ['studentId', 'grade'],
  mode: 'embed',
  onSuccess: (record) => {
    console.log('Запись сохранена:', record);
  },
  onError: (error) => {
    console.error('Ошибка:', error);
  }
});
```

### Способ 4: Обработка событий

**Через CustomEvent:**
```javascript
document.addEventListener('studentRecordSaved', (e) => {
  console.log('Запись сохранена:', e.detail.record);
});

document.addEventListener('studentRecordError', (e) => {
  console.error('Ошибка:', e.detail.message);
});
```

**Через postMessage (для iframe):**
```javascript
window.addEventListener('message', (e) => {
  if (e.data.type === 'studentRecordSaved') {
    console.log('Запись:', e.data.record);
  } else if (e.data.type === 'studentRecordError') {
    console.error('Ошибка:', e.data.message);
  }
});
```

### Полный пример интеграции

См. файл `public/embed-example.html` — демонстрационная страница с примерами использования.

```bash
# Скопируйте на сервер
scp public/embed-example.html root@194.87.103.77:/var/www/html/results/
```

Откройте: `http://194.87.103.77/embed-example.html`

## 📊 Формат данных

Данные сохраняются в CSV файл с UTF-8 BOM (для корректного отображения русского языка в Excel):

```csv
Student ID,Activity,Grade,Comment,Date/Time
"STU001","Лабораторная работа","5","Отличная работа","2024-01-15T10:30:00.000Z"
```

## 📁 Структура проекта

```
├── index.html              # Приложение (HTML + CSS + JS)
├── server/
│   ├── api/
│   │   └── submit.php      # PHP скрипт для записи в CSV
│   └── nginx-php.conf      # Конфигурация nginx
├── public/
│   └── embed-example.html  # Пример интеграции
├── install-php.sh          # Скрипт автоматической установки
└── README.md
```

## 🔧 API Reference

### StudentTracker.setFieldValue(field, value)

Установить значение поля.

**Параметры:**
- `field` (string) — имя поля: 'studentId', 'activity', 'grade', 'comment'
- `value` (string) — значение

**Пример:**
```javascript
StudentTracker.setFieldValue('studentId', 'STU12345');
```

### StudentTracker.getFieldValue(field)

Получить значение поля.

**Параметры:**
- `field` (string) — имя поля

**Возвращает:** string — значение поля

**Пример:**
```javascript
const grade = StudentTracker.getFieldValue('grade');
```

### StudentTracker.setGrade(grade)

Установить оценку (0-5).

**Параметры:**
- `grade` (string) — оценка: '0', '1', '2', '3', '4', '5'

**Пример:**
```javascript
StudentTracker.setGrade('5');
```

### StudentTracker.scanQR()

Запустить QR-сканер.

**Пример:**
```javascript
StudentTracker.scanQR();
```

### StudentTracker.resetForm()

Сбросить форму и установить значения по умолчанию.

**Пример:**
```javascript
StudentTracker.resetForm();
```

### StudentTracker.getConfig()

Получить текущую конфигурацию.

**Возвращает:** object — текущая конфигурация

**Пример:**
```javascript
const config = StudentTracker.getConfig();
console.log(config.fields);
```

### StudentTracker.setConfig(newConfig)

Обновить конфигурацию.

**Параметры:**
- `newConfig` (object) — новые настройки

**Свойства newConfig:**
- `fields` (array) — список полей для отображения
- `mode` (string) — 'standalone' или 'embed'
- `serverUrl` (string) — URL API endpoint
- `onSuccess` (function) — callback при успешном сохранении
- `onError` (function) — callback при ошибке
- `defaultValues` (object) — значения по умолчанию

**Пример:**
```javascript
StudentTracker.setConfig({
  fields: ['studentId', 'grade'],
  mode: 'embed',
  defaultValues: {
    studentId: 'STU001',
    grade: '5'
  }
});
```

## 🔍 Диагностика

### Проверка работы

```bash
# Проверьте что файл создаётся
ls -la /var/www/html/results/archive.csv

# Посмотрите содержимое
cat /var/www/html/results/archive.csv

# Проверьте логи nginx
tail -f /var/log/nginx/error.log
```

### Частые проблемы

**Ошибка 502 Bad Gateway:**
```bash
systemctl status php-fpm
systemctl start php-fpm
```

**Ошибка 403 Forbidden:**
```bash
chmod 777 /var/www/html/results
chmod 777 /var/www/html/results/api
```

**Ошибка 500 Internal Server Error:**
```bash
tail -f /var/log/nginx/error.log
tail -f /var/log/php8.4-fpm.log
```

## 📝 Лицензия

MIT

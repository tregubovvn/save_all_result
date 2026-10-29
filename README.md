# Student Grade Tracker

Приложение для учёта оценок и активностей студентов с поддержкой QR-сканирования, шифрованием данных и сохранением в CSV на сервере nginx.

## 🚀 Возможности

- **Форма ввода данных**: ИД студента, активность, оценка, комментарий, дата/время, URL файла
- **QR-сканирование**: Сканирование QR-кодов через камеру устройства для быстрого ввода ИД
- **QR-генерация**: Создание QR-кодов для студентов
- **Шифрование**: XOR + Base64 шифрование данных перед отправкой
- **CSV экспорт**: Сохранение данных в формате CSV на сервере nginx
- **Адаптивный дизайн**: Работает на мобильных и десктопных устройствах
- **Безопасность**: Токены, SSL/TLS, CORS, rate limiting

## 📦 Установка

### 1. Фронтенд (статические файлы)

```bash
# Установка зависимостей
npm install

# Сборка для продакшена
npm run build

# Файлы будут в папке dist/
# Скопируйте их на сервер: /var/www/student-tracker/dist/
```

### 2. Бэкенд (Node.js сервер)

```bash
# Запуск API сервера
node server/server.js

# Сервер запустится на порту 3000
```

### 3. Nginx конфигурация

```bash
# Скопируйте конфигурацию
sudo cp server/nginx.conf /etc/nginx/sites-available/student-tracker

# Создайте симлинк
sudo ln -s /etc/nginx/sites-available/student-tracker /etc/nginx/sites-enabled/

# Отредактируйте:
# - server_name (ваш домен)
# - ssl_certificate пути
# - root путь к dist/

# Проверьте конфигурацию
sudo nginx -t

# Перезапустите nginx
sudo systemctl reload nginx
```

## 🔐 Безопасность

### Шифрование данных
- Данные шифруются алгоритмом XOR с ключом перед отправкой
- Дополнительно кодируются в Base64
- Каждый запрос содержит временный токен (действителен 24 часа)

### Серверная защита
- SSL/TLS для HTTPS
- CORS заголовки
- Rate limiting (10 запросов/сек)
- Валидация токенов
- Безопасные HTTP заголовки (XSS, CSRF, HSTS)

### Рекомендации
- Смените `ENCRYPTION_KEY` в `src/utils/crypto.ts` и `server/server.js`
- Используйте настоящие SSL сертификаты (Let's Encrypt)
- Настройте firewall (ufw/iptables)
- Регулярно обновляйте зависимости

## 📱 Использование через URL

После развёртывания приложение доступно по URL:
```
https://your-domain.com
```

На мобильных устройствах можно добавить на рабочий стол как PWA.

## 📊 Формат CSV

```csv
Student ID,Activity,Grade,Comment,Date/Time,File URL
STU001,Лабораторная работа №1,5,Отличная работа,2024-01-15T10:30,https://files.example.com/lab1.pdf
STU002,Курсовой проект,4,Хорошая работа с замечаниями,2024-01-15T11:00,
```

## 🛠 Технологии

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **QR**: html5-qrcode (сканирование), qrcode (генерация)
- **Backend**: Node.js (API сервер)
- **Server**: Nginx (reverse proxy, статика, SSL)
- **Хранение**: CSV файлы

## 📁 Структура проекта

```
├── src/
│   ├── App.tsx              # Главный компонент
│   ├── components/
│   │   ├── QRScanner.tsx    # Компонент QR-сканера
│   │   └── QRGenerator.tsx  # Компонент генерации QR
│   ├── utils/
│   │   ├── crypto.ts        # Шифрование/дешифрование
│   │   └── api.ts           # API клиент
│   ├── index.css            # Стили
│   └── main.tsx             # Точка входа
├── server/
│   ├── server.js            # Node.js API сервер
│   └── nginx.conf           # Конфигурация nginx
├── dist/                    # Собранные файлы (после build)
└── data/                    # CSV файлы (создаётся автоматически)
```

## ⚙️ Переменные

| Переменная | Описание | По умолчанию |
|-----------|----------|-------------|
| `ENCRYPTION_KEY` | Ключ шифрования | `StGr@2024!SecKey` |
| `PORT` | Порт API сервера | `3000` |
| `CSV_FILE` | Путь к CSV файлу | `./data/student_records.csv` |

## 📝 Лицензия

MIT

# Student Tracker

Простое приложение для записи оценок студентов в CSV файл. Работает с обычным nginx + PHP (без OpenResty).

## Структура

```
├── index.html              # Приложение (HTML + CSS + JS)
├── server/
│   ├── api/
│   │   └── submit.php      # PHP скрипт для записи в CSV
│   └── nginx-php.conf      # Конфигурация nginx
└── README.md
```

## Установка на сервер 194.87.103.77

### 1. Сборка

```bash
npm run build
```

### 2. Копирование файлов

```bash
# Создаём директорию
ssh user@194.87.103.77 "mkdir -p /var/www/html/results/api"

# Копируем index.html
scp dist/index.html user@194.87.103.77:/var/www/html/results/

# Копируем PHP скрипт
scp server/api/submit.php user@194.87.103.77:/var/www/html/results/api/

# Копируем конфигурацию nginx
scp server/nginx-php.conf user@194.87.103.77:/tmp/student-tracker.conf
```

### 3. Настройка nginx

```bash
# На сервере
ssh user@194.87.103.77

# Копируем конфигурацию
sudo cp /tmp/student-tracker.conf /etc/nginx/conf.d/

# Проверяем конфигурацию
sudo nginx -t

# Перезапускаем nginx
sudo systemctl reload nginx
```

### 4. Права доступа

```bash
# Даём права на запись в директорию
sudo chmod 755 /var/www/html/results
sudo chmod 755 /var/www/html/results/api

# PHP должен иметь право создавать файлы
sudo chown -R www-www-data:www-data /var/www/html/results
```

## Использование

1. Откройте `http://194.87.103.77/results/` в браузере
2. Введите ИД студента (или отсканируйте QR-код)
3. Введите название активности
4. Выберите оценку (0-5)
5. Добавьте комментарий (опционально)
6. Нажмите "Отправить"

Данные автоматически записываются в файл `archive.csv` в директории `/var/www/html/results/`.

## Формат CSV

```csv
Student ID,Activity,Grade,Comment,Date/Time
"STU001","Лабораторная работа","5","Отличная работа","2024-01-15T10:30:00.000Z"
"STU002","Курсовой проект","4","Хорошая работа","2024-01-15T11:00:00.000Z"
```

## Требования

- Nginx
- PHP-FPM (обычно уже установлен на хостинге)
- Права на запись в директорию `/var/www/html/results/`

## Проверка работы

```bash
# Проверьте, что файл создаётся
ls -la /var/www/html/results/archive.csv

# Посмотрите содержимое
cat /var/www/html/results/archive.csv

# Проверьте логи nginx
sudo tail -f /var/log/nginx/error.log
```

## Troubleshooting

**Ошибка 403 Forbidden:**
```bash
sudo chown -R www-www-data:www-data /var/www/html/results
sudo chmod -R 755 /var/www/html/results
```

**Ошибка 500 Internal Server Error:**
```bash
# Проверьте логи
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/php-fpm.log

# Убедитесь что PHP-FPM запущен
sudo systemctl status php-fpm
```

**PHP не выполняется:**
```bash
# Проверьте конфигурацию nginx
sudo nginx -t

# Убедитесь что fastcgi_pass указывает на правильный сокет
# Путь может быть:
# - /var/run/php/php-fpm.sock
# - /var/run/php/php7.4-fpm.sock
# - /var/run/php/php8.0-fpm.sock
# - 127.0.0.1:9000
```

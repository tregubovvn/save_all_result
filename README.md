# Student Tracker (PHP версия)

Простое приложение для записи оценок студентов в CSV файл. Работает с nginx + PHP-FPM.

## Структура

```
├── index.html              # Приложение (HTML + CSS + JS)
├── server/
│   ├── api/
│   │   └── submit.php      # PHP скрипт для записи в CSV
│   └── nginx-php.conf      # Конфигурация nginx
├── install-php.sh          # Скрипт автоматической установки
└── README.md
```

## Быстрая установка

### Автоматическая установка (рекомендуется)

```bash
# Подключитесь к серверу
ssh root@194.87.103.77

# Скачайте проект или скопируйте файлы
cd /root
git clone <your-repo-url>
cd student-tracker

# Запустите установку
sudo bash install-php.sh
```

Скрипт автоматически:
- Установит PHP-FPM (если не установлен)
- Создаст директорию `/var/www/html/results`
- Скопирует `index.html` и `submit.php`
- Создаст конфигурацию nginx
- Настроит права доступа
- Перезапустит nginx

### Ручная установка

#### 1. Установка PHP-FPM

```bash
# Ubuntu/Debian
apt-get update
apt-get install -y php-fpm php-cli

# CentOS/RHEL
yum install -y php-fpm php-cli
```

#### 2. Создание директории

```bash
mkdir -p /var/www/html/results/api
```

#### 3. Копирование файлов

```bash
# С локальной машины
scp dist/index.html root@194.87.103.77:/var/www/html/results/
scp server/api/submit.php root@194.87.103.77:/var/www/html/results/api/
```

#### 4. Создание конфигурации nginx

```bash
nano /etc/nginx/conf.d/student-tracker.conf
```

Вставьте содержимое из `server/nginx-php.conf`, заменив `fastcgi_pass` на правильный сокет PHP-FPM:

```nginx
# Найдите сокет PHP-FPM
ls /var/run/php/

# Обычно это один из:
# unix:/var/run/php/php8.2-fpm.sock
# unix:/var/run/php/php8.1-fpm.sock
# unix:/var/run/php/php8.0-fpm.sock
# unix:/var/run/php/php7.4-fpm.sock
```

#### 5. Настройка прав

```bash
chown -R www-www-data:www-data /var/www/html/results
chmod 755 /var/www/html/results
chmod 755 /var/www/html/results/api
```

#### 6. Проверка и перезапуск

```bash
nginx -t
systemctl reload nginx
```

## Использование

1. Откройте `http://194.87.103.77/` в браузере
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
- PHP-FPM (7.4 или выше)
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

## Диагностика проблем

### Ошибка 403 Forbidden

```bash
# Проверьте права
ls -la /var/www/html/results/

# Исправьте права
chown -R www-www-data:www-data /var/www/html/results
chmod -R 755 /var/www/html/results
```

### Ошибка 502 Bad Gateway

```bash
# Проверьте что PHP-FPM запущен
systemctl status php-fpm

# Если не запущен, запустите
systemctl start php-fpm

# Проверьте сокет
ls -la /var/run/php/

# Убедитесь что в nginx.conf указан правильный сокет
grep fastcgi_pass /etc/nginx/conf.d/student-tracker.conf
```

### Ошибка 500 Internal Server Error

```bash
# Проверьте логи nginx
tail -f /var/log/nginx/error.log

# Проверьте логи PHP
tail -f /var/log/php-fpm.log

# Проверьте права на запись
ls -la /var/www/html/results/
```

### PHP не выполняется

```bash
# Проверьте что PHP установлен
php -v

# Проверьте что PHP-FPM запущен
systemctl status php-fpm

# Проверьте конфигурацию nginx
nginx -t
```

## Полезные команды

### Просмотр логов
```bash
# Логи nginx
tail -f /var/log/nginx/error.log

# Логи PHP-FPM
tail -f /var/log/php-fpm.log
```

### Просмотр файла CSV
```bash
# Последние 10 записей
tail -n 10 /var/www/html/results/archive.csv

# Весь файл
cat /var/www/html/results/archive.csv

# Количество записей
wc -l /var/www/html/results/archive.csv
```

### Управление PHP-FPM
```bash
# Статус
systemctl status php-fpm

# Перезапуск
systemctl restart php-fpm

# Остановка
systemctl stop php-fpm

# Запуск
systemctl start php-fpm
```

## Обновление приложения

Если вы изменили `index.html`, просто скопируйте новую версию:

```bash
# С локальной машины
scp dist/index.html root@194.87.103.77:/var/www/html/results/
```

Перезапуск nginx не требуется.

## Безопасность (опционально)

### Ограничение доступа по IP

Отредактируйте `/etc/nginx/conf.d/student-tracker.conf`:

```nginx
server {
    listen 80;
    server_name 194.87.103.77;

    # Разрешить только с определённых IP
    allow 192.168.1.0/24;
    allow 10.0.0.5;
    deny all;

    # ... остальная конфигурация
}
```

### Добавление базовой аутентификации

```bash
# Создайте файл паролей
htpasswd -c /etc/nginx/.htpasswd admin

# Добавьте в конфигурацию nginx
location / {
    auth_basic "Restricted Access";
    auth_basic_user_file /etc/nginx/.htpasswd;
    try_files $uri $uri/ /index.html;
}
```

## Поддержка

Если возникли проблемы:

1. Проверьте логи: `tail -f /var/log/nginx/error.log`
2. Проверьте конфигурацию: `nginx -t`
3. Убедитесь что PHP-FPM запущен: `systemctl status php-fpm`
4. Проверьте права доступа: `ls -la /var/www/html/results/`

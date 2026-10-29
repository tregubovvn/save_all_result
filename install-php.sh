#!/bin/bash
# ============================================
# Скрипт установки Student Tracker (PHP версия)
# Запуск: sudo bash install-php.sh
# ============================================

set -e

# Цвета
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Student Tracker - Установка (PHP)     ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════╝${NC}"
echo ""

# Проверка root прав
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Ошибка: Запустите скрипт с правами root${NC}"
    echo "Использование: sudo bash install-php.sh"
    exit 1
fi

# Путь к файлам приложения
APP_DIR="/var/www/html/results"
NGINX_CONF="/etc/nginx/conf.d/student-tracker.conf"

# Шаг 1: Установка PHP-FPM
echo -e "${BLUE}[1/6] Установка PHP-FPM...${NC}"
if command -v php &> /dev/null; then
    echo -e "${GREEN}✓ PHP уже установлен${NC}"
else
    apt-get update -qq
    apt-get install -y -qq php-fpm php-cli
    echo -e "${GREEN}✓ PHP-FPM установлен${NC}"
fi

# Шаг 2: Создание директории
echo -e "${BLUE}[2/6] Создание директории приложения...${NC}"
mkdir -p "$APP_DIR/api"
echo -e "${GREEN}✓ Директория создана: $APP_DIR${NC}"

# Шаг 3: Копирование index.html
echo -e "${BLUE}[3/6] Копирование index.html...${NC}"
if [ -f "dist/index.html" ]; then
    cp dist/index.html "$APP_DIR/"
    echo -e "${GREEN}✓ index.html скопирован${NC}"
elif [ -f "index.html" ]; then
    cp index.html "$APP_DIR/"
    echo -e "${GREEN}✓ index.html скопирован${NC}"
else
    echo -e "${RED}Ошибка: index.html не найден${NC}"
    exit 1
fi

# Шаг 4: Копирование PHP скрипта
echo -e "${BLUE}[4/6] Копирование PHP скрипта...${NC}"
if [ -f "server/api/submit.php" ]; then
    cp server/api/submit.php "$APP_DIR/api/"
    echo -e "${GREEN}✓ submit.php скопирован${NC}"
else
    echo -e "${RED}Ошибка: submit.php не найден${NC}"
    exit 1
fi

# Шаг 5: Создание nginx конфигурации
echo -e "${BLUE}[5/6] Создание конфигурации nginx...${NC}"

# Определяем сокет PHP-FPM
PHP_SOCK=""
if [ -S /var/run/php/php8.2-fpm.sock ]; then
    PHP_SOCK="unix:/var/run/php/php8.2-fpm.sock"
elif [ -S /var/run/php/php8.1-fpm.sock ]; then
    PHP_SOCK="unix:/var/run/php/php8.1-fpm.sock"
elif [ -S /var/run/php/php8.0-fpm.sock ]; then
    PHP_SOCK="unix:/var/run/php/php8.0-fpm.sock"
elif [ -S /var/run/php/php7.4-fpm.sock ]; then
    PHP_SOCK="unix:/var/run/php/php7.4-fpm.sock"
else
    PHP_SOCK="unix:/var/run/php/php-fpm.sock"
fi

cat > "$NGINX_CONF" << EOF
server {
    listen 80;
    server_name 194.87.103.77;

    root /var/www/html/results;
    index index.html;

    # API endpoint для записи в CSV
    location /api/submit {
        # CORS заголовки
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type' always;

        # Обработка preflight запроса
        if (\$request_method = 'OPTIONS') {
            return 204;
        }

        # Передача запроса в PHP
        fastcgi_pass $PHP_SOCK;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME \$document_root/api/submit.php;
        include fastcgi_params;
    }

    # Статические файлы
    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

echo -e "${GREEN}✓ Конфигурация создана: $NGINX_CONF${NC}"
echo -e "${YELLOW}  Используется сокет: $PHP_SOCK${NC}"

# Шаг 6: Настройка прав
echo -e "${BLUE}[6/6] Настройка прав доступа...${NC}"
chown -R www-www-data:www-data "$APP_DIR"
chmod 755 "$APP_DIR"
chmod 755 "$APP_DIR/api"
chmod 644 "$APP_DIR/index.html"
chmod 644 "$APP_DIR/api/submit.php"
echo -e "${GREEN}✓ Права установлены${NC}"

# Проверка и перезапуск
echo ""
echo -e "${BLUE}Проверка конфигурации...${NC}"
if nginx -t 2>&1; then
    systemctl reload nginx
    echo -e "${GREEN}✓ Nginx перезапущен${NC}"
else
    echo -e "${RED}Ошибка в конфигурации nginx${NC}"
    exit 1
fi

# Итог
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Установка завершена успешно!          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "Приложение доступно по адресу:"
echo -e "${YELLOW}http://194.87.103.77/${NC}"
echo ""
echo -e "Файл с данными:"
echo -e "${YELLOW}/var/www/html/results/archive.csv${NC}"
echo ""
echo -e "Логи:"
echo -e "${YELLOW}sudo tail -f /var/log/nginx/error.log${NC}"
echo ""

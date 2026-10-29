#!/bin/bash
# ============================================
# Скрипт автоматической установки Student Tracker
# Запуск: sudo bash install.sh
# ============================================

set -e

# Цвета
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Student Tracker - Установка           ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════╝${NC}"
echo ""

# Проверка root прав
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Ошибка: Запустите скрипт с правами root${NC}"
    echo "Использование: sudo bash install.sh"
    exit 1
fi

# Путь к файлам приложения
APP_DIR="/var/www/html/results"
NGINX_CONF="/etc/nginx/conf.d/student-tracker.conf"

# Шаг 1: Установка OpenResty
echo -e "${BLUE}[1/6] Установка OpenResty...${NC}"
if command -v openresty &> /dev/null; then
    echo -e "${GREEN}✓ OpenResty уже установлен${NC}"
else
    # Определяем ОС
    if [ -f /etc/debian_version ]; then
        apt-get update -qq
        apt-get install -y -qq --no-install-recommends \
            wget gnupg ca-certificates lsb-release
        
        wget -qO - https://openresty.org/package/pubkey.gpg | apt-key add -
        echo "deb http://openresty.org/package/ubuntu $(lsb_release -sc) main" \
            > /etc/apt/sources.list.d/openresty.list
        
        apt-get update -qq
        apt-get install -y -qq openresty
    elif [ -f /etc/redhat-release ]; then
        yum install -y -q wget
        wget -qO /etc/yum.repos.d/openresty.repo \
            https://openresty.org/package/centos/openresty.repo
        yum install -y -q openresty
    else
        echo -e "${RED}Неподдерживаемая ОС${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ OpenResty установлен${NC}"
fi

# Шаг 2: Создание директории
echo -e "${BLUE}[2/6] Создание директории приложения...${NC}"
mkdir -p "$APP_DIR"
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

# Шаг 4: Создание nginx конфигурации
echo -e "${BLUE}[4/6] Создание конфигурации nginx...${NC}"
cat > "$NGINX_CONF" << 'EOF'
server {
    listen 80;
    server_name 194.87.103.77;

    root /var/www/html/results;
    index index.html;

    # API endpoint для записи в CSV
    location /api/submit {
        limit_except POST OPTIONS {
            deny all;
        }

        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type' always;

        if ($request_method = 'OPTIONS') {
            return 204;
        }

        content_by_lua_block {
            local file_path = "/var/www/html/results/archive.csv"
            
            ngx.req.read_body()
            local data = ngx.req.get_body_data()
            
            if not data or data == "" then
                ngx.status = 400
                ngx.say('{"success":false,"message":"No data"}')
                return
            end
            
            local file = io.open(file_path, "r")
            if not file then
                file = io.open(file_path, "w")
                if file then
                    file:write("Student ID,Activity,Grade,Comment,Date/Time\n")
                    file:close()
                else
                    ngx.status = 500
                    ngx.say('{"success":false,"message":"Cannot create file"}')
                    return
                end
            else
                file:close()
            end
            
            file = io.open(file_path, "a")
            if not file then
                ngx.status = 500
                ngx.say('{"success":false,"message":"Cannot open file"}')
                return
            end
            
            file:write(data .. "\n")
            file:close()
            
            ngx.header["Content-Type"] = "application/json"
            ngx.say('{"success":true}')
        }
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF
echo -e "${GREEN}✓ Конфигурация создана: $NGINX_CONF${NC}"

# Шаг 5: Настройка прав
echo -e "${BLUE}[5/6] Настройка прав доступа...${NC}"
# Определяем пользователя nginx
NGINX_USER=$(grep -m1 'user' /usr/local/openresty/nginx/conf/nginx.conf 2>/dev/null | awk '{print $2}' | tr -d ';')
if [ -z "$NGINX_USER" ]; then
    NGINX_USER="nobody"
fi

chown -R $NGINX_USER:$NGINX_USER "$APP_DIR" 2>/dev/null || \
chown -R www-data:www-data "$APP_DIR" 2>/dev/null || \
chmod -R 777 "$APP_DIR"

chmod 755 "$APP_DIR"
echo -e "${GREEN}✓ Права установлены${NC}"

# Шаг 6: Проверка и перезапуск
echo -e "${BLUE}[6/6] Проверка и перезапуск nginx...${NC}"
if /usr/local/openresty/bin/openresty -t 2>&1; then
    systemctl reload openresty 2>/dev/null || \
    /usr/local/openresty/bin/openresty -s reload 2>/dev/null || \
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
echo -e "${YELLOW}sudo tail -f /usr/local/openresty/nginx/logs/error.log${NC}"
echo ""

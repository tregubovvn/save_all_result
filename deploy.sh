#!/bin/bash
# ============================================
# Скрипт деплоя Student Tracker
# ============================================
# Использование: ./deploy.sh [user@host] [path]
#
# Примеры:
#   ./deploy.sh user@194.87.103.77 /var/www/html/results
#   ./deploy.sh root@194.87.103.77 /var/www/student-tracker
# ============================================

# Цвета для вывода
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Параметры по умолчанию
SERVER=${1:-"user@194.87.103.77"}
REMOTE_PATH=${2:-"/var/www/html/results"}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Student Tracker - Deploy Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Сервер: ${GREEN}$SERVER${NC}"
echo -e "Путь:   ${GREEN}$REMOTE_PATH${NC}"
echo ""

# Проверяем наличие dist директории
if [ ! -d "dist" ]; then
    echo -e "${RED}Ошибка: Директория dist не найдена!${NC}"
    echo "Сначала выполните: npm run build"
    exit 1
fi

# Шаг 1: Создание удалённой директории
echo -e "${BLUE}[1/5] Создание директории на сервере...${NC}"
ssh $SERVER "mkdir -p $REMOTE_PATH/api $REMOTE_PATH/data $REMOTE_PATH/css $REMOTE_PATH/js"
echo -e "${GREEN}✓ Директория создана${NC}"

# Шаг 2: Копирование HTML и статики
echo -e "${BLUE}[2/5] Копирование файлов приложения...${NC}"
scp -r dist/* $SERVER:$REMOTE_PATH/
echo -e "${GREEN}✓ Файлы скопированы${NC}"

# Шаг 3: Копирование PHP API
echo -e "${BLUE}[3/5] Копирование API скриптов...${NC}"
scp server/api/submit.php $SERVER:$REMOTE_PATH/api/
scp server/.htaccess $SERVER:$REMOTE_PATH/
echo -e "${GREEN}✓ API скопированы${NC}"

# Шаг 4: Настройка прав
echo -e "${BLUE}[4/5] Настройка прав доступа...${NC}"
ssh $SERVER "chmod 755 $REMOTE_PATH/data"
ssh $SERVER "chmod 644 $REMOTE_PATH/api/submit.php"
echo -e "${GREEN}✓ Права установлены${NC}"

# Шаг 5: Проверка
echo -e "${BLUE}[5/5] Проверка развёртывания...${NC}"
ssh $SERVER "ls -la $REMOTE_PATH/"
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Деплой завершён успешно!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Приложение доступно по адресу:"
echo -e "${BLUE}http://194.87.103.77/results/${NC}"
echo ""
echo -e "Не забудьте настроить в приложении:"
echo -e "  URL сервера: ${GREEN}http://194.87.103.77/results/${NC}"
echo -e "  Имя CSV файла: ${GREEN}archive.csv${NC} (или другое)"
echo ""

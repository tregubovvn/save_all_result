# Пошаговая настройка сервера 194.87.103.77

## Способ 1: Автоматическая установка (рекомендуется)

### 1. Подключитесь к серверу по SSH

```bash
ssh root@194.87.103.77
```

### 2. Скачайте проект

```bash
# Если у вас есть git
git clone <your-repo-url>
cd student-tracker

# Или скопируйте файлы вручную через SCP с локальной машины:
# scp -r . root@194.87.103.77:/root/student-tracker
```

### 3. Запустите скрипт установки

```bash
sudo bash install.sh
```

Скрипт автоматически:
- Установит OpenResty (если не установлен)
- Создаст директорию `/var/www/html/results`
- Скопирует `index.html`
- Создаст конфигурацию nginx
- Настроит права доступа
- Перезапустит nginx

### 4. Готово!

Откройте в браузере: **http://194.87.103.77/**

---

## Способ 2: Ручная установка

### Шаг 1: Подключение к серверу

```bash
ssh root@194.87.103.77
```

### Шаг 2: Установка OpenResty

**Для Ubuntu/Debian:**

```bash
# Обновление пакетов
apt-get update

# Установка зависимостей
apt-get install -y wget gnupg ca-certificates lsb-release

# Добавление репозитория OpenResty
wget -O - https://openresty.org/package/pubkey.gpg | apt-key add -
echo "deb http://openresty.org/package/ubuntu $(lsb_release -sc) main" \
    > /etc/apt/sources.list.d/openresty.list

# Установка OpenResty
apt-get update
apt-get install -y openresty
```

**Для CentOS/RHEL:**

```bash
yum install -y wget
wget -O /etc/yum.repos.d/openresty.repo \
    https://openresty.org/package/centos/openresty.repo
yum install -y openresty
```

### Шаг 3: Создание директории приложения

```bash
mkdir -p /var/www/html/results
```

### Шаг 4: Копирование файлов

**С локальной машины:**

```bash
# Копирование index.html
scp dist/index.html root@194.87.103.77:/var/www/html/results/

# Или если собрали на сервере:
cp index.html /var/www/html/results/
```

**На сервере:**

```bash
# Проверьте что файл на месте
ls -la /var/www/html/results/index.html
```

### Шаг 5: Создание конфигурации nginx

```bash
nano /etc/nginx/conf.d/student-tracker.conf
```

Вставьте следующий код:

```nginx
server {
    listen 80;
    server_name 194.87.103.77;

    root /var/www/html/results;
    index index.html;

    # API endpoint для записи в CSV
    location /api/submit {
        # Разрешаем только POST и OPTIONS
        limit_except POST OPTIONS {
            deny all;
        }

        # CORS заголовки
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type' always;

        # Обработка preflight запроса
        if ($request_method = 'OPTIONS') {
            return 204;
        }

        # Lua скрипт для записи в CSV
        content_by_lua_block {
            local file_path = "/var/www/html/results/archive.csv"
            
            -- Читаем тело запроса
            ngx.req.read_body()
            local data = ngx.req.get_body_data()
            
            if not data or data == "" then
                ngx.status = 400
                ngx.say('{"success":false,"message":"No data"}')
                return
            end
            
            -- Проверяем существование файла
            local file = io.open(file_path, "r")
            if not file then
                -- Создаём файл с заголовком
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
            
            -- Дописываем данные в файл
            file = io.open(file_path, "a")
            if not file then
                ngx.status = 500
                ngx.say('{"success":false,"message":"Cannot open file"}')
                return
            end
            
            file:write(data .. "\n")
            file:close()
            
            -- Успешный ответ
            ngx.header["Content-Type"] = "application/json"
            ngx.say('{"success":true}')
        }
    }

    # Статические файлы
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Сохраните файл (Ctrl+O, Enter, Ctrl+X в nano).

### Шаг 6: Настройка прав доступа

```bash
# Определяем пользователя nginx
NGINX_USER=$(grep -m1 'user' /usr/local/openresty/nginx/conf/nginx.conf | awk '{print $2}' | tr -d ';')

# Устанавливаем права
chown -R $NGINX_USER:$NGINX_USER /var/www/html/results
chmod 755 /var/www/html/results

# Или если не работает:
chmod 777 /var/www/html/results
```

### Шаг 7: Проверка конфигурации

```bash
# Проверяем синтаксис конфигурации
/usr/local/openresty/bin/openresty -t
```

Должно вывести:
```
nginx: the configuration file /usr/local/openresty/nginx/conf/nginx.conf syntax is ok
nginx: configuration file /usr/local/openresty/nginx/conf/nginx.conf test is successful
```

### Шаг 8: Перезапуск nginx

```bash
# Вариант 1: через systemctl
systemctl reload openresty

# Вариант 2: через openresty напрямую
/usr/local/openresty/bin/openresty -s reload

# Вариант 3: полный перезапуск
systemctl restart openresty
```

### Шаг 9: Проверка работы

```bash
# Проверьте что nginx запущен
systemctl status openresty

# Должно быть: active (running)
```

---

## Проверка работоспособности

### 1. Откройте браузер

Перейдите по адресу: **http://194.87.103.77/**

Должна открыться форма Student Tracker.

### 2. Сделайте тестовую запись

1. Введите ИД студента: `TEST001`
2. Введите активность: `Тестовая запись`
3. Выберите оценку: `5`
4. Введите комментарий: `Проверка работы`
5. Нажмите "Отправить"

Должно появиться сообщение: **"✓ Запись сохранена!"**

### 3. Проверьте файл CSV

```bash
# На сервере
cat /var/www/html/results/archive.csv
```

Должно вывести:
```csv
Student ID,Activity,Grade,Comment,Date/Time
"TEST001","Тестовая запись","5","Проверка работы","2024-01-15T10:30:00.000Z"
```

---

## Диагностика проблем

### Проблема: Сайт не открывается

**Проверка 1: Nginx запущен?**
```bash
systemctl status openresty
```

Если не запущен:
```bash
systemctl start openresty
```

**Проверка 2: Порт 80 открыт?**
```bash
netstat -tlnp | grep :80
```

Должно показать что nginx слушает порт 80.

**Проверка 3: Firewall?**
```bash
# Для UFW
ufw allow 80/tcp

# Для iptables
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
```

### Проблема: Ошибка 403 Forbidden

**Решение: Проверьте права доступа**
```bash
# Убедитесь что nginx может читать файлы
ls -la /var/www/html/results/

# Исправьте права
chmod 755 /var/www/html/results
chmod 644 /var/www/html/results/index.html

# Или временно для теста:
chmod 777 /var/www/html/results
```

### Проблема: Ошибка 500 при отправке формы

**Проверка 1: Логи nginx**
```bash
tail -f /usr/local/openresty/nginx/logs/error.log
```

**Проверка 2: Права на запись**
```bash
# Nginx должен иметь право записи в директорию
chown -R nobody:nogroup /var/www/html/results
chmod 755 /var/www/html/results
```

**Проверка 3: Lua модуль загружен?**
```bash
/usr/local/openresty/bin/openresty -V 2>&1 | grep lua
```

Должно содержать: `--with-luajit`

### Проблема: CORS ошибка в браузере

**Решение: Проверьте конфигурацию nginx**

Убедитесь что в `/etc/nginx/conf.d/student-tracker.conf` есть:
```nginx
add_header 'Access-Control-Allow-Origin' '*' always;
add_header 'Access-Control-Allow-Methods' 'POST, OPTIONS' always;
add_header 'Access-Control-Allow-Headers' 'Content-Type' always;
```

Перезапустите nginx:
```bash
systemctl reload openresty
```

---

## Полезные команды

### Просмотр логов в реальном времени
```bash
# Ошибки nginx
tail -f /usr/local/openresty/nginx/logs/error.log

# Доступы
tail -f /usr/local/openresty/nginx/logs/access.log
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

### Управление OpenResty
```bash
# Статус
systemctl status openresty

# Перезапуск
systemctl restart openresty

# Перезагрузка конфигурации
systemctl reload openresty

# Остановка
systemctl stop openresty

# Запуск
systemctl start openresty
```

### Проверка конфигурации
```bash
/usr/local/openresty/bin/openresty -t
```

---

## Обновление приложения

Если вы изменили `index.html`, просто скопируйте новую версию:

```bash
# С локальной машины
scp dist/index.html root@194.87.103.77:/var/www/html/results/

# Или на сервере
cp /path/to/new/index.html /var/www/html/results/
```

Перезапуск nginx не требуется - изменения применятся сразу.

---

## Безопасность (опционально)

### Ограничение доступа по IP

Отредактируйте `/etc/nginx/conf.d/student-tracker.conf`:

```nginx
server {
    listen 80;
    server_name 194.87.103.77;

    # Разрешить только с определённых IP
    allow 192.168.1.0/24;  # Ваша подсеть
    allow 10.0.0.5;        # Конкретный IP
    deny all;              # Запретить остальным

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

---

## Поддержка

Если возникли проблемы:

1. Проверьте логи: `tail -f /usr/local/openresty/nginx/logs/error.log`
2. Проверьте конфигурацию: `/usr/local/openresty/bin/openresty -t`
3. Убедитесь что OpenResty запущен: `systemctl status openresty`
4. Проверьте права доступа: `ls -la /var/www/html/results/`

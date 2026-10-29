# Student Tracker

Простое приложение для записи оценок студентов в CSV файл. Работает с OpenResty (nginx + Lua).

## Структура

```
├── index.html              # Приложение (HTML + CSS + JS)
├── server/
│   └── nginx.conf          # Конфигурация OpenResty
└── README.md
```

## Установка на сервер 194.87.103.77

### 1. Сборка

```bash
npm run build
```

### 2. Установка OpenResty

```bash
# Ubuntu/Debian
wget -O - https://openresty.org/package/pubkey.gpg | sudo apt-key add -
echo "deb http://openresty.org/package/ubuntu $(lsb_release -sc) main" | sudo tee /etc/apt/sources.list.d/openresty.list
sudo apt-get update
sudo apt-get install -y openresty
```

### 3. Копирование файлов

```bash
# Создаём директорию
ssh user@194.87.103.77 "sudo mkdir -p /var/www/html/results"

# Копируем index.html
scp dist/index.html user@194.87.103.77:/var/www/html/results/

# Копируем конфигурацию nginx
scp server/nginx.conf user@194.87.103.77:/tmp/student-tracker.conf
```

### 4. Настройка OpenResty

```bash
# На сервере
ssh user@194.87.103.77

# Копируем конфигурацию
sudo cp /tmp/student-tracker.conf /usr/local/openresty/nginx/conf/nginx.conf

# Или включаем как сайт:
sudo cp /tmp/student-tracker.conf /usr/local/openresty/nginx/conf/sites-enabled/student-tracker.conf

# Проверяем конфигурацию
sudo /usr/local/openresty/bin/openresty -t

# Перезапускаем OpenResty
sudo systemctl reload openresty
```

### 5. Права доступа

```bash
# Даём права на запись в директорию
sudo chown -R nobody:nogroup /var/www/html/results
sudo chmod 755 /var/www/html/results
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

- OpenResty (nginx + Lua модуль)
- Права на запись в директорию `/var/www/html/results/`

## Проверка работы

```bash
# Проверьте, что файл создаётся
ls -la /var/www/html/results/archive.csv

# Посмотрите содержимое
cat /var/www/html/results/archive.csv

# Проверьте логи OpenResty
sudo tail -f /usr/local/openresty/nginx/logs/error.log
```

## Troubleshooting

**Ошибка 403 Forbidden:**
```bash
sudo chown -R nobody:nogroup /var/www/html/results
sudo chmod 755 /var/www/html/results
```

**Ошибка 500 Internal Server Error:**
```bash
# Проверьте логи
sudo tail -f /usr/local/openresty/nginx/logs/error.log

# Убедитесь что OpenResty запущен
sudo systemctl status openresty
```

**Lua модуль не загружен:**
```bash
# Проверьте что OpenResty установлен правильно
/usr/local/openresty/bin/openresty -V

# Должен содержать: --with-luajit
```

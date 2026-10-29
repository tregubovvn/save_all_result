# Student Tracker

Простое приложение для записи оценок студентов в CSV файл.

## Установка

### 1. Сборка

```bash
npm install
npm run build
```

### 2. Деплой на сервер 194.87.103.77

```bash
# Скопируйте index.html на сервер
scp dist/index.html user@194.87.103.77:/var/www/html/results/

# Создайте директорию и установите права
ssh user@194.87.103.77 "mkdir -p /var/www/html/results && chmod 755 /var/www/html/results"
```

### 3. Настройка nginx

```bash
# Скопируйте конфигурацию
sudo cp server/nginx-simple.conf /etc/nginx/conf.d/student-tracker.conf

# Проверьте и перезапустите
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Создайте файл archive.csv

```bash
# На сервере
sudo touch /var/www/html/results/archive.csv
sudo chmod 666 /var/www/html/results/archive.csv
echo "Student ID,Activity,Grade,Comment,Date/Time" | sudo tee /var/www/html/results/archive.csv
```

## Использование

1. Откройте `http://194.87.103.77/results/` в браузере
2. Введите ИД студента (или отсканируйте QR-код)
3. Введите название активности
4. Выберите оценку (0-5)
5. Добавьте комментарий (опционально)
6. Нажмите "Отправить"

Данные автоматически записываются в файл `archive.csv` на сервере.

## Формат CSV

```csv
Student ID,Activity,Grade,Comment,Date/Time
"STU001","Лабораторная работа","5","Отличная работа","2024-01-15T10:30:00.000Z"
```

## Требования

- Nginx с модулем lua-nginx-module (OpenResty)
- Права на запись в директорию `/var/www/html/results/`

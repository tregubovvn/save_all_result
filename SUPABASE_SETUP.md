# Настройка Supabase для Student Tracker

## Шаг 1: Создание таблицы в Supabase

1. Откройте https://supabase.com/dashboard/
2. Войдите в ваш проект: `nfoynqfjkvgtqsgwxves`
3. Перейдите в **SQL Editor** (иконка терминала слева)
4. Выполните следующий SQL:

```sql
-- Создание таблицы для записей студентов
CREATE TABLE records (
  id BIGSERIAL PRIMARY KEY,
  student_id TEXT NOT NULL,
  activity TEXT NOT NULL,
  grade TEXT NOT NULL,
  comment TEXT,
  date_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Добавление индекса для быстрого поиска
CREATE INDEX idx_records_student_id ON records(student_id);
CREATE INDEX idx_records_date_time ON records(date_time);

-- Разрешение вставки для анонимных пользователей
ALTER TABLE records ENABLE ROW LEVEL SECURITY;

-- Политика: разрешить вставку всем (анонимно)
CREATE POLICY "Allow anonymous inserts"
  ON records FOR INSERT
  TO anon
  WITH CHECK (true);

-- Политика: разрешить чтение всем (опционально)
CREATE POLICY "Allow anonymous reads"
  ON records FOR SELECT
  TO anon
  USING (true);
```

## Шаг 2: Получение API ключа

1. Перейдите в **Settings** → **API**
2. Скопируйте **anon public** ключ
3. Он выглядит так: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## Шаг 3: Использование в приложении

### Вариант A: Через URL параметры

```html
<iframe src="index.html?supabaseUrl=https://nfoynqfjkvgtqsgwxves.supabase.co&supabaseKey=YOUR_ANON_KEY"></iframe>
```

### Вариант B: Через JavaScript

```javascript
const tracker = iframe.contentWindow.StudentTracker;
tracker.setConfig({
  supabaseUrl: 'https://nfoynqfjkvgtqsgwxves.supabase.co',
  supabaseKey: 'YOUR_ANON_KEY'
});
```

### Вариант C: Прямая настройка в index.html

Откройте `index.html` и найдите строку:
```javascript
supabaseKey: '', // Нужно указать anon key из Supabase
```

Замените на:
```javascript
supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
```

## Шаг 4: Проверка работы

1. Откройте приложение
2. Заполните форму
3. Нажмите "Отправить"
4. В Supabase Dashboard → **Table Editor** → **records** должна появиться новая запись

## Просмотр данных

### Через Supabase Dashboard

1. Перейдите в **Table Editor**
2. Выберите таблицу **records**
3. Все записи отображаются в таблице

### Через SQL

```sql
-- Все записи
SELECT * FROM records ORDER BY date_time DESC;

-- Записи за сегодня
SELECT * FROM records 
WHERE date_time >= CURRENT_DATE 
ORDER BY date_time DESC;

-- Статистика оценок
SELECT grade, COUNT(*) as count 
FROM records 
GROUP BY grade 
ORDER BY grade DESC;

-- Экспорт в CSV (через Supabase Dashboard)
-- Table Editor → records → Export → CSV
```

### Через REST API

```bash
# Получить все записи
curl 'https://nfoynqfjkvgtqsgwxves.supabase.co/rest/v1/records?select=*' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'Authorization: Bearer YOUR_ANON_KEY'

# Получить записи конкретного студента
curl 'https://nfoynqfjkvgtqsgwxves.supabase.co/rest/v1/records?student_id=eq.STU001' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'Authorization: Bearer YOUR_ANON_KEY'
```

## Структура таблицы

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | BIGSERIAL | Автоматический ID |
| `student_id` | TEXT | ИД студента |
| `activity` | TEXT | Название активности |
| `grade` | TEXT | Оценка (0-5) |
| `comment` | TEXT | Комментарий |
| `date_time` | TIMESTAMPTZ | Дата и время записи |
| `created_at` | TIMESTAMPTZ | Когда создана запись в БД |

## Безопасность

### Анонимный доступ (текущая настройка)

Текущая конфигурация разрешает анонимную вставку данных. Это подходит для:
- Внутренних инструментов
- Прототипов
- Когда данные не критичны

### Ограничение доступа

Для продакшена рекомендуется:

```sql
-- Удалить анонимные политики
DROP POLICY "Allow anonymous inserts" ON records;
DROP POLICY "Allow anonymous reads" ON records;

-- Создать политику только для аутентифицированных пользователей
CREATE POLICY "Allow authenticated inserts"
  ON records FOR INSERT
  TO authenticated
  WITH CHECK (true);
```

Тогда нужно будет использовать сервисный ключ или аутентификацию.

## Экспорт данных

### В CSV через Supabase

1. Table Editor → records
2. Нажмите кнопку **Export** (справа вверху)
3. Выберите формат CSV
4. Скачайте файл

### Через SQL запрос

```sql
-- Копируйте результат и сохраните как CSV
SELECT 
  student_id,
  activity,
  grade,
  comment,
  date_time
FROM records
ORDER BY date_time DESC;
```

## Лимиты бесплатного плана Supabase

- **База данных**: 500 МБ
- **Хранилище**: 1 ГБ
- **Bandwidth**: 2 ГБ/месяц
- **API запросы**: Без ограничений
- **Проекты**: До 2 активных

Для вашего приложения (текстовые записи) этого более чем достаточно на годы использования.

## Дополнительные возможности

### Realtime подписки

Можно получать уведомления о новых записях в реальном времени:

```javascript
const supabase = createClient(supabaseUrl, supabaseKey);

supabase
  .channel('records')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'records' },
    (payload) => {
      console.log('Новая запись:', payload.new);
    }
  )
  .subscribe();
```

### Аутентификация пользователей

Supabase поддерживает аутентификацию:

```javascript
// Регистрация
await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
});

// Вход
await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});
```

## Поддержка

Документация Supabase: https://supabase.com/docs

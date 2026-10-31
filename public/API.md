# Student API

Простой JavaScript API для сохранения оценок студентов из любой HTML страницы.

## 🚀 Быстрый старт

### 1. Подключите API

Добавьте эту строку в вашу HTML страницу:

```html
<script src="https://tregubovvn.github.io/save_all_result/public/api.js"></script>
```

### 2. Используйте API

```javascript
// Сохранить запись
StudentAPI.save({
  studentId: 'STU001',
  activity: 'Лабораторная работа',
  grade: '5',
  comment: 'Отличная работа'
}).then(result => {
  if (result.success) {
    console.log('Сохранено!', result.record);
  } else {
    console.error('Ошибка:', result.message);
  }
});
```

## 📖 Методы API

### `StudentAPI.save(data)`

Сохранить новую запись в базу данных.

**Параметры:**
- `data` (object):
  - `studentId` (string, обязательно) - ИД студента
  - `activity` (string, обязательно) - Название активности
  - `grade` (string, обязательно) - Оценка (0-5)
  - `comment` (string, опционально) - Комментарий

**Возвращает:** `Promise<{success: boolean, message: string, record?: object}>`

**Пример:**
```javascript
StudentAPI.save({
  studentId: 'STU001',
  activity: 'Курсовая работа',
  grade: '4',
  comment: 'Хорошая работа, но есть замечания'
}).then(result => {
  if (result.success) {
    alert('Запись сохранена!');
    console.log('Данные:', result.record);
  } else {
    alert('Ошибка: ' + result.message);
  }
});
```

### `StudentAPI.getRecords(studentId)`

Получить все записи для конкретного студента.

**Параметры:**
- `studentId` (string) - ИД студента

**Возвращает:** `Promise<Array>` - массив записей

**Пример:**
```javascript
StudentAPI.getRecords('STU001').then(records => {
  console.log('Найдено записей:', records.length);
  records.forEach(r => {
    console.log(`${r.activity}: ${r.grade}`);
  });
});
```

### `StudentAPI.deleteRecord(id)`

Удалить запись по ID.

**Параметры:**
- `id` (number) - ID записи в базе данных

**Возвращает:** `Promise<{success: boolean, message: string}>`

**Пример:**
```javascript
StudentAPI.deleteRecord(123).then(result => {
  if (result.success) {
    console.log('Запись удалена');
  } else {
    console.error('Ошибка:', result.message);
  }
});
```

### `StudentAPI.getStudentPageUrl(studentId)`

Получить URL страницы с результатами студента.

**Параметры:**
- `studentId` (string) - ИД студента

**Возвращает:** `string` - полный URL

**Пример:**
```javascript
const url = StudentAPI.getStudentPageUrl('STU001');
console.log('Страница студента:', url);
// https://tregubovvn.github.io/save_all_result/public/student.html?id=STU001

// Открыть в новой вкладке
window.open(url, '_blank');
```

## 🎯 Примеры использования

### Пример 1: Простая форма

```html
<!DOCTYPE html>
<html>
<head>
  <title>Сохранение оценки</title>
  <script src="https://tregubovvn.github.io/save_all_result/public/api.js"></script>
</head>
<body>
  <h1>Сохранить оценку</h1>
  
  <form id="gradeForm">
    <input type="text" id="studentId" placeholder="ИД студента" required>
    <input type="text" id="activity" placeholder="Активность" required>
    <input type="number" id="grade" min="0" max="5" placeholder="Оценка" required>
    <textarea id="comment" placeholder="Комментарий"></textarea>
    <button type="submit">Сохранить</button>
  </form>

  <script>
    document.getElementById('gradeForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const result = await StudentAPI.save({
        studentId: document.getElementById('studentId').value,
        activity: document.getElementById('activity').value,
        grade: document.getElementById('grade').value,
        comment: document.getElementById('comment').value
      });

      if (result.success) {
        alert('✓ Запись сохранена!');
        e.target.reset();
      } else {
        alert('✗ Ошибка: ' + result.message);
      }
    });
  </script>
</body>
</html>
```

### Пример 2: Интеграция с существующей системой

```javascript
// В вашей существующей системе после завершения активности
async function onActivityComplete(studentId, activityName, score) {
  const result = await StudentAPI.save({
    studentId: studentId,
    activity: activityName,
    grade: String(score),
    comment: 'Автоматически сохранено системой'
  });

  if (result.success) {
    // Показать ссылку на результаты
    const url = StudentAPI.getStudentPageUrl(studentId);
    console.log('Результаты:', url);
  }
}

// Использование
onActivityComplete('STU001', 'Тест по математике', 5);
```

### Пример 3: Массовое сохранение

```javascript
const students = [
  { id: 'STU001', name: 'Иванов', grade: 5 },
  { id: 'STU002', name: 'Петров', grade: 4 },
  { id: 'STU003', name: 'Сидоров', grade: 3 }
];

async function saveAllGrades() {
  for (const student of students) {
    const result = await StudentAPI.save({
      studentId: student.id,
      activity: 'Экзамен',
      grade: String(student.grade)
    });
    
    console.log(`${student.name}: ${result.success ? '✓' : '✗'}`);
    
    // Задержка чтобы не превысить лимит
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

saveAllGrades();
```

### Пример 4: Получение и отображение результатов

```html
<div id="results"></div>

<script>
async function showStudentResults(studentId) {
  const records = await StudentAPI.getRecords(studentId);
  
  const html = records.map(r => `
    <div class="record">
      <strong>${r.activity}</strong>: ${r.grade}<br>
      <small>${new Date(r.date_time).toLocaleString('ru-RU')}</small>
    </div>
  `).join('');
  
  document.getElementById('results').innerHTML = html;
}

showStudentResults('STU001');
</script>
```

## ⚠️ Ограничения

### Лимит по времени

Для одного студента можно сохранять записи не чаще **одного раза в 10 минут**. Это защита от случайных дубликатов.

Если попытаться сохранить чаще, API вернёт ошибку:

```javascript
{
  success: false,
  message: 'Для студента STU001 можно сохранять не чаще раза в 10 минут. Подождите ещё 7 мин.'
}
```

### CORS

API поддерживает CORS, поэтому его можно использовать с любого домена.

## 🔧 Локальная разработка

Для локальной разработки скачайте `api.js` и разместите его рядом с вашей HTML страницей:

```html
<script src="api.js"></script>
```

## 📊 Просмотр данных

Все сохранённые данные можно посмотреть:

1. **Dashboard** - общая аналитика
   - https://tregubovvn.github.io/save_all_result/public/dashboard.html

2. **Результаты студента** - по ИД
   - https://tregubovvn.github.io/save_all_result/public/student.html?id=STU001

3. **Supabase Dashboard** - прямой доступ к базе
   - https://nfoynqfjkvgtqsgwxves.supabase.co

## 💡 Советы

1. **Валидация данных** - проверяйте данные перед отправкой
2. **Обработка ошибок** - всегда проверяйте `result.success`
3. **Ограничение по времени** - учитывайте лимит 10 минут
4. **Кэширование** - кэшируйте результаты `getRecords()` если нужно часто обращаться

## 📝 Лицензия

MIT

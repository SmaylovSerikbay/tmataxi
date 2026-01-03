# ⚙️ Настройки Vercel для исправления 404

## Проблема
Получаете 404 на главной странице.

## Решение: Настройте в Vercel Dashboard

### Шаг 1: Откройте настройки проекта

1. Зайдите в **Vercel Dashboard**
2. Откройте проект **tmataxikz**
3. Перейдите в **Settings** → **General**

### Шаг 2: Настройте Build & Development Settings

**ВАЖНО**: Убедитесь, что настройки точно такие:

```
Framework Preset: Other
Root Directory: ./
Build Command: cd frontend && npm install && npm run build
Output Directory: frontend/build
Install Command: (оставьте пустым)
```

### Шаг 3: Сохраните и пересоберите

1. Нажмите **Save**
2. Перейдите в **Deployments**
3. Нажмите на последний деплой → **Redeploy**

### Альтернативный вариант (если не помогает)

Если проблема сохраняется, попробуйте:

1. **Settings** → **General**:
   ```
   Root Directory: frontend
   Build Command: npm install && npm run build
   Output Directory: build
   ```

2. Обновите `vercel.json` (уже обновлен - убраны builds)

3. **Redeploy**

## Проверка после деплоя

1. **API**: `https://tmataxikz.vercel.app/api/health`
   - Должен вернуть: `{"status":"ok"}`

2. **Главная**: `https://tmataxikz.vercel.app/`
   - Должна открыться страница приложения

## Если все еще 404

Проверьте логи деплоя:
1. Откройте последний деплой
2. Посмотрите **Build Logs**
3. Убедитесь, что:
   - ✅ `frontend/build` создана
   - ✅ В ней есть `index.html`
   - ✅ Нет ошибок сборки

## Структура после сборки должна быть:

```
.vercel/
api/
frontend/
  build/
    index.html  ← этот файл должен быть!
    static/
      css/
      js/
vercel.json
```

Если `index.html` нет в `frontend/build` - проблема в сборке, не в конфигурации.


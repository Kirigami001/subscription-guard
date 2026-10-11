# Subscription Guard

Subscription Guard — сервис для управления подписками, контроля статуса подписок и защиты доступа к платным возможностям.

## Стек технологий

- Frontend: React + Vite
- Backend: Node.js + Express
- API: REST
- База данных: PostgreSQL / Prisma
- Авторизация: JWT (при необходимости)
- Контейнеризация: Docker (по желанию)

## Архитектура

- `frontend/` — интерфейс пользователя
- `backend/` — серверная логика и API
- `backend/prisma/` — схема и миграции базы данных
- `docs/` — документация и материалы проекта

## API

Ниже приведён базовый набор endpoints, который можно адаптировать под текущий проект:

### Пользовательские подписки

- `GET /api/subscriptions` — получение всех подписок пользователя
- `GET /api/subscriptions/:id` — получение информации о подписке
- `POST /api/subscriptions` — создание новой подписки
- `PUT /api/subscriptions/:id` — обновление подписки
- `DELETE /api/subscriptions/:id` — удаление подписки

### Статус и доступ

- `GET /api/subscriptions/status` — проверка статуса подписки
- `POST /api/subscriptions/activate` — активация подписки
- `POST /api/subscriptions/cancel` — отмена подписки

### Пример ответа

```json
{
  "id": "sub_123",
  "userId": "user_456",
  "plan": "premium",
  "status": "active",
  "renewalDate": "2026-11-01T00:00:00.000Z"
}
```

## Запуск проекта

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Документация

В папке `docs/` хранится проектная документация и материалы по заданию.

## Примечание

Если в проекте уже есть точные маршруты API, названия моделей или стек, их следует заменить на актуальные значения из рабочей версии приложения.

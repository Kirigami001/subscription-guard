# 🛡️ SubscriptionGuard

SubscriptionGuard — веб-сервис для централизованного учета, мониторинга и оптимизации регулярных подписок и цифровых сервисов.

## 🛠️ Стек технологий

- **Frontend:** React 18, Vite, Tailwind CSS, Lucide React (иконки)
- **Backend:** Node.js, Express.js, CORS, Dotenv
- **ORM & Database:** Prisma ORM, PostgreSQL (или SQLite для локальной разработки)
- **Документация:** OpenAPI / REST спецификация, Word-отчет (`/docs`)

---

## 📡 Спецификация REST API

Базовый URL: `/api/v1`

| Метод | Эндпоинт | Описание | Тело запроса (JSON) | Ответ (Код) |
|---|---|---|---|---|
| `GET` | `/health` | Проверка доступности сервиса | — | `{"status": "ok"}` (200) |
| `GET` | `/subscriptions` | Получение списка всех подписок | — | `[Subscription]` (200) |
| `GET` | `/subscriptions/:id` | Получение данных конкретной подписки | — | `Subscription` (200 / 404) |
| `POST` | `/subscriptions` | Добавление новой подписки | Обязательные поля: `title`, `amount`, `billingPeriod`, `nextPayment` | `Subscription` (201) |
| `PUT` | `/subscriptions/:id` | Редактирование существующей подписки | Поля для обновления (`title`, `amount`, `status` и др.) | `Subscription` (200) |
| `DELETE` | `/subscriptions/:id` | Удаление подписки | — | `{"message": "Deleted"}` (200) |
| `GET` | `/subscriptions/analytics/summary` | Сводная аналитика (сумма в месяц, активные подписки) | — | `{"monthlyTotal": 14200, "activeCount": 5}` (200) |

### Пример схемы Subscription (JSON)
```json
{
  "id": "clx...",
  "title": "Spotify Premium",
  "amount": 1500.0,
  "currency": "KZT",
  "billingPeriod": "MONTHLY",
  "category": "Entertainment",
  "nextPayment": "2026-11-01T00:00:00.000Z",
  "status": "ACTIVE"
}
```

---

## 📂 Структура репозитория

```text
subscription-guard/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       └── server.js
├── docs/
│   └── Lab2_SubscriptionGuard_Dokumentacia.docx
├── frontend/
│   └── src/
│       └── App.jsx
└── README.md
```

## 🚀 Запуск проекта локально

### Backend

```bash
cd backend
npm install
npx prisma db push
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 📋 Описание моделей данных

### User
- `id` — уникальный идентификатор (CUID)
- `email` — электронная почта (уникальная)
- `name` — имя пользователя
- `subscriptions` — связь с подписками
- `createdAt`, `updatedAt` — временные метки

### Subscription
- `id` — уникальный идентификатор (CUID)
- `title` — название сервиса/подписки
- `description` — описание (опционально)
- `amount` — стоимость
- `currency` — валюта (по умолчанию: KZT)
- `category` — категория (по умолчанию: General)
- `billingPeriod` — период платежа (WEEKLY, MONTHLY, YEARLY)
- `status` — статус (ACTIVE, PAUSED, CANCELED)
- `nextPayment` — дата следующего платежа
- `userId` — связь с пользователем
- `createdAt`, `updatedAt` — временные метки

---

## 🔧 Настройка окружения

Создайте файл `.env` в папке `backend/`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/subscription_guard"
PORT=5000
```

Для локальной разработки с SQLite:

```env
DATABASE_URL="file:./dev.db"
PORT=5000
```

---

## 📄 Документация

Проектная документация и отчеты расположены в папке `/docs`:
- `Lab2_SubscriptionGuard_Dokumentacia.docx` — полный отчет по проекту

---

## 📝 Лицензия

Проект создан как учебная работа.

# Subscription Guard

Subscription Guard — сервис для отслеживания и управления подписками. Он помогает видеть все активные платежи, контролировать ежемесячные расходы и своевременно планировать оплату.

## Stack

- Frontend: React
- Backend: Node.js + Express
- Database: PostgreSQL
- ORM: Prisma
- API: REST
- Styling: inline CSS / React components

## Project structure

```text
subscription-guard/
├── README.md
├── .gitignore
├── docs/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       └── server.js
└── frontend/
    └── src/
        └── App.jsx
```

## API

### Health check

- `GET /api/v1/health` — health status of the service

### Subscriptions

- `GET /api/v1/subscriptions` — get all subscriptions
- `GET /api/v1/subscriptions/:id` — get a subscription by ID
- `POST /api/v1/subscriptions` — create a new subscription
- `PUT /api/v1/subscriptions/:id` — update a subscription
- `DELETE /api/v1/subscriptions/:id` — delete a subscription

### Analytics

- `GET /api/v1/subscriptions/analytics/summary` — summary analytics for active subscriptions

### Example request body

```json
{
  "title": "Netflix",
  "description": "Video streaming",
  "amount": 2490,
  "currency": "KZT",
  "category": "Entertainment",
  "billingPeriod": "MONTHLY",
  "nextPayment": "2026-11-01T00:00:00.000Z"
}
```

## Local run

### Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Documentation

The project documentation and Word file are stored in the `docs/` folder.

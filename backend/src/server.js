const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'SubscriptionGuard API' });
});

// Получение списка всех подписок
app.get('/api/v1/subscriptions', async (req, res) => {
  try {
    const subscriptions = await prisma.subscription.findMany({
      orderBy: { nextPayment: 'asc' },
    });
    res.json(subscriptions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subscriptions', details: error.message });
  }
});

// Сводка аналитики
app.get('/api/v1/subscriptions/analytics/summary', async (req, res) => {
  try {
    const activeSubs = await prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
    });

    const monthlyTotal = activeSubs.reduce((acc, sub) => {
      let multiplier = 1;
      if (sub.billingPeriod === 'YEARLY') multiplier = 1 / 12;
      if (sub.billingPeriod === 'WEEKLY') multiplier = 4.33;
      return acc + sub.amount * multiplier;
    }, 0);

    res.json({
      activeCount: activeSubs.length,
      monthlyTotal: Math.round(monthlyTotal * 100) / 100,
      currency: 'KZT'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate analytics', details: error.message });
  }
});

// Получение одной подписки
app.get('/api/v1/subscriptions/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const subscription = await prisma.subscription.findUnique({ where: { id } });
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    res.json(subscription);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subscription', details: error.message });
  }
});

// Добавление новой подписки
app.post('/api/v1/subscriptions', async (req, res) => {
  const { title, description, amount, currency, category, billingPeriod, nextPayment } = req.body;
  try {
    const newSubscription = await prisma.subscription.create({
      data: {
        title,
        description,
        amount: parseFloat(amount),
        currency: currency || 'KZT',
        category: category || 'General',
        billingPeriod: billingPeriod || 'MONTHLY',
        nextPayment: new Date(nextPayment),
        status: 'ACTIVE'
      },
    });
    res.status(201).json(newSubscription);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create subscription', details: error.message });
  }
});

// Обновление подписки
app.put('/api/v1/subscriptions/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await prisma.subscription.update({
      where: { id },
      data: req.body,
    });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update subscription', details: error.message });
  }
});

// Удаление подписки
app.delete('/api/v1/subscriptions/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.subscription.delete({ where: { id } });
    res.json({ message: 'Subscription successfully removed' });
  } catch (error) {
    res.status(400).json({ error: 'Failed to delete subscription', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

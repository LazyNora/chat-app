import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import notificationsRouter from './routes/notifications';
import moderationRouter from './routes/moderation';
import webhooksRouter from './routes/webhooks';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

// Routes
app.use('/api/notifications', notificationsRouter);
app.use('/api/moderation', moderationRouter);
app.use('/api/webhooks', webhooksRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});


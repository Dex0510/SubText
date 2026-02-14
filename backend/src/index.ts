import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { initDatabase } from './config/database';
import authRoutes from './routes/auth';
import uploadRoutes from './routes/upload';
import reportRoutes from './routes/report';
import paymentRoutes from './routes/payment';
import userRoutes from './routes/user';
import conversationRoutes from './routes/conversations';
import proFeatureRoutes from './routes/pro-features';
import { rateLimit } from './middleware/rateLimit';

const app = express();

// Security middleware with HSTS and CSP
app.use(helmet({
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
      frameSrc: ["'self'", "https://js.stripe.com"],
      connectSrc: ["'self'", "https://api.stripe.com", env.FRONTEND_URL],
      imgSrc: ["'self'", "data:", "https:"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));

// Global rate limiter: 100 requests per minute per IP
app.use(rateLimit(100, 60));
app.use(morgan('combined'));

// Body parsing - raw body needed for Stripe webhooks
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/user', userRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/conversations', proFeatureRoutes);

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  try {
    // Initialize database schema
    await initDatabase();
    console.log('Database initialized');

    app.listen(env.PORT, () => {
      console.log(`Subtext API server running on port ${env.PORT}`);
      console.log(`Environment: ${env.NODE_ENV}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();

export default app;

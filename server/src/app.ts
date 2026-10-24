import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { healthRouter } from './routes/healthRoutes.js';
import { aiRouter } from './routes/aiRoutes.js';

export const app = express();

// Security Headers
app.use(helmet({
  contentSecurityPolicy: false // Allow API usage
}));

// CORS Configuration
const allowedOrigins = [
  config.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman) or matching whitelist
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy: Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Request size limits (protect against large body payload attacks)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Global Rate Limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', globalLimiter);

// Stricter Rate Limiter for AI generation endpoints
const aiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 60,
  message: { error: 'AI generation rate limit reached. Please wait a moment before trying again.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/ai', aiLimiter);

// Mount Routers
app.use('/api', healthRouter);
app.use('/api/ai', aiRouter);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Centralized Error Handler (no secrets leaked)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[SERVER ERROR]:', err.message || err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'An unexpected internal error occurred. Please try again.'
  });
});

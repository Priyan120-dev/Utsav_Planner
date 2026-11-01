import express, { Request, Response, NextFunction } from 'express';
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { healthRouter } from './routes/healthRoutes.js';
import { aiRouter } from './routes/aiRoutes.js';

export const app = express();

// Path resolution for static client assets
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let clientDistPath = path.resolve(__dirname, '../../client/dist');
if (!fs.existsSync(clientDistPath)) {
  const fallbackPath = path.resolve(process.cwd(), 'client/dist');
  if (fs.existsSync(fallbackPath)) {
    clientDistPath = fallbackPath;
  }
}

// Runtime verification of client build directory
const clientDistExists = fs.existsSync(clientDistPath);
if (!clientDistExists && (config.NODE_ENV === 'production' || process.env.NODE_ENV === 'production')) {
  console.warn(`[SERVER WARN] Production client build not found at runtime: ${clientDistPath}`);
}

// Security Headers with Helmet CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'", config.CLIENT_URL].filter(Boolean)
    }
  }
}));

// CORS Configuration
const allowedOrigins = [
  config.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

app.use(cors((req: Request, callback: (err: Error | null, options?: CorsOptions) => void) => {
  const origin = req.header('Origin');
  const host = req.get('host');

  let isAllowed = false;

  if (!origin) {
    // Allow requests with no origin (mobile apps, curl, postman, and same-origin GET)
    isAllowed = true;
  } else if (allowedOrigins.includes(origin)) {
    // Whitelisted origin
    isAllowed = true;
  } else if (host) {
    // Allow same-origin requests (e.g. from browser on deployed host)
    try {
      const originUrl = new URL(origin);
      if (originUrl.host === host) {
        isAllowed = true;
      }
    } catch {
      // Ignore invalid URL
    }
  }

  if (isAllowed) {
    callback(null, { origin: true, credentials: true });
  } else {
    const corsError: any = new Error('Origin not allowed');
    corsError.status = 403;
    callback(corsError);
  }
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

// Serve built React client in production
if (config.NODE_ENV === 'production' || process.env.NODE_ENV === 'production') {
  if (clientDistExists) {
    app.use(express.static(clientDistPath));
  }
} else {
  // Allow dynamic handling in test environments if NODE_ENV is set to production
  const staticMiddleware = express.static(clientDistPath);
  app.use((req: Request, res: Response, next: NextFunction) => {
    if ((config.NODE_ENV === 'production' || process.env.NODE_ENV === 'production') && clientDistExists) {
      return staticMiddleware(req, res, next);
    }
    next();
  });
}

// SPA fallback: Return client/dist/index.html for any non-/api GET route
app.get('*', (req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/api' || req.path.startsWith('/api/')) {
    return next();
  }

  if (config.NODE_ENV === 'production' || process.env.NODE_ENV === 'production') {
    const indexPath = path.resolve(clientDistPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
  }

  next();
});

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

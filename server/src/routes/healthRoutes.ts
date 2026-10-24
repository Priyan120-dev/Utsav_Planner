import { Router, Request, Response } from 'express';
import { config } from '../config.js';

export const healthRouter = Router();

healthRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'utsav-planner-api',
    timestamp: new Date().toISOString(),
    geminiConfigured: Boolean(config.GEMINI_API_KEY),
    model: config.GEMINI_MODEL
  });
});

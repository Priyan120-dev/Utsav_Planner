import { app } from './app.js';
import { config } from './config.js';
import { logger } from './logger.js';

const server = app.listen(config.PORT, '0.0.0.0', () => {
  logger.info(`[Utsav Planner API] Server running on http://0.0.0.0:${config.PORT}`);
  logger.info(`[Utsav Planner API] Environment: ${config.NODE_ENV}`);
  logger.info(`[Utsav Planner API] Gemini Model: ${config.GEMINI_MODEL}`);
  logger.info(`[Utsav Planner API] Gemini Key Configured: ${Boolean(config.GEMINI_API_KEY)}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
  });
});

import { app } from './app.js';
import { config } from './config.js';

const server = app.listen(config.PORT, '0.0.0.0', () => {
  console.log(`[Utsav Planner API] Server running on http://0.0.0.0:${config.PORT}`);
  console.log(`[Utsav Planner API] Environment: ${config.NODE_ENV}`);
  console.log(`[Utsav Planner API] Gemini Model: ${config.GEMINI_MODEL}`);
  console.log(`[Utsav Planner API] Gemini Key Configured: ${Boolean(config.GEMINI_API_KEY)}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

import { createApp } from './app';
import { config } from './config';

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`===============================================`);
  console.log(`🌱 FoodLoop AI Backend Server Running!`);
  console.log(`📡 URL: http://localhost:${config.port}`);
  console.log(`🔍 Health Check: http://localhost:${config.port}/api/v1/health`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`===============================================`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server terminated.');
  });
});

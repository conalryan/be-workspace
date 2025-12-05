import cors from 'cors';
import express from 'express';
import http from 'http';

import { db } from './db/feature-flag.dbconfig';
import { router } from './routes/feature-flag.routes';

const app: express.Application = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', router);

// Health check endpoint
app.get('/health', async (req, res) => {
  const dbHealthy = await db.healthCheck();
  res.json({
    database: dbHealthy,
    status: dbHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.info(`Feature Flag Server running on port ${PORT}`);
  console.info(`API: http://localhost:${PORT}/api`);
  console.info(`Health: http://localhost:${PORT}/health`);
  console.info(`WebSocket: ws://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.info('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.info('HTTP server closed');
  });
  await db.close();
  process.exit(0);
});

export { app, io, server };

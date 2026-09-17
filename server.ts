import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { config } from './server/config.ts';
import { apiRouter } from './server/routes/api.ts';
import { errorHandler } from './server/middleware/errorHandler.ts';

async function startServer() {
  const app = express();
  const PORT = config.port;

  // Global parsing middlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API routes
  app.use('/api', apiRouter);

  // Centralized API error handling
  app.use(errorHandler);

  // Client-side serving: Vite middleware in development, static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[InsightAI] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[InsightAI] Failed to start server:', err);
  process.exit(1);
});

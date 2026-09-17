import { Router } from 'express';

const healthRouter = Router();

/**
 * Health check endpoint
 * GET /api/health
 */
healthRouter.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
    },
  });
});

export { healthRouter };

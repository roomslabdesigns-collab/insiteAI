import { Router } from 'express';
import { healthRouter } from './health.ts';
import { feedbackRouter } from './feedback.ts';
import { searchRouter } from './search.ts';
import { analystRouter } from './analyst.ts';
import { analyticsRouter } from './analytics.ts';
import { insightsRouter } from './insights.ts';
import { prioritiesRouter } from './priorities.ts';
import { AppError } from '../middleware/errorHandler.ts';

const apiRouter = Router();

// Mount sub-routers
apiRouter.use('/health', healthRouter);
apiRouter.use('/feedback', feedbackRouter);
apiRouter.use('/search', searchRouter);
apiRouter.use('/analyst', analystRouter);
apiRouter.use('/analytics', analyticsRouter);
apiRouter.use('/insights', insightsRouter);
apiRouter.use('/priorities', prioritiesRouter);

// Catch-all for undefined /api/* routes
apiRouter.all('*', (req, _res, next) => {
  next(new AppError(`API route '${req.originalUrl}' not found`, 404, 'NOT_FOUND'));
});

export { apiRouter };

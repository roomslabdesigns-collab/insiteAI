import { Router } from 'express';
import { insightService } from '../services/insightService.ts';

const prioritiesRouter = Router();

/**
 * GET /api/priorities
 * Returns prioritized opportunities ranked deterministically by business impact score.
 */
prioritiesRouter.get('/', async (_req, res, next) => {
  try {
    const priorities = await insightService.getPrioritizedOpportunities();
    res.status(200).json({
      success: true,
      data: priorities,
      priorities,
      count: priorities.length,
      scoringMethod: {
        formula: 'frequency(20) + severity(25) + segment(20) + churn(20) + revenue(15)',
        thresholds: {
          critical: '>= 75',
          high: '55 - 74',
          medium: '35 - 54',
          low: '< 35',
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

export { prioritiesRouter };

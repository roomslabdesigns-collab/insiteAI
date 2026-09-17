import { Router } from 'express';
import { insightService } from '../services/insightService.ts';

const insightsRouter = Router();

/**
 * GET /api/insights
 * Returns all generated insights sorted by priorityScore descending
 */
insightsRouter.get('/', async (_req, res, next) => {
  try {
    const insights = await insightService.getInsights();
    res.status(200).json({
      success: true,
      data: insights,
      insights,
      count: insights.length,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/insights/:id
 * Returns a single insight by ID
 */
insightsRouter.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const insight = insightService.getInsightById(id);
    if (!insight) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Insight with ID '${id}' not found.`,
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: insight,
      insight,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/insights/generate
 * Triggers insight generation across all current feedback and analytics.
 * Supports { force: true } in body or query to refresh cache.
 */
insightsRouter.post('/generate', async (req, res, next) => {
  try {
    const force = req.body?.force === true || req.query?.force === 'true';
    const insights = await insightService.generateInsights(force);

    res.status(200).json({
      success: true,
      data: insights,
      insights,
      count: insights.length,
      message: force ? 'Insights regenerated from current feedback.' : 'Insights retrieved or updated successfully.',
    });
  } catch (err) {
    next(err);
  }
});

export { insightsRouter };

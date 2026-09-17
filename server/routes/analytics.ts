import { Router } from 'express';
import { analyticsService } from '../services/analyticsService.ts';

const analyticsRouter = Router();

/**
 * 1. FEEDBACK OVERVIEW
 * GET /api/analytics/overview
 * Returns:
 * - total feedback
 * - positive feedback
 * - negative feedback
 * - neutral feedback
 * - high-severity feedback
 * - feature requests
 * - churn signals
 */
analyticsRouter.get('/overview', (_req, res, next) => {
  try {
    const overview = analyticsService.getOverview();
    res.status(200).json({
      success: true,
      data: overview,
      ...overview,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 2. SENTIMENT TRENDS
 * GET /api/analytics/sentiment
 * Returns sentiment by date/time period:
 * - positive
 * - negative
 * - neutral
 * - total
 * - timeline
 */
analyticsRouter.get('/sentiment', (_req, res, next) => {
  try {
    const sentiment = analyticsService.getSentimentTrends();
    res.status(200).json({
      success: true,
      data: sentiment,
      ...sentiment,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 3. PRODUCT AREA ANALYSIS
 * GET /api/analytics/product-areas
 * For each product area returns:
 * - feedback count
 * - negative count
 * - high-severity count
 * - feature-request count
 * - churn-signal count
 */
analyticsRouter.get('/product-areas', (_req, res, next) => {
  try {
    const productAreas = analyticsService.getProductAreas();
    res.status(200).json({
      success: true,
      data: productAreas,
      ...productAreas,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 4. CUSTOMER SEGMENT ANALYSIS
 * GET /api/analytics/customer-segments
 * Metrics by customer segment and subscription plan:
 * - feedback count
 * - sentiment
 * - severity
 * - churn signals
 */
analyticsRouter.get('/customer-segments', (_req, res, next) => {
  try {
    const segments = analyticsService.getCustomerSegments();
    res.status(200).json({
      success: true,
      data: segments,
      ...segments,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 5. REVENUE ANALYSIS
 * GET /api/analytics/revenue
 * Using the existing revenue field:
 * - revenue represented by feedback
 * - revenue associated with negative feedback
 * - revenue associated with high-severity feedback
 * - revenue associated with churn signals
 */
analyticsRouter.get('/revenue', (_req, res, next) => {
  try {
    const revenue = analyticsService.getRevenueAnalysis();
    res.status(200).json({
      success: true,
      data: revenue,
      ...revenue,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 6. TOP ISSUES
 * GET /api/analytics/top-issues
 * Most frequently reported themes/issues:
 * - theme
 * - count
 * - sentiment
 * - severity
 * - affected product area
 */
analyticsRouter.get('/top-issues', (_req, res, next) => {
  try {
    const topIssues = analyticsService.getTopIssues();
    res.status(200).json({
      success: true,
      data: topIssues,
      ...topIssues,
    });
  } catch (err) {
    next(err);
  }
});

export { analyticsRouter };

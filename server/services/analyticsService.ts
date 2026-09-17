import { feedbackStore } from '../db/feedbackStore.ts';
import { enrichmentStore } from '../db/enrichmentStore.ts';
import type { Feedback, FeedbackEnrichment } from '../../src/types.ts';

export interface FeedbackOverviewAnalytics {
  totalFeedback: number;
  positiveFeedback: number;
  negativeFeedback: number;
  neutralFeedback: number;
  highSeverityFeedback: number;
  featureRequests: number;
  churnSignals: number;
}

export interface SentimentPeriod {
  period: string;
  positive: number;
  negative: number;
  neutral: number;
  total: number;
}

export interface SentimentTrendsAnalytics {
  positive: number;
  negative: number;
  neutral: number;
  total: number;
  timeline: SentimentPeriod[];
}

export interface ProductAreaAnalyticsItem {
  productArea: string;
  feedbackCount: number;
  negativeCount: number;
  highSeverityCount: number;
  featureRequestCount: number;
  churnSignalCount: number;
}

export interface ProductAreaAnalytics {
  productAreas: ProductAreaAnalyticsItem[];
}

export interface SegmentMetric {
  segment: string;
  feedbackCount: number;
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
  severity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  churnSignals: number;
  totalRevenue: number;
}

export interface PlanMetric {
  plan: string;
  feedbackCount: number;
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
  severity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  churnSignals: number;
  totalRevenue: number;
}

export interface CustomerSegmentsAnalytics {
  bySegment: SegmentMetric[];
  byPlan: PlanMetric[];
}

export interface RevenueAnalytics {
  revenueRepresentedByFeedback: number;
  revenueAssociatedWithNegativeFeedback: number;
  revenueAssociatedWithHighSeverityFeedback: number;
  revenueAssociatedWithChurnSignals: number;
  accountsWithRevenueCount: number;
  disclaimer: string;
}

export interface TopIssueItem {
  theme: string;
  count: number;
  sentiment: string;
  severity: string;
  affectedProductArea: string;
}

export interface TopIssuesAnalytics {
  topIssues: TopIssueItem[];
}

export interface UnifiedFeedbackRecord {
  feedback: Feedback;
  enrichment: FeedbackEnrichment | null;
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed' | 'unclassified';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'unclassified';
  isHighSeverity: boolean;
  isFeatureRequest: boolean;
  isChurnSignal: boolean;
  productArea: string;
  theme: string;
  revenue: number;
  date: string | null;
  segment: string;
  plan: string;
}

// In-memory cache wrapper
interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  feedbackCount: number;
  enrichmentCount: number;
}

export class ProductAnalyticsService {
  private cacheTTLMs = 15000; // 15-second TTL cache for high performance
  private overviewCache: CacheEntry<FeedbackOverviewAnalytics> | null = null;
  private sentimentCache: CacheEntry<SentimentTrendsAnalytics> | null = null;
  private productAreasCache: CacheEntry<ProductAreaAnalytics> | null = null;
  private customerSegmentsCache: CacheEntry<CustomerSegmentsAnalytics> | null = null;
  private revenueCache: CacheEntry<RevenueAnalytics> | null = null;
  private topIssuesCache: CacheEntry<TopIssuesAnalytics> | null = null;

  private isCacheValid<T>(cache: CacheEntry<T> | null): boolean {
    if (!cache) return false;
    const now = Date.now();
    if (now - cache.cachedAt > this.cacheTTLMs) return false;
    if (cache.feedbackCount !== feedbackStore.count()) return false;
    if (cache.enrichmentCount !== enrichmentStore.count()) return false;
    return true;
  }

  /**
   * Helper to merge feedback with its enrichment data and safely normalize values
   */
  public getUnifiedRecords(): UnifiedFeedbackRecord[] {
    const rawFeedback = feedbackStore.getAllRaw();
    return rawFeedback.map((fb) => {
      const enrichment = enrichmentStore.getByFeedbackId(fb.id);

      // Sentiment normalization
      const rawSent = (enrichment?.sentiment || fb.sentiment || '').toLowerCase();
      let sentiment: 'positive' | 'negative' | 'neutral' | 'mixed' | 'unclassified' = 'unclassified';
      if (rawSent.includes('pos')) sentiment = 'positive';
      else if (rawSent.includes('neg')) sentiment = 'negative';
      else if (rawSent.includes('neut')) sentiment = 'neutral';
      else if (rawSent.includes('mix')) sentiment = 'mixed';

      // Severity normalization
      const rawSev = (enrichment?.severity || fb.severity || '').toLowerCase();
      let severity: 'critical' | 'high' | 'medium' | 'low' | 'unclassified' = 'unclassified';
      if (rawSev.includes('crit')) severity = 'critical';
      else if (rawSev.includes('high')) severity = 'high';
      else if (rawSev.includes('med')) severity = 'medium';
      else if (rawSev.includes('low')) severity = 'low';

      const isHighSeverity = severity === 'critical' || severity === 'high';

      // Feature request detection
      const isFeatureRequest = Boolean(
        enrichment?.featureRequest ||
        enrichment?.feedbackType === 'Feature Request' ||
        (fb.sentiment && fb.sentiment.toLowerCase() === 'feature_request') ||
        (fb.source && fb.source.toLowerCase().includes('request'))
      );

      // Churn signal detection
      const isChurnSignal = Boolean(
        enrichment?.churnSignal ||
        fb.churnStatus === 'at_risk' ||
        fb.churnStatus === 'churned' ||
        (fb.source && fb.source.toLowerCase().includes('churn'))
      );

      // Product area
      const productArea = (
        enrichment?.productArea ||
        fb.productArea ||
        'Unassigned'
      ).trim();

      // Theme
      const theme = (
        enrichment?.theme ||
        (productArea !== 'Unassigned' ? `${productArea} feedback` : 'General feedback')
      ).trim();

      // Revenue (safe non-negative numeric)
      const rawRevenue = fb.revenue;
      const revenue = typeof rawRevenue === 'number' && !isNaN(rawRevenue) && rawRevenue > 0 ? rawRevenue : 0;

      // Safe date
      const dateStr = fb.date || fb.createdAt || null;
      let date: string | null = null;
      if (dateStr) {
        try {
          const parsed = new Date(dateStr);
          if (!isNaN(parsed.getTime())) {
            date = parsed.toISOString().slice(0, 10); // YYYY-MM-DD
          }
        } catch {
          date = null;
        }
      }

      // Customer segment & plan
      const segment = (fb.customerSegment || 'unassigned').trim().toLowerCase();
      const plan = (fb.plan || 'unassigned').trim();

      return {
        feedback: fb,
        enrichment,
        sentiment,
        severity,
        isHighSeverity,
        isFeatureRequest,
        isChurnSignal,
        productArea,
        theme,
        revenue,
        date,
        segment,
        plan,
      };
    });
  }

  /**
   * 1. FEEDBACK OVERVIEW
   */
  public getOverview(): FeedbackOverviewAnalytics {
    if (this.isCacheValid(this.overviewCache)) {
      return this.overviewCache!.data;
    }

    const records = this.getUnifiedRecords();

    let positiveFeedback = 0;
    let negativeFeedback = 0;
    let neutralFeedback = 0;
    let highSeverityFeedback = 0;
    let featureRequests = 0;
    let churnSignals = 0;

    for (const r of records) {
      if (r.sentiment === 'positive') positiveFeedback++;
      else if (r.sentiment === 'negative') negativeFeedback++;
      else if (r.sentiment === 'neutral') neutralFeedback++;

      if (r.isHighSeverity) highSeverityFeedback++;
      if (r.isFeatureRequest) featureRequests++;
      if (r.isChurnSignal) churnSignals++;
    }

    const data: FeedbackOverviewAnalytics = {
      totalFeedback: records.length,
      positiveFeedback,
      negativeFeedback,
      neutralFeedback,
      highSeverityFeedback,
      featureRequests,
      churnSignals,
    };

    this.overviewCache = {
      data,
      cachedAt: Date.now(),
      feedbackCount: feedbackStore.count(),
      enrichmentCount: enrichmentStore.count(),
    };

    return data;
  }

  /**
   * 2. SENTIMENT TRENDS
   */
  public getSentimentTrends(): SentimentTrendsAnalytics {
    if (this.isCacheValid(this.sentimentCache)) {
      return this.sentimentCache!.data;
    }

    const records = this.getUnifiedRecords();

    let totalPositive = 0;
    let totalNegative = 0;
    let totalNeutral = 0;

    const periodMap = new Map<string, { positive: number; negative: number; neutral: number; total: number }>();

    for (const r of records) {
      if (r.sentiment === 'positive') totalPositive++;
      else if (r.sentiment === 'negative') totalNegative++;
      else if (r.sentiment === 'neutral') totalNeutral++;

      const period = r.date || 'undated';
      const entry = periodMap.get(period) || { positive: 0, negative: 0, neutral: 0, total: 0 };
      entry.total++;
      if (r.sentiment === 'positive') entry.positive++;
      else if (r.sentiment === 'negative') entry.negative++;
      else if (r.sentiment === 'neutral') entry.neutral++;
      periodMap.set(period, entry);
    }

    // Sort periods chronologically, placing undated at the end if present
    const timeline: SentimentPeriod[] = Array.from(periodMap.entries())
      .map(([period, counts]) => ({
        period,
        positive: counts.positive,
        negative: counts.negative,
        neutral: counts.neutral,
        total: counts.total,
      }))
      .sort((a, b) => {
        if (a.period === 'undated') return 1;
        if (b.period === 'undated') return -1;
        return a.period.localeCompare(b.period);
      });

    const data: SentimentTrendsAnalytics = {
      positive: totalPositive,
      negative: totalNegative,
      neutral: totalNeutral,
      total: records.length,
      timeline,
    };

    this.sentimentCache = {
      data,
      cachedAt: Date.now(),
      feedbackCount: feedbackStore.count(),
      enrichmentCount: enrichmentStore.count(),
    };

    return data;
  }

  /**
   * 3. PRODUCT AREA ANALYSIS
   */
  public getProductAreas(): ProductAreaAnalytics {
    if (this.isCacheValid(this.productAreasCache)) {
      return this.productAreasCache!.data;
    }

    const records = this.getUnifiedRecords();
    const areaMap = new Map<string, ProductAreaAnalyticsItem>();

    for (const r of records) {
      const area = r.productArea;
      const item = areaMap.get(area) || {
        productArea: area,
        feedbackCount: 0,
        negativeCount: 0,
        highSeverityCount: 0,
        featureRequestCount: 0,
        churnSignalCount: 0,
      };

      item.feedbackCount++;
      if (r.sentiment === 'negative') item.negativeCount++;
      if (r.isHighSeverity) item.highSeverityCount++;
      if (r.isFeatureRequest) item.featureRequestCount++;
      if (r.isChurnSignal) item.churnSignalCount++;

      areaMap.set(area, item);
    }

    // Sort by feedbackCount descending
    const productAreas = Array.from(areaMap.values()).sort(
      (a, b) => b.feedbackCount - a.feedbackCount || b.highSeverityCount - a.highSeverityCount
    );

    const data: ProductAreaAnalytics = { productAreas };

    this.productAreasCache = {
      data,
      cachedAt: Date.now(),
      feedbackCount: feedbackStore.count(),
      enrichmentCount: enrichmentStore.count(),
    };

    return data;
  }

  /**
   * 4. CUSTOMER SEGMENT ANALYSIS
   */
  public getCustomerSegments(): CustomerSegmentsAnalytics {
    if (this.isCacheValid(this.customerSegmentsCache)) {
      return this.customerSegmentsCache!.data;
    }

    const records = this.getUnifiedRecords();

    const segmentMap = new Map<string, SegmentMetric>();
    const planMap = new Map<string, PlanMetric>();

    for (const r of records) {
      // By Customer Segment
      const segName = r.segment;
      const segItem = segmentMap.get(segName) || {
        segment: segName,
        feedbackCount: 0,
        sentiment: { positive: 0, negative: 0, neutral: 0 },
        severity: { critical: 0, high: 0, medium: 0, low: 0 },
        churnSignals: 0,
        totalRevenue: 0,
      };

      segItem.feedbackCount++;
      if (r.sentiment === 'positive') segItem.sentiment.positive++;
      else if (r.sentiment === 'negative') segItem.sentiment.negative++;
      else if (r.sentiment === 'neutral') segItem.sentiment.neutral++;

      if (r.severity === 'critical') segItem.severity.critical++;
      else if (r.severity === 'high') segItem.severity.high++;
      else if (r.severity === 'medium') segItem.severity.medium++;
      else if (r.severity === 'low') segItem.severity.low++;

      if (r.isChurnSignal) segItem.churnSignals++;
      segItem.totalRevenue += r.revenue;
      segmentMap.set(segName, segItem);

      // By Plan
      const planName = r.plan;
      const planItem = planMap.get(planName) || {
        plan: planName,
        feedbackCount: 0,
        sentiment: { positive: 0, negative: 0, neutral: 0 },
        severity: { critical: 0, high: 0, medium: 0, low: 0 },
        churnSignals: 0,
        totalRevenue: 0,
      };

      planItem.feedbackCount++;
      if (r.sentiment === 'positive') planItem.sentiment.positive++;
      else if (r.sentiment === 'negative') planItem.sentiment.negative++;
      else if (r.sentiment === 'neutral') planItem.sentiment.neutral++;

      if (r.severity === 'critical') planItem.severity.critical++;
      else if (r.severity === 'high') planItem.severity.high++;
      else if (r.severity === 'medium') planItem.severity.medium++;
      else if (r.severity === 'low') planItem.severity.low++;

      if (r.isChurnSignal) planItem.churnSignals++;
      planItem.totalRevenue += r.revenue;
      planMap.set(planName, planItem);
    }

    const bySegment = Array.from(segmentMap.values()).sort((a, b) => b.feedbackCount - a.feedbackCount);
    const byPlan = Array.from(planMap.values()).sort((a, b) => b.feedbackCount - a.feedbackCount);

    const data: CustomerSegmentsAnalytics = {
      bySegment,
      byPlan,
    };

    this.customerSegmentsCache = {
      data,
      cachedAt: Date.now(),
      feedbackCount: feedbackStore.count(),
      enrichmentCount: enrichmentStore.count(),
    };

    return data;
  }

  /**
   * 5. REVENUE ANALYSIS
   * Using the existing revenue field, calculate:
   * - revenue represented by feedback
   * - revenue associated with negative feedback
   * - revenue associated with high-severity feedback
   * - revenue associated with churn signals
   * Do NOT claim that this is actual lost revenue unless the dataset explicitly supports that conclusion.
   */
  public getRevenueAnalysis(): RevenueAnalytics {
    if (this.isCacheValid(this.revenueCache)) {
      return this.revenueCache!.data;
    }

    const records = this.getUnifiedRecords();

    let revenueRepresentedByFeedback = 0;
    let revenueAssociatedWithNegativeFeedback = 0;
    let revenueAssociatedWithHighSeverityFeedback = 0;
    let revenueAssociatedWithChurnSignals = 0;
    const accountsWithRevenue = new Set<string>();

    for (const r of records) {
      const rev = r.revenue;
      if (rev > 0) {
        revenueRepresentedByFeedback += rev;
        if (r.feedback.customerId) {
          accountsWithRevenue.add(r.feedback.customerId);
        }

        if (r.sentiment === 'negative') {
          revenueAssociatedWithNegativeFeedback += rev;
        }

        if (r.isHighSeverity) {
          revenueAssociatedWithHighSeverityFeedback += rev;
        }

        if (r.isChurnSignal) {
          revenueAssociatedWithChurnSignals += rev;
        }
      }
    }

    const data: RevenueAnalytics = {
      revenueRepresentedByFeedback,
      revenueAssociatedWithNegativeFeedback,
      revenueAssociatedWithHighSeverityFeedback,
      revenueAssociatedWithChurnSignals,
      accountsWithRevenueCount: accountsWithRevenue.size,
      disclaimer: 'Revenue metrics represent customer contract ARR associated with relevant feedback signals, not realized churn or financial loss.',
    };

    this.revenueCache = {
      data,
      cachedAt: Date.now(),
      feedbackCount: feedbackStore.count(),
      enrichmentCount: enrichmentStore.count(),
    };

    return data;
  }

  /**
   * 6. TOP ISSUES
   * Return the most frequently reported themes/issues using existing intelligence data.
   * Include:
   * - theme
   * - count
   * - sentiment
   * - severity
   * - affectedProductArea
   */
  public getTopIssues(): TopIssuesAnalytics {
    if (this.isCacheValid(this.topIssuesCache)) {
      return this.topIssuesCache!.data;
    }

    const records = this.getUnifiedRecords();

    interface IssueCollector {
      theme: string;
      count: number;
      sentiments: Record<string, number>;
      severities: Record<string, number>;
      productAreas: Map<string, number>;
    }

    const themeMap = new Map<string, IssueCollector>();

    for (const r of records) {
      const themeKey = r.theme;
      const item = themeMap.get(themeKey) || {
        theme: themeKey,
        count: 0,
        sentiments: { positive: 0, negative: 0, neutral: 0, mixed: 0, unclassified: 0 },
        severities: { critical: 0, high: 0, medium: 0, low: 0, unclassified: 0 },
        productAreas: new Map<string, number>(),
      };

      item.count++;
      item.sentiments[r.sentiment] = (item.sentiments[r.sentiment] || 0) + 1;
      item.severities[r.severity] = (item.severities[r.severity] || 0) + 1;
      item.productAreas.set(r.productArea, (item.productAreas.get(r.productArea) || 0) + 1);

      themeMap.set(themeKey, item);
    }

    const topIssues: TopIssueItem[] = Array.from(themeMap.values())
      .map((item) => {
        // Determine primary sentiment
        let dominantSentiment = 'negative';
        let maxSentCount = -1;
        for (const [sent, count] of Object.entries(item.sentiments)) {
          if (count > maxSentCount) {
            maxSentCount = count;
            dominantSentiment = sent;
          }
        }

        // Determine highest severity: critical > high > medium > low > unclassified
        let highestSeverity = 'low';
        if (item.severities.critical > 0) highestSeverity = 'critical';
        else if (item.severities.high > 0) highestSeverity = 'high';
        else if (item.severities.medium > 0) highestSeverity = 'medium';
        else if (item.severities.low > 0) highestSeverity = 'low';
        else highestSeverity = 'unclassified';

        // Determine primary affected product area
        let dominantArea = 'Unassigned';
        let maxAreaCount = -1;
        for (const [area, count] of item.productAreas.entries()) {
          if (count > maxAreaCount) {
            maxAreaCount = count;
            dominantArea = area;
          }
        }

        return {
          theme: item.theme,
          count: item.count,
          sentiment: dominantSentiment,
          severity: highestSeverity,
          affectedProductArea: dominantArea,
        };
      })
      .sort((a, b) => b.count - a.count);

    const data: TopIssuesAnalytics = { topIssues };

    this.topIssuesCache = {
      data,
      cachedAt: Date.now(),
      feedbackCount: feedbackStore.count(),
      enrichmentCount: enrichmentStore.count(),
    };

    return data;
  }
}

export const analyticsService = new ProductAnalyticsService();

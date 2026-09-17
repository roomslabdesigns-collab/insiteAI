/**
 * InsightAI — Core Domain Types
 * Phase 1 Application Foundation
 */

export type CustomerSegment = 'enterprise' | 'mid_market' | 'smb';
export type ChurnStatus = 'active' | 'at_risk' | 'churned';

export interface Customer {
  id: string;
  name: string;
  domain?: string;
  segment: CustomerSegment;
  subscriptionPlan: string;
  arr: number; // in USD
  churnStatus: ChurnStatus;
  churnDate?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface ProductArea {
  id: string;
  name: string;
  description: string;
  ownerEmail?: string;
  createdAt: string;
}

export type FeedbackSource = 'tickets' | 'reviews' | 'nps' | 'churn' | 'requests' | string;
export type Sentiment = 'positive' | 'neutral' | 'negative' | 'mixed' | string;
export type Severity = 'critical' | 'high' | 'medium' | 'low' | string;
export type FeedbackType = 'Bug' | 'Feature Request' | 'Complaint' | 'Praise' | 'Question' | 'Other';

export interface Feedback {
  id: string;
  content: string;
  source: string;
  date: string;
  customerId?: string | null;
  customerSegment?: string | null;
  plan?: string | null;
  revenue?: number | null;
  productArea?: string | null;
  sentiment?: string | null;
  severity?: string | null;
  churnStatus?: string | null;
  createdAt: string;
}

export interface FeedbackEnrichment {
  id: string;
  feedbackId: string;
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  severity: 'critical' | 'high' | 'medium' | 'low';
  productArea: string;
  feedbackType: FeedbackType;
  theme: string;
  featureRequest: boolean;
  churnSignal: boolean;
  model: string;
  processedAt: string;
}

export interface FeedbackEmbedding {
  feedbackId: string;
  embedding: number[];
  embeddingModel: string;
  createdAt: string;
  updatedAt: string;
}

export interface SemanticSearchResult {
  feedbackId: string;
  content: string;
  similarity: number;
  similarityScore: number;
  productArea: string | null;
  sentiment: string | null;
  severity: string | null;
  theme: string | null;
  feedbackType?: string | null;
}

export interface BatchEmbeddingResult {
  processed: number;
  successful: number;
  failed: number;
  skipped: number;
  results: Array<{
    feedbackId: string;
    embeddingModel: string;
    dimensions: number;
  }>;
  failures: Array<{
    feedbackId: string;
    error: string;
  }>;
}

export interface AnalystEvidence {
  feedbackId: string;
  content: string;
  similarity: number;
  productArea?: string | null;
  sentiment?: string | null;
  severity?: string | null;
  theme?: string | null;
  feedbackType?: string | null;
}

export interface AnalystAskRequest {
  question: string;
  limit?: number;
  minSimilarity?: number;
}

export interface AnalystAskResponse {
  answer: string;
  evidence: AnalystEvidence[];
}

export interface BatchEnrichmentRequest {
  limit?: number;
  force?: boolean;
  feedbackIds?: string[];
}

export interface BatchEnrichmentResult {
  processed: number;
  successful: number;
  failed: number;
  skipped: number;
  results: FeedbackEnrichment[];
  failures: Array<{
    feedbackId: string;
    error: string;
  }>;
}

export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedFeedbackResult {
  items: Feedback[];
  pagination: PaginationMetadata;
}

export interface ReasoningStage {
  stage: string;
  title: string;
  details: string;
}

export interface Insight {
  id: string;
  queryText: string;
  answerText: string;
  reasoningTrace: ReasoningStage[];
  citationFeedbackIds: string[];
  createdAt: string;
  executionTimeMs?: number;
}

export interface FeedbackTheme {
  id: string;
  title: string;
  description: string;
  productAreaId?: string;
  signalCount: number;
  impactScore: number; // 0 to 100
  arrAtRisk: number;
  affectedAccountCount: number;
  trend30d: number; // percentage, e.g. +34
  status: 'emerging' | 'active' | 'stabilizing' | 'resolved';
}

export interface Opportunity {
  id: string;
  rank: number;
  title: string;
  description: string;
  impactScore: number;
  severity: Severity;
  effort: 'S' | 'M' | 'L' | 'XL';
  arrAtRisk: number;
  accountsCount: number;
  evidenceCount: number;
  trend30d: number;
  roadmapColumn: 'now' | 'next' | 'later';
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface FeedbackOverviewData {
  totalFeedback: number;
  positiveFeedback: number;
  negativeFeedback: number;
  neutralFeedback: number;
  highSeverityFeedback: number;
  featureRequests: number;
  churnSignals: number;
}

export interface SentimentPeriodData {
  period: string;
  positive: number;
  negative: number;
  neutral: number;
  total: number;
}

export interface SentimentTrendsData {
  positive: number;
  negative: number;
  neutral: number;
  total: number;
  timeline: SentimentPeriodData[];
}

export interface ProductAreaMetricData {
  productArea: string;
  feedbackCount: number;
  negativeCount: number;
  highSeverityCount: number;
  featureRequestCount: number;
  churnSignalCount: number;
}

export interface ProductAreasAnalyticsData {
  productAreas: ProductAreaMetricData[];
}

export interface SegmentMetricData {
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

export interface PlanMetricData {
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

export interface CustomerSegmentsAnalyticsData {
  bySegment: SegmentMetricData[];
  byPlan: PlanMetricData[];
}

export interface RevenueAnalyticsData {
  revenueRepresentedByFeedback: number;
  revenueAssociatedWithNegativeFeedback: number;
  revenueAssociatedWithHighSeverityFeedback: number;
  revenueAssociatedWithChurnSignals: number;
  accountsWithRevenueCount: number;
  disclaimer: string;
}

export interface TopIssueItemData {
  theme: string;
  count: number;
  sentiment: string;
  severity: string;
  affectedProductArea: string;
}

export interface TopIssuesAnalyticsData {
  topIssues: TopIssueItemData[];
}

export type InsightType = 
  | 'Customer Pain Point'
  | 'Feature Opportunity'
  | 'Emerging Issue'
  | 'Churn Risk'
  | 'Product Strength';

export type PriorityLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export interface PriorityFactors {
  frequencyScore: number;       // e.g. 0-20
  severityScore: number;        // e.g. 0-25
  segmentScore: number;         // e.g. 0-20
  churnScore: number;           // e.g. 0-20
  revenueScore: number;         // e.g. 0-15
  rawMetrics: {
    feedbackCount: number;
    highestSeverity: string;
    affectedSegments: string[];
    churnSignalCount: number;
    totalRevenue: number;
  };
}

export interface InsightSupportingMetrics {
  feedbackCount: number;
  negativeFeedbackCount: number;
  highSeverityCount: number;
  churnSignalCount: number;
  revenueRepresented: number;
  accountsCount: number;
  affectedSegments: string[];
  dominantSentiment: string;
}

export interface AIProductInsight {
  id: string;
  title: string;
  description: string;
  productArea: string;
  insightType: InsightType;
  supportingFeedbackIds: string[];
  supportingMetrics: InsightSupportingMetrics;
  priorityScore: number;
  priorityLevel: PriorityLevel;
  priorityFactors: PriorityFactors;
  createdAt: string;
}

export interface PrioritizedOpportunity {
  id: string;
  insightId: string;
  title: string;
  productArea: string;
  insightType: InsightType;
  priorityScore: number;
  priorityLevel: PriorityLevel;
  meterWidth: string;
  meterColor: string;
  revenueRepresented: number;
  revenueDisplay: string;
  accountsCount: number;
  evidenceCount: number;
  evidenceDisplay: string;
  effort: 'S' | 'M' | 'L' | 'XL';
  trend: string;
  trendPositive: boolean;
  isExpansion: boolean;
  priorityFactors: PriorityFactors;
  supportingFeedbackIds: string[];
  createdAt: string;
}


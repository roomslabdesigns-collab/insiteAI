import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, AlertCircle, Sparkles, Layers } from 'lucide-react';
import type { 
  FeedbackOverviewData, 
  RevenueAnalyticsData, 
  TopIssueItemData,
  SentimentTrendsData,
  ProductAreaMetricData,
  AIProductInsight
} from '../../types.ts';

export const DashboardView: React.FC = () => {
  const [overview, setOverview] = useState<FeedbackOverviewData | null>(null);
  const [revenue, setRevenue] = useState<RevenueAnalyticsData | null>(null);
  const [topIssues, setTopIssues] = useState<TopIssueItemData[]>([]);
  const [sentiment, setSentiment] = useState<SentimentTrendsData | null>(null);
  const [productAreas, setProductAreas] = useState<ProductAreaMetricData[]>([]);
  const [insights, setInsights] = useState<AIProductInsight[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async (isRefreshAction = false) => {
    if (isRefreshAction) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const [ovRes, revRes, issuesRes, sentRes, areasRes, insightsRes] = await Promise.all([
        fetch('/api/analytics/overview').then((r) => r.json()),
        fetch('/api/analytics/revenue').then((r) => r.json()),
        fetch('/api/analytics/top-issues').then((r) => r.json()),
        fetch('/api/analytics/sentiment').then((r) => r.json()),
        fetch('/api/analytics/product-areas').then((r) => r.json()),
        fetch('/api/insights').then((r) => r.json()),
      ]);

      if (ovRes.success && (ovRes.data || ovRes.totalFeedback !== undefined)) {
        setOverview(ovRes.data || ovRes);
      } else {
        throw new Error(ovRes.error?.message || 'Failed to fetch feedback overview');
      }

      if (revRes.success && (revRes.data || revRes.revenueRepresentedByFeedback !== undefined)) {
        setRevenue(revRes.data || revRes);
      }

      if (issuesRes.success && (issuesRes.data?.topIssues || issuesRes.topIssues)) {
        setTopIssues(issuesRes.data?.topIssues || issuesRes.topIssues || []);
      }

      if (sentRes.success && (sentRes.data || sentRes.timeline)) {
        setSentiment(sentRes.data || sentRes);
      }

      if (areasRes.success && (areasRes.data?.productAreas || areasRes.productAreas)) {
        setProductAreas(areasRes.data?.productAreas || areasRes.productAreas || []);
      }

      if (insightsRes.success && (Array.isArray(insightsRes.data) || Array.isArray(insightsRes.insights))) {
        setInsights(insightsRes.data || insightsRes.insights || []);
      }
    } catch (err) {
      console.warn('[Dashboard Analytics Load Error]', err);
      setError(err instanceof Error ? err.message : 'Unable to connect to analytics services.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Format currency helper
  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null || isNaN(val)) return '$0';
    if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
    return `$${val}`;
  };

  const totalSignals = overview?.totalFeedback ?? 0;
  const churnArr = revenue?.revenueAssociatedWithChurnSignals ?? 0;

  // Max counts for bar calculations
  const maxIssueCount = Math.max(...topIssues.map((t) => t.count), 1);
  const maxAreaCount = Math.max(...productAreas.map((a) => a.feedbackCount), 1);

  // Timeline histogram bars
  const timelinePeriods = sentiment?.timeline || [];
  const maxTimelineCount = Math.max(...timelinePeriods.map((p) => p.total), 1);

  // Format product area display name
  const formatAreaName = (name: string) => {
    return name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="p-8 sm:p-10 select-none animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[27px] font-extrabold tracking-tight text-[#e9eaf0]">Dashboard</h1>
          <p className="text-[13.5px] text-[#8a90a0] mt-1.5">
            {isLoading 
              ? 'Loading analytics from feedback database...' 
              : `Real-time analytics · ${totalSignals} feedback signals · verified from stored database`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            type="button" 
            onClick={() => fetchDashboardData(true)}
            disabled={isLoading || isRefreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-[#1e2029] rounded-xl bg-[#0e0f15] text-[12.5px] font-semibold text-[#a8adba] hover:border-[#31365a] hover:text-[#e9eaf0] transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh dashboard data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#8b93ff]' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <button 
            type="button" 
            className="px-3.5 py-2 border border-[#1e2029] rounded-xl bg-[#0e0f15] text-[12.5px] font-semibold text-[#a8adba] hover:border-[#31365a] hover:text-[#e9eaf0] transition-colors"
          >
            All time
          </button>
          <button 
            type="button" 
            className="px-3.5 py-2 border border-[rgba(99,102,241,0.3)] rounded-xl bg-[#1c1f33] text-[12.5px] font-semibold text-[#c7cbff] hover:bg-[#232740] transition-colors"
          >
            Export
          </button>
        </div>
      </div>

      {/* Global Error State */}
      {error && !isLoading && (
        <div className="mt-6 p-4 rounded-2xl border border-[rgba(248,113,113,0.25)] bg-[#130b0d] flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-[#f87171] flex-none mt-0.5" />
            <div>
              <div className="text-[13.5px] font-bold text-[#fca5a5]">Analytics Service Error</div>
              <p className="text-[12.5px] text-[#e0a0a0] mt-0.5">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => fetchDashboardData()}
            className="px-3 py-1.5 rounded-xl border border-[rgba(248,113,113,0.3)] bg-[#201014] text-[12px] font-semibold text-white hover:bg-[#2b161b] transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* 4 KPI Metrics - Task 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
        {/* Metric 1: Total Signals & Sentiment */}
        <div className="border border-[#1b1d27] rounded-2xl bg-[#0d0e13] p-4">
          <div className="font-mono text-[9.5px] tracking-wider text-[#5d626f] uppercase font-medium">
            TOTAL FEEDBACK SIGNALS
          </div>
          <div className="text-[26px] font-extrabold tracking-tight text-white mt-2.5">
            {isLoading ? '...' : totalSignals.toLocaleString()}
          </div>
          <div className="text-[11.5px] text-[#8a90a0] mt-1.5">
            {isLoading ? (
              'Calculating...'
            ) : (
              <>
                <span className="text-[#6ee7b7] font-semibold">{overview?.positiveFeedback ?? 0} pos</span>
                {' · '}
                <span className="text-[#f8a1a1] font-semibold">{overview?.negativeFeedback ?? 0} neg</span>
                {' · '}
                <span className="text-[#9aa0af]">{overview?.neutralFeedback ?? 0} neu</span>
              </>
            )}
          </div>
        </div>

        {/* Metric 2: High Severity Feedback */}
        <div className="border border-[#1b1d27] rounded-2xl bg-[#0d0e13] p-4">
          <div className="font-mono text-[9.5px] tracking-wider text-[#5d626f] uppercase font-medium">
            HIGH SEVERITY FEEDBACK
          </div>
          <div className="text-[26px] font-extrabold tracking-tight text-[#f8a1a1] mt-2.5">
            {isLoading ? '...' : (overview?.highSeverityFeedback ?? 0)}
          </div>
          <div className="text-[11.5px] text-[#8a90a0] mt-1.5">
            critical or high priority signals
          </div>
        </div>

        {/* Metric 3: Feature Requests */}
        <div className="border border-[#1b1d27] rounded-2xl bg-[#0d0e13] p-4">
          <div className="font-mono text-[9.5px] tracking-wider text-[#5d626f] uppercase font-medium">
            FEATURE REQUESTS
          </div>
          <div className="text-[26px] font-extrabold tracking-tight text-[#a5b4fc] mt-2.5">
            {isLoading ? '...' : (overview?.featureRequests ?? 0)}
          </div>
          <div className="text-[11.5px] text-[#8a90a0] mt-1.5">
            enhancement opportunities identified
          </div>
        </div>

        {/* Metric 4: Churn Signals & ARR */}
        <div className="border border-[#1b1d27] rounded-2xl bg-[#0d0e13] p-4">
          <div className="font-mono text-[9.5px] tracking-wider text-[#5d626f] uppercase font-medium">
            ARR AT RISK (CHURN SIGNALS)
          </div>
          <div className="text-[26px] font-extrabold tracking-tight text-[#fbb87c] mt-2.5">
            {isLoading ? '...' : formatCurrency(churnArr)}
          </div>
          <div className="text-[11.5px] text-[#8a90a0] mt-1.5">
            {overview?.churnSignals ?? 0} churn signals flagged
          </div>
        </div>
      </div>

      {/* Main Charts & Analytics Grid (Tasks 2 & 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mt-3">
        {/* Top Themes Progress Breakdown - Task 5 */}
        <div className="lg:col-span-7 border border-[#1b1d27] rounded-2xl bg-[#0b0c11] p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-bold text-white">Top themes by business impact</h3>
            <span className="font-mono text-[10.5px] text-[#5d626f]">SIGNALS · SEVERITY</span>
          </div>

          <div className="flex flex-col gap-4 mt-5">
            {isLoading ? (
              <div className="py-8 text-center text-[13px] text-[#6d7382]">
                Loading issues intelligence...
              </div>
            ) : topIssues.length === 0 ? (
              <div className="py-8 text-center text-[13px] text-[#6d7382]">
                No theme intelligence data recorded yet.
              </div>
            ) : (
              topIssues.map((theme) => {
                const barWidth = `${Math.max(12, Math.round((theme.count / maxIssueCount) * 100))}%`;
                const isCritical = theme.severity === 'critical' || theme.severity === 'high';

                return (
                  <div key={theme.theme}>
                    <div className="flex items-center gap-2.5 text-[13px] font-semibold text-[#d7dae2]">
                      <span className="truncate max-w-[280px] sm:max-w-[340px]">{theme.theme}</span>
                      <span className="ml-auto font-mono text-[11.5px] text-[#7b8190]">
                        {theme.count} {theme.count === 1 ? 'signal' : 'signals'}
                      </span>
                      <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded uppercase border ${
                        isCritical
                          ? 'text-[#f8a1a1] bg-[rgba(248,113,113,0.1)] border-[rgba(248,113,113,0.2)]'
                          : 'text-[#a8adba] bg-[#141620] border-[#1e2233]'
                      }`}>
                        {theme.severity}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#171923] mt-2 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#4f6bff] to-[#a06bff]" 
                        style={{ width: barWidth }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Signal Volume Histogram & Sentiment - Task 2 */}
        <div className="lg:col-span-5 border border-[#1b1d27] rounded-2xl bg-[#0b0c11] p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-bold text-white">Sentiment & signal volume</h3>
            <span className="font-mono text-[10.5px] text-[#5d626f]">REAL-TIME TIMELINE</span>
          </div>
          
          <div className="flex items-end gap-1.5 h-[132px] mt-5">
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center text-[12px] text-[#6d7382]">
                Loading timeline records...
              </div>
            ) : timelinePeriods.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-[12px] text-[#6d7382]">
                No timeline records available
              </div>
            ) : (
              timelinePeriods.map((period, i) => {
                const heightPercent = Math.max(15, Math.round((period.total / maxTimelineCount) * 100));
                return (
                  <div 
                    key={period.period} 
                    title={`${period.period}: ${period.total} signals (${period.positive} pos, ${period.negative} neg, ${period.neutral} neu)`}
                    className={`flex-1 rounded-t cursor-help transition-all ${
                      i === timelinePeriods.length - 1
                        ? 'bg-gradient-to-t from-[#3b3f7a] to-[#6b73f5]' 
                        : period.negative > 0
                        ? 'bg-[#3b3f7a]' 
                        : 'bg-[#242a47]'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                );
              })
            )}
          </div>

          <div className="flex justify-between font-mono text-[10px] text-[#5d626f] mt-2.5">
            <span>{timelinePeriods[0]?.period || 'EARLIEST'}</span>
            <span>{timelinePeriods[timelinePeriods.length - 1]?.period || 'LATEST'}</span>
          </div>

          <div className="h-px bg-[#171923] my-4" />

          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5 text-[12.5px] text-[#a8adba]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f87171]" />
              <span>Negative sentiment signals</span>
              <span className="ml-auto font-mono text-[12px] font-bold text-[#f8a1a1]">
                {overview?.negativeFeedback ?? 0}
              </span>
            </div>
            <div className="flex items-center gap-2.5 text-[12.5px] text-[#a8adba]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#fb923c]" />
              <span>Churn risk indicators</span>
              <span className="ml-auto font-mono text-[12px] font-bold text-[#fbb87c]">
                {overview?.churnSignals ?? 0}
              </span>
            </div>
            <div className="flex items-center gap-2.5 text-[12.5px] text-[#a8adba]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34d399]" />
              <span>Positive feedback signals</span>
              <span className="ml-auto font-mono text-[12px] font-bold text-[#6ee7b7]">
                {overview?.positiveFeedback ?? 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Second Grid: Product Areas & AI Product Insights (Tasks 3 & 6) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mt-3">
        {/* Product Areas - Task 3 */}
        <div className="lg:col-span-6 border border-[#1b1d27] rounded-2xl bg-[#0b0c11] p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#8b93ff]" />
              <h3 className="text-[14px] font-bold text-white">Product Areas</h3>
            </div>
            <span className="font-mono text-[10.5px] text-[#5d626f]">SIGNALS · CHURN · SEVERITY</span>
          </div>

          <div className="flex flex-col gap-3.5 mt-5">
            {isLoading ? (
              <div className="py-8 text-center text-[13px] text-[#6d7382]">
                Loading product areas...
              </div>
            ) : productAreas.length === 0 ? (
              <div className="py-8 text-center text-[13px] text-[#6d7382]">
                No product areas mapped yet.
              </div>
            ) : (
              productAreas.map((area) => {
                const widthPercent = `${Math.max(12, Math.round((area.feedbackCount / maxAreaCount) * 100))}%`;

                return (
                  <div 
                    key={area.productArea}
                    className="p-3 rounded-xl bg-[#0d0e14] border border-[#171923] hover:border-[#25293d] transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-bold text-[#e9eaf0]">
                        {formatAreaName(area.productArea)}
                      </span>
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <span className="text-[#a8adba] font-semibold">{area.feedbackCount} signals</span>
                        {area.highSeverityCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold text-[#f8a1a1] bg-[rgba(248,113,113,0.12)] border border-[rgba(248,113,113,0.22)]">
                            {area.highSeverityCount} high/crit
                          </span>
                        )}
                        {area.churnSignalCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold text-[#fbb87c] bg-[rgba(251,146,60,0.12)] border border-[rgba(251,146,60,0.22)]">
                            {area.churnSignalCount} churn
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="h-1 rounded-full bg-[#171923] mt-2.5 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#4f6bff] to-[#7d6bff]"
                        style={{ width: widthPercent }}
                      />
                    </div>

                    <div className="flex items-center gap-4 mt-2 font-mono text-[10px] text-[#6d7382]">
                      <span>{area.negativeCount} negative</span>
                      <span>{area.featureRequestCount} feature reqs</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* AI Insights - Task 6 */}
        <div className="lg:col-span-6 border border-[#1b1d27] rounded-2xl bg-[#0b0c11] p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#8b93ff]" />
              <h3 className="text-[14px] font-bold text-white">AI Product Insights</h3>
            </div>
            <span className="font-mono text-[10.5px] text-[#5d626f]">PRIORITY RANKED</span>
          </div>

          <div className="flex flex-col gap-3 mt-5">
            {isLoading ? (
              <div className="py-8 text-center text-[13px] text-[#6d7382]">
                Analyzing insights database...
              </div>
            ) : insights.length === 0 ? (
              <div className="py-8 text-center text-[13px] text-[#6d7382]">
                No synthesized product insights available yet.
              </div>
            ) : (
              insights.slice(0, 4).map((item) => {
                const isCritical = item.priorityLevel === 'Critical';
                const isHigh = item.priorityLevel === 'High';

                return (
                  <div 
                    key={item.id}
                    className="p-3.5 rounded-xl bg-[#0d0e14] border border-[#171923] hover:border-[#2b2f45] transition-all"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] font-bold text-[#e9eaf0]">
                        {item.title}
                      </span>
                      <span className={`ml-auto px-2 py-0.5 rounded-md font-mono text-[10px] font-bold border ${
                        isCritical
                          ? 'bg-[rgba(248,113,113,0.12)] border-[rgba(248,113,113,0.24)] text-[#f8a1a1]'
                          : isHigh
                          ? 'bg-[rgba(251,146,60,0.12)] border-[rgba(251,146,60,0.24)] text-[#fbb87c]'
                          : 'bg-[rgba(99,102,241,0.12)] border-[rgba(99,102,241,0.24)] text-[#a5b4fc]'
                      }`}>
                        {item.priorityLevel.toUpperCase()} ({item.priorityScore})
                      </span>
                    </div>

                    <p className="text-[12px] leading-relaxed text-[#8a90a0] mt-1.5 line-clamp-2">
                      {item.description}
                    </p>

                    <div className="flex items-center gap-4 mt-2.5 pt-2 border-t border-[#151722] font-mono text-[10px] text-[#636877] flex-wrap">
                      <span>Area: <strong className="text-[#a8adba]">{formatAreaName(item.productArea)}</strong></span>
                      <span>Type: <strong className="text-[#a8adba]">{item.insightType}</strong></span>
                      {item.supportingMetrics?.revenueRepresented > 0 && (
                        <span>ARR: <strong className="text-white">${(item.supportingMetrics.revenueRepresented / 1000).toFixed(0)}K</strong></span>
                      )}
                      <span className="ml-auto text-[#8b93ff]">
                        Evidence: {item.supportingFeedbackIds.join(', ')}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

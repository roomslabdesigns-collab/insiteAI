import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import type { CustomerSegmentsAnalyticsData, TopIssueItemData } from '../../types.ts';

export const SegmentsView: React.FC = () => {
  const [segmentsData, setSegmentsData] = useState<CustomerSegmentsAnalyticsData | null>(null);
  const [topIssues, setTopIssues] = useState<TopIssueItemData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSegments = useCallback(async (isRefreshAction = false) => {
    if (isRefreshAction) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const [segRes, issuesRes] = await Promise.all([
        fetch('/api/analytics/customer-segments').then((r) => r.json()),
        fetch('/api/analytics/top-issues').then((r) => r.json()),
      ]);

      if (segRes.success && (segRes.data || segRes.bySegment)) {
        setSegmentsData(segRes.data || segRes);
      } else {
        throw new Error(segRes.error?.message || 'Failed to load customer segments');
      }

      if (issuesRes.success && (issuesRes.data?.topIssues || issuesRes.topIssues)) {
        setTopIssues(issuesRes.data?.topIssues || issuesRes.topIssues || []);
      }
    } catch (err) {
      console.warn('[Segments Analytics Load Error]', err);
      setError(err instanceof Error ? err.message : 'Unable to connect to customer segments analytics.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSegments();
  }, [fetchSegments]);

  const formatRevenue = (rev?: number) => {
    if (!rev || rev === 0 || isNaN(rev)) return '$0';
    if (rev >= 1000000) return `$${(rev / 1000000).toFixed(1)}M`;
    if (rev >= 1000) return `$${(rev / 1000).toFixed(0)}K`;
    return `$${rev}`;
  };

  const formatSegmentName = (name: string) => {
    if (name.toLowerCase() === 'enterprise') return 'Enterprise';
    if (name.toLowerCase() === 'mid_market' || name.toLowerCase() === 'mid-market') return 'Mid-market';
    if (name.toLowerCase() === 'smb') return 'SMB';
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  const getStatus = (churnSignals: number, neg: number, pos: number) => {
    if (churnSignals > 0) {
      return { label: 'AT RISK', class: 'text-[#f8a1a1]', border: 'border-[#232637]' };
    }
    if (neg > pos) {
      return { label: 'WATCH', class: 'text-[#fbb87c]', border: 'border-[#1b1d27]' };
    }
    return { label: 'HEALTHY', class: 'text-[#6ee7b7]', border: 'border-[#1b1d27]' };
  };

  const items = segmentsData?.bySegment || [];

  return (
    <div className="p-8 sm:p-10 select-none animate-in fade-in duration-200">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[27px] font-extrabold tracking-tight text-[#e9eaf0]">Customer Segments</h1>
          <p className="text-[13.5px] text-[#8a90a0] mt-1.5">
            {isLoading 
              ? 'Loading segment intelligence...' 
              : `How sentiment and priorities differ by customer tier · ${items.length} active segments`}
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchSegments(true)}
          disabled={isLoading || isRefreshing}
          className="flex items-center gap-1.5 px-3.5 py-2 border border-[#1e2029] rounded-xl bg-[#0e0f15] text-[12.5px] font-semibold text-[#a8adba] hover:border-[#31365a] hover:text-[#e9eaf0] transition-colors disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#8b93ff]' : ''}`} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && !isLoading && (
        <div className="mt-6 p-4 rounded-2xl border border-[rgba(248,113,113,0.25)] bg-[#130b0d] flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-[#f87171] flex-none mt-0.5" />
            <div>
              <div className="text-[13.5px] font-bold text-[#fca5a5]">Segments Service Error</div>
              <p className="text-[12.5px] text-[#e0a0a0] mt-0.5">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => fetchSegments()}
            className="px-3 py-1.5 rounded-xl border border-[rgba(248,113,113,0.3)] bg-[#201014] text-[12px] font-semibold text-white hover:bg-[#2b161b] transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Segments Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
        {isLoading && (
          <div className="col-span-3 border border-[#1b1d27] rounded-2xl bg-[#0d0e13] p-12 text-center text-[#6d7382]">
            <RefreshCw className="w-5 h-5 animate-spin text-[#8b93ff] mx-auto mb-2" />
            Aggregating customer segment analytics from database...
          </div>
        )}

        {!isLoading && items.length === 0 && !error && (
          <div className="col-span-3 border border-[#1b1d27] rounded-2xl bg-[#0d0e13] p-8 text-center text-[#6d7382]">
            No customer segments found in stored feedback.
          </div>
        )}

        {!isLoading && items.map((seg, idx) => {
          const status = getStatus(seg.churnSignals, seg.sentiment.negative, seg.sentiment.positive);
          const netSentiment = seg.sentiment.positive - seg.sentiment.negative;
          const sentimentLabel = `${netSentiment > 0 ? '+' : ''}${netSentiment}`;
          const sentimentColor = netSentiment > 0 ? 'text-[#6ee7b7]' : netSentiment < 0 ? 'text-[#f8a1a1]' : 'text-[#fbb87c]';
          const themeForSeg = topIssues[idx % (topIssues.length || 1)]?.theme || 'General feedback';

          return (
            <div 
              key={seg.segment}
              className={`border ${status.border} rounded-2xl bg-[#0d0e13] p-5`}
            >
              <div className="flex items-center gap-2">
                <span className="text-[14.5px] font-bold text-white">{formatSegmentName(seg.segment)}</span>
                <span className={`ml-auto font-mono text-[10px] font-bold ${status.class}`}>
                  {status.label}
                </span>
              </div>

              <div className="mt-4 flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-[12.5px] text-[#a8adba]">
                  <span>Signals</span>
                  <span className="font-bold text-[#e9eaf0]">{seg.feedbackCount}</span>
                </div>
                <div className="flex items-center justify-between text-[12.5px] text-[#a8adba]">
                  <span>ARR Represented</span>
                  <span className="font-bold text-[#e9eaf0]">{formatRevenue(seg.totalRevenue)}</span>
                </div>
                <div className="flex items-center justify-between text-[12.5px] text-[#a8adba]">
                  <span>Net Sentiment</span>
                  <span className={`font-bold ${sentimentColor}`}>
                    {sentimentLabel} <span className="text-[11px] font-normal text-[#6d7382]">({seg.sentiment.positive}p/{seg.sentiment.negative}n)</span>
                  </span>
                </div>
              </div>

              <div className="h-px bg-[#171923] my-4" />

              <div className="font-mono text-[10px] text-[#5d626f] uppercase tracking-wider">
                PRIMARY THEME
              </div>
              <div className="mt-2 text-[12.5px] font-medium text-[#d7dae2] truncate">
                {themeForSeg}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

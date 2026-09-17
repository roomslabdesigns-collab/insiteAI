import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import type { Feedback } from '../../types.ts';

interface EnrichmentStats {
  totalFeedback: number;
  totalEnriched: number;
  pendingEnrichment: number;
}

export const FeedbackView: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState('All sources');
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [stats, setStats] = useState<EnrichmentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFeedback = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fbRes, statsRes] = await Promise.all([
        fetch('/api/feedback?limit=100').then((r) => r.json()),
        fetch('/api/feedback/enrichment/stats').then((r) => r.json()),
      ]);

      if (fbRes.success && (fbRes.data?.items || fbRes.items)) {
        setFeedbackList(fbRes.data?.items || fbRes.items || []);
      } else {
        throw new Error(fbRes.error?.message || 'Failed to load feedback records');
      }

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (err) {
      console.warn('[Feedback Fetch Error]', err);
      setError(err instanceof Error ? err.message : 'Unable to connect to feedback database.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const handleBatchEnrich = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/feedback/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 5 }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchFeedback();
      }
    } catch (err) {
      console.error('[Batch Enrich Error]', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const filters = ['All sources', 'Enterprise', 'Negative', 'Last 30 days'];

  // Filter feedback items according to selected filter chip
  const filteredFeedback = useMemo(() => {
    if (activeFilter === 'Enterprise') {
      return feedbackList.filter(
        (f) => (f.customerSegment || '').toLowerCase() === 'enterprise'
      );
    }
    if (activeFilter === 'Negative') {
      return feedbackList.filter(
        (f) => (f.sentiment || '').toLowerCase() === 'negative'
      );
    }
    if (activeFilter === 'Last 30 days') {
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      return feedbackList.filter((f) => {
        const d = new Date(f.date || f.createdAt).getTime();
        return !isNaN(d) && d >= thirtyDaysAgo;
      });
    }
    return feedbackList;
  }, [feedbackList, activeFilter]);

  const formatSource = (src?: string) => {
    if (!src) return 'Direct';
    return src
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatSegment = (seg?: string) => {
    if (!seg) return 'General';
    if (seg.toLowerCase() === 'enterprise') return 'Enterprise';
    if (seg.toLowerCase() === 'mid_market' || seg.toLowerCase() === 'mid-market') return 'Mid-market';
    if (seg.toLowerCase() === 'smb') return 'SMB';
    return seg.charAt(0).toUpperCase() + seg.slice(1);
  };

  const getSentimentBadge = (sentiment?: string) => {
    const s = (sentiment || '').toUpperCase();
    switch (s) {
      case 'NEGATIVE':
        return 'text-[#f8a1a1] bg-[rgba(248,113,113,0.1)] border-[rgba(248,113,113,0.2)]';
      case 'MIXED':
        return 'text-[#fbb87c] bg-[rgba(251,146,60,0.1)] border-[rgba(251,146,60,0.2)]';
      case 'POSITIVE':
        return 'text-[#6ee7b7] bg-[rgba(52,211,153,0.1)] border-[rgba(52,211,153,0.2)]';
      case 'NEUTRAL':
      default:
        return 'text-[#8a90a0] bg-[rgba(148,163,184,0.1)] border-[rgba(148,163,184,0.2)]';
    }
  };

  const uniqueProductAreas = useMemo(() => {
    const areas = new Set<string>();
    feedbackList.forEach((f) => {
      if (f.productArea) areas.add(f.productArea);
    });
    return areas.size;
  }, [feedbackList]);

  return (
    <div className="p-8 sm:p-10 select-none animate-in fade-in duration-200">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[27px] font-extrabold tracking-tight text-[#e9eaf0]">Feedback</h1>
          <p className="text-[13.5px] text-[#8a90a0] mt-1.5">
            {isLoading 
              ? 'Loading feedback records...' 
              : `${feedbackList.length} signals ingested · clustered into ${uniqueProductAreas} product areas`}
          </p>
        </div>

        {/* Processing status badge & batch trigger */}
        {stats && (
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#1b1d27] bg-[#0d0e14] text-[12px] text-[#8a90a0]">
              <span className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-[#fbb87c] animate-pulse' : stats.pendingEnrichment === 0 ? 'bg-[#34d399]' : 'bg-[#818cf8]'}`} />
              <span>
                AI Enrichment:{' '}
                <strong className="text-white font-semibold">{stats.totalEnriched}</strong> / {stats.totalFeedback} classified
              </span>
            </div>

            {stats.pendingEnrichment > 0 && (
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleBatchEnrich}
                className="px-3 py-1.5 rounded-xl border border-[rgba(99,102,241,0.3)] bg-[#1c1f33] text-[12px] font-semibold text-[#c7cbff] hover:bg-[#232740] transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? 'Classifying...' : `Enrich next (${stats.pendingEnrichment})`}
              </button>
            )}

            <button
              type="button"
              onClick={fetchFeedback}
              disabled={isLoading || isProcessing}
              className="p-2 rounded-xl border border-[#1b1d27] bg-[#0d0e14] text-[#8a90a0] hover:text-[#e9eaf0] hover:border-[#31365a] transition-colors cursor-pointer"
              title="Refresh feedback database"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#8b93ff]' : ''}`} />
            </button>
          </div>
        )}
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 mt-6 flex-wrap">
        {filters.map((filter) => {
          const isSelected = activeFilter === filter;
          return (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 rounded-full text-[12px] transition-colors cursor-pointer ${
                isSelected
                  ? 'border border-[rgba(99,102,241,0.3)] bg-[#1c1f33] text-[#c7cbff] font-semibold'
                  : 'border border-[#1b1d27] bg-[#0c0d12] text-[#9aa0af] hover:border-[#31365a] hover:text-[#e9eaf0]'
              }`}
            >
              {filter}
            </button>
          );
        })}
      </div>

      {/* Error Alert */}
      {error && !isLoading && (
        <div className="mt-5 p-4 rounded-2xl border border-[rgba(248,113,113,0.25)] bg-[#130b0d] flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-[#f87171] flex-none mt-0.5" />
            <div>
              <div className="text-[13.5px] font-bold text-[#fca5a5]">Feedback Service Error</div>
              <p className="text-[12.5px] text-[#e0a0a0] mt-0.5">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchFeedback}
            className="px-3 py-1.5 rounded-xl border border-[rgba(248,113,113,0.3)] bg-[#201014] text-[12px] font-semibold text-white hover:bg-[#2b161b] transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Feedback Table */}
      <div className="mt-5 border border-[#1b1d27] rounded-2xl bg-[#0b0c11] overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Table Header */}
            <div className="grid grid-cols-[2.6fr_116px_100px_94px_82px] gap-3 px-5 py-3 border-b border-[#171923] font-mono text-[9.5px] text-[#5d626f] uppercase tracking-wider font-semibold">
              <span>SIGNAL</span>
              <span>THEME / AREA</span>
              <span>SOURCE</span>
              <span>SEGMENT</span>
              <span>SENTIMENT</span>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="py-12 text-center text-[13px] text-[#6d7382]">
                <RefreshCw className="w-5 h-5 animate-spin text-[#8b93ff] mx-auto mb-2" />
                Loading feedback signals from database...
              </div>
            )}

            {/* Empty State */}
            {!isLoading && filteredFeedback.length === 0 && !error && (
              <div className="py-12 text-center text-[13px] text-[#6d7382]">
                No feedback signals match the selected filter.
              </div>
            )}

            {/* Table Rows */}
            {!isLoading && filteredFeedback.map((row) => {
              const displayTheme = row.productArea 
                ? row.productArea.replace(/_/g, ' ')
                : 'General';
              const sentimentBadge = (row.sentiment || 'NEUTRAL').toUpperCase();

              return (
                <div 
                  key={row.id}
                  className="grid grid-cols-[2.6fr_116px_100px_94px_82px] gap-3 px-5 py-4 border-b border-[#13151c] last:border-b-0 items-center hover:bg-[#0f1016] transition-colors"
                >
                  <div className="text-[13px] text-[#d7dae2] leading-relaxed">
                    <span className="font-mono text-[11px] text-[#8b93ff] mr-2">[{row.id}]</span>
                    “{row.content}”
                  </div>
                  <span className="text-[12px] text-[#8a90a0] capitalize truncate">
                    {displayTheme}
                  </span>
                  <span className="text-[12px] text-[#8a90a0] truncate">
                    {formatSource(row.source)}
                  </span>
                  <span className="text-[12px] text-[#8a90a0]">
                    {formatSegment(row.customerSegment)}
                  </span>
                  <div>
                    <span className={`inline-block font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${getSentimentBadge(sentimentBadge)}`}>
                      {sentimentBadge}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

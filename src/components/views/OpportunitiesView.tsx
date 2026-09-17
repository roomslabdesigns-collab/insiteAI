import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import type { PrioritizedOpportunity } from '../../types.ts';

interface OpportunitiesViewProps {
  onAskAI: () => void;
}

export const OpportunitiesView: React.FC<OpportunitiesViewProps> = ({ onAskAI }) => {
  const [opportunities, setOpportunities] = useState<PrioritizedOpportunity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFactorId, setSelectedFactorId] = useState<string | null>(null);

  const fetchPriorities = useCallback(async (isRefreshAction = false) => {
    if (isRefreshAction) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await fetch('/api/priorities');
      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setOpportunities(json.data);
      } else {
        throw new Error(json.error?.message || 'Failed to retrieve opportunities');
      }
    } catch (err) {
      console.warn('Failed to load live priorities:', err);
      setError(err instanceof Error ? err.message : 'Unable to load priorities from backend.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPriorities();
  }, [fetchPriorities]);

  const totalDetected = opportunities.length;

  return (
    <div className="p-8 sm:p-10 select-none animate-in fade-in duration-200">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[27px] font-extrabold tracking-tight text-[#e9eaf0]">Opportunities</h1>
          <p className="text-[13.5px] text-[#8a90a0] mt-1.5">
            {loading ? 'Analyzing signals...' : `${totalDetected} detected · ranked by business impact score`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchPriorities(true)}
            disabled={loading || isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 border border-[#1e2029] rounded-xl bg-[#0e0f15] text-[12.5px] font-semibold text-[#a8adba] hover:border-[#31365a] hover:text-[#e9eaf0] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#8b93ff]' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <button 
            type="button" 
            onClick={onAskAI}
            className="px-3.5 py-2 border border-[rgba(99,102,241,0.3)] rounded-xl bg-[#1c1f33] text-[12.5px] font-semibold text-[#c7cbff] hover:bg-[#232740] transition-colors cursor-pointer"
          >
            Ask AI to prioritize
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && !loading && (
        <div className="mt-6 p-4 rounded-2xl border border-[rgba(248,113,113,0.25)] bg-[#130b0d] flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-[#f87171] flex-none mt-0.5" />
            <div>
              <div className="text-[13.5px] font-bold text-[#fca5a5]">Opportunities Service Error</div>
              <p className="text-[12.5px] text-[#e0a0a0] mt-0.5">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => fetchPriorities()}
            className="px-3 py-1.5 rounded-xl border border-[rgba(248,113,113,0.3)] bg-[#201014] text-[12px] font-semibold text-white hover:bg-[#2b161b] transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="mt-6 border border-[#1b1d27] rounded-2xl bg-[#0d0e13] p-12 text-center text-[#6d7382]">
          <RefreshCw className="w-5 h-5 animate-spin text-[#8b93ff] mx-auto mb-2" />
          Ranking product opportunities against feedback evidence...
        </div>
      )}

      {/* Empty state */}
      {!loading && opportunities.length === 0 && !error && (
        <div className="mt-6 border border-[#1b1d27] rounded-2xl bg-[#0d0e13] p-8 text-center text-[#6d7382]">
          No prioritized product opportunities found in stored feedback.
        </div>
      )}

      <div className="flex flex-col gap-3 mt-6">
        {!loading && opportunities.map((opp, idx) => {
          const rank = (idx + 1).toString().padStart(2, '0');
          const isSelected = selectedFactorId === opp.id;
          const factors = opp.priorityFactors;

          return (
            <div 
              key={opp.id}
              className="border border-[#1b1d27] rounded-2xl bg-[#0d0e13] p-4 sm:p-5 hover:border-[#31365a] transition-all cursor-pointer"
              onClick={() => setSelectedFactorId(isSelected ? null : opp.id)}
            >
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono text-[11px] text-[#8b93ff] font-semibold">{rank}</span>
                <span className="text-[15.5px] font-bold tracking-tight text-[#e9eaf0]">{opp.title}</span>
                <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold border ${
                  opp.priorityLevel === 'Critical' 
                    ? 'bg-[rgba(248,113,113,0.12)] border-[rgba(248,113,113,0.24)] text-[#f8a1a1]' 
                    : opp.priorityLevel === 'High' 
                    ? 'bg-[rgba(251,146,60,0.12)] border-[rgba(251,146,60,0.24)] text-[#fbb87c]'
                    : opp.priorityLevel === 'Medium'
                    ? 'bg-[rgba(99,102,241,0.12)] border-[rgba(99,102,241,0.24)] text-[#a5b4fc]'
                    : 'bg-[rgba(52,211,153,0.1)] border-[rgba(52,211,153,0.22)] text-[#6ee7b7]'
                }`}>
                  {opp.priorityLevel.toUpperCase()}
                </span>
                <span className="ml-auto font-mono text-[13px] font-bold text-white">{opp.priorityScore}</span>
              </div>

              <div className="h-1 rounded-full bg-[#171923] mt-3 overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${opp.meterColor}`} 
                  style={{ width: opp.meterWidth }}
                />
              </div>

              <div className="flex items-center gap-6 flex-wrap mt-3.5 pt-1">
                <div>
                  <div className="font-mono text-[9.5px] text-[#5d626f] uppercase tracking-wider">
                    {opp.isExpansion ? 'EXPANSION' : 'ARR AT RISK'}
                  </div>
                  <div className="mt-1 text-[13px] font-bold text-white">{opp.revenueDisplay}</div>
                </div>
                <div>
                  <div className="font-mono text-[9.5px] text-[#5d626f] uppercase tracking-wider">ACCOUNTS</div>
                  <div className="mt-1 text-[13px] font-bold text-white">{opp.accountsCount}</div>
                </div>
                <div>
                  <div className="font-mono text-[9.5px] text-[#5d626f] uppercase tracking-wider">EVIDENCE</div>
                  <div className="mt-1 text-[13px] font-bold text-white">{opp.evidenceDisplay}</div>
                </div>
                <div>
                  <div className="font-mono text-[9.5px] text-[#5d626f] uppercase tracking-wider">EFFORT</div>
                  <div className="mt-1 text-[13px] font-bold text-white">{opp.effort}</div>
                </div>
                <div>
                  <div className="font-mono text-[9.5px] text-[#5d626f] uppercase tracking-wider">TREND 30D</div>
                  <div className={`mt-1 text-[13px] font-bold ${opp.trendPositive ? 'text-[#6ee7b7]' : 'text-[#f8a1a1]'}`}>
                    {opp.trend}
                  </div>
                </div>
              </div>

              {/* Evidence & Factor Breakdown (expandable on click) */}
              {isSelected && factors && (
                <div className="mt-4 pt-3 border-t border-[#171923] text-[12px] animate-in fade-in duration-150">
                  <div className="font-mono text-[10px] text-[#8b93ff] uppercase tracking-wider font-semibold mb-2">
                    Priority Score Breakdown ({opp.priorityScore} / 100)
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-[11px] text-[#9fa5b5] bg-[#08090d] p-3 rounded-xl border border-[#1a1c27]">
                    <div>
                      <span className="text-[#5d626f] block text-[9.5px]">FREQUENCY</span>
                      <span className="text-white font-bold">{factors.frequencyScore}/20</span> ({factors.rawMetrics.feedbackCount} signals)
                    </div>
                    <div>
                      <span className="text-[#5d626f] block text-[9.5px]">SEVERITY</span>
                      <span className="text-white font-bold">{factors.severityScore}/25</span> ({factors.rawMetrics.highestSeverity})
                    </div>
                    <div>
                      <span className="text-[#5d626f] block text-[9.5px]">SEGMENT</span>
                      <span className="text-white font-bold">{factors.segmentScore}/20</span> ({factors.rawMetrics.affectedSegments.join(', ') || 'N/A'})
                    </div>
                    <div>
                      <span className="text-[#5d626f] block text-[9.5px]">CHURN</span>
                      <span className="text-white font-bold">{factors.churnScore}/20</span> ({factors.rawMetrics.churnSignalCount} signals)
                    </div>
                    <div>
                      <span className="text-[#5d626f] block text-[9.5px]">REVENUE</span>
                      <span className="text-white font-bold">{factors.revenueScore}/15</span> (${(factors.rawMetrics.totalRevenue / 1000).toFixed(0)}k ARR)
                    </div>
                  </div>
                  <div className="mt-2.5 font-mono text-[10.5px] text-[#6d7382]">
                    Supporting Feedback IDs: <span className="text-[#c7cbff]">{opp.supportingFeedbackIds.join(', ')}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

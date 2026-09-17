import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import type { Feedback } from '../../types.ts';

interface EvidenceItem {
  id: string;
  quote: string;
  meta: string;
  theme: string;
}

export const EvidenceView: React.FC = () => {
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvidence = useCallback(async (isRefreshAction = false) => {
    if (isRefreshAction) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await fetch('/api/feedback?limit=100');
      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }
      const json = await res.json();
      const rawList = Array.isArray(json.data) 
        ? json.data 
        : Array.isArray(json.data?.items) 
        ? json.data.items 
        : Array.isArray(json.items) 
        ? json.items 
        : [];
      
      const mapped: EvidenceItem[] = rawList.map((fb: Feedback) => {
        const seg = (fb.customerSegment || 'General').toUpperCase();
        const rev = typeof fb.revenue === 'number' && fb.revenue > 0 ? ` · $${(fb.revenue / 1000).toFixed(0)}K ARR` : '';
        const src = fb.source ? fb.source.replace(/_/g, ' ') : 'feedback';
        const cid = fb.customerId ? ` · ${fb.customerId}` : '';
        const meta = `${src.charAt(0).toUpperCase() + src.slice(1)} · ${seg}${rev}${cid}`;
        const theme = fb.productArea ? `${fb.productArea.charAt(0).toUpperCase() + fb.productArea.slice(1)}` : 'General';

        return {
          id: fb.id,
          quote: `“${fb.content}”`,
          meta,
          theme,
        };
      });

      setEvidenceItems(mapped);
    } catch (err) {
      console.warn('Failed to load evidence library feedback:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to feedback database.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchEvidence();
  }, [fetchEvidence]);

  return (
    <div className="p-8 sm:p-10 select-none animate-in fade-in duration-200">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[27px] font-extrabold tracking-tight text-[#e9eaf0]">Evidence Library</h1>
          <p className="text-[13.5px] text-[#8a90a0] mt-1.5">
            {loading ? 'Retrieving evidence records...' : 'Every quote behind a recommendation, with its account and value'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchEvidence(true)}
          disabled={loading || isRefreshing}
          className="flex items-center gap-1.5 px-3.5 py-2 border border-[#1e2029] rounded-xl bg-[#0e0f15] text-[12.5px] font-semibold text-[#a8adba] hover:border-[#31365a] hover:text-[#e9eaf0] transition-colors disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#8b93ff]' : ''}`} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Error State */}
      {error && !loading && (
        <div className="mt-6 p-4 rounded-2xl border border-[rgba(248,113,113,0.25)] bg-[#130b0d] flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-[#f87171] flex-none mt-0.5" />
            <div>
              <div className="text-[13.5px] font-bold text-[#fca5a5]">Evidence Library Error</div>
              <p className="text-[12.5px] text-[#e0a0a0] mt-0.5">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => fetchEvidence()}
            className="px-3 py-1.5 rounded-xl border border-[rgba(248,113,113,0.3)] bg-[#201014] text-[12px] font-semibold text-white hover:bg-[#2b161b] transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="mt-6 border border-[#1b1d27] rounded-2xl bg-[#0d0e13] p-12 text-center text-[#6d7382]">
          <RefreshCw className="w-5 h-5 animate-spin text-[#8b93ff] mx-auto mb-2" />
          Loading evidence records from database...
        </div>
      )}

      {/* Empty State */}
      {!loading && evidenceItems.length === 0 && !error && (
        <div className="mt-6 border border-[#1b1d27] rounded-2xl bg-[#0d0e13] p-8 text-center text-[#6d7382]">
          No evidence records found in feedback database.
        </div>
      )}

      {/* Evidence List */}
      <div className="flex flex-col gap-2.5 mt-6">
        {!loading && evidenceItems.map((item) => (
          <div 
            key={item.id}
            className="border border-[#1b1d27] rounded-xl bg-[#0d0e13] p-4 sm:p-5 hover:border-[#2b2f45] transition-colors"
          >
            <p className="text-[13.5px] leading-relaxed text-[#d7dae2]">
              <span className="font-mono text-[11px] text-[#8b93ff] mr-2">[{item.id}]</span>
              {item.quote}
            </p>
            <div className="flex items-center gap-2.5 mt-3 font-mono text-[10.5px] text-[#6d7382] flex-wrap">
              <span>{item.meta}</span>
              <span className="ml-auto text-[#8b93ff] font-sans font-medium">{item.theme}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

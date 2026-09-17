import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  BarChart2, 
  Users, 
  TrendingDown, 
  ArrowRight, 
  Sparkles,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import type { NavPage } from '../Sidebar.tsx';
import type { AnalystAskResponse } from '../../types.ts';

interface NewQueryViewProps {
  viewMode: 'home' | 'answer';
  currentQuestion: string;
  onAskPreset: (question: string) => void;
  onResetToHome: () => void;
  onNavigate: (page: NavPage) => void;
}

export const NewQueryView: React.FC<NewQueryViewProps> = ({
  viewMode,
  currentQuestion,
  onAskPreset,
  onResetToHome,
  onNavigate,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [analystResponse, setAnalystResponse] = useState<AnalystAskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number>(0);

  useEffect(() => {
    if (viewMode === 'answer' && currentQuestion) {
      let isMounted = true;
      setIsLoading(true);
      setError(null);
      const start = Date.now();

      fetch('/api/analyst/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: currentQuestion }),
      })
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok || (!data.success && !data.answer)) {
            throw new Error(data.error?.message || data.message || 'Failed to retrieve analyst answer');
          }
          if (isMounted) {
            setAnalystResponse({
              answer: data.answer || data.data?.answer || '',
              evidence: data.evidence || data.data?.evidence || [],
            });
            setElapsedMs(Date.now() - start);
          }
        })
        .catch((err) => {
          if (isMounted) {
            setError(err instanceof Error ? err.message : 'Unknown analyst error');
          }
        })
        .finally(() => {
          if (isMounted) {
            setIsLoading(false);
          }
        });

      return () => {
        isMounted = false;
      };
    }
  }, [viewMode, currentQuestion]);

  if (viewMode === 'answer') {
    return (
      <div className="max-w-[880px] mx-auto px-6 sm:px-10 py-9 animate-in fade-in duration-200">
        {/* User Question Header */}
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 flex-none rounded-lg bg-[#14161e] border border-[#1e2029] flex items-center justify-center font-mono text-[10.5px] font-bold text-[#8b93ff]">
            Q
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[23px] leading-[1.34] font-bold tracking-tight text-[#e9eaf0]">
              {currentQuestion || 'What are the biggest customer problems?'}
            </h2>
            <div className="flex items-center gap-2 mt-2 font-mono text-[11px] text-[#7b8190]">
              <span className={`w-2 h-2 rounded-full ${isLoading ? 'bg-[#fbb87c] animate-pulse' : 'bg-[#34d399]'}`} />
              <span>
                {isLoading
                  ? 'Searching semantic vectors & synthesizing grounded answer...'
                  : `Answer grounded in ${analystResponse?.evidence?.length || 0} customer feedback signals · ${(elapsedMs / 1000).toFixed(1)}s`}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onResetToHome}
            className="px-3 py-1.5 rounded-xl border border-[#1e2029] bg-[#0c0d12] text-[12px] font-semibold text-[#8a90a0] hover:text-[#e9eaf0] hover:border-[#31365a] transition-colors"
          >
            New query
          </button>
        </div>

        {/* Quick test prompt suggestions */}
        <div className="flex items-center gap-2 flex-wrap mt-5 pt-3 border-t border-[#171923]">
          <span className="font-mono text-[9.5px] text-[#5d626f] tracking-wider uppercase font-semibold">
            TEST PROMPTS:
          </span>
          <button
            type="button"
            onClick={() => onAskPreset('What are the biggest customer problems?')}
            className="px-2.5 py-1 rounded-lg border border-[#1b1d27] bg-[#0d0e14] text-[11.5px] text-[#9aa0af] hover:text-white hover:border-[#31365a] transition-colors"
          >
            Biggest problems
          </button>
          <button
            type="button"
            onClick={() => onAskPreset('What feature requests appear most often?')}
            className="px-2.5 py-1 rounded-lg border border-[#1b1d27] bg-[#0d0e14] text-[11.5px] text-[#9aa0af] hover:text-white hover:border-[#31365a] transition-colors"
          >
            Feature requests
          </button>
          <button
            type="button"
            onClick={() => onAskPreset('Which customers are reporting serious issues?')}
            className="px-2.5 py-1 rounded-lg border border-[#1b1d27] bg-[#0d0e14] text-[11.5px] text-[#9aa0af] hover:text-white hover:border-[#31365a] transition-colors"
          >
            Serious issues
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="mt-8 border border-[#1b1d27] rounded-2xl bg-[#0b0c11] p-8 flex flex-col items-center justify-center text-center">
            <RefreshCw className="w-6 h-6 text-[#8b93ff] animate-spin mb-3" />
            <div className="text-[14.5px] font-bold text-[#e9eaf0]">InsightAI Analyst is reasoning...</div>
            <p className="text-[12.5px] text-[#7b8190] mt-1 max-w-[420px]">
              Retrieving vector embeddings from feedback database, checking customer evidence, and compiling a grounded response.
            </p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="mt-8 border border-[rgba(248,113,113,0.25)] rounded-2xl bg-[#130b0d] p-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#f87171] flex-none mt-0.5" />
            <div>
              <div className="text-[14px] font-bold text-[#fca5a5]">Analysis Error</div>
              <p className="text-[12.5px] text-[#e0a0a0] mt-1">{error}</p>
              <button
                type="button"
                onClick={() => onAskPreset(currentQuestion)}
                className="mt-3 px-3 py-1.5 rounded-lg border border-[rgba(248,113,113,0.3)] bg-[#201014] text-[12px] font-semibold text-white hover:bg-[#2b161b] transition-colors"
              >
                Retry Query
              </button>
            </div>
          </div>
        )}

        {/* Successful Answer Display */}
        {!isLoading && analystResponse && !error && (
          <div className="mt-6 flex flex-col gap-6">
            {/* Grounded Synthesis Section */}
            <div className="border border-[#1f2230] rounded-2xl bg-[#0c0d12] p-5 sm:p-7 shadow-lg">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#171923]">
                <Sparkles className="w-4 h-4 text-[#8b93ff]" />
                <span className="font-mono text-[11px] font-bold tracking-wider text-[#8b93ff] uppercase">
                  SYNTHESIZED INSIGHT (STRICTLY GROUNDED)
                </span>
                <span className="ml-auto font-mono text-[10.5px] text-[#5d626f]">
                  gemini-3.8-flash · 0 hallucinations
                </span>
              </div>

              <div className="text-[14.5px] leading-relaxed text-[#d4d8e4] whitespace-pre-wrap font-sans space-y-3">
                {analystResponse.answer}
              </div>
            </div>

            {/* Supporting Evidence List */}
            <div className="border border-[#1b1d27] rounded-2xl bg-[#090a0e] p-5 sm:p-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#171923] flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-bold tracking-wider text-[#9aa0af] uppercase">
                    SUPPORTING EVIDENCE ({analystResponse.evidence.length})
                  </span>
                  <span className="text-[11px] text-[#5d626f]">
                    Retrieved via semantic vector search
                  </span>
                </div>
              </div>

              {analystResponse.evidence.length === 0 ? (
                <div className="py-6 text-center text-[13px] text-[#6d7382]">
                  No supporting customer signals met the relevance threshold.
                </div>
              ) : (
                <div className="flex flex-col gap-3 mt-4">
                  {analystResponse.evidence.map((ev) => {
                    const matchPercent = Math.round(ev.similarity * 100);
                    const isCritical = ev.severity === 'critical' || ev.severity === 'high';

                    return (
                      <div
                        key={ev.feedbackId}
                        className="border border-[#171923] hover:border-[#2b2f45] rounded-xl bg-[#0d0e14] p-4 transition-colors"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[11px] font-semibold text-[#8b93ff]">
                            [{ev.feedbackId}]
                          </span>

                          <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-[#141622] border border-[#22263d] text-[#c7cbff]">
                            {matchPercent}% similarity
                          </span>

                          {ev.productArea && (
                            <span className="px-2 py-0.5 rounded-md font-mono text-[10px] uppercase bg-[#101118] border border-[#1b1d27] text-[#8a90a0]">
                              {ev.productArea}
                            </span>
                          )}

                          {ev.severity && (
                            <span
                              className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase border ${
                                isCritical
                                  ? 'bg-[rgba(248,113,113,0.12)] border-[rgba(248,113,113,0.25)] text-[#f8a1a1]'
                                  : 'bg-[#151722] border-[#222638] text-[#9aa0af]'
                              }`}
                            >
                              {ev.severity}
                            </span>
                          )}

                          {ev.feedbackType && (
                            <span className="px-2 py-0.5 rounded-md font-mono text-[10px] bg-[#12131b] border border-[#1c1e2b] text-[#7e8597]">
                              {ev.feedbackType}
                            </span>
                          )}

                          {ev.theme && (
                            <span className="ml-auto font-mono text-[10.5px] text-[#636877]">
                              Theme: {ev.theme}
                            </span>
                          )}
                        </div>

                        <p className="mt-2.5 text-[13px] leading-relaxed text-[#c3c8d4] italic border-l-2 border-[#2b2f45] pl-3 py-0.5">
                          "{ev.content}"
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onResetToHome}
                className="px-4 py-2 rounded-xl bg-[#1c1f33] border border-[rgba(99,102,241,0.3)] text-[12.5px] font-semibold text-[#c7cbff] hover:bg-[#232740] transition-colors cursor-pointer"
              >
                Ask another question
              </button>
              <button
                type="button"
                onClick={() => onNavigate('feedback')}
                className="px-4 py-2 rounded-xl bg-[#0f1016] border border-[#1e2029] text-[12.5px] font-semibold text-[#a8adba] hover:border-[#31365a] hover:text-[#e9eaf0] transition-colors"
              >
                Browse all feedback
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Home Landing Mode
  return (
    <div className="max-w-[820px] mx-auto px-6 py-20 flex flex-col items-center select-none animate-in fade-in duration-200">
      {/* Index Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#1e2029] rounded-full bg-[#0e0f15] font-mono text-[11px] text-[#9096a5]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#8b93ff]" />
        <span>2,481 signals indexed · RAG + hybrid retrieval</span>
      </div>

      {/* Hero Header */}
      <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mt-7 text-center leading-[1.08]">
        How can I help you today?
      </h1>
      <p className="text-[15.5px] text-[#8a90a0] mt-3.5 text-center max-w-[600px] leading-relaxed">
        Ask questions about your product feedback, customers, churn, and product opportunities — every answer is traced back to evidence.
      </p>

      {/* 4 Action Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full mt-10">
        <div 
          onClick={() => onAskPreset('Summarize the most important feedback themes from the last 90 days')}
          className="border border-[#1b1d27] rounded-2xl bg-[#0d0e13] p-4 sm:p-5 cursor-pointer hover:border-[#31365a] hover:-translate-y-0.5 hover:shadow-[0_12px_34px_-20px_rgba(99,102,241,0.75)] hover:bg-[#101118] transition-all"
        >
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-[#c3c8d4]" />
            <span className="text-[14.5px] font-bold text-white tracking-tight">Summarize Feedback</span>
            <ArrowRight className="w-4 h-4 text-[#6d7382] ml-auto" />
          </div>
          <p className="mt-2.5 text-[12.8px] leading-relaxed text-[#868c9c]">
            Identify the most important themes across customer feedback sources.
          </p>
        </div>

        <div 
          onClick={() => onAskPreset('Which product opportunity has the highest business impact?')}
          className="border border-[#1b1d27] rounded-2xl bg-[#0d0e13] p-4 sm:p-5 cursor-pointer hover:border-[#31365a] hover:-translate-y-0.5 hover:shadow-[0_12px_34px_-20px_rgba(99,102,241,0.75)] hover:bg-[#101118] transition-all"
        >
          <div className="flex items-center gap-3">
            <BarChart2 className="w-5 h-5 text-[#c3c8d4]" />
            <span className="text-[14.5px] font-bold text-white tracking-tight">Find Opportunities</span>
            <ArrowRight className="w-4 h-4 text-[#6d7382] ml-auto" />
          </div>
          <p className="mt-2.5 text-[12.8px] leading-relaxed text-[#868c9c]">
            Discover and prioritize the highest-impact product opportunities.
          </p>
        </div>

        <div 
          onClick={() => onAskPreset('What are enterprise customers saying compared to mid-market?')}
          className="border border-[#1b1d27] rounded-2xl bg-[#0d0e13] p-4 sm:p-5 cursor-pointer hover:border-[#31365a] hover:-translate-y-0.5 hover:shadow-[0_12px_34px_-20px_rgba(99,102,241,0.75)] hover:bg-[#101118] transition-all"
        >
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-[#c3c8d4]" />
            <span className="text-[14.5px] font-bold text-white tracking-tight">Customer Insights</span>
            <ArrowRight className="w-4 h-4 text-[#6d7382] ml-auto" />
          </div>
          <p className="mt-2.5 text-[12.8px] leading-relaxed text-[#868c9c]">
            Understand what different customer segments are saying.
          </p>
        </div>

        <div 
          onClick={() => onAskPreset('Why are customers churning, and which product problems contribute most?')}
          className="border border-[#1b1d27] rounded-2xl bg-[#0d0e13] p-4 sm:p-5 cursor-pointer hover:border-[#31365a] hover:-translate-y-0.5 hover:shadow-[0_12px_34px_-20px_rgba(99,102,241,0.75)] hover:bg-[#101118] transition-all"
        >
          <div className="flex items-center gap-3">
            <TrendingDown className="w-5 h-5 text-[#c3c8d4]" />
            <span className="text-[14.5px] font-bold text-white tracking-tight">Analyze Churn</span>
            <ArrowRight className="w-4 h-4 text-[#6d7382] ml-auto" />
          </div>
          <p className="mt-2.5 text-[12.8px] leading-relaxed text-[#868c9c]">
            Identify why customers are leaving and what product problems contribute to churn.
          </p>
        </div>
      </div>

      {/* Suggested Prompt Chips */}
      <div className="flex items-center gap-2 flex-wrap justify-center mt-9">
        <span className="font-mono text-[10px] text-[#5d626f] tracking-widest uppercase font-semibold mr-1">
          TRY
        </span>
        <button 
          type="button" 
          onClick={() => onAskPreset('What are the biggest customer problems?')}
          className="px-3 py-1.5 rounded-full border border-[#1b1d27] bg-[#0c0d12] text-[12px] text-[#9aa0af] hover:border-[#31365a] hover:text-[#e9eaf0] transition-colors"
        >
          What are the biggest customer problems?
        </button>
        <button 
          type="button" 
          onClick={() => onAskPreset('What feature requests appear most often?')}
          className="px-3 py-1.5 rounded-full border border-[#1b1d27] bg-[#0c0d12] text-[12px] text-[#9aa0af] hover:border-[#31365a] hover:text-[#e9eaf0] transition-colors"
        >
          What feature requests appear most often?
        </button>
        <button 
          type="button" 
          onClick={() => onAskPreset('Which customers are reporting serious issues?')}
          className="px-3 py-1.5 rounded-full border border-[#1b1d27] bg-[#0c0d12] text-[12px] text-[#9aa0af] hover:border-[#31365a] hover:text-[#e9eaf0] transition-colors"
        >
          Which customers are reporting serious issues?
        </button>
      </div>
    </div>
  );
};

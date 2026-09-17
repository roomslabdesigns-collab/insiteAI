import React from 'react';
import { Plus } from 'lucide-react';

export const SourcesView: React.FC = () => {
  const sources = [
    { name: 'Support Tickets', signals: '1,042', lastSync: '4 min ago', status: 'Connected' },
    { name: 'App Reviews', signals: '486', lastSync: '12 min ago', status: 'Connected' },
    { name: 'NPS Feedback', signals: '402', lastSync: '1 hr ago', status: 'Connected' },
    { name: 'Churn Surveys', signals: '388', lastSync: '3 hrs ago', status: 'Connected' },
    { name: 'Feature Requests', signals: '163', lastSync: '20 min ago', status: 'Connected' },
  ];

  return (
    <div className="p-8 sm:p-10 select-none animate-in fade-in duration-200">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[27px] font-extrabold tracking-tight text-[#e9eaf0]">Data Sources</h1>
          <p className="text-[13.5px] text-[#8a90a0] mt-1.5">5 connected · 2,481 signals ingested · sync every 15 min</p>
        </div>
        <button 
          type="button" 
          className="px-3.5 py-2 border border-[rgba(99,102,241,0.3)] rounded-xl bg-[#1c1f33] text-[12.5px] font-semibold text-[#c7cbff] hover:bg-[#232740] transition-colors"
        >
          Connect source
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
        {sources.map((src) => (
          <div 
            key={src.name}
            className="border border-[#1b1d27] rounded-2xl bg-[#0d0e13] p-4 sm:p-5 hover:border-[#2b2f45] transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-[14px] font-bold text-white">{src.name}</span>
              <span className="ml-auto flex items-center gap-1.5 text-[11px] text-[#6ee7b7] font-medium whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34d399]" />
                {src.status}
              </span>
            </div>

            <div className="flex items-center gap-5 mt-3.5">
              <div>
                <div className="font-mono text-[9.5px] text-[#5d626f] uppercase tracking-wider">SIGNALS</div>
                <div className="mt-1 text-[13px] font-bold text-white">{src.signals}</div>
              </div>
              <div>
                <div className="font-mono text-[9.5px] text-[#5d626f] uppercase tracking-wider">LAST SYNC</div>
                <div className="mt-1 text-[13px] font-bold text-white">{src.lastSync}</div>
              </div>
            </div>
          </div>
        ))}

        {/* Add Source Card */}
        <div className="border border-dashed border-[#232637] rounded-2xl bg-[#0a0b0f] p-5 flex items-center justify-center gap-2 text-[#7b8190] text-[13px] font-semibold cursor-pointer hover:border-[#31365a] hover:text-[#e9eaf0] transition-colors min-h-[106px]">
          <Plus className="w-4 h-4" />
          <span>Add a source</span>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';

export const SettingsView: React.FC = () => {
  const [hybridRetrieval, setHybridRetrieval] = useState(true);
  const [spikeAlerts, setSpikeAlerts] = useState(true);
  const [anonymize, setAnonymize] = useState(false);

  return (
    <div className="p-8 sm:p-10 max-w-[720px] select-none animate-in fade-in duration-200">
      <h1 className="text-[27px] font-extrabold tracking-tight text-[#e9eaf0]">Settings</h1>
      <p className="text-[13.5px] text-[#8a90a0] mt-1.5">Workspace · Acme Product Org</p>

      <div className="border border-[#1b1d27] rounded-2xl bg-[#0b0c11] mt-6 overflow-hidden">
        {/* Scoring Model Row */}
        <div className="flex items-center gap-3.5 p-4 sm:p-5 border-b border-[#13151c]">
          <div>
            <div className="text-[13.5px] font-semibold text-white">Impact scoring model</div>
            <div className="text-[12px] text-[#7b8190] mt-1">ARR-weighted · segment adjusted</div>
          </div>
          <button 
            type="button" 
            className="ml-auto px-3 py-1.5 border border-[#1e2029] rounded-lg text-[12px] text-[#a8adba] hover:border-[#31365a] hover:text-[#e9eaf0] transition-colors"
          >
            Configure
          </button>
        </div>

        {/* Hybrid Retrieval Toggle */}
        <div className="flex items-center gap-3.5 p-4 sm:p-5 border-b border-[#13151c]">
          <div>
            <div className="text-[13.5px] font-semibold text-white">Retrieval</div>
            <div className="text-[12px] text-[#7b8190] mt-1">Hybrid (BM25 + embeddings) · rerank on</div>
          </div>
          <button 
            type="button" 
            onClick={() => setHybridRetrieval(!hybridRetrieval)}
            className={`ml-auto w-[38px] h-[22px] rounded-full p-0.5 flex transition-colors cursor-pointer ${
              hybridRetrieval ? 'bg-[#3b3f7a] justify-end' : 'bg-[#1e2029] justify-start'
            }`}
          >
            <span className={`w-4 h-4 rounded-full transition-colors ${
              hybridRetrieval ? 'bg-[#c7cbff]' : 'bg-[#5d626f]'
            }`} />
          </button>
        </div>

        {/* Theme Spike Alerts Toggle */}
        <div className="flex items-center gap-3.5 p-4 sm:p-5 border-b border-[#13151c]">
          <div>
            <div className="text-[13.5px] font-semibold text-white">Theme spike alerts</div>
            <div className="text-[12px] text-[#7b8190] mt-1">Notify when a cluster grows &gt;20% week over week</div>
          </div>
          <button 
            type="button" 
            onClick={() => setSpikeAlerts(!spikeAlerts)}
            className={`ml-auto w-[38px] h-[22px] rounded-full p-0.5 flex transition-colors cursor-pointer ${
              spikeAlerts ? 'bg-[#3b3f7a] justify-end' : 'bg-[#1e2029] justify-start'
            }`}
          >
            <span className={`w-4 h-4 rounded-full transition-colors ${
              spikeAlerts ? 'bg-[#c7cbff]' : 'bg-[#5d626f]'
            }`} />
          </button>
        </div>

        {/* Anonymization Toggle */}
        <div className="flex items-center gap-3.5 p-4 sm:p-5">
          <div>
            <div className="text-[13.5px] font-semibold text-white">Anonymize customer names in reports</div>
            <div className="text-[12px] text-[#7b8190] mt-1">Replace account names with identifiers when sharing</div>
          </div>
          <button 
            type="button" 
            onClick={() => setAnonymize(!anonymize)}
            className={`ml-auto w-[38px] h-[22px] rounded-full p-0.5 flex transition-colors cursor-pointer ${
              anonymize ? 'bg-[#3b3f7a] justify-end' : 'bg-[#1e2029] justify-start'
            }`}
          >
            <span className={`w-4 h-4 rounded-full transition-colors ${
              anonymize ? 'bg-[#c7cbff]' : 'bg-[#5d626f]'
            }`} />
          </button>
        </div>
      </div>
    </div>
  );
};

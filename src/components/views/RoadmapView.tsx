import React from 'react';

export const RoadmapView: React.FC = () => {
  return (
    <div className="p-8 sm:p-10 select-none animate-in fade-in duration-200">
      <h1 className="text-[27px] font-extrabold tracking-tight text-[#e9eaf0]">Roadmap</h1>
      <p className="text-[13.5px] text-[#8a90a0] mt-1.5">Every item traced to the evidence that justified it</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
        {/* NOW Column */}
        <div className="border border-[#1b1d27] rounded-2xl bg-[#0b0c11] p-3.5 flex flex-col gap-2.5">
          <div className="flex items-center gap-2 font-mono text-[10px] text-[#7b8190] tracking-wider uppercase font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8b93ff]" />
            <span>NOW · Q4</span>
          </div>

          <div className="border border-[#232637] rounded-xl bg-[#0f1016] p-3.5">
            <div className="text-[13.5px] font-bold text-white">Scheduled report export</div>
            <p className="text-[12px] leading-relaxed text-[#868c9c] mt-1.5">
              CSV + PDF delivery on a cadence, workspace-wide.
            </p>
            <div className="mt-2.5 font-mono text-[10.5px] text-[#8b93ff]">
              412 evidence · $820K ARR
            </div>
          </div>

          <div className="border border-[#1b1d27] rounded-xl bg-[#0f1016] p-3.5">
            <div className="text-[13.5px] font-bold text-white">Theme spike alerts</div>
            <p className="text-[12px] leading-relaxed text-[#868c9c] mt-1.5">
              Slack + email when a cluster grows fast.
            </p>
            <div className="mt-2.5 font-mono text-[10.5px] text-[#7b8190]">
              96 evidence
            </div>
          </div>
        </div>

        {/* NEXT Column */}
        <div className="border border-[#1b1d27] rounded-2xl bg-[#0b0c11] p-3.5 flex flex-col gap-2.5">
          <div className="flex items-center gap-2 font-mono text-[10px] text-[#7b8190] tracking-wider uppercase font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#fb923c]" />
            <span>NEXT · Q1</span>
          </div>

          <div className="border border-[#1b1d27] rounded-xl bg-[#0f1016] p-3.5">
            <div className="text-[13.5px] font-bold text-white">Granular role scoping</div>
            <p className="text-[12px] leading-relaxed text-[#868c9c] mt-1.5">
              Per-project permissions for security reviews.
            </p>
            <div className="mt-2.5 font-mono text-[10.5px] text-[#7b8190]">
              288 evidence · $610K ARR
            </div>
          </div>

          <div className="border border-[#1b1d27] rounded-xl bg-[#0f1016] p-3.5">
            <div className="text-[13.5px] font-bold text-white">Bulk provisioning</div>
            <p className="text-[12px] leading-relaxed text-[#868c9c] mt-1.5">
              SCIM sync and invite templates.
            </p>
            <div className="mt-2.5 font-mono text-[10.5px] text-[#7b8190]">
              164 evidence
            </div>
          </div>
        </div>

        {/* LATER Column */}
        <div className="border border-[#1b1d27] rounded-2xl bg-[#0b0c11] p-3.5 flex flex-col gap-2.5">
          <div className="flex items-center gap-2 font-mono text-[10px] text-[#7b8190] tracking-wider uppercase font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4b5060]" />
            <span>LATER</span>
          </div>

          <div className="border border-[#1b1d27] rounded-xl bg-[#0f1016] p-3.5">
            <div className="text-[13.5px] font-bold text-white">Mobile performance pass</div>
            <p className="text-[12px] leading-relaxed text-[#868c9c] mt-1.5">
              Cold-start and list rendering work.
            </p>
            <div className="mt-2.5 font-mono text-[10.5px] text-[#7b8190]">
              139 evidence
            </div>
          </div>

          <div className="border border-[#1b1d27] rounded-xl bg-[#0f1016] p-3.5">
            <div className="text-[13.5px] font-bold text-white">Billing transparency</div>
            <p className="text-[12px] leading-relaxed text-[#868c9c] mt-1.5">
              Usage breakdowns in the invoice view.
            </p>
            <div className="mt-2.5 font-mono text-[10.5px] text-[#7b8190]">
              96 evidence
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

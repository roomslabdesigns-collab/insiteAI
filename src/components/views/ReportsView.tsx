import React from 'react';

export const ReportsView: React.FC = () => {
  const reports = [
    {
      title: 'Q3 Enterprise Voice of Customer',
      meta: 'generated 2 days ago · 1,204 signals · 3 recommendations',
      status: 'SHARED',
      badgeClass: 'bg-[rgba(52,211,153,0.1)] border-[rgba(52,211,153,0.22)] text-[#6ee7b7]',
    },
    {
      title: 'Churn drivers · Q3',
      meta: 'generated 5 days ago · 388 signals · 4 recommendations',
      status: 'DRAFT',
      badgeClass: 'bg-[#14161e] border-[#1e2029] text-[#9aa0af]',
    },
    {
      title: 'Feature request digest · August',
      meta: 'generated 12 days ago · 642 signals · 6 recommendations',
      status: 'SHARED',
      badgeClass: 'bg-[rgba(52,211,153,0.1)] border-[rgba(52,211,153,0.22)] text-[#6ee7b7]',
    },
  ];

  return (
    <div className="p-8 sm:p-10 select-none animate-in fade-in duration-200">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[27px] font-extrabold tracking-tight text-[#e9eaf0]">Reports</h1>
          <p className="text-[13.5px] text-[#8a90a0] mt-1.5">AI-generated, evidence-linked, shareable</p>
        </div>
        <button 
          type="button" 
          className="px-3.5 py-2 border border-[rgba(99,102,241,0.3)] rounded-xl bg-[#1c1f33] text-[12.5px] font-semibold text-[#c7cbff] hover:bg-[#232740] transition-colors"
        >
          New report
        </button>
      </div>

      <div className="flex flex-col gap-2.5 mt-6">
        {reports.map((report, idx) => (
          <div 
            key={idx}
            className="flex items-center gap-3.5 border border-[#1b1d27] rounded-xl bg-[#0d0e13] p-4 hover:border-[#2b2f45] cursor-pointer transition-colors"
          >
            <div className="min-w-0">
              <div className="text-[14px] font-bold text-white">{report.title}</div>
              <div className="font-mono text-[10.5px] text-[#6d7382] mt-1.5">{report.meta}</div>
            </div>
            <span className={`ml-auto px-2 py-1 rounded-md font-mono text-[10px] font-bold border ${report.badgeClass}`}>
              {report.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

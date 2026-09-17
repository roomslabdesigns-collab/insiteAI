import React from 'react';
import { 
  Bell, 
  MessageSquare, 
  Apple, 
  FileCheck2, 
  ClipboardList, 
  Lightbulb,
  CheckCircle2
} from 'lucide-react';
import type { NavPage } from './Sidebar.tsx';

interface RightSidebarProps {
  onNavigate: (page: NavPage) => void;
  onSelectQuery: (query: string) => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  onNavigate,
  onSelectQuery,
}) => {
  const sources = [
    { name: 'Support Tickets', icon: MessageSquare, status: 'Connected' },
    { name: 'App Reviews', icon: Apple, status: 'Connected' },
    { name: 'NPS Feedback', icon: FileCheck2, status: 'Connected' },
    { name: 'Churn Surveys', icon: ClipboardList, status: 'Connected' },
    { name: 'Feature Requests', icon: Lightbulb, status: 'Connected' },
  ];

  const recentQueries = [
    { title: 'What are the biggest pain points for enterprise customers?', time: '2 hours ago' },
    { title: 'Why are enterprise customers dissatisfied with reporting?', time: '5 hours ago' },
    { title: 'Summarize feedback from last sprint', time: '1 day ago' },
    { title: 'Which features are most requested by churned accounts?', time: '2 days ago' },
    { title: 'Show me churn reasons for Q3 and ARR impact', time: '2 days ago' },
  ];

  return (
    <aside className="w-[300px] flex-none hidden xl:flex flex-col bg-[#08090d] border-l border-[#171923] p-5 h-full overflow-y-auto select-none">
      {/* Top Header User Profile & Notifications */}
      <div className="flex items-center justify-end gap-3.5 pb-5 border-b border-[#14161f]">
        <button 
          type="button" 
          aria-label="Notifications"
          className="p-1.5 rounded-lg text-[#8a90a0] hover:text-[#e9eaf0] hover:bg-[#14161e] transition-colors"
        >
          <Bell className="w-4 h-4" />
        </button>
        <div className="w-8 h-8 rounded-full bg-[#181a24] border border-[#232637] flex items-center justify-center font-mono text-[11px] font-bold text-[#c3c8d4]">
          SP
        </div>
      </div>

      {/* Data Sources Widget */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3.5">
          <span className="text-[13px] font-bold tracking-tight text-[#e9eaf0]">Data Sources</span>
          <button 
            onClick={() => onNavigate('sources')}
            type="button" 
            className="text-[11.5px] font-medium text-[#8b93ff] hover:text-[#a5abff] transition-colors"
          >
            Connect
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          {sources.map((src) => {
            const Icon = src.icon;
            return (
              <div 
                key={src.name}
                onClick={() => onNavigate('sources')}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#0c0d12] border border-[#171924] hover:border-[#282c40] cursor-pointer transition-all"
              >
                <div className="w-6 h-6 rounded-lg bg-[#141620] flex items-center justify-center text-[#9096a5]">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-[12.5px] font-medium text-[#d7dae2]">{src.name}</span>
                <span className="ml-auto flex items-center gap-1.5 text-[10.5px] text-[#6ee7b7] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#34d399]" />
                  {src.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Queries Widget */}
      <div className="mt-7">
        <div className="flex items-center justify-between mb-3.5">
          <span className="text-[13px] font-bold tracking-tight text-[#e9eaf0]">Recent Queries</span>
          <span className="text-[11.5px] text-[#6d7382]">View all</span>
        </div>

        <div className="flex flex-col gap-2">
          {recentQueries.map((q, idx) => (
            <div 
              key={idx}
              onClick={() => onSelectQuery(q.title)}
              className="p-3 rounded-xl bg-[#0c0d12] border border-[#171924] hover:border-[#2e334e] hover:bg-[#0f1118] cursor-pointer transition-all"
            >
              <div className="flex items-start gap-2.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#8b93ff] mt-0.5 flex-none" />
                <div>
                  <p className="text-[12px] font-medium text-[#c3c8d4] leading-relaxed line-clamp-2">
                    {q.title}
                  </p>
                  <span className="font-mono text-[10px] text-[#5d626f] mt-1.5 block">
                    {q.time}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

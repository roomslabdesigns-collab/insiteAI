import React from 'react';
import { 
  PlusSquare, 
  LayoutGrid, 
  FileText, 
  Sparkles, 
  CircleDot, 
  BarChart3, 
  Database, 
  BookOpen, 
  Users, 
  Settings, 
  Search 
} from 'lucide-react';

export type NavPage = 
  | 'new' 
  | 'dashboard' 
  | 'feedback' 
  | 'opportunities' 
  | 'roadmap' 
  | 'reports' 
  | 'sources' 
  | 'evidence' 
  | 'segments' 
  | 'settings';

interface SidebarProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  searchQuery,
  onSearchChange,
}) => {
  const primaryNavItems = [
    { id: 'new' as NavPage, label: 'New Query', icon: PlusSquare },
    { id: 'dashboard' as NavPage, label: 'Dashboard', icon: LayoutGrid },
    { id: 'feedback' as NavPage, label: 'Feedback', icon: FileText, badge: '2.4k' },
    { id: 'opportunities' as NavPage, label: 'Opportunities', icon: Sparkles, hasDot: true },
    { id: 'roadmap' as NavPage, label: 'Roadmap', icon: CircleDot },
    { id: 'reports' as NavPage, label: 'Reports', icon: BarChart3 },
  ];

  const intelligenceNavItems = [
    { id: 'sources' as NavPage, label: 'Data Sources', icon: Database },
    { id: 'evidence' as NavPage, label: 'Evidence Library', icon: BookOpen },
    { id: 'segments' as NavPage, label: 'Customer Segments', icon: Users },
  ];

  const getItemClass = (id: NavPage) => {
    const isActive = currentPage === id;
    if (isActive) {
      return 'flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-[13.5px] font-semibold text-white bg-gradient-to-r from-[rgba(70,79,190,0.22)] to-[rgba(70,79,190,0.08)] border border-[rgba(99,102,241,0.24)] transition-all';
    }
    return 'flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-[13.5px] font-medium text-[#a8adba] hover:text-[#e9eaf0] hover:border-[#2b2f45] border border-transparent transition-all';
  };

  return (
    <aside className="w-[274px] flex-none flex flex-col bg-[#0a0b0f] border-r border-[#171923] p-4 h-full select-none">
      {/* Brand Header */}
      <div 
        onClick={() => onNavigate('new')}
        className="flex items-center gap-3 px-1.5 py-0.5 cursor-pointer"
      >
        <div className="w-[26px] height-[26px] flex items-center justify-center">
          <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
            <defs>
              <linearGradient id="iaLogoSidebar" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor="#4f6bff" />
                <stop offset="100%" stopColor="#a06bff" />
              </linearGradient>
            </defs>
            <rect x="2" y="9" width="5" height="12" rx="2.5" fill="url(#iaLogoSidebar)" opacity="0.75" />
            <rect x="10.5" y="3" width="5" height="18" rx="2.5" fill="url(#iaLogoSidebar)" />
            <rect x="19" y="12" width="5" height="9" rx="2.5" fill="url(#iaLogoSidebar)" opacity="0.55" />
          </svg>
        </div>
        <div>
          <div className="text-[17px] font-extrabold tracking-[-0.02em] leading-none text-[#e9eaf0]">InsightAI</div>
          <div className="text-[10.5px] text-[#7b8190] tracking-[0.01em] mt-1">Product Feedback Intelligence</div>
        </div>
      </div>

      {/* Global Search Input */}
      <div className="relative my-4">
        <Search className="w-4 h-4 text-[#6d7382] absolute left-3 top-2.5 pointer-events-none" />
        <input 
          type="text" 
          placeholder="Search..." 
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full h-[37px] pl-9 pr-3 rounded-xl border border-[#1b1d27] bg-[#0e0f15] text-[#e9eaf0] text-[13px] outline-none focus:border-[#2e3350] focus:bg-[#101219] transition-all placeholder:text-[#5d626f]"
        />
      </div>

      {/* Primary Navigation */}
      <nav className="flex flex-col gap-1">
        {primaryNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <div 
              key={item.id} 
              onClick={() => onNavigate(item.id)}
              className={getItemClass(item.id)}
            >
              <Icon className="w-4 h-4 text-current" />
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto font-mono text-[10px] text-[#7b8190] bg-[#14161e] border border-[#1e2029] px-1.5 py-0.5 rounded">
                  {item.badge}
                </span>
              )}
              {item.hasDot && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#fb923c]" />
              )}
            </div>
          );
        })}
      </nav>

      {/* Section Divider */}
      <div className="h-px bg-[#171923] my-4 mx-2" />
      <div className="font-mono text-[10px] tracking-wider text-[#5d626f] uppercase px-3 mb-2 font-medium">
        DATA & INTELLIGENCE
      </div>

      {/* Data & Intelligence Navigation */}
      <nav className="flex flex-col gap-1">
        {intelligenceNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <div 
              key={item.id} 
              onClick={() => onNavigate(item.id)}
              className={getItemClass(item.id)}
            >
              <Icon className="w-4 h-4 text-current" />
              <span>{item.label}</span>
            </div>
          );
        })}
      </nav>

      <div className="h-px bg-[#171923] my-4 mx-2" />

      {/* Settings Navigation */}
      <div 
        onClick={() => onNavigate('settings')}
        className={getItemClass('settings')}
      >
        <Settings className="w-4 h-4 text-current" />
        <span>Settings</span>
      </div>

      {/* Ingestion Health Status Footer */}
      <div className="mt-auto border border-[#1b1d27] rounded-xl p-3.5 bg-[#0e0f15]">
        <div className="flex items-center gap-2 text-[11.5px] font-semibold text-[#c9cdd8]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#34d399] animate-pulse" />
          <span>Ingestion healthy</span>
        </div>
        <div className="font-mono text-[10.5px] text-[#6d7382] mt-1.5">
          last sync 4 min ago · 5 sources
        </div>
      </div>
    </aside>
  );
};

import React, { useState, useRef } from 'react';
import { Paperclip, ChevronDown, ArrowUp, Check, Database, FileText, X } from 'lucide-react';
import type { FeedbackSource } from '../types.ts';

interface BottomQueryBarProps {
  onAsk: (query: string, sources: FeedbackSource[], files: File[]) => void;
}

const ALL_SOURCES: { id: FeedbackSource; label: string }[] = [
  { id: 'tickets', label: 'Support Tickets' },
  { id: 'reviews', label: 'App Reviews' },
  { id: 'nps', label: 'NPS Feedback' },
  { id: 'churn', label: 'Churn Surveys' },
  { id: 'requests', label: 'Feature Requests' },
];

export const BottomQueryBar: React.FC<BottomQueryBarProps> = ({ onAsk }) => {
  const [queryText, setQueryText] = useState('');
  const [selectedSources, setSelectedSources] = useState<FeedbackSource[]>([
    'tickets', 'reviews', 'nps', 'churn', 'requests'
  ]);
  const [isSourceMenuOpen, setIsSourceMenuOpen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleSource = (sourceId: FeedbackSource) => {
    setSelectedSources(prev => 
      prev.includes(sourceId) 
        ? prev.filter(s => s !== sourceId)
        : [...prev, sourceId]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setAttachedFiles(prev => [...prev, ...newFiles].slice(0, 4));
    }
  };

  const removeFile = (idx: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = queryText.trim();
    if (!clean && attachedFiles.length === 0) return;
    onAsk(
      clean || 'Summarize key themes and customer signals from attached feedback',
      selectedSources,
      attachedFiles
    );
    setQueryText('');
  };

  const getSourceLabel = () => {
    if (selectedSources.length === ALL_SOURCES.length) return 'All sources';
    if (selectedSources.length === 0) return 'No sources';
    if (selectedSources.length === 1) {
      const match = ALL_SOURCES.find(s => s.id === selectedSources[0]);
      return match ? match.label : '1 source';
    }
    return `${selectedSources.length} sources`;
  };

  return (
    <div className="relative z-20 px-6 sm:px-10 pb-6 pt-3 select-none">
      <div className="relative max-w-[880px] mx-auto border border-[#22242f] rounded-2xl bg-[#0e0f15] shadow-2xl focus-within:border-[#353b5c] transition-all">
        
        {/* Attached Files Chips */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 px-3.5 pt-3">
            {attachedFiles.map((f, i) => (
              <div 
                key={i}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#232637] bg-[#14161e] font-mono text-[11px] text-[#c3c8d4]"
              >
                <FileText className="w-3 h-3 text-[#8b93ff]" />
                <span className="max-w-[140px] truncate">{f.name}</span>
                <button 
                  type="button" 
                  onClick={() => removeFile(i)}
                  className="hover:text-white ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <button 
              type="button"
              onClick={() => setAttachedFiles([])}
              className="px-2 py-1 rounded-lg border border-[#1e2029] font-mono text-[11px] text-[#7b8190] hover:text-[#e9eaf0] hover:border-[#31365a] transition-all"
            >
              clear all
            </button>
          </div>
        )}

        {/* Source Dropdown Menu */}
        {isSourceMenuOpen && (
          <div className="absolute right-16 bottom-[calc(100%+8px)] w-60 border border-[#232637] rounded-xl bg-[#101219] p-2 shadow-2xl z-30 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="font-mono text-[9.5px] tracking-widest text-[#5d626f] px-2.5 py-1.5 uppercase font-medium">
              Query Context Sources
            </div>
            {ALL_SOURCES.map((src) => {
              const isSelected = selectedSources.includes(src.id);
              return (
                <div 
                  key={src.id}
                  onClick={() => toggleSource(src.id)}
                  className="flex items-center justify-between px-2.5 py-2 rounded-lg text-[12.5px] text-[#d7dae2] hover:bg-[#171a24] cursor-pointer transition-colors"
                >
                  <span>{src.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#8b93ff]" />}
                </div>
              );
            })}
          </div>
        )}

        {/* Input Controls Bar */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2.5 p-2.5 pl-3.5">
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple 
            accept=".csv,.json,.txt"
            className="hidden"
          />
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            title="Attach customer feedback files (.csv, .json, .txt)"
            className="text-[#6d7382] hover:text-[#c3c8d4] p-1 rounded-lg hover:bg-[#151722] transition-colors"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <input 
            type="text"
            placeholder="Ask anything about your product feedback..."
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            className="flex-1 min-w-0 h-9 bg-transparent border-none outline-none text-[#e9eaf0] text-[14px] placeholder:text-[#5d626f]"
          />

          {/* Source Filter Trigger */}
          <button 
            type="button" 
            onClick={() => setIsSourceMenuOpen(!isSourceMenuOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#1e2029] font-mono text-[11px] text-[#8a90a0] hover:text-[#e9eaf0] hover:border-[#31365a] transition-all bg-[#0b0c11]"
          >
            <Database className="w-3 h-3 text-current" />
            <span>{getSourceLabel()}</span>
            <ChevronDown className="w-2.5 h-2.5 text-current opacity-70" />
          </button>

          {/* Submit Button */}
          <button 
            type="submit"
            aria-label="Send Query"
            className="w-9 h-9 flex-none rounded-full bg-gradient-to-tr from-[#5b62f5] to-[#7b5bf0] flex items-center justify-center text-white shadow-lg shadow-[rgba(99,102,241,0.35)] hover:brightness-110 active:scale-95 transition-all"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </form>
      </div>

      <div className="max-w-[880px] mx-auto mt-2 font-mono text-[10.5px] text-[#4f5462] text-center">
        Answers cite source evidence · InsightAI can be wrong, always check the linked signals
      </div>
    </div>
  );
};

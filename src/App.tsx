/**
 * InsightAI — Product Feedback Intelligence Platform
 * Phase 1 Application Foundation
 */
import React, { useState, useEffect } from 'react';
import { Sidebar, type NavPage } from './components/Sidebar.tsx';
import { RightSidebar } from './components/RightSidebar.tsx';
import { BottomQueryBar } from './components/BottomQueryBar.tsx';

import { NewQueryView } from './components/views/NewQueryView.tsx';
import { DashboardView } from './components/views/DashboardView.tsx';
import { FeedbackView } from './components/views/FeedbackView.tsx';
import { OpportunitiesView } from './components/views/OpportunitiesView.tsx';
import { RoadmapView } from './components/views/RoadmapView.tsx';
import { ReportsView } from './components/views/ReportsView.tsx';
import { SourcesView } from './components/views/SourcesView.tsx';
import { EvidenceView } from './components/views/EvidenceView.tsx';
import { SegmentsView } from './components/views/SegmentsView.tsx';
import { SettingsView } from './components/views/SettingsView.tsx';

export default function App() {
  const [currentPage, setCurrentPage] = useState<NavPage>('new');
  const [viewMode, setViewMode] = useState<'home' | 'answer'>('home');
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Probe backend API health on initial mount
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        console.info('[InsightAI Backend Health Status]', data);
      })
      .catch((err) => {
        console.warn('[InsightAI Backend Health Check Warning]', err);
      });
  }, []);

  const handleAsk = (question: string) => {
    setCurrentQuestion(question);
    setViewMode('answer');
    setCurrentPage('new');
  };

  const handleNavigate = (page: NavPage) => {
    setCurrentPage(page);
    if (page === 'new') {
      setViewMode('home');
    }
  };

  return (
    <div className="flex h-screen w-full min-h-[700px] bg-[#07080b] text-[#e9eaf0] font-sans antialiased overflow-hidden">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* 2. Main Content Stage */}
      <main className="flex-1 min-w-0 flex flex-col relative h-full">
        {/* Subtle Ambient Radial Glow */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(900px 420px at 50% -8%, rgba(76,84,190,0.13), transparent 70%)',
          }}
        />

        {/* Scrollable View Container */}
        <div className="flex-1 min-h-0 overflow-y-auto relative z-10">
          {currentPage === 'new' && (
            <NewQueryView
              viewMode={viewMode}
              currentQuestion={currentQuestion}
              onAskPreset={handleAsk}
              onResetToHome={() => setViewMode('home')}
              onNavigate={handleNavigate}
            />
          )}

          {currentPage === 'dashboard' && <DashboardView />}
          {currentPage === 'feedback' && <FeedbackView />}
          {currentPage === 'opportunities' && (
            <OpportunitiesView onAskAI={() => handleAsk('Which product opportunity has the highest business impact?')} />
          )}
          {currentPage === 'roadmap' && <RoadmapView />}
          {currentPage === 'reports' && <ReportsView />}
          {currentPage === 'sources' && <SourcesView />}
          {currentPage === 'evidence' && <EvidenceView />}
          {currentPage === 'segments' && <SegmentsView />}
          {currentPage === 'settings' && <SettingsView />}
        </div>

        {/* Persistent Bottom Query Bar */}
        <BottomQueryBar onAsk={handleAsk} />
      </main>

      {/* 3. Right Sidebar Activity & Sources */}
      <RightSidebar
        onNavigate={handleNavigate}
        onSelectQuery={handleAsk}
      />
    </div>
  );
}

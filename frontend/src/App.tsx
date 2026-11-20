import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { MarksRegisterPage } from './pages/MarksRegisterPage';
import { MarksEntryPage } from './pages/MarksEntryPage';
import { LedgerExplorerPage } from './pages/LedgerExplorerPage';
import { VerificationPage } from './pages/VerificationPage';
import { StudentsPage } from './pages/StudentsPage';
import { HardwarePage } from './pages/HardwarePage';
import { ResearchPage } from './pages/ResearchPage';
import { api } from './services/api';
import { VerificationReport } from './types';

const MainApp: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [showLanding, setShowLanding] = useState<boolean>(!localStorage.getItem('securemarks_token'));
  const [showLogin, setShowLogin] = useState<boolean>(false);
  const [report, setReport] = useState<VerificationReport | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchVerificationReport = async () => {
    setIsRefreshing(true);
    try {
      const res = await api.verifyLedger();
      setReport(res);
    } catch (err) {
      console.error('Failed to verify ledger:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchVerificationReport();
      setShowLanding(false);
      setShowLogin(false);
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-cyan-400 font-mono text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span>Connecting to SecureMarks DBMS Ledger...</span>
        </div>
      </div>
    );
  }

  // Show Landing Page for unauthenticated visitors
  if (showLanding && !user) {
    return (
      <LandingPage
        onGetStarted={() => setShowLogin(true)}
        onExploreResearch={() => {
          setShowLanding(false);
          setCurrentTab('research');
        }}
      />
    );
  }

  // Show Login Page if requested
  if (showLogin && !user) {
    return <LoginPage onLoginSuccess={() => setShowLogin(false)} />;
  }

  const hasTampering = report?.status === 'TAMPERING_DETECTED' || report?.status === 'CHAIN_BROKEN';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <Navbar
        latestStatus={report?.status}
        onRefresh={fetchVerificationReport}
        isRefreshing={isRefreshing}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
          hasTampering={hasTampering}
        />

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-950">
          <div className="max-w-7xl mx-auto">
            {currentTab === 'dashboard' && (
              <DashboardPage
                onNavigateTab={(tab) => setCurrentTab(tab)}
                report={report}
              />
            )}
            {currentTab === 'register' && <MarksRegisterPage />}
            {currentTab === 'entry' && (
              <MarksEntryPage
                onMarksSaved={fetchVerificationReport}
              />
            )}
            {currentTab === 'ledger' && <LedgerExplorerPage />}
            {currentTab === 'verify' && (
              <VerificationPage
                report={report}
                onRefreshReport={fetchVerificationReport}
              />
            )}
            {currentTab === 'students' && <StudentsPage />}
            {currentTab === 'hardware' && <HardwarePage />}
            {currentTab === 'research' && <ResearchPage />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

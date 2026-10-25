import React, { useState, useEffect } from 'react';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import DashboardView from './components/dashboard/DashboardView';
import InterviewSetupView from './components/interview/InterviewSetupView';
import RubricsView from './components/rubrics/RubricsView';
import HistoryView from './components/history/HistoryView';
import AssignmentEvidenceView from './components/evidence/AssignmentEvidenceView';
import { getSavedLanguage, saveLanguage } from './i18n';
import { stopAllMediaStreams } from './utils/mediaUtils';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentLanguage, setCurrentLanguage] = useState(() => getSavedLanguage());
  const [serverStatus, setServerStatus] = useState({
    status: 'connecting',
    mode: 'SIMULATION_MODE',
    activeModel: 'gemini-2.0-flash',
    hasApiKey: false,
    maxUploadSize: 5242880
  });
  const [isConnecting, setIsConnecting] = useState(true);

  const handleLanguageChange = (newLang) => {
    setCurrentLanguage(newLang);
    saveLanguage(newLang);
  };

  const handleTabChange = (newTab) => {
    if (activeTab === 'interview' && newTab !== 'interview') {
      stopAllMediaStreams();
    }
    setActiveTab(newTab);
  };

  // Check backend health & Gemini status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const data = await res.json();
          setServerStatus(data);
        } else {
          setServerStatus(prev => ({ ...prev, status: 'fallback', mode: 'SIMULATION_MODE' }));
        }
      } catch (err) {
        // Safe offline fallback state if server is momentarily booting
        console.warn('Backend not currently reachable, operating in client fallback mode:', err);
        setServerStatus(prev => ({ ...prev, status: 'offline', mode: 'SIMULATION_MODE' }));
      } finally {
        setIsConnecting(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-canvas)'
    }}>
      {/* Navigation Header */}
      <Header
        serverStatus={serverStatus}
        currentLanguage={currentLanguage}
        onLanguageChange={handleLanguageChange}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Main View Router */}
      <main style={{ flex: 1 }}>
        {activeTab === 'dashboard' && (
          <DashboardView
            serverStatus={serverStatus}
            currentLanguage={currentLanguage}
            onStartInterview={() => setActiveTab('interview')}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'interview' && (
          <InterviewSetupView
            serverStatus={serverStatus}
            currentLanguage={currentLanguage}
            onLanguageChange={handleLanguageChange}
            onBackToDashboard={() => setActiveTab('dashboard')}
            onViewHistory={() => setActiveTab('history')}
          />
        )}

        {activeTab === 'evidence' && (
          <AssignmentEvidenceView
            currentLanguage={currentLanguage}
          />
        )}

        {activeTab === 'rubrics' && (
          <RubricsView
            currentLanguage={currentLanguage}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            currentLanguage={currentLanguage}
            onStartNew={() => setActiveTab('interview')}
          />
        )}
      </main>

      {/* Professional Lab Footer */}
      <Footer currentLanguage={currentLanguage} />
    </div>
  );
}

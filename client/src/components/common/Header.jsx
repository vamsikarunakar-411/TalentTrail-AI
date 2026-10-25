import React from 'react';
import { Sparkles, Globe } from 'lucide-react';
import { t, SUPPORTED_LANGUAGES } from '../../i18n';

export default function Header({ serverStatus, currentLanguage = 'en-US', onLanguageChange, activeTab, onTabChange }) {
  const isSimulation = serverStatus?.mode === 'SIMULATION_MODE';

  const navItems = [
    { id: 'dashboard', label: t('nav.dashboard', null, currentLanguage) },
    { id: 'interview', label: t('nav.interview', null, currentLanguage) },
    { id: 'evidence', label: t('nav.evidence', null, currentLanguage) },
    { id: 'rubrics', label: t('nav.rubrics', null, currentLanguage) },
    { id: 'history', label: t('nav.history', null, currentLanguage) },
  ];

  return (
    <header style={{
      backgroundColor: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '0.85rem 1.5rem',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backdropFilter: 'blur(8px)',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{
        maxWidth: 'var(--container-max)',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Brand & Identity: TalentTrail AI */}
        <div 
          onClick={() => onTabChange('dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
        >
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--lavender-500) 0%, var(--lavender-700) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            boxShadow: 'var(--shadow-lavender)'
          }}>
            <Sparkles size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.15rem',
                fontWeight: 800,
                color: 'var(--text-heading)',
                letterSpacing: '-0.02em'
              }}>
                TalentTrail AI
              </span>
              <span style={{
                backgroundColor: 'var(--lavender-100)',
                color: 'var(--lavender-800)',
                border: '1px solid var(--lavender-200)',
                borderRadius: '9999px',
                fontSize: '0.7rem',
                padding: '0.15rem 0.5rem',
                fontWeight: 600
              }}>
                with Ismav
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {t('nav.subtitle', null, currentLanguage)}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          {navItems.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                style={{
                  padding: '0.45rem 0.9rem',
                  fontSize: '0.84rem',
                  fontWeight: isActive ? 600 : 500,
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${isActive ? 'var(--lavender-300)' : 'transparent'}`,
                  backgroundColor: isActive ? 'var(--lavender-100)' : 'transparent',
                  color: isActive ? 'var(--lavender-900)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Right Section: Language + Engine Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Language Selector */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            backgroundColor: 'var(--lavender-50)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '0.2rem 0.5rem'
          }}>
            <Globe size={14} color="var(--lavender-600)" />
            <select
              value={currentLanguage}
              onChange={(e) => onLanguageChange(e.target.value)}
              aria-label={t('nav.languageSelect', null, currentLanguage)}
              style={{
                backgroundColor: 'transparent',
                color: 'var(--text-primary)',
                border: 'none',
                outline: 'none',
                fontSize: '0.78rem',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* AI / Simulation Indicator */}
          <div
            title={isSimulation
              ? (serverStatus?.simulationReason === 'NO_API_KEY_CONFIGURED'
                  ? 'Simulation Mode: Deterministic rubric rule engine (No external API calls). Configure GEMINI_API_KEY in server/.env for Live Gemini AI.'
                  : `Simulation Fallback: ${serverStatus?.simulationReason || 'Running deterministic rubric engine'}`)
              : `Connected to Google Gemini (${serverStatus?.activeModel || serverStatus?.configuredModel || 'gemini-2.0-flash'})`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: isSimulation ? '#FFFBEB' : '#ECFDF5',
              border: `1px solid ${isSimulation ? '#FDE68A' : '#A7F3D0'}`,
              fontSize: '0.75rem',
              fontWeight: 600,
              color: isSimulation ? '#B45309' : '#065F46'
            }}
          >
            <span className={isSimulation ? 'status-dot status-dot-amber' : 'status-dot status-dot-active'} />
            <span>
              {isSimulation 
                ? t('nav.modeSimulation', null, currentLanguage) 
                : `${t('nav.modeLive', null, currentLanguage)} (${serverStatus?.activeModel || serverStatus?.configuredModel || '2.0-flash'})`}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}


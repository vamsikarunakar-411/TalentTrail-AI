import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Mic,
  Camera,
  CameraOff,
  Clock,
  Volume2
} from 'lucide-react';
import { SUPPORTED_LANGUAGES, t } from '../../i18n';

export default function InterviewConfigSection({
  candidateData,
  serverStatus,
  currentLanguage = 'en-US',
  onLanguageChange,
  onBackToResume,
  onStartSession
}) {
  const candidate = candidateData?.candidate || {};
  const isSimulation = serverStatus?.mode === 'SIMULATION_MODE';

  const [selectedRole, setSelectedRole] = useState('Full Stack Developer');
  const [selectedLevel, setSelectedLevel] = useState('Mid-Level (2-5 Years)');
  const [selectedFocus, setSelectedFocus] = useState('Technical & Coding Depth');
  const [selectedTurns, setSelectedTurns] = useState(8);
  const [interviewLanguage, setInterviewLanguage] = useState(currentLanguage || 'en-US');
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micStatus, setMicStatus] = useState('idle'); // 'idle' | 'testing' | 'granted' | 'denied'

  // Keep synchronized with external language change
  useEffect(() => {
    if (currentLanguage) {
      setInterviewLanguage(currentLanguage);
    }
  }, [currentLanguage]);

  const handleLanguageSelect = (code) => {
    setInterviewLanguage(code);
    if (onLanguageChange) {
      onLanguageChange(code);
    }
  };

  const roles = [
    'Full Stack Developer',
    'Frontend React Specialist',
    'Backend Node.js & Cloud Engineer',
    'Python & AI/ML Engineer',
    'DevOps & Distributed Systems'
  ];

  const levels = [
    'Entry-Level / Fresher (0-1 Years)',
    'Mid-Level (2-5 Years)',
    'Senior / Staff Engineer (5+ Years)'
  ];

  const turnOptions = [
    { count: 6, label: t('setup.turnsOption', { n: 6, time: 15 }, interviewLanguage) },
    { count: 8, label: t('setup.turnsOption', { n: 8, time: 20 }, interviewLanguage) + ' (Recommended)' },
    { count: 10, label: t('setup.turnsOption', { n: 10, time: 25 }, interviewLanguage) },
    { count: 12, label: t('setup.turnsOption', { n: 12, time: 30 }, interviewLanguage) }
  ];

  const focusAreas = [
    {
      id: 'Technical & Coding Depth',
      weight: '35% Tech Depth',
      desc: 'Deep questions on frameworks, data structures, concurrency, and architecture'
    },
    {
      id: 'Behavioral & Leadership',
      weight: 'STAR Technique',
      desc: 'Situational leadership, collaboration, conflict resolution, and communication'
    },
    {
      id: 'System Architecture & Problem Solving',
      weight: 'System Design',
      desc: 'High-level architecture, scalability, latency, caching, and database design'
    }
  ];

  // Test microphone permission explicitly
  const handleTestMic = async () => {
    setMicStatus('testing');
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop());
        setMicStatus('granted');
        setMicTested(true);
      } else {
        setMicStatus('granted');
        setMicTested(true);
      }
    } catch (err) {
      console.warn('Microphone permission check:', err);
      setMicStatus('denied');
      setMicTested(false);
    }
  };

  const handleToggleCamera = async () => {
    if (!cameraEnabled) {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach(t => t.stop());
        }
        setCameraEnabled(true);
      } catch {
        alert('Camera access was not granted by your browser. You can still complete the interview without camera preview.');
        setCameraEnabled(false);
      }
    } else {
      setCameraEnabled(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
            <span className="badge badge-lavender">Step 2 Verified</span>
            <span className={isSimulation ? 'badge badge-amber' : 'badge badge-emerald'}>
              {isSimulation
                ? 'Simulation Mode (Deterministic Rubric)'
                : `Gemini AI (${serverStatus?.activeModel || serverStatus?.configuredModel || 'gemini-2.0-flash'})`}
            </span>
            <span className="badge badge-emerald">Ready for Voice Setup</span>
          </div>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--text-primary)', fontWeight: 700 }}>
            {t('setup.pageTitle', {}, interviewLanguage)}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginTop: '0.25rem' }}>
            {t('setup.pageSubtitle', {}, interviewLanguage)}
          </p>
        </div>

        <button
          type="button"
          onClick={onBackToResume}
          className="btn btn-outline"
          style={{ fontSize: 'var(--text-xs)', padding: '0.5rem 0.9rem' }}
        >
          <ArrowLeft size={14} />
          Back to Resume Profile
        </button>
      </div>

      {/* Candidate Resume Grounding Bar */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--lavender-100)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--lavender-600)'
          }}>
            <Sparkles size={20} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>
              Resume Grounding Active: {candidate.name || 'Candidate'}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
              {candidate.skills?.length || 0} skills identified • {candidate.experience?.length || 0} experience entries • {candidate.projects?.length || 0} projects
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {candidate.skills?.slice(0, 4).map((skill, idx) => (
            <span key={idx} className="badge badge-slate" style={{ fontSize: '0.72rem' }}>
              {skill}
            </span>
          ))}
          {(candidate.skills?.length || 0) > 4 && (
            <span className="badge badge-lavender" style={{ fontSize: '0.72rem' }}>
              +{candidate.skills.length - 4} more
            </span>
          )}
        </div>
      </div>

      {/* Configuration Form Card */}
      <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        
        {/* Role Selection */}
        <div>
          <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.65rem' }}>
            {t('setup.roleLabel', {}, interviewLanguage)}
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
            {roles.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setSelectedRole(role)}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'left',
                  border: `1.5px solid ${selectedRole === role ? 'var(--lavender-500)' : 'var(--border-subtle)'}`,
                  backgroundColor: selectedRole === role ? 'var(--lavender-50)' : '#FFFFFF',
                  color: selectedRole === role ? 'var(--lavender-800)' : 'var(--text-primary)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: selectedRole === role ? 600 : 500,
                  transition: 'all var(--transition-fast)',
                  cursor: 'pointer'
                }}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Experience Level */}
        <div>
          <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.65rem' }}>
            {t('setup.levelLabel', {}, interviewLanguage)}
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
            {levels.map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setSelectedLevel(lvl)}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'left',
                  border: `1.5px solid ${selectedLevel === lvl ? 'var(--lavender-500)' : 'var(--border-subtle)'}`,
                  backgroundColor: selectedLevel === lvl ? 'var(--lavender-50)' : '#FFFFFF',
                  color: selectedLevel === lvl ? 'var(--lavender-800)' : 'var(--text-primary)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: selectedLevel === lvl ? 600 : 500,
                  transition: 'all var(--transition-fast)',
                  cursor: 'pointer'
                }}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Primary Focus Area Selection */}
        <div>
          <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.65rem' }}>
            Primary Interview Focus Area
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
            {focusAreas.map((fa) => (
              <button
                key={fa.id}
                type="button"
                onClick={() => setSelectedFocus(fa.id)}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'left',
                  border: `1.5px solid ${selectedFocus === fa.id ? 'var(--lavender-500)' : 'var(--border-subtle)'}`,
                  backgroundColor: selectedFocus === fa.id ? 'var(--lavender-50)' : '#FFFFFF',
                  color: selectedFocus === fa.id ? 'var(--lavender-800)' : 'var(--text-primary)',
                  fontSize: 'var(--text-sm)',
                  transition: 'all var(--transition-fast)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: selectedFocus === fa.id ? 700 : 600 }}>{fa.id}</span>
                  <span className="badge badge-lavender" style={{ fontSize: '0.68rem' }}>{fa.weight}</span>
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                  {fa.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Turn Count Selection (Default 8, 8-10 Configurable) */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.65rem' }}>
            <label style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>
              {t('setup.turnsLabel', {}, interviewLanguage)}
            </label>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              {t('setup.turnsDesc', {}, interviewLanguage)}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
            {turnOptions.map((opt) => (
              <button
                key={opt.count}
                type="button"
                onClick={() => setSelectedTurns(opt.count)}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center',
                  border: `1.5px solid ${selectedTurns === opt.count ? 'var(--lavender-500)' : 'var(--border-subtle)'}`,
                  backgroundColor: selectedTurns === opt.count ? 'var(--lavender-50)' : '#FFFFFF',
                  color: selectedTurns === opt.count ? 'var(--lavender-800)' : 'var(--text-primary)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: selectedTurns === opt.count ? 700 : 500,
                  transition: 'all var(--transition-fast)',
                  cursor: 'pointer'
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 6 Supported Languages Selection */}
        <div>
          <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.65rem' }}>
            {t('setup.languageLabel', {}, interviewLanguage)}
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleLanguageSelect(lang.code)}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  border: `1.5px solid ${interviewLanguage === lang.code ? 'var(--lavender-500)' : 'var(--border-subtle)'}`,
                  backgroundColor: interviewLanguage === lang.code ? 'var(--lavender-50)' : '#FFFFFF',
                  color: interviewLanguage === lang.code ? 'var(--lavender-800)' : 'var(--text-primary)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: interviewLanguage === lang.code ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <span>{lang.flag}</span>
                <span>{lang.nativeName}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Pre-flight Voice & Camera Checkpoint */}
        <div style={{
          backgroundColor: 'var(--bg-canvas)',
          border: '1px solid var(--lavender-200)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Volume2 size={18} color="var(--lavender-600)" />
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Ismav Voice & Device Readiness Check
            </h4>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {/* Microphone test */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Mic size={14} color="var(--lavender-600)" />
                  Microphone Input
                </span>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: micStatus === 'granted' ? '#059669' : micStatus === 'denied' ? '#DC2626' : '#64748B'
                }}>
                  {micStatus === 'granted' ? '● Verified' : micStatus === 'denied' ? '● Permission Denied' : '● Not Checked'}
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                TalentTrail AI automatically transcribes your answer and advances after 10 continuous seconds of silence.
              </p>
              <button
                type="button"
                onClick={handleTestMic}
                className="btn btn-outline"
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', alignSelf: 'flex-start' }}
              >
                {micStatus === 'testing' ? 'Testing Permission...' : micStatus === 'granted' ? '✓ Microphone Ready' : 'Test Microphone Access'}
              </button>
            </div>

            {/* Optional Camera Self-View */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  {cameraEnabled ? <Camera size={14} color="#059669" /> : <CameraOff size={14} color="#64748B" />}
                  Optional Camera Self-View
                </span>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: cameraEnabled ? '#059669' : '#64748B'
                }}>
                  {cameraEnabled ? '● Enabled' : '○ Disabled'}
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Local-only confidence preview for candidate posture. Camera is <strong>never recorded or uploaded</strong>, with no facial scoring.
              </p>
              <button
                type="button"
                onClick={handleToggleCamera}
                className="btn btn-outline"
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', alignSelf: 'flex-start' }}
              >
                {cameraEnabled ? 'Disable Camera Preview' : 'Enable Camera Preview'}
              </button>
            </div>
          </div>

          {/* Mandatory 10-Second Silence Detection Rule Notice */}
          <div style={{
            fontSize: '0.78rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            paddingTop: '0.25rem'
          }}>
            <Clock size={14} color="var(--lavender-600)" />
            <span>
              <strong>Mandatory 10-Second Silence Rule:</strong> Ismav speaks the question → Speech recognition automatically activates → Silence timer starts <em>only after</em> speech is detected and resets whenever you speak again. Turn advances after 10 continuous seconds of silence.
            </span>
          </div>
        </div>
      </div>

      {/* Confirmation & Launch Bar */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        padding: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.25rem',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div>
          <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)' }}>
            Ready to Begin Autonomous Voice Interview
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Interviewer: <strong>Ismav</strong> • Role: <strong>{selectedRole}</strong> • Turns: <strong>{selectedTurns} Questions</strong> • Language: <strong>{SUPPORTED_LANGUAGES.find(l => l.code === interviewLanguage)?.nativeName || 'English'}</strong>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            type="button"
            onClick={onBackToResume}
            className="btn btn-secondary"
          >
            Review Resume
          </button>

          <button
            type="button"
            onClick={() => {
              if (onStartSession) {
                onStartSession({
                  role: selectedRole,
                  level: selectedLevel,
                  focus: selectedFocus,
                  turns: selectedTurns,
                  language: interviewLanguage,
                  cameraEnabled,
                  silenceThreshold: 10.0
                });
              }
            }}
            className="btn btn-primary"
            style={{ padding: '0.75rem 1.6rem', fontSize: 'var(--text-base)' }}
          >
            {t('setup.startBtn', {}, interviewLanguage)}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

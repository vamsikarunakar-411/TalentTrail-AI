import React, { useState } from 'react';
import {
  FileText,
  Sliders,
  Award,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
  Volume2,
  Mic,
  Eye,
  Globe
} from 'lucide-react';
import AvatarInterviewer from '../avatar/AvatarInterviewer';
import { t, getLanguageMetadata } from '../../i18n';

const ISMAV_GREETINGS = {
  'en-US': "Hello and welcome! I am Ismav, your AI Technical Interviewer at TalentTrail AI. I am ready to conduct your autonomous voice interview.",
  'te-IN': "నమస్కారం! నేను ఇస్మావ్‌ని, మీ టాలెంట్ ట్రయిల్ ఏఐ ఇంటర్వ్యూయర్ ని. మీ రెజ్యూమ్ ఆధారంగా ప్రశ్నలు అడగడానికి నేను సిద్ధంగా ఉన్నాను.",
  'ml-IN': "നമസ്കാരം! ഞാൻ ഇസ്മാവ്, നിങ്ങളുടെ ടാലന്റ് ട്രയൽ എഐ ഇന്റർവ്യൂവർ. നിങ്ങളുടെ റെസ്യൂമെ അടിസ്ഥാനമാക്കി ചോദ്യങ്ങൾ ചോദിക്കാൻ ഞാൻ തയ്യാറാണ്.",
  'kn-IN': "ನಮಸ್ಕಾರ! ನಾನು ಇಸ್ಮಾವ್, ಟ್ಯಾಲೆಂಟ್ ಟ್ರಯಲ್ ಎಐ ಸಂದರ್ಶಕ. ನಿಮ್ಮ ರೆಸ್ಯೂಮ್ ಆಧರಿಸಿ ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಲು ನಾನು ಸಿದ್ಧನಾಗಿದ್ದೇನೆ.",
  'hi-IN': "नमस्ते! मैं इस्माव हूँ, आपका टैलेंटट्रेल एआई साक्षात्कारकर्ता। आपके बायोडाटा के आधार पर प्रश्न पूछने के लिए मैं तैयार हूँ।",
  'ta-IN': "வணக்கம்! நான் இஸ்மாவ், உங்கள் டேலண்ட் ட்ரெயில் ஏஐ நேர்காணலாளர். உங்கள் ரெஸ்யூம் அடிப்படையில் கேள்விகளைக் கேட்க நான் தயாராக உள்ளேன்."
};

export default function DashboardView({
  serverStatus,
  currentLanguage = 'en-US',
  onNavigateTab
}) {
  const [avatarDemoState, setAvatarDemoState] = useState('idle');
  const isSimulation = serverStatus?.mode === 'SIMULATION_MODE';
  const langMeta = getLanguageMetadata(currentLanguage);

  const toggleAvatarVoice = () => {
    if (avatarDemoState === 'speaking') {
      setAvatarDemoState('idle');
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      return;
    }

    setAvatarDemoState('speaking');
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const text = ISMAV_GREETINGS[currentLanguage] || ISMAV_GREETINGS['en-US'];
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = currentLanguage;
      utterance.rate = 0.95;
      utterance.pitch = 0.96;

      // Select matching male voice where available per language
      try {
        const voices = window.speechSynthesis.getVoices();
        const langVoices = voices.filter(v => v.lang === currentLanguage || v.lang.startsWith(currentLanguage.slice(0, 2)));
        let matchedVoice = langVoices.find(v => {
          const nameLower = v.name.toLowerCase();
          return nameLower.includes('male') || nameLower.includes('david') || nameLower.includes('george') ||
                 nameLower.includes('mark') || nameLower.includes('ravi') || nameLower.includes('valluvar') ||
                 nameLower.includes('madhav') || nameLower.includes('guy') || nameLower.includes('james') ||
                 nameLower.includes('daniel') || nameLower.includes('mohan') || nameLower.includes('rishi') ||
                 nameLower.includes('ajay') || nameLower.includes('pawan') || nameLower.includes('kiran');
        });
        if (!matchedVoice && langVoices.length > 0) {
          // Fall back to first available voice for language that doesn't explicitly declare female if possible
          matchedVoice = langVoices.find(v => {
            const nameLower = v.name.toLowerCase();
            return !nameLower.includes('female') && !nameLower.includes('zira') && !nameLower.includes('samantha');
          }) || langVoices[0];
        }
        if (matchedVoice) utterance.voice = matchedVoice;
      } catch {
        // Voice matching optional
      }

      utterance.onend = () => setAvatarDemoState('idle');
      utterance.onerror = () => setAvatarDemoState('idle');
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setAvatarDemoState('idle'), 3000);
    }
  };

  return (
    <div className="container" style={{ padding: '2.5rem var(--space-6)', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Top Focused Hero Banner (Without duplicate Start Mock Interview CTA) */}
      <section style={{
        background: 'linear-gradient(135deg, #FFFFFF 0%, #FAF5FF 100%)',
        border: '1px solid var(--border-lavender)',
        borderRadius: 'var(--radius-xl)',
        padding: '2.5rem',
        boxShadow: 'var(--shadow-md)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle Lavender Backdrop Glow */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          right: '-5%',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 220px',
          gap: '2.5rem',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.85rem' }}>
              <span className="badge badge-violet">
                <Sparkles size={12} /> TalentTrail AI
              </span>
              <span className="badge badge-slate">
                <Globe size={12} style={{ marginRight: '0.25rem' }} />
                {langMeta.flag} {langMeta.name}
              </span>
            </div>

            <h1 style={{
              fontSize: '2.1rem',
              fontWeight: 800,
              color: 'var(--text-heading)',
              marginBottom: '0.85rem',
              letterSpacing: '-0.02em'
            }}>
              {t('dashboard.welcomeTitle', null, currentLanguage)}
            </h1>

            <p style={{
              fontSize: '1rem',
              color: 'var(--text-secondary)',
              maxWidth: '680px',
              lineHeight: 1.6,
              marginBottom: '1.25rem'
            }}>
              {t('dashboard.welcomeSubtitle', null, currentLanguage)}
            </p>

            {/* Quick Informational Links - Dedicated Interview access is via header nav */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
              <button
                className="btn btn-outline"
                onClick={() => onNavigateTab('interview')}
                style={{ fontSize: '0.84rem', fontWeight: 600, borderColor: 'var(--lavender-300)', color: 'var(--lavender-900)' }}
              >
                <Mic size={15} color="var(--lavender-700)" />
                {t('nav.interview', null, currentLanguage)}
              </button>

              <button
                className="btn btn-ghost"
                onClick={() => onNavigateTab('rubrics')}
                style={{ fontSize: '0.84rem' }}
              >
                <Sliders size={14} />
                {t('nav.rubrics', null, currentLanguage)}
              </button>

              <button
                className="btn btn-ghost"
                onClick={() => onNavigateTab('history')}
                style={{ fontSize: '0.84rem' }}
              >
                <Award size={14} />
                {t('nav.history', null, currentLanguage)}
              </button>
            </div>
          </div>

          {/* Ismav Avatar Preview Card */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid var(--border-lavender)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem 1rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <AvatarInterviewer
              state={avatarDemoState}
              size={110}
              name="Ismav"
              role="Senior AI Interviewer"
            />
            
            <button
              className="btn btn-outline"
              onClick={toggleAvatarVoice}
              style={{
                fontSize: '0.75rem',
                padding: '0.35rem 0.75rem',
                width: '100%'
              }}
            >
              <Volume2 size={13} />
              {avatarDemoState === 'speaking' ? 'Stop Voice' : `Test Ismav (${langMeta.nativeName})`}
            </button>
          </div>
        </div>
      </section>

      {/* Engine Status Banner: Explicit Live AI vs. Simulation Mode */}
      <section style={{
        backgroundColor: isSimulation ? '#FFFBEB' : '#ECFDF5',
        border: `1px solid ${isSimulation ? '#FDE68A' : '#A7F3D0'}`,
        borderRadius: 'var(--radius-lg)',
        padding: '1rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {isSimulation ? (
            <AlertTriangle size={20} color="#D97706" />
          ) : (
            <CheckCircle2 size={20} color="#059669" />
          )}
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: isSimulation ? '#92400E' : '#065F46' }}>
              {isSimulation
                ? (t('nav.modeSimulation', null, currentLanguage) || 'Simulation Mode')
                : `${t('nav.modeGemini', null, currentLanguage) || t('nav.modeLive', null, currentLanguage) || 'Gemini Live AI'} Active`}
            </div>
            <div style={{ fontSize: '0.78rem', color: isSimulation ? '#B45309' : '#047857' }}>
              {isSimulation
                ? (serverStatus?.simulationReason === 'NO_API_KEY_CONFIGURED'
                    ? 'Deterministic rubric rule engine (No external API calls). Configure GEMINI_API_KEY in server/.env for Live Gemini AI.'
                    : (serverStatus?.simulationReason || t('common.simulationNotice', null, currentLanguage)))
                : `Connected to Google Gemini (${serverStatus?.activeModel || serverStatus?.configuredModel || 'gemini-2.0-flash'}). Live generative evaluation active.`}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {isSimulation ? (
            <span
              className="badge badge-amber"
              title="Deterministic rubric engine active. Configure GEMINI_API_KEY in server/.env to enable Gemini Live AI."
            >
              Engine: Deterministic Rubric
            </span>
          ) : (
            <span className="badge badge-emerald">
              Gemini AI • {serverStatus?.activeModel || serverStatus?.configuredModel || 'gemini-2.0-flash'}
            </span>
          )}
        </div>
      </section>

      {/* 3 Focused Feature Architecture Cards */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* Card 1: Resume Parsing */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--lavender-100)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--lavender-700)'
          }}>
            <FileText size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--text-heading)', marginBottom: '0.35rem' }}>
              {t('dashboard.step1Title', null, currentLanguage)}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {t('dashboard.step1Desc', null, currentLanguage)}
            </p>
          </div>
        </div>

        {/* Card 2: Voice Interview with Ismav & 10s silence */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--sky-500-15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--sky-600)'
          }}>
            <Mic size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--text-heading)', marginBottom: '0.35rem' }}>
              {t('dashboard.step2Title', null, currentLanguage)}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {t('dashboard.step2Desc', null, currentLanguage)}
            </p>
          </div>
        </div>

        {/* Card 3: Final Comprehensive Report */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--emerald-500-15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--emerald-600)'
          }}>
            <Award size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--text-heading)', marginBottom: '0.35rem' }}>
              {t('dashboard.step3Title', null, currentLanguage)}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {t('dashboard.step3Desc', null, currentLanguage)}
            </p>
          </div>
        </div>
      </section>

      {/* Voice State Machine & Security Section */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.5rem'
      }}>
        {/* Transparent Methodology */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
            <Layers size={18} color="var(--lavender-600)" />
            <h3 style={{ fontSize: '1rem', color: 'var(--text-heading)' }}>
              {t('dashboard.systemOverview', null, currentLanguage)}
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              {
                step: '1. READY',
                desc: 'Candidate uploads resume, selects role parameters, turn count (8 default), and language.'
              },
              {
                step: '2. ASKING_QUESTION',
                desc: 'Ismav speaks the current question in the chosen language via Web Speech synthesis.'
              },
              {
                step: '3. LISTENING',
                desc: 'Speech recognition automatically activates when TTS finishes. Live transcript updates in real-time.'
              },
              {
                step: '4. PROCESSING_ANSWER',
                desc: 'Mandatory 10-second silence rule: Timer starts only after speech detection and resets when candidate speaks.'
              },
              {
                step: '5. COMPLETED',
                desc: 'Displays the complete final report with rubric breakdown and actionable feedback. Zero mid-turn grading.'
              }
            ].map((item, idx) => (
              <div key={idx} style={{
                padding: '0.75rem',
                backgroundColor: 'var(--lavender-50)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-lavender)'
              }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--lavender-800)', marginBottom: '0.15rem' }}>
                  {item.step}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy & Ethical Standards */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
            <Shield size={18} color="var(--emerald-600)" />
            <h3 style={{ fontSize: '1rem', color: 'var(--text-heading)' }}>Privacy & Ethical Standards</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {[
              {
                label: 'In-Memory PDF Parsing',
                value: 'Uploaded resumes are parsed directly in RAM via pdf-parse; files are never persisted to disk.'
              },
              {
                label: 'Local Voice Processing Only',
                value: 'Speech recognition uses browser Web Speech APIs. No raw candidate voice recordings are stored or transmitted.'
              },
              {
                label: 'Transparent Focus Detection',
                value: 'Non-invasive notification when window loses focus. No false claims of blocking OS split-screen.'
              },
              {
                label: 'Strict Secret Isolation',
                value: 'Zero frontend API keys. All generative AI calls occur server-to-server with safe fallback simulation.'
              }
            ].map((item, idx) => (
              <div key={idx} style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.2rem',
                padding: '0.65rem 0',
                borderBottom: idx < 3 ? '1px solid var(--border-subtle)' : 'none'
              }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {item.label}
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}

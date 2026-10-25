import React, { useState, useEffect } from 'react';
import { History, Award, Calendar, User, ArrowRight, Trash2, Eye, RotateCcw } from 'lucide-react';
import InterviewCompletionReport from '../interview/InterviewCompletionReport';
import { t } from '../../i18n';

const STORAGE_KEY = 'talenttrail_interview_history';
const LEGACY_STORAGE_KEY = 'ai_interview_history';

export default function HistoryView({ onStartNew, currentLanguage = 'en-US' }) {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    try {
      const primary = localStorage.getItem(STORAGE_KEY);
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      const data = primary ? JSON.parse(primary) : (legacy ? JSON.parse(legacy) : []);
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Error reading history:', err);
    }
  }, []);

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all archived interview records?')) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      setSessions([]);
      setSelectedSession(null);
    }
  };

  const handleDeleteItem = (id, e) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setSessions(updated);
    if (selectedSession && selectedSession.id === id) {
      setSelectedSession(null);
    }
  };

  if (selectedSession && selectedSession.summary) {
    return (
      <div className="container" style={{ padding: '2.5rem var(--space-6)', maxWidth: '1000px' }}>
        <button
          type="button"
          onClick={() => setSelectedSession(null)}
          className="btn btn-secondary"
          style={{ marginBottom: '1.5rem', fontSize: 'var(--text-xs)' }}
        >
          ← {t('history.title', null, currentLanguage)}
        </button>
        <InterviewCompletionReport
          summary={selectedSession.summary}
          currentLanguage={currentLanguage}
          onRestart={onStartNew}
          onViewHistory={() => setSelectedSession(null)}
        />
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2.5rem var(--space-6)', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span className="badge badge-violet" style={{ marginBottom: '0.5rem' }}>TalentTrail Records</span>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--text-primary)', fontWeight: 800 }}>
            {t('history.title', null, currentLanguage)}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginTop: '0.25rem' }}>
            {t('history.subtitle', null, currentLanguage)}
          </p>
        </div>

        {sessions.length > 0 && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={handleClearHistory}
              className="btn btn-outline"
              style={{ fontSize: '0.8rem', color: '#DC2626', borderColor: '#FCA5A5' }}
            >
              <Trash2 size={13} /> {t('history.clearHistory', null, currentLanguage)}
            </button>
            <button
              type="button"
              onClick={onStartNew}
              className="btn btn-primary"
              style={{ fontSize: '0.8rem' }}
            >
              + {t('report.newInterviewBtn', null, currentLanguage)}
            </button>
          </div>
        )}
      </div>

      {sessions.length === 0 ? (
        /* Empty State */
        <div className="card" style={{
          textAlign: 'center',
          padding: '3.5rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          backgroundColor: '#FFFFFF',
          border: '1.5px dashed var(--lavender-300)'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'var(--lavender-100)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--lavender-600)'
          }}>
            <History size={26} />
          </div>
          <div>
            <h3 style={{ fontSize: 'var(--text-lg)', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '0.35rem' }}>
              {t('history.title', null, currentLanguage)}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', maxWidth: '440px', margin: '0 auto', lineHeight: 1.5 }}>
              {t('history.empty', null, currentLanguage)}
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={onStartNew}
            style={{ marginTop: '0.5rem' }}
          >
            {t('dashboard.startInterviewCTA', null, currentLanguage)}
            <ArrowRight size={15} />
          </button>
        </div>
      ) : (
        /* Session List */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {sessions.map((sess) => (
            <div
              key={sess.id}
              className="card card-interactive"
              onClick={() => setSelectedSession(sess)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1.25rem',
                padding: '1.25rem 1.5rem',
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-sm)',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--lavender-100)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: 'var(--lavender-700)'
                }}>
                  {sess.candidateName ? sess.candidateName.charAt(0).toUpperCase() : 'C'}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.2rem' }}>
                    <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                      {sess.candidateName || 'Candidate'}
                    </h4>
                    <span className="badge badge-slate" style={{ fontSize: '0.7rem' }}>
                      {sess.role} ({sess.level})
                    </span>
                    <span className={sess.isSimulation ? 'badge badge-amber' : 'badge badge-emerald'} style={{ fontSize: '0.68rem' }}>
                      {sess.isSimulation ? 'Simulation Mode' : 'Gemini AI'}
                    </span>
                    {sess.language && (
                      <span className="badge badge-lavender" style={{ fontSize: '0.68rem' }}>
                        {sess.language}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Completed on {new Date(sess.completedAt).toLocaleString()} • {sess.totalQuestions || 8} questions evaluated
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: sess.averageScore >= 75 ? '#059669' : sess.averageScore >= 60 ? '#D97706' : '#DC2626' }}>
                    {sess.averageScore} / 100
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {sess.recommendation || 'Evaluated'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteItem(sess.id, e)}
                    style={{
                      padding: '0.4rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid #FCA5A5',
                      backgroundColor: '#FEF2F2',
                      color: '#DC2626',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Delete record"
                  >
                    <Trash2 size={14} />
                  </button>
                  <span style={{ color: 'var(--lavender-600)', display: 'flex', alignItems: 'center' }}>
                    <ArrowRight size={16} />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


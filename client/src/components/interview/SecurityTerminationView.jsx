import React, { useMemo } from 'react';
import {
  ShieldAlert,
  Home,
  Clock,
  User,
  Briefcase,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ListOrdered
} from 'lucide-react';
import { t } from '../../i18n';

/**
 * TalentTrail AI — Dedicated Anti-Malpractice Security Termination Screen
 * 
 * Displayed when an interview is stopped due to persistent camera face absence.
 * Features:
 * - Security shield icon and prominent anti-malpractice badge
 * - "Interview Stopped" heading with neutral, factual explanation
 * - Preserved session metadata (questions saved, timestamp, candidate profile)
 * - Timestamped Security Event Log audit timeline
 * - Reassuring notice that partial answers are safely preserved
 * - Single primary action: "Exit to Interview Dashboard"
 */
export default function SecurityTerminationView({
  candidate,
  sessionConfig,
  sessionHistory = [],
  terminatedAt,
  terminationReason,
  securityEvents = [],
  currentLanguage = 'en-US',
  onExitToDashboard
}) {
  const formattedTime = useMemo(() => {
    try {
      const d = terminatedAt ? new Date(terminatedAt) : new Date();
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + 
        ' — ' + d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return new Date().toLocaleTimeString();
    }
  }, [terminatedAt]);

  const questionsCompletedCount = useMemo(() => {
    if (!Array.isArray(sessionHistory)) return 0;
    return sessionHistory.filter(item => item && (item.answer || item.evaluation)).length;
  }, [sessionHistory]);

  const eventsList = useMemo(() => {
    if (Array.isArray(securityEvents) && securityEvents.length > 0) {
      return securityEvents;
    }
    return [
      {
        id: 'ev_init',
        displayTime: new Date().toLocaleTimeString(),
        type: 'MONITORING_START',
        message: t('security.eventInitialized', null, currentLanguage) || 'Face-presence security monitoring initialized',
        level: 'info'
      },
      {
        id: 'ev_absent',
        displayTime: new Date().toLocaleTimeString(),
        type: 'FACE_ABSENT',
        message: t('security.faceNotDetectedWarning', null, currentLanguage) || 'Face not detected in camera feed',
        level: 'warning'
      },
      {
        id: 'ev_term',
        displayTime: new Date().toLocaleTimeString(),
        type: 'TERMINATION_TRIGGERED',
        message: t('security.eventTerminated', null, currentLanguage) || 'Session stopped: continuous face absence reached 30 seconds',
        level: 'critical'
      }
    ];
  }, [securityEvents, currentLanguage]);

  return (
    <div style={{
      maxWidth: '780px',
      margin: '0 auto',
      padding: '2.5rem 1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem'
    }}>
      {/* Main Security Card */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-xl, 16px)',
        border: '1px solid #FCA5A5',
        boxShadow: '0 20px 45px -10px rgba(220, 38, 38, 0.12), 0 8px 20px -6px rgba(99, 102, 241, 0.08)',
        padding: '2.75rem 2.25rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle decorative top security bar */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '6px',
          background: 'linear-gradient(90deg, #DC2626 0%, #EA580C 50%, #DC2626 100%)'
        }} />

        {/* Shield Icon Badge */}
        <div style={{
          width: '76px',
          height: '76px',
          borderRadius: '50%',
          backgroundColor: '#FEF2F2',
          border: '2px solid #FEE2E2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem auto',
          boxShadow: '0 10px 25px rgba(220, 38, 38, 0.18)'
        }}>
          <ShieldAlert size={42} color="#DC2626" strokeWidth={2.2} />
        </div>

        {/* Anti-Malpractice Pill Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
          backgroundColor: '#FEE2E2',
          border: '1px solid #FCA5A5',
          color: '#991B1B',
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          padding: '0.35rem 0.95rem',
          borderRadius: '9999px',
          marginBottom: '1rem'
        }}>
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: '#DC2626',
            display: 'inline-block'
          }} />
          {t('security.shieldLabel', null, currentLanguage) || 'Anti-Malpractice Security Triggered'}
        </div>

        {/* Main Heading */}
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 800,
          color: '#1E1B4B',
          letterSpacing: '-0.02em',
          margin: '0 0 0.85rem 0'
        }}>
          {t('security.interviewStopped', null, currentLanguage) || 'Interview Stopped'}
        </h1>

        {/* Clear, Neutral Explanation */}
        <p style={{
          fontSize: '0.96rem',
          color: '#4B5563',
          lineHeight: 1.65,
          maxWidth: '600px',
          margin: '0 auto 2rem auto'
        }}>
          {t('security.explanation', null, currentLanguage) || 
            'Face presence could not be verified in the live camera feed for 30 consecutive seconds during the active interview session. Candidate camera presence is required throughout the assessment to maintain evaluation integrity.'}
        </p>

        {/* Session Snapshot Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '1rem',
          backgroundColor: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: 'var(--radius-lg, 12px)',
          padding: '1.25rem',
          marginBottom: '2rem',
          textAlign: 'left'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'var(--lavender-100, #EDE9FE)',
              color: 'var(--lavender-700, #6D28D9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <User size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
                Candidate
              </div>
              <div style={{ fontSize: '0.88rem', color: '#1E293B', fontWeight: 700 }}>
                {candidate?.name || 'Candidate'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'var(--lavender-100, #EDE9FE)',
              color: 'var(--lavender-700, #6D28D9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Briefcase size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
                Interview Role
              </div>
              <div style={{ fontSize: '0.88rem', color: '#1E293B', fontWeight: 700 }}>
                {sessionConfig?.role || 'Full Stack Developer'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#FEF3C7',
              color: '#B45309',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ListOrdered size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
                {t('security.questionsCompleted', null, currentLanguage) || 'Questions Saved'}
              </div>
              <div style={{ fontSize: '0.88rem', color: '#1E293B', fontWeight: 700 }}>
                {questionsCompletedCount} question(s) recorded
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#FEE2E2',
              color: '#B91C1C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Clock size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
                {t('security.timestampLabel', null, currentLanguage) || 'Stopped At'}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#1E293B', fontWeight: 600 }}>
                {formattedTime}
              </div>
            </div>
          </div>
        </div>

        {/* Timestamped Security Event Log Timeline */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 'var(--radius-lg, 12px)',
          padding: '1.25rem',
          marginBottom: '2rem',
          textAlign: 'left'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.85rem',
            paddingBottom: '0.65rem',
            borderBottom: '1px solid #F1F5F9'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.88rem',
              fontWeight: 700,
              color: '#1E293B'
            }}>
              <ShieldAlert size={16} color="#DC2626" />
              {t('security.eventLogTitle', null, currentLanguage) || 'Timestamped Security Event Log'}
            </div>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              color: '#64748B',
              backgroundColor: '#F1F5F9',
              padding: '0.2rem 0.55rem',
              borderRadius: '9999px'
            }}>
              {eventsList.length} events logged
            </span>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
            maxHeight: '220px',
            overflowY: 'auto',
            paddingRight: '0.25rem'
          }}>
            {eventsList.map((evt, idx) => {
              const isCrit = evt.level === 'critical' || evt.type === 'TERMINATION_TRIGGERED';
              const isWarn = evt.level === 'warning' || evt.type === 'FACE_ABSENT' || evt.type === 'CAMERA_DISCONNECTED';
              
              const badgeBg = isCrit ? '#FEE2E2' : isWarn ? '#FEF3C7' : '#EEF2FF';
              const badgeColor = isCrit ? '#991B1B' : isWarn ? '#92400E' : '#3730A3';
              const badgeBorder = isCrit ? '#FCA5A5' : isWarn ? '#FDE68A' : '#C7D2FE';

              return (
                <div
                  key={evt.id || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.85rem',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    backgroundColor: isCrit ? '#FEF2F2' : isWarn ? '#FFFDF5' : '#F8FAFC',
                    border: `1px solid ${isCrit ? '#FECACA' : isWarn ? '#FEF08A' : '#E2E8F0'}`
                  }}
                >
                  <span style={{
                    fontSize: '0.72rem',
                    fontFamily: 'monospace',
                    color: '#64748B',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    marginTop: '0.15rem'
                  }}>
                    {evt.displayTime || (evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : '--:--:--')}
                  </span>

                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    backgroundColor: badgeBg,
                    color: badgeColor,
                    border: `1px solid ${badgeBorder}`,
                    whiteSpace: 'nowrap'
                  }}>
                    {evt.type.replace('_', ' ')}
                  </span>

                  <span style={{
                    fontSize: '0.82rem',
                    color: '#1F2937',
                    lineHeight: 1.45,
                    flex: 1
                  }}>
                    {evt.message}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Short Statement: Data Preserved & No Irreversible Action */}
        <div style={{
          backgroundColor: '#F0FDF4',
          border: '1px solid #BBF7D0',
          borderRadius: 'var(--radius-md, 8px)',
          padding: '0.95rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          textAlign: 'left',
          marginBottom: '2rem'
        }}>
          <CheckCircle2 size={20} color="#16A34A" style={{ flexShrink: 0 }} />
          <p style={{
            fontSize: '0.84rem',
            color: '#166534',
            lineHeight: 1.5,
            margin: 0
          }}>
            {t('security.sessionStoppedNotice', null, currentLanguage) || 
              'The interview session was stopped to maintain assessment integrity. All answers submitted prior to this event have been safely preserved in your session history. No irreversible account action has been taken.'}
          </p>
        </div>

        {/* Primary Action Button: Exit to Dashboard */}
        <div>
          <button
            type="button"
            id="exit-to-dashboard-btn"
            onClick={onExitToDashboard}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.55rem',
              backgroundColor: 'var(--lavender-600, #7C3AED)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 'var(--radius-lg, 10px)',
              padding: '0.9rem 2.25rem',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
              transition: 'all 0.2s ease',
              minWidth: '240px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--lavender-700, #6D28D9)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--lavender-600, #7C3AED)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <Home size={18} />
            {t('security.exitToDashboard', null, currentLanguage) || 'Exit to Interview Dashboard'}
          </button>
        </div>
      </div>
    </div>
  );
}

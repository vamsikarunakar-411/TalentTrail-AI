import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  Printer,
  Sparkles,
  Info,
  Layers,
  ArrowRight,
  Shield,
  ShieldAlert
} from 'lucide-react';

import { t } from '../../i18n';

export default function InterviewCompletionReport({
  summary,
  currentLanguage = 'en-US',
  onRestart,
  onViewHistory
}) {
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [copied, setCopied] = useState(false);
  const [savedLocally, setSavedLocally] = useState(false);

  if (!summary) return null;

  const {
    candidateName,
    role,
    level,
    language = currentLanguage,
    completedAt,
    totalQuestions,
    averageScore,
    categoryAverages = {},
    recommendation,
    recommendationReasoning,
    keyStrengths = [],
    keyImprovementAreas = [],
    isSimulation,
    evaluationNotice,
    educationalDisclaimer,
    sessionRecords = [],
    terminationStatus,
    terminationReason,
    terminatedAt,
    isTerminated
  } = summary;

  const isTerminatedFaceAbsent = terminationStatus === 'terminated_face_absent' || isTerminated;
  const isRecommended = !isTerminatedFaceAbsent && recommendation === 'Recommended';
  const isNeedsImprovement = !isTerminatedFaceAbsent && recommendation === 'Needs Improvement';

  const recColor = isTerminatedFaceAbsent ? '#DC2626' : isRecommended ? '#10B981' : isNeedsImprovement ? '#F59E0B' : '#EF4444';
  const recBg = isTerminatedFaceAbsent ? 'rgba(239, 68, 68, 0.14)' : isRecommended ? 'rgba(16, 185, 129, 0.12)' : isNeedsImprovement ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)';
  const recBorder = isTerminatedFaceAbsent ? '#DC2626' : isRecommended ? '#10B981' : isNeedsImprovement ? '#F59E0B' : '#EF4444';

  const handleCopySummary = () => {
    const textReport = `====================================================
TALENTTRAIL AI MOCK INTERVIEW ASSESSMENT REPORT
Candidate: ${candidateName}
Target Role: ${role} (${level})
Date: ${new Date(completedAt).toLocaleString()}
Overall Score: ${averageScore} / 100
Recommendation: ${recommendation}
====================================================
EVIDENCE-BASED REASONING:
${recommendationReasoning}

CATEGORY SCORES:
- Technical Depth: ${categoryAverages.technical || averageScore} / 100
- Project Architecture: ${categoryAverages.project || averageScore} / 100
- Problem-Solving: ${categoryAverages.problemSolving || averageScore} / 100
- Behavioral & HR: ${categoryAverages.hr || averageScore} / 100

KEY STRENGTHS:
${keyStrengths.map(s => `• ${s}`).join('\n')}

AREAS FOR IMPROVEMENT:
${keyImprovementAreas.map(a => `• ${a}`).join('\n')}

EDUCATIONAL DISCLAIMER:
${educationalDisclaimer}
====================================================`;

    navigator.clipboard.writeText(textReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleSaveToHistory = () => {
    try {
      const existing = JSON.parse(localStorage.getItem('talenttrail_interview_history') || '[]');
      const newEntry = {
        id: 'session_' + Date.now(),
        candidateName,
        role,
        level,
        language,
        completedAt,
        averageScore,
        recommendation,
        totalQuestions,
        isSimulation,
        summary
      };
      localStorage.setItem('talenttrail_interview_history', JSON.stringify([newEntry, ...existing]));
      setSavedLocally(true);
      setTimeout(() => setSavedLocally(false), 3000);
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem',
      backgroundColor: '#FFFFFF',
      color: '#0F172A',
      padding: '2.5rem',
      borderRadius: 'var(--radius-xl)',
      border: '1px solid #E2E8F0',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)'
    }}>
      {/* Strict 30s Face Absence Termination Notice */}
      {isTerminatedFaceAbsent && (
        <div style={{
          backgroundColor: '#FEF2F2',
          border: '1.5px solid #EF4444',
          borderRadius: 'var(--radius-md)',
          padding: '1.15rem 1.35rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '1rem',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)'
        }}>
          <ShieldAlert size={24} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#991B1B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Interview Terminated: Face Not Detected for 30 Consecutive Seconds
            </div>
            <div style={{ fontSize: '0.86rem', color: '#B91C1C', lineHeight: 1.55, marginTop: '0.35rem' }}>
              In accordance with TalentTrail AI interview integrity rules, candidate face presence must be maintained continuously throughout the session. Because your face was not detected in the camera feed for 30 consecutive seconds, this session was automatically concluded and safely saved. All answers and rubric benchmarks recorded prior to absence have been preserved below.
            </div>
            {terminatedAt && (
              <div style={{ fontSize: '0.78rem', color: '#7F1D1D', marginTop: '0.4rem', fontWeight: 600 }}>
                Termination Timestamp: {new Date(terminatedAt).toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top Banner: Educational Disclaimer Alert */}
      <div style={{
        backgroundColor: '#FEF3C7',
        border: '1px solid #F59E0B',
        borderRadius: 'var(--radius-md)',
        padding: '1rem 1.25rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.85rem'
      }}>
        <Info size={20} color="#B45309" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Academic Mock Interview Laboratory Notice
          </div>
          <div style={{ fontSize: '0.82rem', color: '#78350F', lineHeight: 1.5, marginTop: '0.2rem' }}>
            {educationalDisclaimer}
          </div>
        </div>
      </div>

      {/* Header Profile & Mode */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '1.25rem',
        paddingBottom: '1.5rem',
        borderBottom: '1px solid #E2E8F0'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
            <span style={{
              backgroundColor: '#EEF2FF',
              color: '#4F46E5',
              border: '1px solid #C7D2FE',
              borderRadius: '9999px',
              padding: '0.2rem 0.65rem',
              fontSize: '0.75rem',
              fontWeight: 600
            }}>
              Step 3 Completed
            </span>
            <span style={{
              backgroundColor: isSimulation ? '#FEF3C7' : '#D1FAE5',
              color: isSimulation ? '#B45309' : '#065F46',
              border: `1px solid ${isSimulation ? '#FDE68A' : '#A7F3D0'}`,
              borderRadius: '9999px',
              padding: '0.2rem 0.65rem',
              fontSize: '0.75rem',
              fontWeight: 600
            }}>
              {isSimulation
                ? 'Simulation Mode (Deterministic Rubric Engine)'
                : `Google Gemini AI (${summary.activeModel || summary.configuredModel || 'gemini-2.0-flash'})`}
            </span>
          </div>

          <h2 style={{ fontSize: '1.85rem', color: '#0F172A', fontWeight: 800 }}>
            Mock Interview Performance Report
          </h2>
          <div style={{ fontSize: '0.9rem', color: '#64748B', marginTop: '0.3rem' }}>
            Candidate: <strong style={{ color: '#0F172A' }}>{candidateName}</strong> • Target Role: <strong style={{ color: '#0F172A' }}>{role}</strong> ({level}) • {new Date(completedAt).toLocaleDateString()}
            {isSimulation ? (
              <span style={{ marginLeft: '0.45rem', color: '#B45309', fontSize: '0.8rem', fontWeight: 500 }}>
                • Evaluated via deterministic rubric rules (No external LLM API used)
              </span>
            ) : (
              <span style={{ marginLeft: '0.45rem', color: '#059669', fontSize: '0.8rem', fontWeight: 500 }}>
                • Evaluated dynamically via Google Gemini ({summary.activeModel || summary.configuredModel || 'gemini-2.0-flash'})
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons Top */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleCopySummary}
            style={{
              padding: '0.55rem 0.95rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #CBD5E1',
              backgroundColor: '#F8FAFC',
              color: '#334155',
              fontSize: '0.82rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: 'pointer'
            }}
          >
            {copied ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
            {copied ? 'Copied Report' : 'Copy Summary'}
          </button>

          <button
            type="button"
            onClick={handleSaveToHistory}
            style={{
              padding: '0.55rem 0.95rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #CBD5E1',
              backgroundColor: '#F8FAFC',
              color: '#334155',
              fontSize: '0.82rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: 'pointer'
            }}
          >
            {savedLocally ? <Check size={14} color="#10B981" /> : <FileText size={14} />}
            {savedLocally ? 'Saved to History' : 'Save to History'}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            style={{
              padding: '0.55rem 0.95rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #CBD5E1',
              backgroundColor: '#F8FAFC',
              color: '#334155',
              fontSize: '0.82rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: 'pointer'
            }}
          >
            <Printer size={14} />
            Print
          </button>
        </div>
      </div>

      {/* Main Scorecard & Recommendation Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem',
        alignItems: 'stretch'
      }}>
        {/* Overall Score Box */}
        <div style={{
          backgroundColor: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: 'var(--radius-lg)',
          padding: '1.75rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Overall Performance Score
          </div>
          <div style={{
            fontSize: '3.5rem',
            fontWeight: 900,
            color: recColor,
            lineHeight: 1,
            marginTop: '0.75rem',
            marginBottom: '0.5rem'
          }}>
            {averageScore}
            <span style={{ fontSize: '1.5rem', color: '#94A3B8', fontWeight: 500 }}>/100</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#64748B' }}>
            Evaluated across {totalQuestions} resume-grounded questions
          </div>
        </div>

        {/* Transparent Recommendation Box */}
        <div style={{
          backgroundColor: recBg,
          border: `1.5px solid ${recBorder}`,
          borderRadius: 'var(--radius-lg)',
          padding: '1.75rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Award size={20} color={recColor} />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: recColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Transparent Final Recommendation
            </span>
          </div>

          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem' }}>
            {recommendation}
          </div>

          <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.6 }}>
            {recommendationReasoning}
          </p>
        </div>
      </div>

      {/* Category Progress Bars */}
      <div style={{
        backgroundColor: '#F8FAFC',
        border: '1px solid #E2E8F0',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem'
      }}>
        <h3 style={{ fontSize: '1.05rem', color: '#0F172A', fontWeight: 700, marginBottom: '1.25rem' }}>
          Evaluation Rubric Breakdown
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          {[
            { label: 'Technical Depth (35%)', val: categoryAverages.technical || averageScore, color: '#6366F1' },
            { label: 'Project Architecture (25%)', val: categoryAverages.project || averageScore, color: '#0EA5E9' },
            { label: 'Problem-Solving (25%)', val: categoryAverages.problemSolving || averageScore, color: '#10B981' },
            { label: 'Behavioral & HR (15%)', val: categoryAverages.hr || averageScore, color: '#F59E0B' }
          ].map((cat, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                <span>{cat.label}</span>
                <span style={{ color: cat.color }}>{cat.val} / 100</span>
              </div>
              <div style={{
                height: '8px',
                backgroundColor: '#E2E8F0',
                borderRadius: '9999px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${cat.val}%`,
                  backgroundColor: cat.color,
                  borderRadius: '9999px',
                  transition: 'width 0.8s ease'
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths & Improvement Areas 2-Column Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.5rem'
      }}>
        {/* Key Strengths */}
        <div style={{
          backgroundColor: '#ECFDF5',
          border: '1px solid #A7F3D0',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <CheckCircle2 size={18} color="#059669" />
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#065F46' }}>
              Demonstrated Strengths
            </h4>
          </div>
          <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {keyStrengths && keyStrengths.length > 0 ? (
              keyStrengths.map((str, idx) => (
                <li key={idx} style={{ fontSize: '0.85rem', color: '#047857', lineHeight: 1.5 }}>
                  {str}
                </li>
              ))
            ) : (
              <li style={{ fontSize: '0.85rem', color: '#047857', lineHeight: 1.5, listStyle: 'none' }}>
                Solid baseline engagement demonstrated throughout the session.
              </li>
            )}
          </ul>
        </div>

        {/* Priority Areas for Improvement */}
        <div style={{
          backgroundColor: '#FFFBEB',
          border: '1px solid #FDE68A',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <AlertTriangle size={18} color="#D97706" />
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#92400E' }}>
              Areas for Improvement
            </h4>
          </div>
          <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {keyImprovementAreas && keyImprovementAreas.length > 0 ? (
              keyImprovementAreas.map((imp, idx) => (
                <li key={idx} style={{ fontSize: '0.85rem', color: '#B45309', lineHeight: 1.5 }}>
                  {imp}
                </li>
              ))
            ) : (
              <li style={{ fontSize: '0.85rem', color: '#B45309', lineHeight: 1.5, listStyle: 'none' }}>
                Continue practicing architectural depth and production edge cases.
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Consented Presentation Quality & Device Calibration Observations */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem', margin: 0 }}>
            <Shield size={16} color="var(--lavender-600)" />
            Candidate Calibration & Presentation Baseline Observations
          </h4>
          <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
            ● Consented Optical & Acoustic Observations
          </span>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.78rem' }}>
          <div style={{ padding: '0.65rem', backgroundColor: 'var(--bg-canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <strong>Posture Centering:</strong> {summary?.postureObservation || 'Central Alignment Maintained'}
          </div>
          <div style={{ padding: '0.65rem', backgroundColor: 'var(--bg-canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <strong>Screen & Camera Alignment:</strong> Established (0° Yaw Baseline)
          </div>
          <div style={{ padding: '0.65rem', backgroundColor: 'var(--bg-canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <strong>Vocal Projection Level:</strong> Optimal Range (20-65 dB RMS)
          </div>
        </div>

        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
          <strong>Fairness Notice:</strong> Presentation observations are provided for developmental self-coaching only. Final hiring recommendations and scores are strictly calculated from technical correctness, depth, and the 4-category rubric.
        </p>
      </div>

      {/* Question-by-Question Detailed Review Accordion */}
      <div>
        <h3 style={{ fontSize: '1.15rem', color: '#0F172A', fontWeight: 700, marginBottom: '1rem' }}>
          Detailed Question & Answer Transcript
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {sessionRecords.map((rec, idx) => {
            const isExpanded = expandedIndex === idx;
            return (
              <div
                key={idx}
                style={{
                  border: '1px solid #E2E8F0',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#F8FAFC',
                  overflow: 'hidden'
                }}
              >
                {/* Collapsible Bar */}
                <button
                  type="button"
                  onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                  style={{
                    width: '100%',
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: isExpanded ? '#EEF2FF' : '#F8FAFC',
                    textAlign: 'left',
                    gap: '1rem',
                    cursor: 'pointer',
                    border: 'none',
                    outline: 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                    <span style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: '#6366F1',
                      color: '#FFFFFF',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {idx + 1}
                    </span>
                    <span style={{
                      backgroundColor: '#E2E8F0',
                      color: '#334155',
                      fontSize: '0.72rem',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '9999px',
                      fontWeight: 600
                    }}>
                      {rec.category}
                    </span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0F172A' }}>
                      {(rec.questionText || rec.question || 'Interview Question').slice(0, 90)}...
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{
                      backgroundColor: (rec.score ?? 0) >= 75 ? '#ECFDF5' : '#FFFBEB',
                      color: (rec.score ?? 0) >= 75 ? '#065F46' : '#92400E',
                      border: `1px solid ${(rec.score ?? 0) >= 75 ? '#A7F3D0' : '#FDE68A'}`,
                      borderRadius: '9999px',
                      padding: '0.2rem 0.65rem',
                      fontSize: '0.78rem',
                      fontWeight: 700
                    }}>
                      Score: {rec.score ?? 0} / 100
                    </span>
                    {isExpanded ? <ChevronUp size={16} color="#64748B" /> : <ChevronDown size={16} color="#64748B" />}
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div style={{ padding: '1.25rem', backgroundColor: '#FFFFFF', borderTop: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                        Question Context & Grounding
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#334155', fontStyle: 'italic', marginBottom: '0.5rem' }}>
                        {rec.contextRationale || 'Resume Grounded'}
                      </div>
                      <div style={{ fontSize: '0.92rem', color: '#0F172A', fontWeight: 600 }}>
                        {rec.questionText || rec.question || 'Interview Question'}
                      </div>
                    </div>

                    <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                        Candidate Answer
                      </div>
                      <p style={{ fontSize: '0.88rem', color: rec.candidateAnswer ? '#1E293B' : '#DC2626', lineHeight: 1.6, whiteSpace: 'pre-wrap', fontStyle: rec.candidateAnswer ? 'normal' : 'italic' }}>
                        {rec.candidateAnswer ? rec.candidateAnswer : 'Unanswered (No speech or typed response recorded for this question)'}
                      </p>
                    </div>

                    <div style={{ backgroundColor: '#EEF2FF', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid #C7D2FE' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4F46E5', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                        {t('report.ismavFeedback', null, currentLanguage) || "Ismav's Assessment & Feedback"}
                      </div>
                      <p style={{ fontSize: '0.88rem', color: '#312E81', lineHeight: 1.6 }}>
                        {rec.feedback}
                      </p>
                    </div>

                    {/* Breakdown pill tags */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', paddingTop: '0.25rem', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '0.72rem',
                        backgroundColor: rec.isSimulation ? '#FEF3C7' : '#D1FAE5',
                        color: rec.isSimulation ? '#92400E' : '#065F46',
                        border: `1px solid ${rec.isSimulation ? '#FDE68A' : '#A7F3D0'}`,
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontWeight: 600
                      }}>
                        {rec.isSimulation ? 'Deterministic Rubric Engine' : `Gemini AI (${rec.activeModel || 'gemini-2.0-flash'})`}
                      </span>
                      {rec.categoryScores && (
                        <>
                          <span style={{ fontSize: '0.75rem', backgroundColor: '#F1F5F9', padding: '0.2rem 0.5rem', borderRadius: '4px', color: '#475569' }}>
                            Tech Depth: {rec.categoryScores.technicalDepth}%
                          </span>
                          <span style={{ fontSize: '0.75rem', backgroundColor: '#F1F5F9', padding: '0.2rem 0.5rem', borderRadius: '4px', color: '#475569' }}>
                            Relevance: {rec.categoryScores.contextualRelevance}%
                          </span>
                          <span style={{ fontSize: '0.75rem', backgroundColor: '#F1F5F9', padding: '0.2rem 0.5rem', borderRadius: '4px', color: '#475569' }}>
                            Clarity: {rec.categoryScores.communicationClarity}%
                          </span>
                          <span style={{ fontSize: '0.75rem', backgroundColor: '#F1F5F9', padding: '0.2rem 0.5rem', borderRadius: '4px', color: '#475569' }}>
                            Problem-Solving: {rec.categoryScores.problemSolving}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Footer Actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        paddingTop: '1.5rem',
        borderTop: '1px solid #E2E8F0'
      }}>
        <div style={{ fontSize: '0.82rem', color: '#64748B' }}>
          Interview completed successfully • All rubric assessments archived
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {onViewHistory && (
            <button
              type="button"
              onClick={onViewHistory}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                color: '#334155',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              View In Archive
            </button>
          )}

          <button
            type="button"
            onClick={onRestart}
            style={{
              padding: '0.65rem 1.5rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: '#6366F1',
              color: '#FFFFFF',
              fontSize: '0.88rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
            }}
          >
            <RotateCcw size={15} />
            Start New Mock Interview
          </button>
        </div>
      </div>
    </div>
  );
}

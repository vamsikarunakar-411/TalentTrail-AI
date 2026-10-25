import React from 'react';
import { Award, BookOpen, Target, CheckCircle2, RotateCcw, Sparkles } from 'lucide-react';
import { t } from '../../i18n';

export default function RubricsView({ currentLanguage = 'en-US' }) {
  const rubrics = [
    {
      criterion: t('report.technicalDepth', null, currentLanguage),
      weight: "35%",
      description: t('rubrics.rubric1Desc', null, currentLanguage),
      scales: [
        { score: "85-100", label: "Advanced", desc: "Demonstrates deep conceptual mastery and practical edge-case awareness." },
        { score: "60-84", label: "Proficient", desc: "Solid conceptual grasp with standard industry implementations." },
        { score: "0-59", label: "Developing", desc: "Surface-level understanding with factual or structural inaccuracies." }
      ]
    },
    {
      criterion: t('report.contextualRelevance', null, currentLanguage),
      weight: "30%",
      description: t('rubrics.rubric2Desc', null, currentLanguage),
      scales: [
        { score: "85-100", label: "Highly Targeted", desc: "Concise, precise, and directly addresses core problem parameters." },
        { score: "60-84", label: "Relevant", desc: "Answers the prompt but includes minor tangent or extraneous details." },
        { score: "0-59", label: "Off-Target", desc: "Fails to address key requirements or misinterprets the question." }
      ]
    },
    {
      criterion: t('report.communicationClarity', null, currentLanguage),
      weight: "20%",
      description: t('rubrics.rubric3Desc', null, currentLanguage),
      scales: [
        { score: "85-100", label: "Exemplary", desc: "Structured, articulate, easy to follow, and confident tone." },
        { score: "60-84", label: "Clear", desc: "Understandable structure with occasional minor flow pauses." },
        { score: "0-59", label: "Unstructured", desc: "Difficult to follow or disorganized thought sequence." }
      ]
    },
    {
      criterion: t('report.problemSolving', null, currentLanguage),
      weight: "15%",
      description: t('rubrics.rubric4Desc', null, currentLanguage),
      scales: [
        { score: "85-100", label: "Comprehensive", desc: "Evaluates multiple trade-offs and justifies architectural choices." },
        { score: "60-84", label: "Standard", desc: "Identifies primary solution with basic reasoning." },
        { score: "0-59", label: "Limited", desc: "Does not explain rationale or alternative possibilities." }
      ]
    }
  ];

  return (
    <div className="container" style={{ padding: '2.5rem var(--space-6)', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <span className="badge badge-violet" style={{ marginBottom: '0.5rem' }}>TalentTrail Evaluation System</span>
        <h2 style={{ fontSize: '1.8rem', color: 'var(--text-primary)', fontWeight: 800 }}>
          {t('rubrics.title', null, currentLanguage)}
        </h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '720px', marginTop: '0.25rem', fontSize: 'var(--text-sm)' }}>
          {t('rubrics.subtitle', null, currentLanguage)}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {rubrics.map((r, i) => (
          <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 700 }}>{r.criterion}</h3>
              <span className="badge badge-lavender">Weight: {r.weight}</span>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {r.description}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginTop: '0.5rem' }}>
              {r.scales.map((s, idx) => (
                <div key={idx} style={{
                  padding: '0.55rem 0.85rem',
                  backgroundColor: 'var(--bg-canvas)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.78rem'
                }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{s.label} ({s.score}%)</span>
                  <span style={{ color: 'var(--text-secondary)', maxWidth: '55%', textAlign: 'right' }}>{s.desc}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Test-Retest Consistency & Calibration Notice */}
      <div className="card" style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid var(--border-subtle)',
        padding: '1.5rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '1.25rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--lavender-100)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--lavender-700)',
          flexShrink: 0
        }}>
          <RotateCcw size={22} />
        </div>
        <div>
          <h3 style={{ fontSize: 'var(--text-base)', marginBottom: '0.35rem', color: 'var(--text-primary)', fontWeight: 700 }}>
            Evaluation Calibration & Test-Retest Consistency
          </h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            In mock interview practice, rubric calibration is essential. TalentTrail AI evaluates answers using strict semantic domain analysis rather than raw length. Whether practicing in Live Gemini AI mode or Deterministic Simulation mode, our rubrics provide transparent, constructive feedback to help candidates improve their communication and technical depth.
          </p>
        </div>
      </div>
    </div>
  );
}


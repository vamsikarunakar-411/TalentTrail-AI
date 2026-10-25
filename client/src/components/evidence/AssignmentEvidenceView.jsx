import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  Download,
  Save,
  Copy,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Languages,
  FileText,
  Camera,
  RefreshCw,
  Award,
  Layers,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

const EVIDENCE_STORAGE_KEY = 'talenttrail_assignment_evidence';
const HISTORY_STORAGE_KEY = 'talenttrail_interview_history';

const DEFAULT_CANDIDATE_DATA = {
  candidateA: {
    label: 'Candidate A (My Resume)',
    pseudonym: 'Candidate A',
    resumeFilename: 'my_resume.pdf',
    interviewLanguage: 'en-US',
    interviewDate: new Date().toISOString().split('T')[0],
    questions: [
      {
        turn: 1,
        question: '',
        candidateAnswer: '',
        score: '',
        feedback: ''
      }
    ],
    repeatedQuestionTest: {
      performed: false,
      repeatedQuestion: '',
      originalAnswer: '',
      repeatedAnswer: '',
      originalScore: '',
      repeatedScore: '',
      observedDifferences: ''
    },
    finalReport: {
      overallScore: '',
      recommendation: 'Recommended',
      reasoning: '',
      topStrengths: '',
      areasForImprovement: '',
      mode: 'Simulation Mode (Deterministic Rubric Engine)'
    },
    observations: '',
    screenshotFilenames: [
      '01_candidate_a_preflight.png',
      '02_candidate_a_calibration.png',
      '03_candidate_a_side_by_side_ismav.png',
      '04_candidate_a_final_report.png'
    ]
  },
  candidateB: {
    label: 'Candidate B (Additional Resume 1)',
    pseudonym: 'Candidate B',
    resumeFilename: 'candidate_b_resume.pdf',
    interviewLanguage: 'en-US',
    interviewDate: new Date().toISOString().split('T')[0],
    questions: [
      {
        turn: 1,
        question: '',
        candidateAnswer: '',
        score: '',
        feedback: ''
      }
    ],
    repeatedQuestionTest: {
      performed: false,
      repeatedQuestion: '',
      originalAnswer: '',
      repeatedAnswer: '',
      originalScore: '',
      repeatedScore: '',
      observedDifferences: ''
    },
    finalReport: {
      overallScore: '',
      recommendation: 'Needs Improvement',
      reasoning: '',
      topStrengths: '',
      areasForImprovement: '',
      mode: 'Simulation Mode (Deterministic Rubric Engine)'
    },
    observations: '',
    screenshotFilenames: [
      '05_candidate_b_side_by_side.png',
      '06_candidate_b_final_report.png'
    ]
  },
  candidateC: {
    label: 'Candidate C (Additional Resume 2)',
    pseudonym: 'Candidate C',
    resumeFilename: 'candidate_c_resume.pdf',
    interviewLanguage: 'hi-IN',
    interviewDate: new Date().toISOString().split('T')[0],
    questions: [
      {
        turn: 1,
        question: '',
        candidateAnswer: '',
        score: '',
        feedback: ''
      }
    ],
    repeatedQuestionTest: {
      performed: false,
      repeatedQuestion: '',
      originalAnswer: '',
      repeatedAnswer: '',
      originalScore: '',
      repeatedScore: '',
      observedDifferences: ''
    },
    finalReport: {
      overallScore: '',
      recommendation: 'Recommended',
      reasoning: '',
      topStrengths: '',
      areasForImprovement: '',
      mode: 'Simulation Mode (Deterministic Rubric Engine)'
    },
    observations: '',
    screenshotFilenames: [
      '07_candidate_c_multilingual_stage.png',
      '08_candidate_c_final_report.png'
    ]
  }
};

export default function AssignmentEvidenceView({ currentLanguage = 'en-US' }) {
  const [activeTab, setActiveTab] = useState('candidateA'); // 'candidateA' | 'candidateB' | 'candidateC' | 'summary'
  const [evidenceData, setEvidenceData] = useState(() => {
    try {
      const saved = localStorage.getItem(EVIDENCE_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Error loading stored evidence:', e);
    }
    return DEFAULT_CANDIDATE_DATA;
  });

  const [savedToast, setSavedToast] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [historySessions, setHistorySessions] = useState([]);
  const [showImportModal, setShowImportModal] = useState(false);

  // Load session history on mount for 1-click import capability
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setHistorySessions(parsed);
        }
      }
    } catch (e) {
      console.warn('Error loading history sessions:', e);
    }
  }, []);

  const saveToLocalStorage = (data) => {
    try {
      localStorage.setItem(EVIDENCE_STORAGE_KEY, JSON.stringify(data));
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2500);
    } catch (e) {
      console.error('Failed to save assignment evidence:', e);
    }
  };

  const updateCandidateField = (candidateKey, fieldPath, value) => {
    setEvidenceData(prev => {
      const updated = { ...prev };
      const cand = { ...updated[candidateKey] };

      if (fieldPath.includes('.')) {
        const [parent, child] = fieldPath.split('.');
        cand[parent] = {
          ...cand[parent],
          [child]: value
        };
      } else {
        cand[fieldPath] = value;
      }

      updated[candidateKey] = cand;
      return updated;
    });
  };

  const updateQuestionItem = (candidateKey, index, key, value) => {
    setEvidenceData(prev => {
      const updated = { ...prev };
      const cand = { ...updated[candidateKey] };
      const questions = [...(cand.questions || [])];
      questions[index] = {
        ...questions[index],
        [key]: value
      };
      cand.questions = questions;
      updated[candidateKey] = cand;
      return updated;
    });
  };

  const addQuestionItem = (candidateKey) => {
    setEvidenceData(prev => {
      const updated = { ...prev };
      const cand = { ...updated[candidateKey] };
      const questions = [...(cand.questions || [])];
      questions.push({
        turn: questions.length + 1,
        question: '',
        candidateAnswer: '',
        score: '',
        feedback: ''
      });
      cand.questions = questions;
      updated[candidateKey] = cand;
      return updated;
    });
  };

  const removeQuestionItem = (candidateKey, index) => {
    setEvidenceData(prev => {
      const updated = { ...prev };
      const cand = { ...updated[candidateKey] };
      cand.questions = cand.questions.filter((_, i) => i !== index);
      updated[candidateKey] = cand;
      return updated;
    });
  };

  const importFromSession = (session) => {
    if (!session || !session.summary) return;
    const s = session.summary;

    const importedQuestions = Array.isArray(s.turns)
      ? s.turns.map((t, idx) => ({
          turn: idx + 1,
          question: t.question || `Question ${idx + 1}`,
          candidateAnswer: t.answer || '(No candidate answer recorded)',
          score: t.score !== undefined ? String(t.score) : '',
          feedback: t.feedback || ''
        }))
      : [];

    setEvidenceData(prev => {
      const updated = { ...prev };
      updated[activeTab] = {
        ...updated[activeTab],
        pseudonym: s.candidateName || updated[activeTab].pseudonym,
        interviewLanguage: s.language || updated[activeTab].interviewLanguage,
        interviewDate: session.date ? new Date(session.date).toISOString().split('T')[0] : updated[activeTab].interviewDate,
        questions: importedQuestions.length > 0 ? importedQuestions : updated[activeTab].questions,
        finalReport: {
          overallScore: s.overallScore !== undefined ? String(s.overallScore) : '',
          recommendation: s.recommendation || 'Recommended',
          reasoning: s.recommendationReasoning || '',
          topStrengths: Array.isArray(s.topStrengths) ? s.topStrengths.join('; ') : '',
          areasForImprovement: Array.isArray(s.areasForImprovement) ? s.areasForImprovement.join('; ') : '',
          mode: s.isSimulation ? 'Simulation Mode (Deterministic Rule Engine)' : `Gemini AI (${s.activeModel})`
        }
      };
      saveToLocalStorage(updated);
      return updated;
    });

    setShowImportModal(false);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(evidenceData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'TalentTrail_Assignment_Test_Evidence.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const generateMarkdownReport = () => {
    let md = `# TalentTrail AI — Assignment Test Evidence Report
Generated: ${new Date().toLocaleString()}
Submission Deadline: October 26, 2026

> [!NOTE]
> Academic Integrity Notice: All interview questions, candidate answers, and scoring decisions in this report reflect actual evaluations recorded by the TalentTrail AI application.

---

## Candidate A: ${evidenceData.candidateA.label}
- **Pseudonym / Name**: ${evidenceData.candidateA.pseudonym}
- **Resume File**: \`${evidenceData.candidateA.resumeFilename}\`
- **Interview Language**: ${evidenceData.candidateA.interviewLanguage}
- **Interview Date**: ${evidenceData.candidateA.interviewDate}
- **Evaluation Engine**: ${evidenceData.candidateA.finalReport.mode}
- **Final Overall Score**: ${evidenceData.candidateA.finalReport.overallScore}/100
- **Final Selection Decision**: **${evidenceData.candidateA.finalReport.recommendation}**

### Questions & Verbatim Answers
${evidenceData.candidateA.questions.map(q => `#### Turn ${q.turn}: ${q.question || '(No question specified)'}
- **Candidate Answer**: "${q.candidateAnswer || '(None)'}"
- **Score**: ${q.score ? `${q.score}/100` : 'N/A'}
- **Feedback**: ${q.feedback || 'None'}
`).join('\n')}

### Repeated Question Testing
- **Tested**: ${evidenceData.candidateA.repeatedQuestionTest.performed ? 'Yes' : 'No'}
- **Repeated Question**: ${evidenceData.candidateA.repeatedQuestionTest.repeatedQuestion || 'N/A'}
- **Original Answer**: "${evidenceData.candidateA.repeatedQuestionTest.originalAnswer || 'N/A'}"
- **Repeated Answer**: "${evidenceData.candidateA.repeatedQuestionTest.repeatedAnswer || 'N/A'}"
- **Differences Observed**: ${evidenceData.candidateA.repeatedQuestionTest.observedDifferences || 'N/A'}

### Screenshots Recorded
${evidenceData.candidateA.screenshotFilenames.map(f => `- \`${f}\``).join('\n')}

---

## Candidate B: ${evidenceData.candidateB.label}
- **Pseudonym / Name**: ${evidenceData.candidateB.pseudonym}
- **Resume File**: \`${evidenceData.candidateB.resumeFilename}\`
- **Interview Language**: ${evidenceData.candidateB.interviewLanguage}
- **Interview Date**: ${evidenceData.candidateB.interviewDate}
- **Evaluation Engine**: ${evidenceData.candidateB.finalReport.mode}
- **Final Overall Score**: ${evidenceData.candidateB.finalReport.overallScore}/100
- **Final Selection Decision**: **${evidenceData.candidateB.finalReport.recommendation}**

### Questions & Verbatim Answers
${evidenceData.candidateB.questions.map(q => `#### Turn ${q.turn}: ${q.question || '(No question specified)'}
- **Candidate Answer**: "${q.candidateAnswer || '(None)'}"
- **Score**: ${q.score ? `${q.score}/100` : 'N/A'}
- **Feedback**: ${q.feedback || 'None'}
`).join('\n')}

### Screenshots Recorded
${evidenceData.candidateB.screenshotFilenames.map(f => `- \`${f}\``).join('\n')}

---

## Candidate C: ${evidenceData.candidateC.label}
- **Pseudonym / Name**: ${evidenceData.candidateC.pseudonym}
- **Resume File**: \`${evidenceData.candidateC.resumeFilename}\`
- **Interview Language**: ${evidenceData.candidateC.interviewLanguage}
- **Interview Date**: ${evidenceData.candidateC.interviewDate}
- **Evaluation Engine**: ${evidenceData.candidateC.finalReport.mode}
- **Final Overall Score**: ${evidenceData.candidateC.finalReport.overallScore}/100
- **Final Selection Decision**: **${evidenceData.candidateC.finalReport.recommendation}**

### Questions & Verbatim Answers
${evidenceData.candidateC.questions.map(q => `#### Turn ${q.turn}: ${q.question || '(No question specified)'}
- **Candidate Answer**: "${q.candidateAnswer || '(None)'}"
- **Score**: ${q.score ? `${q.score}/100` : 'N/A'}
- **Feedback**: ${q.feedback || 'None'}
`).join('\n')}

### Screenshots Recorded
${evidenceData.candidateC.screenshotFilenames.map(f => `- \`${f}\``).join('\n')}
`;
    return md;
  };

  const handleCopyMarkdown = () => {
    const md = generateMarkdownReport();
    navigator.clipboard?.writeText(md).then(() => {
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    });
  };

  const currentCand = evidenceData[activeTab];

  return (
    <div className="container" style={{ padding: '2.5rem var(--space-6)', maxWidth: '1060px' }}>
      {/* Top Banner / Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '1.25rem',
        marginBottom: '2rem',
        backgroundColor: '#FFFFFF',
        padding: '1.75rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ maxWidth: '650px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <span style={{
              backgroundColor: 'var(--lavender-100)',
              color: 'var(--lavender-800)',
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              border: '1px solid var(--lavender-300)'
            }}>
              Academic Assignment Portfolio
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Target: October 26, 2026
            </span>
          </div>

          <h1 style={{
            fontSize: '1.65rem',
            fontWeight: 800,
            color: 'var(--text-heading)',
            marginBottom: '0.5rem',
            letterSpacing: '-0.02em'
          }}>
            Assignment Test Evidence Workspace
          </h1>

          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Record genuine interview test evidence for three test cases: <strong>Candidate A</strong> (your own resume), 
            <strong> Candidate B</strong> (additional resume 1), and <strong>Candidate C</strong> (additional resume 2). 
            Preserves verbatim candidate answers, actual scoring rubric feedback, and repeated-question test results.
          </p>
        </div>

        {/* Global Evidence Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', minWidth: '220px' }}>
          <button
            type="button"
            onClick={() => saveToLocalStorage(evidenceData)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <Save size={16} />
            <span>Save Test Evidence</span>
          </button>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={handleExportJSON}
              className="btn btn-secondary"
              style={{ flex: 1, fontSize: '0.76rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
              title="Download raw evidence JSON file"
            >
              <Download size={14} />
              <span>Export JSON</span>
            </button>

            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="btn btn-secondary"
              style={{ flex: 1, fontSize: '0.76rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
              title="Copy markdown evidence report to clipboard"
            >
              <Copy size={14} />
              <span>Copy MD</span>
            </button>
          </div>

          {historySessions.length > 0 && activeTab !== 'summary' && (
            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              style={{
                background: 'var(--lavender-50)',
                color: 'var(--lavender-800)',
                border: '1px dashed var(--lavender-400)',
                borderRadius: 'var(--radius-md)',
                padding: '0.45rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem'
              }}
            >
              <RefreshCw size={13} />
              <span>Import from Completed Session</span>
            </button>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {savedToast && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          backgroundColor: '#10B981',
          color: '#FFFFFF',
          padding: '0.75rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.85rem',
          fontWeight: 600
        }}>
          <CheckCircle2 size={18} />
          <span>Test evidence saved to local browser storage!</span>
        </div>
      )}

      {copiedToast && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          backgroundColor: 'var(--lavender-700)',
          color: '#FFFFFF',
          padding: '0.75rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.85rem',
          fontWeight: 600
        }}>
          <Copy size={18} />
          <span>Markdown report copied to clipboard!</span>
        </div>
      )}

      {/* Candidate Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: '0.5rem'
      }}>
        {[
          { id: 'candidateA', label: 'Candidate A (My Resume)', badge: 'Primary' },
          { id: 'candidateB', label: 'Candidate B (Resume 1)', badge: 'Case 2' },
          { id: 'candidateC', label: 'Candidate C (Resume 2)', badge: 'Case 3' },
          { id: 'summary', label: 'Cross-Candidate Summary', badge: 'Comparative' }
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                border: `1.5px solid ${isActive ? 'var(--lavender-500)' : 'transparent'}`,
                backgroundColor: isActive ? 'var(--lavender-50)' : 'transparent',
                color: isActive ? 'var(--lavender-900)' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease'
              }}
            >
              <span>{tab.label}</span>
              <span style={{
                fontSize: '0.68rem',
                padding: '0.1rem 0.4rem',
                borderRadius: '9999px',
                backgroundColor: isActive ? 'var(--lavender-200)' : 'var(--bg-canvas)',
                color: isActive ? 'var(--lavender-900)' : 'var(--text-muted)'
              }}>
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Candidate Form Content */}
      {activeTab !== 'summary' && currentCand && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          
          {/* Metadata Card */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={18} color="var(--lavender-600)" />
              Candidate Profile & Session Metadata
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1.25rem'
            }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Candidate Pseudonym / Label
                </label>
                <input
                  type="text"
                  value={currentCand.pseudonym}
                  onChange={(e) => updateCandidateField(activeTab, 'pseudonym', e.target.value)}
                  className="input"
                  style={{ width: '100%', padding: '0.6rem 0.85rem', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Resume Filename
                </label>
                <input
                  type="text"
                  value={currentCand.resumeFilename}
                  onChange={(e) => updateCandidateField(activeTab, 'resumeFilename', e.target.value)}
                  className="input"
                  style={{ width: '100%', padding: '0.6rem 0.85rem', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Interview Language
                </label>
                <select
                  value={currentCand.interviewLanguage}
                  onChange={(e) => updateCandidateField(activeTab, 'interviewLanguage', e.target.value)}
                  className="input"
                  style={{ width: '100%', padding: '0.6rem 0.85rem', fontSize: '0.85rem' }}
                >
                  <option value="en-US">English (en-US)</option>
                  <option value="te-IN">Telugu (te-IN)</option>
                  <option value="hi-IN">Hindi (hi-IN)</option>
                  <option value="ta-IN">Tamil (ta-IN)</option>
                  <option value="kn-IN">Kannada (kn-IN)</option>
                  <option value="ml-IN">Malayalam (ml-IN)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Interview Date
                </label>
                <input
                  type="date"
                  value={currentCand.interviewDate}
                  onChange={(e) => updateCandidateField(activeTab, 'interviewDate', e.target.value)}
                  className="input"
                  style={{ width: '100%', padding: '0.6rem 0.85rem', fontSize: '0.85rem' }}
                />
              </div>
            </div>
          </div>

          {/* Questions & Verbatim Answers Card */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <HelpCircle size={18} color="var(--lavender-600)" />
                  Actual Questions Asked & Candidate Answers Verbatim
                </h3>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  Record the questions Ismav asked and the exact responses provided.
                </div>
              </div>

              <button
                type="button"
                onClick={() => addQuestionItem(activeTab)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--lavender-400)',
                  backgroundColor: '#FFFFFF',
                  color: 'var(--lavender-800)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Plus size={14} />
                <span>Add Question</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {(currentCand.questions || []).map((q, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '1.25rem',
                    backgroundColor: 'var(--bg-canvas)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--lavender-900)' }}>
                      Question Turn #{q.turn || idx + 1}
                    </span>
                    {(currentCand.questions || []).length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestionItem(activeTab, idx)}
                        style={{ border: 'none', background: 'none', color: '#DC2626', cursor: 'pointer', padding: '0.2rem' }}
                        title="Remove question"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                      Question Text (Asked by Ismav)
                    </label>
                    <input
                      type="text"
                      value={q.question}
                      onChange={(e) => updateQuestionItem(activeTab, idx, 'question', e.target.value)}
                      placeholder="e.g. Could you explain your experience building scalable web applications with React?"
                      className="input"
                      style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.84rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                      Candidate Verbatim Answer (Spoken or Typed)
                    </label>
                    <textarea
                      rows={3}
                      value={q.candidateAnswer}
                      onChange={(e) => updateQuestionItem(activeTab, idx, 'candidateAnswer', e.target.value)}
                      placeholder="Enter the candidate's exact answer as recognized or typed during the interview..."
                      className="input"
                      style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.84rem', resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                        Score (0-100)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={q.score}
                        onChange={(e) => updateQuestionItem(activeTab, idx, 'score', e.target.value)}
                        placeholder="85"
                        className="input"
                        style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.84rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                        Application Feedback / Rationale
                      </label>
                      <input
                        type="text"
                        value={q.feedback}
                        onChange={(e) => updateQuestionItem(activeTab, idx, 'feedback', e.target.value)}
                        placeholder="e.g. Clear explanation of state management and architectural trade-offs."
                        className="input"
                        style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.84rem' }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Repeated Question Testing Card (Phase 4) */}
          <div className="card" style={{ padding: '1.75rem', borderLeft: '4px solid var(--lavender-600)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <RefreshCw size={18} color="var(--lavender-600)" />
                  Repeated Question Testing (Phase 4 Evidence)
                </h3>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  Tests whether asking identical/similar questions yields consistent evaluation feedback and handles variations.
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={Boolean(currentCand.repeatedQuestionTest?.performed)}
                  onChange={(e) => updateCandidateField(activeTab, 'repeatedQuestionTest.performed', e.target.checked)}
                />
                <span>Test Conducted</span>
              </label>
            </div>

            {currentCand.repeatedQuestionTest?.performed ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                    Repeated Question Text
                  </label>
                  <input
                    type="text"
                    value={currentCand.repeatedQuestionTest?.repeatedQuestion || ''}
                    onChange={(e) => updateCandidateField(activeTab, 'repeatedQuestionTest.repeatedQuestion', e.target.value)}
                    placeholder="Enter the question repeated to this candidate..."
                    className="input"
                    style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.84rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                      First (Original) Response
                    </label>
                    <textarea
                      rows={3}
                      value={currentCand.repeatedQuestionTest?.originalAnswer || ''}
                      onChange={(e) => updateCandidateField(activeTab, 'repeatedQuestionTest.originalAnswer', e.target.value)}
                      placeholder="Candidate's initial response..."
                      className="input"
                      style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.84rem', resize: 'vertical' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                      Second (Repeated) Response
                    </label>
                    <textarea
                      rows={3}
                      value={currentCand.repeatedQuestionTest?.repeatedAnswer || ''}
                      onChange={(e) => updateCandidateField(activeTab, 'repeatedQuestionTest.repeatedAnswer', e.target.value)}
                      placeholder="Candidate's repeated response..."
                      className="input"
                      style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.84rem', resize: 'vertical' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                    Observed Evaluation Differences & Consistency Notes
                  </label>
                  <textarea
                    rows={2}
                    value={currentCand.repeatedQuestionTest?.observedDifferences || ''}
                    onChange={(e) => updateCandidateField(activeTab, 'repeatedQuestionTest.observedDifferences', e.target.value)}
                    placeholder="Did the score remain consistent? Did the evaluation rubric capture additional detail in the second response?"
                    className="input"
                    style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.84rem' }}
                  />
                </div>
              </div>
            ) : (
              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-canvas)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Check "Test Conducted" above when performing repeated-question consistency tests.
              </div>
            )}
          </div>

          {/* Final Application Decision & Report Card */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award size={18} color="var(--lavender-600)" />
              Actual Final Report & Selection Decision
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1.25rem',
              marginBottom: '1rem'
            }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Overall Score (0-100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={currentCand.finalReport?.overallScore || ''}
                  onChange={(e) => updateCandidateField(activeTab, 'finalReport.overallScore', e.target.value)}
                  placeholder="e.g. 84"
                  className="input"
                  style={{ width: '100%', padding: '0.6rem 0.85rem', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Selection Decision
                </label>
                <select
                  value={currentCand.finalReport?.recommendation || 'Recommended'}
                  onChange={(e) => updateCandidateField(activeTab, 'finalReport.recommendation', e.target.value)}
                  className="input"
                  style={{ width: '100%', padding: '0.6rem 0.85rem', fontSize: '0.85rem' }}
                >
                  <option value="Recommended">Recommended</option>
                  <option value="Needs Improvement">Needs Improvement</option>
                  <option value="Not Yet Recommended">Not Yet Recommended</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Evaluation Engine
                </label>
                <input
                  type="text"
                  value={currentCand.finalReport?.mode || 'Simulation Mode'}
                  onChange={(e) => updateCandidateField(activeTab, 'finalReport.mode', e.target.value)}
                  className="input"
                  style={{ width: '100%', padding: '0.6rem 0.85rem', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Evidence-Based Recommendation Reasoning (From Final Report)
              </label>
              <textarea
                rows={2}
                value={currentCand.finalReport?.reasoning || ''}
                onChange={(e) => updateCandidateField(activeTab, 'finalReport.reasoning', e.target.value)}
                placeholder="The system recommended this candidate because..."
                className="input"
                style={{ width: '100%', padding: '0.6rem 0.85rem', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {/* Observations & Screenshot References */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Camera size={18} color="var(--lavender-600)" />
              Observations & Screenshot Evidence References
            </h3>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Qualitative Observations / Evaluation Issues
              </label>
              <textarea
                rows={3}
                value={currentCand.observations || ''}
                onChange={(e) => updateCandidateField(activeTab, 'observations', e.target.value)}
                placeholder="Notes on candidate pacing, speech recognition transcription fidelity, camera posture tracking, or language accuracy..."
                className="input"
                style={{ width: '100%', padding: '0.6rem 0.85rem', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Screenshot Evidence Filenames (Comma-separated)
              </label>
              <input
                type="text"
                value={(currentCand.screenshotFilenames || []).join(', ')}
                onChange={(e) => {
                  const arr = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                  updateCandidateField(activeTab, 'screenshotFilenames', arr);
                }}
                className="input"
                style={{ width: '100%', padding: '0.6rem 0.85rem', fontSize: '0.85rem' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Cross-Candidate Summary Tab */}
      {activeTab === 'summary' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '1rem' }}>
              Assignment Three-Candidate Comparative Evidence Matrix
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Comparative overview across all three candidates evaluated with TalentTrail AI.
            </p>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--lavender-50)', borderBottom: '2px solid var(--lavender-200)' }}>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: 'var(--lavender-900)' }}>Metric</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: 'var(--lavender-900)' }}>Candidate A (My Resume)</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: 'var(--lavender-900)' }}>Candidate B (Resume 1)</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: 'var(--lavender-900)' }}>Candidate C (Resume 2)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Pseudonym / Role</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{evidenceData.candidateA.pseudonym}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{evidenceData.candidateB.pseudonym}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{evidenceData.candidateC.pseudonym}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Resume Filename</td>
                    <td style={{ padding: '0.75rem 1rem' }}><code>{evidenceData.candidateA.resumeFilename}</code></td>
                    <td style={{ padding: '0.75rem 1rem' }}><code>{evidenceData.candidateB.resumeFilename}</code></td>
                    <td style={{ padding: '0.75rem 1rem' }}><code>{evidenceData.candidateC.resumeFilename}</code></td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Interview Language</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{evidenceData.candidateA.interviewLanguage}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{evidenceData.candidateB.interviewLanguage}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{evidenceData.candidateC.interviewLanguage}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Questions Evaluated</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{evidenceData.candidateA.questions?.length || 0} questions</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{evidenceData.candidateB.questions?.length || 0} questions</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{evidenceData.candidateC.questions?.length || 0} questions</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Overall Score</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--lavender-900)' }}>
                      {evidenceData.candidateA.finalReport.overallScore ? `${evidenceData.candidateA.finalReport.overallScore}/100` : 'Not recorded'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--lavender-900)' }}>
                      {evidenceData.candidateB.finalReport.overallScore ? `${evidenceData.candidateB.finalReport.overallScore}/100` : 'Not recorded'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--lavender-900)' }}>
                      {evidenceData.candidateC.finalReport.overallScore ? `${evidenceData.candidateC.finalReport.overallScore}/100` : 'Not recorded'}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Selection Decision</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '9999px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor: evidenceData.candidateA.finalReport.recommendation === 'Recommended' ? '#DCFCE7' : '#FEF3C7',
                        color: evidenceData.candidateA.finalReport.recommendation === 'Recommended' ? '#15803D' : '#B45309'
                      }}>
                        {evidenceData.candidateA.finalReport.recommendation}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '9999px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor: evidenceData.candidateB.finalReport.recommendation === 'Recommended' ? '#DCFCE7' : '#FEF3C7',
                        color: evidenceData.candidateB.finalReport.recommendation === 'Recommended' ? '#15803D' : '#B45309'
                      }}>
                        {evidenceData.candidateB.finalReport.recommendation}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '9999px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor: evidenceData.candidateC.finalReport.recommendation === 'Recommended' ? '#DCFCE7' : '#FEF3C7',
                        color: evidenceData.candidateC.finalReport.recommendation === 'Recommended' ? '#15803D' : '#B45309'
                      }}>
                        {evidenceData.candidateC.finalReport.recommendation}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Repeated Test</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{evidenceData.candidateA.repeatedQuestionTest?.performed ? 'Verified' : 'Pending'}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{evidenceData.candidateB.repeatedQuestionTest?.performed ? 'Verified' : 'Pending'}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{evidenceData.candidateC.repeatedQuestionTest?.performed ? 'Verified' : 'Pending'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal for 1-click import from recent session */}
      {showImportModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '1.5rem'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            maxWidth: '600px',
            width: '100%',
            padding: '1.75rem',
            boxShadow: 'var(--shadow-xl)',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.5rem' }}>
              Import Completed Session into {currentCand?.label}
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Select an interview session archived in your browser to automatically import all questions asked, verbatim answers, rubric scores, and recommendations.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {historySessions.map(session => (
                <div
                  key={session.id}
                  onClick={() => importFromSession(session)}
                  style={{
                    padding: '0.85rem 1.15rem',
                    border: '1.5px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-canvas)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--lavender-500)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-heading)' }}>
                      {session.summary?.candidateName || 'Candidate Session'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {session.date ? new Date(session.date).toLocaleString() : 'Date N/A'} • {session.summary?.turns?.length || 0} turns • {session.summary?.language || 'en-US'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--lavender-800)' }}>
                      Score: {session.summary?.overallScore || 'N/A'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 600 }}>
                      Click to Import →
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowImportModal(false)}
              className="btn btn-secondary"
              style={{ width: '100%', fontSize: '0.85rem' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  User,
  Mail,
  Phone,
  GraduationCap,
  Briefcase,
  Code2,
  FolderGit2,
  FileText,
  RotateCcw,
  ArrowRight,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Cpu,
  Sparkles,
  Info,
  Edit3,
  Award,
  Globe,
  Plus,
  Trash2,
  X
} from 'lucide-react';
import { t } from '../../i18n';

export default function ParsedResumePreview({ parseResult, onReupload, onContinueToSetup, onUpdateCandidate, currentLanguage = 'en-US' }) {
  const [showRawText, setShowRawText] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const candidate = parseResult?.candidate || {};
  const identified = candidate?.identifiedFields || {};
  const fieldConfidence = candidate?.fieldConfidence || {};

  // Editable Form State
  const [editForm, setEditForm] = useState({
    name: candidate.name || '',
    email: candidate.email || '',
    phone: candidate.phone || '',
    linkedin: candidate.linkedin || '',
    github: candidate.github || '',
    skills: [...(candidate.skills || [])],
    projects: (candidate.projects || []).map(p => ({
      title: p.title || '',
      description: p.description || '',
      technologies: [...(p.technologies || [])]
    })),
    newSkillInput: ''
  });

  // Count identified core sections
  const coreFields = ['name', 'email', 'phone', 'skills', 'education', 'experience', 'projects'];
  const identifiedCount = coreFields.filter(f => Boolean(identified[f])).length;

  const handleCopyText = () => {
    if (parseResult?.extractedText) {
      navigator.clipboard.writeText(parseResult.extractedText);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    }
  };

  const handleAddSkill = () => {
    const s = editForm.newSkillInput.trim();
    if (s && !editForm.skills.includes(s)) {
      setEditForm(prev => ({
        ...prev,
        skills: [...prev.skills, s],
        newSkillInput: ''
      }));
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setEditForm(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skillToRemove)
    }));
  };

  const handleSaveProfile = () => {
    const cleanName = editForm.name.trim();
    const cleanEmail = editForm.email.trim();
    const cleanPhone = editForm.phone.trim();

    const updatedCandidate = {
      ...candidate,
      name: cleanName || null,
      email: cleanEmail || null,
      phone: cleanPhone || null,
      linkedin: editForm.linkedin.trim() || null,
      github: editForm.github.trim() || null,
      skills: editForm.skills,
      projects: editForm.projects.filter(p => p.title.trim()),
      isManuallyVerified: true,
      identifiedFields: {
        ...identified,
        name: Boolean(cleanName),
        email: Boolean(cleanEmail),
        phone: Boolean(cleanPhone),
        skills: editForm.skills.length > 0,
        projects: editForm.projects.length > 0,
        linkedin: Boolean(editForm.linkedin.trim()),
        github: Boolean(editForm.github.trim())
      },
      fieldConfidence: {
        ...fieldConfidence,
        name: { status: cleanName ? 'VERIFIED' : 'MISSING', confidence: cleanName ? 1.0 : 0 },
        email: { status: cleanEmail ? 'VERIFIED' : 'MISSING', confidence: cleanEmail ? 1.0 : 0 },
        phone: { status: cleanPhone ? 'VERIFIED' : 'MISSING', confidence: cleanPhone ? 1.0 : 0 }
      }
    };

    if (onUpdateCandidate) {
      onUpdateCandidate(updatedCandidate);
    }
    setIsEditing(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Banner: Success & Method Notice */}
      <div style={{
        backgroundColor: '#ECFDF5',
        border: '1px solid #A7F3D0',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#D1FAE5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#059669'
          }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: '#065F46' }}>
              Resume Successfully Parsed & Verified
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: '#047857', marginTop: '0.15rem' }}>
              File: <strong>{parseResult.filename}</strong> ({parseResult.fileSizeFormatted}) • {parseResult.pageCount} page(s) • {parseResult.wordCount} words
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span className="badge badge-emerald">
            {identifiedCount} of 7 Fields Extracted
          </span>
          <span className="badge badge-slate" title="Rule-based deterministic extraction running without external AI API keys">
            <Cpu size={12} /> In-Memory Parser
          </span>
          {candidate.isManuallyVerified && (
            <span className="badge badge-emerald" title="Profile details verified by candidate">
              <Check size={12} /> Candidate Verified
            </span>
          )}
        </div>
      </div>

      {/* Scanned PDF Notice if text extraction is low */}
      {parseResult.notice && (
        <div style={{
          backgroundColor: '#FFFBEB',
          border: '1px solid #FDE68A',
          borderRadius: 'var(--radius-md)',
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: '#92400E',
          fontSize: 'var(--text-xs)'
        }}>
          <AlertTriangle size={18} color="#D97706" />
          <div>
            <strong>Document Notice:</strong> {parseResult.notice} You can edit and enter your details directly below to proceed with the interview.
          </div>
        </div>
      )}

      {/* Main Candidate Summary Card */}
      <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.75rem', backgroundColor: '#FFFFFF' }}>
        
        {/* Candidate Identity Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1.25rem',
          paddingBottom: '1.5rem',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: identified.name ? 'var(--lavender-500)' : 'var(--lavender-100)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: identified.name ? '#FFFFFF' : 'var(--lavender-600)',
              fontSize: '1.4rem',
              fontWeight: 700,
              boxShadow: identified.name ? 'var(--shadow-lavender)' : 'none'
            }}>
              {identified.name ? candidate.name.charAt(0).toUpperCase() : <User size={28} />}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '1.45rem', color: 'var(--text-primary)', fontWeight: 800 }}>
                  {identified.name ? candidate.name : (
                    <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontWeight: 500 }}>
                      Name not identified in resume
                    </span>
                  )}
                </h3>
                {!identified.name && (
                  <span className="badge badge-amber" style={{ fontSize: '0.68rem' }}>
                    <AlertTriangle size={11} /> Unidentified
                  </span>
                )}
                {!identified.name && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--lavender-700)',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    Enter Name
                  </button>
                )}
              </div>

              {/* Contact Pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: 'var(--text-xs)' }}>
                  <Mail size={14} color="var(--lavender-600)" />
                  {identified.email ? (
                    <a href={`mailto:${candidate.email}`} style={{ color: 'var(--lavender-700)', fontWeight: 500 }}>
                      {candidate.email}
                    </a>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Email not identified
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: 'var(--text-xs)' }}>
                  <Phone size={14} color="var(--lavender-600)" />
                  {identified.phone ? (
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{candidate.phone}</span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Phone not identified
                    </span>
                  )}
                </div>

                {identified.linkedin && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: 'var(--text-xs)' }}>
                    <Globe size={14} color="var(--lavender-600)" />
                    <a href={candidate.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--lavender-700)', fontWeight: 500 }}>
                      LinkedIn Profile
                    </a>
                  </div>
                )}

                {identified.github && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: 'var(--text-xs)' }}>
                    <Code2 size={14} color="var(--lavender-600)" />
                    <a href={candidate.github} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--lavender-700)', fontWeight: 500 }}>
                      GitHub Profile
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons: Edit & Re-upload */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="btn btn-secondary"
              style={{ fontSize: 'var(--text-xs)', padding: '0.5rem 0.9rem' }}
            >
              <Edit3 size={13} />
              {isEditing ? 'Cancel Edit' : 'Edit / Verify Profile'}
            </button>
            <button
              type="button"
              onClick={onReupload}
              className="btn btn-outline"
              style={{ fontSize: 'var(--text-xs)', padding: '0.5rem 0.9rem' }}
            >
              <RotateCcw size={13} />
              Upload Different Resume
            </button>
          </div>
        </div>

        {/* Inline Candidate Profile Editor Drawer */}
        {isEditing && (
          <div style={{
            padding: '1.5rem',
            backgroundColor: 'var(--bg-canvas)',
            border: '1.5px solid var(--lavender-200)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit3 size={16} color="var(--lavender-600)" />
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Edit & Confirm Candidate Information
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Full Candidate Name *
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Karunakar Rao"
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: 'var(--text-sm)',
                    backgroundColor: '#FFFFFF'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="e.g. candidate@example.com"
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: 'var(--text-sm)',
                    backgroundColor: '#FFFFFF'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Phone Number
                </label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="e.g. +91 98765 43210"
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: 'var(--text-sm)',
                    backgroundColor: '#FFFFFF'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  LinkedIn URL
                </label>
                <input
                  type="text"
                  value={editForm.linkedin}
                  onChange={(e) => setEditForm(prev => ({ ...prev, linkedin: e.target.value }))}
                  placeholder="linkedin.com/in/username"
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: 'var(--text-sm)',
                    backgroundColor: '#FFFFFF'
                  }}
                />
              </div>
            </div>

            {/* Skills Tag Management */}
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Skills Management (Add or Remove)
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.65rem' }}>
                <input
                  type="text"
                  value={editForm.newSkillInput}
                  onChange={(e) => setEditForm(prev => ({ ...prev, newSkillInput: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }}
                  placeholder="Add custom skill (e.g. Next.js) and press Enter"
                  style={{
                    flex: 1,
                    padding: '0.45rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: 'var(--text-xs)',
                    backgroundColor: '#FFFFFF'
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="btn btn-secondary"
                  style={{ fontSize: 'var(--text-xs)', padding: '0.45rem 0.85rem' }}
                >
                  <Plus size={13} /> Add Skill
                </button>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', maxHeight: '140px', overflowY: 'auto', padding: '0.25rem 0' }}>
                {editForm.skills.map((s, idx) => (
                  <span
                    key={idx}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      backgroundColor: 'var(--lavender-50)',
                      border: '1px solid var(--lavender-200)',
                      color: 'var(--lavender-800)',
                      padding: '0.25rem 0.6rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.72rem',
                      fontWeight: 600
                    }}
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(s)}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--lavender-600)' }}
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="btn btn-outline"
                style={{ fontSize: 'var(--text-xs)' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                className="btn btn-primary"
                style={{ fontSize: 'var(--text-xs)', padding: '0.5rem 1.25rem' }}
              >
                <Check size={13} /> Save Verified Profile
              </button>
            </div>
          </div>
        )}

        {/* Technical Skills Section */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Code2 size={18} color="var(--lavender-600)" />
              <h4 style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)', fontWeight: 700 }}>
                Identified Technical Skills
              </h4>
            </div>
            <span className="badge badge-slate">
              {candidate.skills?.length || 0} skills
            </span>
          </div>

          {identified.skills && candidate.skills.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {candidate.skills.map((skill, idx) => (
                <span
                  key={idx}
                  style={{
                    backgroundColor: 'var(--lavender-50)',
                    color: 'var(--lavender-800)',
                    border: '1px solid var(--lavender-200)',
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    letterSpacing: '0.01em'
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <div style={{
              padding: '0.85rem 1rem',
              backgroundColor: 'var(--bg-canvas)',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border-subtle)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertTriangle size={15} color="#F59E0B" />
              <span>No explicit technical skills section was extracted from this resume format.</span>
            </div>
          )}
        </div>

        {/* Experience Section */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Briefcase size={18} color="var(--lavender-600)" />
              <h4 style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)', fontWeight: 700 }}>
                Work Experience & Employment
              </h4>
            </div>
            <span className="badge badge-slate">
              {candidate.experience?.length || 0} entries
            </span>
          </div>

          {identified.experience && candidate.experience.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {candidate.experience.map((exp, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '1rem',
                    backgroundColor: 'var(--bg-canvas)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {exp.role}
                    </div>
                    {exp.duration && (
                      <span className="badge badge-slate" style={{ fontSize: '0.68rem' }}>
                        {exp.duration}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--lavender-700)', fontWeight: 600 }}>
                    {exp.company}
                  </div>
                  {exp.highlights && exp.highlights.length > 0 && (
                    <ul style={{ margin: '0.35rem 0 0 1.25rem', padding: 0, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                      {exp.highlights.slice(0, 3).map((h, hIdx) => (
                        <li key={hIdx} style={{ marginBottom: '0.2rem' }}>{h}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              padding: '0.85rem 1rem',
              backgroundColor: 'var(--bg-canvas)',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border-subtle)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertTriangle size={15} color="#F59E0B" />
              <span>No explicit work experience entries were identified.</span>
            </div>
          )}
        </div>

        {/* Technical Projects Section */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FolderGit2 size={18} color="var(--lavender-600)" />
              <h4 style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)', fontWeight: 700 }}>
                Technical Projects
              </h4>
            </div>
            <span className="badge badge-slate">
              {candidate.projects?.length || 0} projects
            </span>
          </div>

          {identified.projects && candidate.projects.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
              {candidate.projects.map((proj, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '1rem',
                    backgroundColor: 'var(--bg-canvas)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem'
                  }}
                >
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {proj.title}
                  </div>
                  {proj.description && (
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {proj.description}
                    </div>
                  )}
                  {proj.technologies && proj.technologies.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.35rem' }}>
                      {proj.technologies.map((t, tIdx) => (
                        <span key={tIdx} className="badge badge-slate" style={{ fontSize: '0.68rem' }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              padding: '0.85rem 1rem',
              backgroundColor: 'var(--bg-canvas)',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border-subtle)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertTriangle size={15} color="#F59E0B" />
              <span>No separate project entries identified.</span>
            </div>
          )}
        </div>

        {/* Certifications & Licenses Section */}
        {candidate.certifications && candidate.certifications.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={18} color="var(--lavender-600)" />
                <h4 style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)', fontWeight: 700 }}>
                  Certifications & Credentials
                </h4>
              </div>
              <span className="badge badge-slate">
                {candidate.certifications.length} credentials
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {candidate.certifications.map((cert, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: 'var(--bg-canvas)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Award size={14} color="#D97706" />
                  <span>{cert}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education Section */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <GraduationCap size={18} color="var(--lavender-600)" />
              <h4 style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)', fontWeight: 700 }}>
                Academic Background & Education
              </h4>
            </div>
            <span className="badge badge-slate">
              {candidate.education?.length || 0} entries
            </span>
          </div>

          {identified.education && candidate.education.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {candidate.education.map((edu, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '1rem',
                    backgroundColor: 'var(--bg-canvas)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}
                >
                  <div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {edu.degree}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--lavender-700)', fontWeight: 500 }}>
                      {edu.institution}
                    </div>
                  </div>
                  {edu.year && (
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                      {edu.year}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              padding: '0.85rem 1rem',
              backgroundColor: 'var(--bg-canvas)',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border-subtle)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertTriangle size={15} color="#F59E0B" />
              <span>No explicit education entries identified.</span>
            </div>
          )}
        </div>

        {/* Collapsible Raw Text Inspector */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
          <button
            type="button"
            onClick={() => setShowRawText(!showRawText)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'none',
              border: 'none',
              color: 'var(--lavender-700)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              cursor: 'pointer',
              padding: 0
            }}
          >
            {showRawText ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            <span>{showRawText ? 'Hide Raw Extracted PDF Text' : 'Inspect Raw Extracted PDF Text'}</span>
          </button>

          {showRawText && (
            <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.72rem', padding: '0.3rem 0.65rem' }}
                >
                  {hasCopied ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                  {hasCopied ? 'Copied' : 'Copy Text'}
                </button>
              </div>
              <pre style={{
                maxHeight: '220px',
                overflowY: 'auto',
                backgroundColor: 'var(--bg-canvas)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.75rem',
                lineHeight: 1.5,
                color: 'var(--text-secondary)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontFamily: 'monospace'
              }}>
                {parseResult.extractedText}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation & Continue Footer Action */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        padding: '1.25rem 1.5rem',
        backgroundColor: '#FFFFFF',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
          Profile verified. The extracted skills and projects will ground Ismav's questions in Step 3.
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={onReupload}
            className="btn btn-secondary"
          >
            {t('resume.changeFile', null, currentLanguage)}
          </button>
          <button
            type="button"
            onClick={onContinueToSetup}
            className="btn btn-primary"
            style={{ padding: '0.65rem 1.4rem' }}
          >
            {t('setup.stepSetup', null, currentLanguage)} (Ismav)
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

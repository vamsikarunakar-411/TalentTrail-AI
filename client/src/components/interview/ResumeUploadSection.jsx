import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  AlertCircle,
  CheckCircle2,
  FileCheck,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Info
} from 'lucide-react';
import { t } from '../../i18n';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export default function ResumeUploadSection({ onParseSuccess, serverStatus, currentLanguage = 'en-US' }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [errorDetails, setErrorDetails] = useState('');
  const fileInputRef = useRef(null);

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const validateFile = (file) => {
    setErrorMessage('');
    setErrorDetails('');

    if (!file) {
      setErrorMessage('No file selected.');
      setErrorDetails('Please select a valid PDF file.');
      return false;
    }

    // 1. Check file extension and MIME type
    const isPdfExt = file.name.toLowerCase().endsWith('.pdf');
    const isPdfMime = file.type === 'application/pdf' || file.type === '';

    if (!isPdfExt || (!isPdfMime && file.type)) {
      setErrorMessage('Invalid file type.');
      setErrorDetails(`"${file.name}" is not a PDF. Only PDF resumes (.pdf) are supported.`);
      return false;
    }

    // 2. Check empty file (0 bytes)
    if (file.size === 0) {
      setErrorMessage('Empty file detected.');
      setErrorDetails(`"${file.name}" has a file size of 0 bytes. Please select a valid document.`);
      return false;
    }

    // 3. Check 5MB limit
    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage('File size limit exceeded.');
      setErrorDetails(`"${file.name}" is ${formatFileSize(file.size)}. Maximum allowed size is 5 MB.`);
      return false;
    }

    return true;
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      if (validateFile(file)) {
        setSelectedFile(file);
      } else {
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      } else {
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const handleUploadAndParse = async () => {
    if (!selectedFile) {
      setErrorMessage('Please select a PDF file first.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setErrorDetails('');
    setLoadingStep('Uploading resume PDF safely to memory buffer...');

    try {
      const formData = new FormData();
      formData.append('resume', selectedFile);

      setLoadingStep('Parsing PDF text and analyzing candidate details...');
      const response = await fetch('/api/resume/parse', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data?.error?.message || `Server error (${response.status})`);
      }

      setLoadingStep('Candidate profile extracted successfully!');
      setTimeout(() => {
        onParseSuccess(data);
      }, 350);
    } catch (err) {
      console.error('[CLIENT UPLOAD ERROR]:', err);
      setErrorMessage(err.message || 'Failed to upload and parse resume.');
      setErrorDetails('Please ensure the PDF is valid, unencrypted, and does not exceed 5 MB.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSample = async () => {
    setIsLoading(true);
    setErrorMessage('');
    setErrorDetails('');
    setLoadingStep('Loading verified sample candidate profile...');

    try {
      const response = await fetch('/api/resume/sample');
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data?.error?.message || 'Failed to load sample profile');
      }
      onParseSuccess(data);
    } catch (err) {
      console.error('[SAMPLE LOAD ERROR]:', err);
      setErrorMessage('Could not load sample resume profile.');
      setErrorDetails(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setErrorMessage('');
    setErrorDetails('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Step Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <span className="badge badge-lavender">Step 1: Resume Ingestion</span>
            <span className="badge badge-slate">PDF Only • Max 5 MB</span>
          </div>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--text-primary)', fontWeight: 800 }}>
            Upload Candidate Resume
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginTop: '0.25rem', maxWidth: '600px' }}>
            Upload your technical resume to ground mock interview questions in your verified skills, experience, and projects.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLoadSample}
          disabled={isLoading}
          className="btn btn-outline"
          style={{ fontSize: '0.8rem', padding: '0.5rem 0.9rem' }}
          title="Quickly test with a pre-formatted sample tech resume"
        >
          <Sparkles size={14} color="var(--lavender-600)" />
          Load Sample Resume
        </button>
      </div>

      {/* Error Alert Box */}
      {errorMessage && (
        <div style={{
          backgroundColor: '#FEF2F2',
          border: '1px solid #FCA5A5',
          borderRadius: 'var(--radius-md)',
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem'
        }}>
          <AlertCircle size={20} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: '#991B1B' }}>
              {errorMessage}
            </div>
            {errorDetails && (
              <div style={{ fontSize: 'var(--text-xs)', color: '#B91C1C', marginTop: '0.25rem' }}>
                {errorDetails}
              </div>
            )}
          </div>
          <button
            onClick={() => setErrorMessage('')}
            style={{ color: '#991B1B', fontSize: 'var(--text-xs)', padding: '0.2rem', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Drag & Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragActive ? 'var(--lavender-500)' : selectedFile ? '#10B981' : 'var(--border-strong)'}`,
          borderRadius: 'var(--radius-xl)',
          backgroundColor: dragActive
            ? 'var(--lavender-50)'
            : selectedFile
            ? 'rgba(16, 185, 129, 0.04)'
            : '#FFFFFF',
          padding: '2.75rem 1.5rem',
          textAlign: 'center',
          transition: 'all var(--transition-normal)',
          position: 'relative',
          cursor: isLoading ? 'wait' : 'pointer',
          boxShadow: 'var(--shadow-sm)'
        }}
        onClick={() => !isLoading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          id="resume-pdf-input"
          accept="application/pdf,.pdf"
          onChange={handleFileChange}
          disabled={isLoading}
          style={{ display: 'none' }}
          aria-label="Upload PDF Resume"
        />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: selectedFile ? '#ECFDF5' : 'var(--lavender-100)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: selectedFile ? '#059669' : 'var(--lavender-600)',
            boxShadow: dragActive ? 'var(--shadow-lavender)' : 'var(--shadow-sm)',
            transition: 'all var(--transition-fast)'
          }}>
            {selectedFile ? <FileCheck size={32} /> : <UploadCloud size={32} />}
          </div>

          <div>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              {selectedFile ? selectedFile.name : dragActive ? t('resume.dropHere', null, currentLanguage) : t('resume.chooseOrDrag', null, currentLanguage)}
            </div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto' }}>
              {selectedFile
                ? `${formatFileSize(selectedFile.size)} • Ready for safe in-memory extraction`
                : t('resume.fileLimits', null, currentLanguage)}
            </p>
          </div>

          {!selectedFile && (
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: 'var(--text-xs)', padding: '0.5rem 1.25rem', marginTop: '0.25rem' }}
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              {t('resume.browseLocal', null, currentLanguage)}
            </button>
          )}
        </div>
      </div>

      {/* Selected File Card Details & Action */}
      {selectedFile && (
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
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
              <FileText size={22} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>
                {selectedFile.name}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                {formatFileSize(selectedFile.size)} • Valid PDF Document
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={handleRemoveFile}
              disabled={isLoading}
              className="btn btn-secondary"
              style={{ fontSize: 'var(--text-xs)', padding: '0.45rem 0.85rem' }}
            >
              {t('resume.removeBtn', null, currentLanguage)}
            </button>
            <button
              type="button"
              onClick={handleUploadAndParse}
              disabled={isLoading}
              className="btn btn-primary"
              style={{ fontSize: 'var(--text-xs)', padding: '0.5rem 1.25rem' }}
            >
              {isLoading ? (
                <>
                  <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  Processing...
                </>
              ) : (
                <>
                  {t('resume.parseBtn', null, currentLanguage)}
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* In-Memory Parsing & Privacy Banner */}
      <div style={{
        backgroundColor: 'var(--lavender-50)',
        border: '1px solid var(--lavender-200)',
        borderRadius: 'var(--radius-lg)',
        padding: '1rem 1.25rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.85rem'
      }}>
        <ShieldCheck size={20} color="var(--lavender-600)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.82rem', color: 'var(--lavender-900)', lineHeight: 1.5 }}>
          {t('resume.privacyGuarantee', null, currentLanguage)}
        </div>
      </div>
    </div>
  );
}

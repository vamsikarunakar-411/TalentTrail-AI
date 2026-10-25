import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, CheckCircle, ArrowRight, ShieldAlert, Cpu, FileText, Sliders, Camera, Target } from 'lucide-react';
import ResumeUploadSection from './ResumeUploadSection';
import ParsedResumePreview from './ParsedResumePreview';
import InterviewConfigSection from './InterviewConfigSection';
import PreflightDeviceCheck from './PreflightDeviceCheck';
import CandidateCalibration from './CandidateCalibration';
import InterviewRoomView from './InterviewRoomView';
import { stopMediaStream, stopAllMediaStreams } from '../../utils/mediaUtils';
import { t } from '../../i18n';

export default function InterviewSetupView({
  serverStatus,
  currentLanguage = 'en-US',
  onLanguageChange,
  onBackToDashboard,
  onViewHistory
}) {
  const [currentStep, setCurrentStep] = useState('upload'); // 'upload' | 'preview' | 'config' | 'preflight' | 'calibration' | 'room'
  const [parsedData, setParsedData] = useState(null);
  const [sessionConfig, setSessionConfig] = useState(null);
  const [preflightData, setPreflightData] = useState(null);
  const [calibrationData, setCalibrationData] = useState(null);
  const activeStreamRef = useRef(null);

  // Synchronize sessionConfig language whenever currentLanguage updates
  useEffect(() => {
    if (sessionConfig && sessionConfig.language !== currentLanguage) {
      setSessionConfig(prev => prev ? ({ ...prev, language: currentLanguage }) : prev);
    }
  }, [currentLanguage]);

  // Keep activeStreamRef updated
  useEffect(() => {
    activeStreamRef.current = sessionConfig?.stream || preflightData?.stream || null;
  }, [sessionConfig?.stream, preflightData?.stream]);

  // Comprehensive unmount cleanup: stop any media tracks when candidate navigates to other views/tabs
  useEffect(() => {
    return () => {
      stopAllMediaStreams();
      activeStreamRef.current = null;
    };
  }, []);

  const handleParseSuccess = (data) => {
    setParsedData(data);
    setCurrentStep('preview');
  };

  const handleReupload = () => {
    stopAllMediaStreams();
    activeStreamRef.current = null;
    setSessionConfig(null);
    setPreflightData(null);
    setCalibrationData(null);
    setCurrentStep('upload');
  };

  const handleBackToDashboardClean = () => {
    stopAllMediaStreams();
    activeStreamRef.current = null;
    if (onBackToDashboard) onBackToDashboard();
  };

  const handleContinueToSetup = () => {
    setCurrentStep('config');
  };

  const handleConfigProceed = (config) => {
    setSessionConfig(config);
    setCurrentStep('preflight');
  };

  const handlePreflightProceed = (preflightResult) => {
    setPreflightData(preflightResult);
    activeStreamRef.current = preflightResult?.stream || null;
    setCurrentStep('calibration');
  };

  // Helper to verify physical stream has active video track
  const isStreamLive = (stream) => {
    if (!stream) return false;
    const vTracks = typeof stream.getVideoTracks === 'function' ? stream.getVideoTracks() : [];
    return vTracks.length > 0 && vTracks[0].readyState === 'live';
  };

  const handleCalibrationProceed = (calibResult) => {
    const chosenStream = calibResult?.stream || preflightData?.stream || activeStreamRef.current;
    const calibData = calibResult?.calibrationData || calibrationData;
    const consent = calibResult?.consentGranted ?? true;

    setCalibrationData(calibData);
    activeStreamRef.current = chosenStream;
    // Merge preflight stream into sessionConfig and advance directly to room
    setSessionConfig(prev => ({
      ...prev,
      stream: chosenStream,
      cameraEnabled: true,
      calibrationData: calibData,
      consentGranted: consent
    }));
    setCurrentStep('room');
  };

  return (
    <div className="container" style={{ 
      padding: currentStep === 'room' ? '0.75rem var(--space-4)' : '2.5rem var(--space-6)', 
      maxWidth: currentStep === 'room' ? '1400px' : '980px',
      width: '100%'
    }}>
      {/* Stepper Navigation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '2rem',
        padding: '1rem 1.5rem',
        backgroundColor: '#FFFFFF',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          {[
            { id: 'upload', number: '1', label: t('setup.stepUpload', null, currentLanguage), icon: UploadCloud },
            { id: 'preview', number: '2', label: t('setup.stepProfile', null, currentLanguage), icon: FileText },
            { id: 'config', number: '3', label: t('setup.stepSetup', null, currentLanguage), icon: Sliders },
            { id: 'preflight', number: '4', label: t('setup.stepPreflight', null, currentLanguage), icon: Camera },
            { id: 'calibration', number: '5', label: t('setup.stepCalibration', null, currentLanguage), icon: Target },
            { id: 'room', number: '6', label: t('setup.stepRoom', null, currentLanguage), icon: Cpu },
          ].map((step, idx) => {
            const stepOrder = ['upload', 'preview', 'config', 'preflight', 'calibration', 'room'];
            const currentIndex = stepOrder.indexOf(currentStep);
            const thisIndex = stepOrder.indexOf(step.id);
            const isActive = currentStep === step.id;
            const isCompleted = thisIndex < currentIndex;

            return (
              <React.Fragment key={step.id}>
                {idx > 0 && (
                  <span style={{ color: 'var(--border-strong)', fontSize: '0.85rem' }}>→</span>
                )}
                <div
                  onClick={() => {
                    if (step.id === 'upload') setCurrentStep('upload');
                    if (step.id === 'preview' && parsedData) setCurrentStep('preview');
                    if (step.id === 'config' && parsedData) setCurrentStep('config');
                    if (step.id === 'preflight' && parsedData && sessionConfig) setCurrentStep('preflight');
                    if (step.id === 'calibration' && preflightData && isStreamLive(activeStreamRef.current)) setCurrentStep('calibration');
                    if (step.id === 'room') {
                      if (sessionConfig && calibrationData && isStreamLive(activeStreamRef.current)) {
                        setCurrentStep('room');
                      } else {
                        // Gated: direct navigation cannot bypass compulsory camera verification
                        setCurrentStep('preflight');
                      }
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    cursor: thisIndex <= currentIndex ? 'pointer' : 'default',
                    opacity: thisIndex > currentIndex + 1 ? 0.45 : 1
                  }}
                >
                  <span style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    backgroundColor: isCompleted
                      ? '#10B981'
                      : isActive
                      ? 'var(--lavender-600)'
                      : 'var(--border-subtle)',
                    color: (isCompleted || isActive) ? '#FFFFFF' : 'var(--text-secondary)',
                    boxShadow: isActive ? 'var(--shadow-lavender)' : 'none'
                  }}>
                    {isCompleted ? '✓' : step.number}
                  </span>
                  <span style={{
                    fontSize: '0.76rem',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? 'var(--lavender-700)' : isCompleted ? 'var(--text-primary)' : 'var(--text-secondary)'
                  }}>
                    {step.label}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {onBackToDashboard && (
          <button
            type="button"
            onClick={handleBackToDashboardClean}
            style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none' }}
          >
            {t('setup.backToDashboard', null, currentLanguage)}
          </button>
        )}
      </div>

      {/* Dynamic Step View */}
      {currentStep === 'upload' && (
        <div className="card" style={{ padding: '2.25rem' }}>
          <ResumeUploadSection
            onParseSuccess={handleParseSuccess}
            serverStatus={serverStatus}
            currentLanguage={currentLanguage}
          />
        </div>
      )}

      {currentStep === 'preview' && parsedData && (
        <ParsedResumePreview
          parseResult={parsedData}
          onReupload={handleReupload}
          onContinueToSetup={handleContinueToSetup}
          currentLanguage={currentLanguage}
          onUpdateCandidate={(updatedCandidate) => {
            setParsedData(prev => ({
              ...prev,
              candidate: updatedCandidate
            }));
          }}
        />
      )}

      {currentStep === 'config' && parsedData && (
        <InterviewConfigSection
          candidateData={parsedData}
          serverStatus={serverStatus}
          currentLanguage={currentLanguage}
          onLanguageChange={onLanguageChange}
          onBackToResume={() => setCurrentStep('preview')}
          onStartSession={handleConfigProceed}
        />
      )}

      {currentStep === 'preflight' && parsedData && sessionConfig && (
        <PreflightDeviceCheck
          currentLanguage={currentLanguage}
          sessionConfig={sessionConfig}
          candidateData={parsedData}
          onProceedToCalibration={handlePreflightProceed}
          onBackToConfig={() => setCurrentStep('config')}
        />
      )}

      {currentStep === 'calibration' && parsedData && sessionConfig && (
        <CandidateCalibration
          currentLanguage={currentLanguage}
          sessionConfig={sessionConfig}
          candidateData={parsedData}
          preflightData={preflightData}
          onStartInterview={handleCalibrationProceed}
          onBackToPreflight={() => setCurrentStep('preflight')}
        />
      )}

      {currentStep === 'room' && parsedData && sessionConfig && (
        <InterviewRoomView
          candidateData={parsedData}
          sessionConfig={sessionConfig}
          serverStatus={serverStatus}
          currentLanguage={currentLanguage}
          activeMediaStream={sessionConfig.stream}
          calibrationData={sessionConfig.calibrationData}
          onBackToConfig={() => setCurrentStep('config')}
          onViewHistory={onViewHistory}
          onBackToDashboard={handleBackToDashboardClean}
        />
      )}
    </div>
  );
}

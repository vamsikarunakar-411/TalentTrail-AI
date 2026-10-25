import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  Clock,
  Camera,
  CameraOff,
  Pause,
  Play,
  Square,
  Shield,
  ShieldAlert,
  Info
} from 'lucide-react';
import AvatarInterviewer from '../avatar/AvatarInterviewer';
import InterviewCompletionReport from './InterviewCompletionReport';
import SecurityTerminationView from './SecurityTerminationView';
import { useFacePresenceMonitor } from '../../hooks/useFacePresenceMonitor';
import { SECURITY_CONFIG } from '../../config/securityConfig';
import { t } from '../../i18n';
import { registerMediaStream, stopMediaStream, stopAllMediaStreams } from '../../utils/mediaUtils';

/**
 * TalentTrail AI — Autonomous Voice Interview Room
 * AI Interviewer: Ismav
 * State Machine: READY → ASKING_QUESTION → LISTENING → PROCESSING_ANSWER → NEXT_QUESTION → COMPLETED
 *
 * Mandatory 10-Second Silence Rule:
 * Timer begins ONLY AFTER speech is detected, resets on every detected speech event,
 * and advances only after 10 continuous seconds of silence following detected candidate speech.
 */
export default function InterviewRoomView({
  candidateData,
  sessionConfig,
  serverStatus,
  currentLanguage = 'en-US',
  activeMediaStream: propActiveStream,
  calibrationData: propCalibration,
  onBackToConfig,
  onViewHistory,
  onBackToDashboard
}) {
  const activeMediaStream = sessionConfig?.stream || propActiveStream;
  const effectiveCalibration = sessionConfig?.calibrationData || propCalibration;
  const candidate = useMemo(() => candidateData?.candidate || {}, [candidateData]);
  const activeLang = currentLanguage || sessionConfig?.language || 'en-US';
  const totalTurnsConfigured = Number(sessionConfig?.turns) || 8;
  const silenceThresholdSec = 10.0; // Mandatory 10-second silence rule

  // Canonical welcome greeting across all 6 supported languages
  const getWelcomeGreeting = useCallback((lang, candidateName) => {
    const name = candidateName || 'Candidate';
    const welcomes = {
      'te-IN': `నమస్తే ${name} గారూ. TalentTrail AI ఇంటర్వ్యూకి స్వాగతం. నేను మీ ఇంటర్వ్యూవర్ ఇస్మావ్‌ని. మొదటి ప్రశ్న:`,
      'en-US': `Hello ${name}, welcome to TalentTrail AI. I am Ismav, your AI interviewer. Let's begin with our first question:`,
      'ml-IN': `നമസ്കാരം ${name}, TalentTrail AI-ലേക്ക് സ്വാഗതം. ഞാൻ നിങ്ങളുടെ ഇന്റർവ്യൂവർ ഇസ്മാവാണ്. ആദ്യ ചോദ്യം:`,
      'kn-IN': `ನಮಸ್ಕಾರ ${name}, TalentTrail AI ಗೆ ಸ್ವಾಗತ. ನಾನು ನಿಮ್ಮ ಸಂದರ್ಶಕ ಇಸ್ಮಾವ್. ಮೊದಲ ಪ್ರಶ್ನೆ:`,
      'hi-IN': `नमस्ते ${name}, TalentTrail AI में आपका स्वागत है। मैं आपका साक्षात्कारकर्ता इस्माव हूँ। पहला प्रश्न:`,
      'ta-IN': `வணக்கம் ${name}, TalentTrail AI-க்கு வரவேற்கிறோம். நான் உங்கள் நேர்காணலாளர் இஸ்மாவ். முதல் கேள்வி:`
    };
    return welcomes[lang] || welcomes['en-US'];
  }, []);

  // Honest voice availability state
  const [voiceUnavailableNotice, setVoiceUnavailableNotice] = useState(false);

  // Real-time Posture & Out-of-frame telemetry (Presentation observation only)
  const [postureObservation, setPostureObservation] = useState('Centered');
  const [outOfFrameWarning, setOutOfFrameWarning] = useState(false);

  // Interview state machine
  const [interviewState, setInterviewState] = useState('READY'); // 'READY' | 'ASKING_QUESTION' | 'LISTENING' | 'PROCESSING_ANSWER' | 'COMPLETED'
  const [avatarVisualState, setAvatarVisualState] = useState('idle'); // 'idle' | 'speaking' | 'listening' | 'thinking' | 'acknowledging' | 'approved' | 'completed'
  const [avatarHeadGesture, setAvatarHeadGesture] = useState(null);
  const [avatarHandGesture, setAvatarHandGesture] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);

  // Real-time microphone audio telemetry states
  const [isAudioCapturing, setIsAudioCapturing] = useState(false);
  const [isSpeakingNow, setIsSpeakingNow] = useState(false);

  // Question & turn tracking
  const [currentTurnIndex, setCurrentTurnIndex] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);
  const isSimulation = Boolean(currentQuestion?.isSimulation ?? (serverStatus?.mode === 'SIMULATION_MODE'));

  // Transcript states (Final preserved separate from transient interim)
  const [finalTranscript, setFinalTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [speechDetected, setSpeechDetected] = useState(false);

  // Silence timer states
  const [silenceRemainingSec, setSilenceRemainingSec] = useState(10.0);
  const [silenceProgress, setSilenceProgress] = useState(0); // 0 to 100%

  // Audio / Speech Engine states
  const [sttSupported, setSttSupported] = useState(() => typeof window !== 'undefined' ? Boolean(window.SpeechRecognition || window.webkitSpeechRecognition) : true);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  const [audioPlayBlocked, setAudioPlayBlocked] = useState(false);

  // Persistent local candidate camera preview
  const [cameraActive, setCameraActive] = useState(() => Boolean(sessionConfig?.cameraEnabled ?? true));
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // Mandatory Camera Validation & Face Presence Tracking
  const [cameraDeviceError, setCameraDeviceError] = useState('');
  const [isDeviceValidated, setIsDeviceValidated] = useState(false);
  const [securityTerminationData, setSecurityTerminationData] = useState(null);
  const [showSecurityLogModal, setShowSecurityLogModal] = useState(false);

  // Final completion summary & errors (declared prior to hook invocation to prevent TDZ)
  const [completionSummary, setCompletionSummary] = useState(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Absence tracking refs
  const isTerminatedRef = useRef(false);
  const isFinishingRef = useRef(false);
  const faceMonitorIntervalRef = useRef(null);

  // Cross-calling refs to eliminate circular dependencies
  const startRecognitionRef = useRef(null);
  const handleFinalizeRef = useRef(null);
  const handleTerminateDueToFaceAbsenceRef = useRef(null);

  // Isolated Face-Presence Monitoring Hook (Anti-Malpractice Security)
  const {
    faceDetected,
    faceAbsenceWarning,
    absenceSecondsRemaining,
    securityEventLog,
    cameraStatus: monitorCameraStatus
  } = useFacePresenceMonitor({
    videoRef,
    isActive: isDeviceValidated && interviewState !== 'COMPLETED' && !isFinishing,
    currentLanguage: activeLang,
    onTerminate: (details) => {
      handleTerminateDueToFaceAbsenceRef.current?.(details);
    },
    config: SECURITY_CONFIG
  });

  // Keep camera device error synchronized with monitoring status
  useEffect(() => {
    if (monitorCameraStatus === 'disconnected' && isDeviceValidated) {
      setIsDeviceValidated(false);
      setCameraDeviceError('Camera feed disconnected. Camera presence is compulsory.');
    }
  }, [monitorCameraStatus, isDeviceValidated]);

  // Window focus monitoring
  const [focusLostWarning, setFocusLostWarning] = useState(false);

  // Mutable refs to eliminate stale closure defects
  const interviewStateRef = useRef('READY');
  const isPausedRef = useRef(false);
  const isMicMutedRef = useRef(false);
  const isTransitioningRef = useRef(false);
  const isTypingRef = useRef(false);
  const isStartingRecognitionRef = useRef(false);
  const hasInitializedRef = useRef(false);
  const finalTranscriptRef = useRef('');
  const interimTranscriptRef = useRef('');
  const speechDetectedRef = useRef(false);
  const askedQuestionIdsRef = useRef(new Set());
  const recognitionRef = useRef(null);
  const restartTimeoutRef = useRef(null);
  const restartAttemptsRef = useRef(0);
  const silenceIntervalRef = useRef(null);
  const silenceEndTimeRef = useRef(0);
  const ttsTimeoutRef = useRef(null);
  const utteranceRef = useRef(null);
  const availableVoicesRef = useRef([]);


  // Keep state refs in sync
  useEffect(() => {
    interviewStateRef.current = interviewState;
  }, [interviewState]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    isMicMutedRef.current = isMicMuted;
  }, [isMicMuted]);

  useEffect(() => {
    finalTranscriptRef.current = finalTranscript;
  }, [finalTranscript]);

  useEffect(() => {
    interimTranscriptRef.current = interimTranscript;
  }, [interimTranscript]);

  useEffect(() => {
    speechDetectedRef.current = speechDetected;
  }, [speechDetected]);

  // 1. Check Speech-to-Text Support and cache voices on Mount
  useEffect(() => {
    const cacheVoices = () => {
      if ('speechSynthesis' in window) {
        const v = window.speechSynthesis.getVoices();
        if (v && v.length > 0) {
          availableVoicesRef.current = v;
        }
      }
    };
    cacheVoices();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = cacheVoices;
    }
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // 2. Window Focus Monitoring & Monotonic Absence Catch-Up
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && interviewStateRef.current !== 'COMPLETED') {
        setFocusLostWarning(true);
      } else {
        setFocusLostWarning(false);
        // If tab was backgrounded while candidate face was absent, evaluate monotonic time immediately
        if (absenceStartTimeRef.current !== null && !isTerminatedRef.current && interviewStateRef.current !== 'COMPLETED') {
          const elapsedMs = Date.now() - absenceStartTimeRef.current;
          if (elapsedMs >= 30000) {
            handleTerminateDueToFaceAbsenceRef.current?.();
          } else {
            const remainingSec = Math.max(0, Math.ceil((30000 - elapsedMs) / 1000));
            setAbsenceSecondsRemaining(remainingSec);
          }
        }
      }
    };

    const handleWindowBlur = () => {
      if (interviewStateRef.current !== 'COMPLETED') {
        setFocusLostWarning(true);
      }
    };

    const handleWindowFocus = () => {
      setFocusLostWarning(false);
      if (absenceStartTimeRef.current !== null && !isTerminatedRef.current && interviewStateRef.current !== 'COMPLETED') {
        const elapsedMs = Date.now() - absenceStartTimeRef.current;
        if (elapsedMs >= 30000) {
          handleTerminateDueToFaceAbsenceRef.current?.();
        } else {
          const remainingSec = Math.max(0, Math.ceil((30000 - elapsedMs) / 1000));
          setAbsenceSecondsRemaining(remainingSec);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  // 2a. Reliable stream attacher that handles muted property, track enablement, and metadata load
  const attachStreamToVideo = useCallback((stream) => {
    const video = videoRef.current;
    if (!video || !stream) return;
    try {
      // Ensure video track is enabled and transmitting frames (prevent black preview)
      const vTrack = stream.getVideoTracks ? stream.getVideoTracks()?.[0] : null;
      if (vTrack && !vTrack.enabled) {
        vTrack.enabled = true;
      }

      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '');
      video.setAttribute('autoplay', '');

      if (video.srcObject !== stream) {
        video.srcObject = stream;
      }

      const attemptPlay = () => {
        if (!video) return;
        if (video.paused) {
          const playPromise = video.play?.();
          if (playPromise !== undefined) {
            playPromise.catch(err => {
              console.log('Candidate preview auto-play handled:', err?.message);
            });
          }
        }
      };

      video.addEventListener('loadedmetadata', attemptPlay, { once: true });
      video.addEventListener('canplay', attemptPlay, { once: true });
      attemptPlay();
    } catch (err) {
      console.warn('attachStreamToVideo error:', err);
    }
  }, []);

  // 2b. Explicit Camera & Audio Permission Handler (Compulsory Camera Requirement)
  const handleRequestCameraAccess = useCallback(async () => {
    setCameraDeviceError('');
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('Media devices API not available.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } },
        audio: true
      });
      registerMediaStream(stream);
      mediaStreamRef.current = stream;
      attachStreamToVideo(stream);
      setIsDeviceValidated(true);
      setCameraActive(true);
      setCameraDeviceError('');
      return stream;
    } catch (err) {
      console.warn('Compulsory camera access error:', err);
      setIsDeviceValidated(false);
      setCameraDeviceError('Camera access is compulsory. Please allow camera and microphone access to start the interview.');
      return null;
    }
  }, [attachStreamToVideo]);

  // 3. Mandatory Camera Stream Management & Hardware Validation
  useEffect(() => {
    let isSubscribed = true;

    const validateTracks = (stream) => {
      const vTrack = stream?.getVideoTracks()?.[0];
      const hasLiveVideo = Boolean(vTrack && vTrack.readyState === 'live');
      if (hasLiveVideo) {
        if (isSubscribed) {
          setIsDeviceValidated(true);
          setCameraDeviceError('');
        }
      } else {
        if (isSubscribed) {
          setIsDeviceValidated(false);
          setCameraDeviceError('Camera feed disconnected. Live camera is compulsory.');
        }
      }

      const handleVideoEnded = () => {
        if (isSubscribed) {
          console.warn('Mandatory camera video track ended.');
          setIsDeviceValidated(false);
          setCameraDeviceError('Camera feed lost. Please reconnect camera.');
          setFaceDetected(false);
        }
      };

      const handleUnmute = () => {
        if (isSubscribed) {
          setIsDeviceValidated(true);
          setCameraDeviceError('');
          if (videoRef.current) {
            videoRef.current.play?.().catch(() => {});
          }
        }
      };

      if (vTrack) {
        vTrack.addEventListener('ended', handleVideoEnded);
        vTrack.addEventListener('unmute', handleUnmute);
      }

      return () => {
        if (vTrack) {
          vTrack.removeEventListener('ended', handleVideoEnded);
          vTrack.removeEventListener('unmute', handleUnmute);
        }
      };
    };

    const isLiveStream = (st) => {
      if (!st) return false;
      const vts = typeof st.getVideoTracks === 'function' ? st.getVideoTracks() : [];
      return vts.length > 0 && vts[0].readyState === 'live';
    };

    // Reuse existing validated media stream passed from preflight/calibration
    if (isLiveStream(activeMediaStream)) {
      registerMediaStream(activeMediaStream);
      mediaStreamRef.current = activeMediaStream;
      setCameraActive(true);
      attachStreamToVideo(activeMediaStream);
      return validateTracks(activeMediaStream);
    }

    // Fallback: only if no live preflight stream exists, request local stream
    if (navigator?.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: true })
        .then(stream => {
          if (!isSubscribed) {
            stopMediaStream(stream);
            return;
          }
          registerMediaStream(stream);
          mediaStreamRef.current = stream;
          setCameraActive(true);
          attachStreamToVideo(stream);
          validateTracks(stream);
        })
        .catch(err => {
          console.warn('Camera preview not available in interview room:', err.message);
          if (isSubscribed) {
            setIsDeviceValidated(false);
            setCameraDeviceError('Camera access is compulsory. Please allow camera and microphone access to proceed.');
          }
        });
    }

    return () => {
      isSubscribed = false;
    };
  }, [activeMediaStream, attachStreamToVideo]);

  // Dedicated effect to bind active stream to video ref whenever ready
  useEffect(() => {
    if (cameraActive) {
      const active = mediaStreamRef.current || activeMediaStream;
      if (active) {
        attachStreamToVideo(active);
      }
    }
  }, [cameraActive, activeMediaStream, attachStreamToVideo]);

  // Periodic video playback and stream health watchdog
  useEffect(() => {
    if (!cameraActive) return;
    const healthInterval = setInterval(() => {
      const video = videoRef.current;
      const stream = mediaStreamRef.current || activeMediaStream;
      if (video && stream) {
        const vTrack = stream.getVideoTracks ? stream.getVideoTracks()?.[0] : null;
        if (vTrack && !vTrack.enabled) {
          vTrack.enabled = true;
        }
        if (video.srcObject !== stream) {
          attachStreamToVideo(stream);
        }
        if (video.paused && vTrack && vTrack.readyState === 'live') {
          video.play?.().catch(() => {});
        }
      }
    }, 1000);

    return () => clearInterval(healthInterval);
  }, [cameraActive, activeMediaStream, attachStreamToVideo]);

  // 3b. Real-time Posture & Out-of-Frame Monitoring (Non-punitive presentation feedback)
  useEffect(() => {
    if (!cameraActive || !effectiveCalibration || sessionConfig?.consentGranted === false) {
      return;
    }

    const checkInterval = setInterval(() => {
      const video = videoRef.current;
      // Do not analyze unready, zero-dimension, or paused frames to avoid false "Out of Frame" warnings
      if (!video || video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0 || video.paused) return;

      try {
        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 120;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, 160, 120);
        const frame = ctx.getImageData(30, 20, 100, 80);

        let weight = 0;
        let sumX = 0;
        for (let i = 0; i < frame.data.length; i += 16) {
          const r = frame.data[i];
          const g = frame.data[i + 1];
          const b = frame.data[i + 2];
          if (r > 60 && g > 40 && b > 20 && r > b) {
            weight++;
            sumX += (i / 4) % 100;
          }
        }

        if (weight > 30) {
          const avgX = sumX / weight;
          if (avgX < 32) {
            setPostureObservation('Slanted Left');
            setOutOfFrameWarning(false);
          } else if (avgX > 68) {
            setPostureObservation('Slanted Right');
            setOutOfFrameWarning(false);
          } else {
            setPostureObservation('Centered');
            setOutOfFrameWarning(false);
          }
        } else {
          setPostureObservation('Out of Frame');
          setOutOfFrameWarning(true);
        }
      } catch {
        // Safe optical fallback
      }
    }, 1800);

    return () => clearInterval(checkInterval);
  }, [cameraActive, effectiveCalibration, sessionConfig?.consentGranted]);

  // Helper to extract question text for active language
  const getLocalizedQuestionText = useCallback((q) => {
    if (!q) return '';
    if (activeLang.startsWith('te') && q.teluguQuestion) return q.teluguQuestion;
    if (activeLang.startsWith('ml') && q.malayalamQuestion) return q.malayalamQuestion;
    if (activeLang.startsWith('kn') && q.kannadaQuestion) return q.kannadaQuestion;
    if (activeLang.startsWith('hi') && q.hindiQuestion) return q.hindiQuestion;
    if (activeLang.startsWith('ta') && q.tamilQuestion) return q.tamilQuestion;
    if (q.activeLanguageText) return q.activeLanguageText;
    return q.question || '';
  }, [activeLang]);

  // 4. Initial Question Fetch on Mount
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const initQuestions = async () => {
      try {
        const res = await fetch('/api/interview/generate-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidate,
            role: sessionConfig?.role || 'Full Stack Developer',
            level: sessionConfig?.level || 'Mid-Level (2-5 Years)',
            focus: sessionConfig?.focus || 'Technical & Coding Depth',
            language: activeLang,
            totalTurns: totalTurnsConfigured
          })
        });

        if (!res.ok) {
          throw new Error('Could not initialize interview questions.');
        }

        const data = await res.json();
        if (data.questions && data.questions.length > 0) {
          const firstQ = data.questions[0];
          setCurrentQuestion(firstQ);
          askedQuestionIdsRef.current.add(firstQ.id);
        }
      } catch (err) {
        console.error('Initial question error:', err);
        setGeneralError('Question generator service unavailable. Proceeding with structured simulation backup.');
      }
    };

    initQuestions();
  }, [candidate, sessionConfig, activeLang, totalTurnsConfigured]);

  // 5. Silence Timer Helper: Clears interval cleanly
  const clearSilenceTimers = useCallback(() => {
    if (silenceIntervalRef.current) {
      clearInterval(silenceIntervalRef.current);
      silenceIntervalRef.current = null;
    }
    silenceEndTimeRef.current = 0;
    setSilenceRemainingSec(10.0);
    setSilenceProgress(0);
  }, []);

  // 6. Speech Recognition Safety Helper: Stops recognition cleanly without memory leaks
  const stopRecognitionSafely = useCallback(() => {
    clearSilenceTimers();
    setIsAudioCapturing(false);
    setIsSpeakingNow(false);
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    if (recognitionRef.current) {
      const rec = recognitionRef.current;
      recognitionRef.current = null;
      try {
        rec.onresult = null;
        rec.onerror = null;
        rec.onend = null;
        rec.abort();
      } catch {
        // Ignored
      }
    }
    isStartingRecognitionRef.current = false;
  }, [clearSilenceTimers]);

  // 7. Stop any active speech synthesis
  const stopTTS = useCallback(() => {
    if (ttsTimeoutRef.current) {
      clearTimeout(ttsTimeoutRef.current);
      ttsTimeoutRef.current = null;
    }
    utteranceRef.current = null;
    if (typeof window !== 'undefined') {
      window.__taletrail_active_utterance = null;
    }
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignored
      }
    }
  }, []);

  // 8. Speech Synthesis for Ismav (Dynamic male voice selection with language matching & V8 GC protection)
  const speakText = useCallback((text, onCompleteCallback) => {
    stopTTS();
    stopRecognitionSafely();

    if (!('speechSynthesis' in window)) {
      if (onCompleteCallback) onCompleteCallback();
      return;
    }

    try {
      window.speechSynthesis.resume();
    } catch {
      // Ignored
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance; // Prevent Chromium garbage collection mid-speech
    if (typeof window !== 'undefined') {
      window.__taletrail_active_utterance = utterance;
    }
    utterance.lang = activeLang;
    utterance.rate = 0.95;
    utterance.pitch = 0.96;

    // Dynamically match voice for active language with honest availability check
    try {
      const voices = (availableVoicesRef.current && availableVoicesRef.current.length > 0)
        ? availableVoicesRef.current
        : window.speechSynthesis.getVoices();
      const langVoices = voices.filter(v => v.lang === activeLang || v.lang.startsWith(activeLang.slice(0, 2)));

      if (langVoices.length === 0) {
        // Honest notification: No TTS voice installed for this language in browser/OS.
        // Do NOT silently substitute an unrelated language or English voice!
        setVoiceUnavailableNotice(true);
        if (onCompleteCallback) onCompleteCallback();
        return;
      }
      setVoiceUnavailableNotice(false);

      let matchedVoice = langVoices.find(v => {
        const nameLower = v.name.toLowerCase();
        return nameLower.includes('male') || nameLower.includes('david') || nameLower.includes('george') ||
               nameLower.includes('mark') || nameLower.includes('ravi') || nameLower.includes('valluvar') ||
               nameLower.includes('madhav') || nameLower.includes('guy') || nameLower.includes('james') ||
               nameLower.includes('daniel') || nameLower.includes('mohan') || nameLower.includes('rishi') ||
               nameLower.includes('ajay') || nameLower.includes('pawan') || nameLower.includes('kiran');
      });
      if (!matchedVoice && langVoices.length > 0) {
        // Prefer voice not explicitly declaring female
        matchedVoice = langVoices.find(v => {
          const nameLower = v.name.toLowerCase();
          return !nameLower.includes('female') && !nameLower.includes('zira') && !nameLower.includes('samantha');
        }) || langVoices[0];
      }
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }
    } catch {
      // Voice matching optional fallback
    }

    let hasCompleted = false;
    let hasStarted = false;

    const finishSpeech = (success = true) => {
      if (hasCompleted) return;
      hasCompleted = true;
      utteranceRef.current = null;
      if (typeof window !== 'undefined') {
        window.__taletrail_active_utterance = null;
      }
      if (ttsTimeoutRef.current) {
        clearTimeout(ttsTimeoutRef.current);
        ttsTimeoutRef.current = null;
      }
      if (success) {
        setAudioPlayBlocked(false);
        if (onCompleteCallback) onCompleteCallback();
      } else {
        // Audio failed to start or was blocked by autoplay policies
        // Preserve current question state and prompt candidate to click Play/Retry
        setAudioPlayBlocked(true);
        setAvatarVisualState('idle');
      }
    };

    utterance.onstart = () => {
      hasStarted = true;
      setAudioPlayBlocked(false);
      setInterviewState('ASKING_QUESTION');
      interviewStateRef.current = 'ASKING_QUESTION';
      setAvatarVisualState('speaking');
      setAvatarHeadGesture('idle');
      setAvatarHandGesture('explain');
    };

    utterance.onend = () => {
      finishSpeech(true);
    };

    utterance.onerror = (e) => {
      console.warn('TTS playback note:', e?.error, e);
      if (!hasStarted) {
        finishSpeech(false);
      } else {
        finishSpeech(true);
      }
    };

    // Safety timeout in case browser TTS event doesn't fire
    const safetyMs = Math.max(5000, text.length * 90 + 4000);
    ttsTimeoutRef.current = setTimeout(() => {
      if (!hasStarted) {
        console.warn('TTS speech did not start within safety timeout. Prompting candidate for audio retry.');
        finishSpeech(false);
      } else {
        finishSpeech(true);
      }
    }, safetyMs);

    // Short tick allows previous cancel() to flush cleanly in Chromium audio subsystem
    setTimeout(() => {
      try {
        window.speechSynthesis.speak(utterance);
      } catch (speakErr) {
        console.warn('Speech synthesis speak error:', speakErr);
        finishSpeech(false);
      }
    }, 60);
  }, [activeLang, stopRecognitionSafely, stopTTS]);

  // 9. Complete Interview & Compile Final Report
  const handleFinishInterview = useCallback(async (finalHistory = sessionHistory, terminationMeta = null) => {
    setIsFinishing(true);
    isFinishingRef.current = true;
    stopRecognitionSafely();
    stopTTS();
    setInterviewState('COMPLETED');
    interviewStateRef.current = 'COMPLETED';
    setAvatarVisualState('completed');

    // Stop face monitoring loop
    if (faceMonitorIntervalRef.current) {
      clearInterval(faceMonitorIntervalRef.current);
      faceMonitorIntervalRef.current = null;
    }

    // Immediately stop all active camera/media tracks on interview completion
    stopAllMediaStreams();
    mediaStreamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    const terminationStatus = terminationMeta?.terminationStatus;
    const terminationReason = terminationMeta?.terminationReason;
    const terminatedAt = terminationMeta?.terminatedAt;

    try {
      const res = await fetch('/api/interview/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate,
          role: sessionConfig?.role || 'Full Stack Developer',
          level: sessionConfig?.level || 'Mid-Level',
          sessionHistory: finalHistory,
          language: activeLang,
          terminationStatus,
          terminationReason,
          terminatedAt
        })
      });

      if (!res.ok) {
        throw new Error('Unable to compile final evaluation summary.');
      }

      const data = await res.json();
      setCompletionSummary(data.summary);

      // Auto-save to localStorage history
      try {
        const existing = JSON.parse(localStorage.getItem('talenttrail_interview_history') || '[]');
        const newEntry = {
          id: 'session_' + Date.now(),
          candidateName: candidate.name || 'Candidate',
          role: sessionConfig?.role || 'Full Stack Developer',
          level: sessionConfig?.level || 'Mid-Level',
          language: activeLang,
          completedAt: new Date().toISOString(),
          averageScore: data.summary?.averageScore || 0,
          recommendation: data.summary?.recommendation || 'Evaluated',
          totalQuestions: finalHistory.length,
          isSimulation: data.summary?.isSimulation ?? true,
          terminationStatus,
          terminationReason,
          terminatedAt,
          summary: data.summary
        };
        localStorage.setItem('talenttrail_interview_history', JSON.stringify([newEntry, ...existing]));
      } catch (err) {
        console.warn('History storage note:', err);
      }
    } catch (err) {
      console.error('Completion compilation error:', err);
      setGeneralError('Compiled report from recorded session data: ' + err.message);

      // Defensive fallback summary ensures the candidate NEVER sees a crash or loses their interview
      const safeHistory = Array.isArray(finalHistory) ? finalHistory : [];
      const computedAvg = safeHistory.length > 0
        ? Math.round(safeHistory.reduce((acc, curr) => acc + (curr.evaluation?.score || 0), 0) / safeHistory.length)
        : 0;

      const fallbackSummary = {
        candidateName: candidate?.name || 'Candidate',
        role: sessionConfig?.role || 'Full Stack Developer',
        level: sessionConfig?.level || 'Mid-Level',
        language: activeLang,
        completedAt: new Date().toISOString(),
        totalQuestions: safeHistory.length,
        averageScore: computedAvg,
        categoryAverages: {
          technical: computedAvg,
          project: computedAvg,
          problemSolving: computedAvg,
          hr: computedAvg
        },
        recommendation: terminationStatus === 'terminated_face_absent' ? 'Session Terminated' : (computedAvg >= 75 ? 'Recommended' : computedAvg >= 60 ? 'Needs Improvement' : 'Not Yet Recommended'),
        recommendationReasoning: terminationStatus === 'terminated_face_absent'
          ? 'Interview session was terminated early because the candidate face was absent from the camera feed for 30 consecutive seconds. All answers recorded prior to termination have been preserved.'
          : (safeHistory.length > 0
            ? `Interview session concluded with ${safeHistory.length} question(s) completed with an average score of ${computedAvg}/100.`
            : 'Interview session concluded early before answers were submitted.'),
        keyStrengths: safeHistory.length > 0 ? ['Active participation and question responses recorded.'] : [],
        keyImprovementAreas: ['Maintain continuous camera presence and complete full interview rounds.'],
        isSimulation: true,
        terminationStatus,
        terminationReason,
        terminatedAt,
        evaluationNotice: 'Report compiled safely from recorded session history.',
        educationalDisclaimer: 'Educational Mock-Interview Assessment: This recommendation is generated solely for educational practice and interview skill development in a laboratory mock environment.',
        sessionRecords: safeHistory.map(item => ({
          questionId: item.question?.id,
          category: item.question?.category || 'General',
          categoryLabel: item.question?.categoryLabel || 'General',
          questionText: item.question?.question || 'Interview Question',
          contextRationale: item.question?.contextRationale || 'Interview Practice',
          candidateAnswer: item.answer || '',
          score: item.evaluation?.score || 0,
          categoryScores: item.evaluation?.categoryScores,
          feedback: item.evaluation?.feedback || 'Session recorded successfully.',
          isSimulation: true
        }))
      };

      setCompletionSummary(fallbackSummary);

      try {
        const existing = JSON.parse(localStorage.getItem('talenttrail_interview_history') || '[]');
        const fallbackEntry = {
          id: 'session_' + Date.now(),
          candidateName: candidate?.name || 'Candidate',
          role: sessionConfig?.role || 'Full Stack Developer',
          level: sessionConfig?.level || 'Mid-Level',
          language: activeLang,
          completedAt: new Date().toISOString(),
          averageScore: computedAvg,
          recommendation: fallbackSummary.recommendation,
          totalQuestions: safeHistory.length,
          isSimulation: true,
          terminationStatus,
          terminationReason,
          terminatedAt,
          summary: fallbackSummary
        };
        localStorage.setItem('talenttrail_interview_history', JSON.stringify([fallbackEntry, ...existing]));
      } catch (storageErr) {
        console.warn('History storage note:', storageErr);
      }
    } finally {
      setIsFinishing(false);
      isFinishingRef.current = false;
    }
  }, [sessionHistory, candidate, sessionConfig, activeLang, stopRecognitionSafely, stopTTS, activeMediaStream]);

  // 9b. Strict 30-Second Face Absence Automatic Save and Termination
  const handleTerminateDueToFaceAbsence = useCallback(async (absenceDetails = null) => {
    if (isTerminatedRef.current || isFinishingRef.current || interviewStateRef.current === 'COMPLETED') {
      return;
    }
    isTerminatedRef.current = true;
    console.warn('Strict 30-Second Face Absence Threshold Reached. Terminating and saving interview.');

    if (faceMonitorIntervalRef.current) {
      clearInterval(faceMonitorIntervalRef.current);
      faceMonitorIntervalRef.current = null;
    }

    // Stop audio capture & synthesis immediately
    stopRecognitionSafely();
    stopTTS();

    // Preserve in-progress partial spoken or typed answer
    const currentFinal = finalTranscriptRef.current ? finalTranscriptRef.current.trim() : '';
    const currentInterim = interimTranscriptRef.current ? interimTranscriptRef.current.trim() : '';
    let inProgressAnswer = currentFinal;
    if (currentInterim && !currentFinal.includes(currentInterim)) {
      inProgressAnswer = currentFinal ? `${currentFinal} ${currentInterim}` : currentInterim;
    }
    inProgressAnswer = inProgressAnswer.trim();

    const finalHistory = [...sessionHistory];
    if (currentQuestion && inProgressAnswer) {
      const alreadySaved = finalHistory.some(item => item.question?.id === currentQuestion.id);
      if (!alreadySaved) {
        finalHistory.push({
          question: currentQuestion,
          answer: inProgressAnswer,
          evaluation: {
            score: 50,
            feedback: 'Session terminated automatically due to camera face absence. Partial response recorded.',
            categoryScores: {
              technical: 50,
              project: 50,
              problemSolving: 50,
              hr: 50
            }
          },
          timestamp: new Date().toISOString()
        });
      }
    }

    const terminatedAt = new Date().toISOString();
    const terminationReason = absenceDetails?.reason || 'Face not detected in camera feed for 30 consecutive seconds';

    // Store termination metadata to render SecurityTerminationView
    setSecurityTerminationData({
      candidate,
      sessionConfig,
      sessionHistory: finalHistory,
      terminatedAt,
      terminationReason,
      securityEvents: absenceDetails?.securityEvent
        ? [...securityEventLog, absenceDetails.securityEvent]
        : securityEventLog
    });

    // Atomically complete session and save recoverable history
    await handleFinishInterview(finalHistory, {
      terminationStatus: 'terminated_face_absent',
      terminationReason,
      terminatedAt
    });
  }, [sessionHistory, currentQuestion, stopRecognitionSafely, stopTTS, handleFinishInterview, candidate, sessionConfig, securityEventLog]);

  useEffect(() => {
    handleTerminateDueToFaceAbsenceRef.current = handleTerminateDueToFaceAbsence;
  }, [handleTerminateDueToFaceAbsence]);

  // 9c. Note: Real-time detection loop is now encapsulated in the dedicated useFacePresenceMonitor hook

  // 10. Finalize Answer and Advance Turn (Strict single-execution guard & 10s rule enforcement)
  const handleFinalizeAnswerAndAdvance = useCallback(async () => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    stopRecognitionSafely();
    stopTTS();

    // Flush any pending interim speech into finalized answer
    const currentFinal = finalTranscriptRef.current ? finalTranscriptRef.current.trim() : '';
    const currentInterim = interimTranscriptRef.current ? interimTranscriptRef.current.trim() : '';
    let finalAnswer = currentFinal;
    if (currentInterim && !currentFinal.includes(currentInterim)) {
      finalAnswer = currentFinal ? `${currentFinal} ${currentInterim}` : currentInterim;
    }
    finalAnswer = finalAnswer.trim();

    // Prevent submitting empty answer
    if (!finalAnswer) {
      isTransitioningRef.current = false;
      setGeneralError(t('room.emptyWarning', {}, activeLang) || 'Please speak or type a response before proceeding.');
      setInterviewState('LISTENING');
      interviewStateRef.current = 'LISTENING';
      setAvatarVisualState('listening');
      setAvatarHeadGesture('idle');
      setAvatarHandGesture('idle');
      if (!isMicMutedRef.current && startRecognitionRef.current) {
        startRecognitionRef.current();
      }
      return;
    }

    setGeneralError('');
    // Acknowledging avatar state: brief friendly nod before internal processing
    setAvatarVisualState('acknowledging');
    setAvatarHeadGesture('nod');
    setAvatarHandGesture('idle');

    setTimeout(async () => {
      setInterviewState('PROCESSING_ANSWER');
      interviewStateRef.current = 'PROCESSING_ANSWER';
      setAvatarVisualState('thinking');
      setAvatarHeadGesture('tilt');
      setAvatarHandGesture('idle');

      try {
        const res = await fetch('/api/interview/adaptive-turn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: currentQuestion,
            answer: finalAnswer,
            candidate,
            turnIndex: currentTurnIndex,
            totalTurns: totalTurnsConfigured,
            sessionHistory,
            role: sessionConfig?.role,
            level: sessionConfig?.level,
            language: activeLang
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error?.message || 'Failed to process answer turn.');
        }

        const turnData = await res.json();

        // Record session turn internally with question and candidate answer
        const updatedHistory = [
          ...sessionHistory,
          {
            question: currentQuestion,
            answer: finalAnswer,
            evaluation: turnData.evaluation // Stored internally for final report only
          }
        ];
        setSessionHistory(updatedHistory);

        // Score-driven reaction: if score >= 70, show affirming approved state with thumbs up!
        const evalScore = Number(turnData.evaluation?.score) || 0;
        const isStrongAnswer = evalScore >= 70;

        if (isStrongAnswer) {
          setAvatarVisualState('approved');
          setAvatarHeadGesture('nod');
          setAvatarHandGesture('thumbsUp');
        }

        const advanceDelay = isStrongAnswer ? 1100 : 300;

        setTimeout(async () => {
          // Check if final turn
          if (turnData.isFinalTurn || !turnData.nextQuestion || currentTurnIndex >= totalTurnsConfigured) {
            await handleFinishInterview(updatedHistory);
          } else {
            // Verify next question is not duplicate of any previously asked question ID
            const candidateNextQ = turnData.nextQuestion;
            if (askedQuestionIdsRef.current.has(candidateNextQ.id)) {
              candidateNextQ.id = `q_adaptive_${Date.now()}`;
            }
            askedQuestionIdsRef.current.add(candidateNextQ.id);

            // Proceed to next question turn
            setCurrentTurnIndex(prev => prev + 1);
            setCurrentQuestion(candidateNextQ);

            // Reset transcript accumulator and silence detector for new question
            finalTranscriptRef.current = '';
            interimTranscriptRef.current = '';
            setFinalTranscript('');
            setInterimTranscript('');
            setSpeechDetected(false);
            speechDetectedRef.current = false;
            isTypingRef.current = false;
            clearSilenceTimers();
            isTransitioningRef.current = false;

            // Transition to asking question state and speak the next question
            const questionText = getLocalizedQuestionText(candidateNextQ);
            speakText(questionText, () => {
              setInterviewState('LISTENING');
              interviewStateRef.current = 'LISTENING';
              setAvatarVisualState('listening');
              setAvatarHeadGesture('idle');
              setAvatarHandGesture('idle');
              if (!isMicMutedRef.current && startRecognitionRef.current) {
                startRecognitionRef.current();
              }
            });
          }
        }, advanceDelay);
      } catch (err) {
        console.error('Turn processing error:', err);
        setGeneralError('Error evaluating turn: ' + err.message + '. Retaining transcript for retry.');
        setInterviewState('LISTENING');
        interviewStateRef.current = 'LISTENING';
        setAvatarVisualState('listening');
        setAvatarHeadGesture('idle');
        setAvatarHandGesture('idle');
        isTransitioningRef.current = false;
      }
    }, 700); // Friendly acknowledging gesture before thinking
  }, [currentQuestion, currentTurnIndex, sessionHistory, candidate, sessionConfig, activeLang, totalTurnsConfigured, getLocalizedQuestionText, speakText, handleFinishInterview, stopRecognitionSafely, stopTTS, clearSilenceTimers]);

  useEffect(() => {
    handleFinalizeRef.current = handleFinalizeAnswerAndAdvance;
  }, [handleFinalizeAnswerAndAdvance]);

  // 11. Managed Silence Countdown Detector (Enforced 10-second continuous silence after detected candidate speech)
  const resetSilenceCountdown = useCallback(() => {
    if (isMicMutedRef.current || isPausedRef.current || interviewStateRef.current !== 'LISTENING') return;
    if (!speechDetectedRef.current) return; // Strict: countdown begins ONLY after candidate has spoken

    // Reset silence target timestamp to 10 seconds from right now
    silenceEndTimeRef.current = Date.now() + (silenceThresholdSec * 1000);
    setSilenceRemainingSec(silenceThresholdSec);
    setSilenceProgress(0);

    // If countdown interval is not already ticking, start it
    if (!silenceIntervalRef.current) {
      silenceIntervalRef.current = setInterval(() => {
        // If candidate is actively typing in the textarea, pause the silence countdown to prevent premature submission
        if (isTypingRef.current) {
          silenceEndTimeRef.current = Date.now() + (silenceThresholdSec * 1000);
          setSilenceRemainingSec(silenceThresholdSec);
          setSilenceProgress(0);
          return;
        }

        const remainingMs = silenceEndTimeRef.current - Date.now();
        if (remainingMs <= 0) {
          clearSilenceTimers();
          if (handleFinalizeRef.current) {
            handleFinalizeRef.current();
          }
        } else {
          const remainingSec = Math.max(0, remainingMs / 1000);
          setSilenceRemainingSec(Math.round(remainingSec * 10) / 10);
          const elapsedMs = (silenceThresholdSec * 1000) - remainingMs;
          const pct = Math.min(100, Math.max(0, Math.round((elapsedMs / (silenceThresholdSec * 1000)) * 100)));
          setSilenceProgress(pct);
        }
      }, 100);
    }
  }, [silenceThresholdSec, clearSilenceTimers]);

  // 12. Start Speech Recognition with Root-Cause Segregation of Final vs. Interim Text
  const startRecognition = useCallback(() => {
    if (!sttSupported || isPausedRef.current || isMicMutedRef.current || interviewStateRef.current === 'COMPLETED') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSttSupported(false);
      return;
    }

    if (isStartingRecognitionRef.current) return;
    isStartingRecognitionRef.current = true;

    stopRecognitionSafely();

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = activeLang;

      recognition.onstart = () => {
        isStartingRecognitionRef.current = false;
        setIsAudioCapturing(true);
        setAvatarVisualState('listening');
        setAvatarHeadGesture('idle');
        setAvatarHandGesture('idle');
        setMicPermissionDenied(false);
        restartAttemptsRef.current = 0;
      };

      recognition.onaudiostart = () => {
        setIsAudioCapturing(true);
      };

      recognition.onaudioend = () => {
        setIsAudioCapturing(false);
        setIsSpeakingNow(false);
      };

      recognition.onspeechstart = () => {
        setIsSpeakingNow(true);
        isTypingRef.current = false;
        if (!speechDetectedRef.current) {
          setSpeechDetected(true);
          speechDetectedRef.current = true;
        }
        resetSilenceCountdown();
      };

      recognition.onspeechend = () => {
        setIsSpeakingNow(false);
      };

      recognition.onresult = (event) => {
        isTypingRef.current = false; // Candidate is speaking via microphone
        setIsSpeakingNow(true);
        let interimText = '';
        let finalizedSegment = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          const textPiece = res[0]?.transcript || '';
          if (res.isFinal) {
            finalizedSegment += textPiece + ' ';
          } else {
            interimText += textPiece;
          }
        }

        // 1. Accumulate finalized segment strictly once with robust duplicate prevention
        if (finalizedSegment.trim()) {
          const cleanPiece = finalizedSegment.trim();
          const currentBase = finalTranscriptRef.current ? finalTranscriptRef.current.trim() : '';
          
          if (!currentBase.endsWith(cleanPiece)) {
            const newAccumulated = currentBase
              ? `${currentBase} ${cleanPiece}`
              : cleanPiece;
            finalTranscriptRef.current = newAccumulated;
            setFinalTranscript(newAccumulated);
          }
        }

        // 2. Keep interim text separate in real-time buffer
        interimTranscriptRef.current = interimText.trim();
        setInterimTranscript(interimText.trim());

        // 3. Mark speech detected once candidate starts speaking
        if (!speechDetectedRef.current && (finalTranscriptRef.current.trim() || interimText.trim())) {
          setSpeechDetected(true);
          speechDetectedRef.current = true;
        }

        // 4. Reset 10-second silence countdown on every speech recognition event
        if (speechDetectedRef.current && !isMicMutedRef.current) {
          resetSilenceCountdown();
        }
      };

      recognition.onerror = (e) => {
        isStartingRecognitionRef.current = false;
        if (e.error === 'no-speech') {
          // Normal silence pause in browser; do not treat as fatal error
          return;
        }
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          setMicPermissionDenied(true);
          setGeneralError('Microphone permission is blocked. You can type your response in the editable text box below.');
          clearSilenceTimers();
          return;
        }
        if (e.error === 'language-not-supported') {
          setSttSupported(false);
          setGeneralError(t('room.sttUnsupportedLocale', { lang: activeLang }, activeLang));
          clearSilenceTimers();
          return;
        }
        console.warn('SpeechRecognition note:', e.error);
      };

      recognition.onend = () => {
        isStartingRecognitionRef.current = false;
        setIsAudioCapturing(false);
        setIsSpeakingNow(false);
        // Safe auto-recovery: If interview is still listening and mic is not muted/paused/transitioning, restart
        if (interviewStateRef.current === 'LISTENING' && !isPausedRef.current && !isMicMutedRef.current && !isTransitioningRef.current) {
          if (restartAttemptsRef.current < 25) {
            restartAttemptsRef.current += 1;
            if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
            restartTimeoutRef.current = setTimeout(() => {
              if (interviewStateRef.current === 'LISTENING' && !isPausedRef.current && !isMicMutedRef.current && !isTransitioningRef.current) {
                if (startRecognitionRef.current) startRecognitionRef.current();
              }
            }, 120);
          }
        }
      };

      recognition.start();
    } catch (err) {
      isStartingRecognitionRef.current = false;
      setIsAudioCapturing(false);
      setIsSpeakingNow(false);
      console.warn('SpeechRecognition activation note:', err);
    }
  }, [sttSupported, activeLang, stopRecognitionSafely, resetSilenceCountdown, clearSilenceTimers]);

  useEffect(() => {
    startRecognitionRef.current = startRecognition;
  }, [startRecognition]);

  // 13. Dedicated Microphone Toggle Helper (Mute / Unmute while keeping interview active)
  const handleToggleMic = () => {
    if (isMicMuted) {
      setIsMicMuted(false);
      isMicMutedRef.current = false;
      if (interviewStateRef.current === 'LISTENING') {
        startRecognition();
      }
    } else {
      setIsMicMuted(true);
      isMicMutedRef.current = true;
      stopRecognitionSafely();
      clearSilenceTimers();
    }
  };

  // 14. Start Autonomous Interview Session (From READY state)
  const handleStartAutonomousInterview = () => {
    if (!isDeviceValidated) {
      setCameraDeviceError('Camera access is compulsory before starting the interview. Please allow camera and microphone access.');
      return;
    }

    if (!currentQuestion) {
      setGeneralError('Preparing your personalized interview questions. Please wait a moment...');
      return;
    }

    setGeneralError('');
    setAudioPlayBlocked(false);

    // Explicitly prime and resume browser speech synthesis on user interaction
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.resume();
      } catch {
        // Ignored
      }
    }

    setInterviewState('ASKING_QUESTION');
    interviewStateRef.current = 'ASKING_QUESTION';
    setAvatarVisualState('speaking');
    setAvatarHeadGesture('idle');
    setAvatarHandGesture('explain');

    // Welcome greeting localized across all 6 languages (Ismav)
    const welcome = getWelcomeGreeting(activeLang, candidate.name);
    const qText = getLocalizedQuestionText(currentQuestion);
    const speechScript = `${welcome} ${qText}`;

    speakText(speechScript, () => {
      setInterviewState('LISTENING');
      interviewStateRef.current = 'LISTENING';
      setAvatarVisualState('listening');
      setAvatarHeadGesture('idle');
      setAvatarHandGesture('idle');
      if (!isMicMutedRef.current && startRecognitionRef.current) {
        startRecognitionRef.current();
      }
    });
  };

  // 15. Replay Current Question Safely
  const handleReplayQuestion = () => {
    stopRecognitionSafely();
    setAudioPlayBlocked(false);
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.resume();
      } catch {}
    }

    setInterviewState('ASKING_QUESTION');
    interviewStateRef.current = 'ASKING_QUESTION';
    setAvatarVisualState('speaking');
    setAvatarHeadGesture('idle');
    setAvatarHandGesture('explain');

    const qText = getLocalizedQuestionText(currentQuestion);
    speakText(qText, () => {
      setInterviewState('LISTENING');
      interviewStateRef.current = 'LISTENING';
      setAvatarVisualState('listening');
      setAvatarHeadGesture('idle');
      setAvatarHandGesture('idle');
      if (!isMicMutedRef.current && startRecognitionRef.current) {
        startRecognitionRef.current();
      }
    });
  };

  // 15b. Explicit Audio Retry Handler (If browser blocked autoplay or first question remained silent)
  const handleRetryQuestionAudio = () => {
    setAudioPlayBlocked(false);
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.resume();
      } catch {}
    }

    setInterviewState('ASKING_QUESTION');
    interviewStateRef.current = 'ASKING_QUESTION';
    setAvatarVisualState('speaking');
    setAvatarHeadGesture('idle');
    setAvatarHandGesture('explain');

    const welcome = currentTurnIndex === 1 ? getWelcomeGreeting(activeLang, candidate.name) : '';
    const qText = getLocalizedQuestionText(currentQuestion);
    const speechScript = `${welcome}${qText}`;

    speakText(speechScript, () => {
      setInterviewState('LISTENING');
      interviewStateRef.current = 'LISTENING';
      setAvatarVisualState('listening');
      setAvatarHeadGesture('idle');
      setAvatarHandGesture('idle');
      if (!isMicMutedRef.current && startRecognitionRef.current) {
        startRecognitionRef.current();
      }
    });
  };

  // 16. Toggle Pause / Resume
  const handleTogglePause = () => {
    if (isPaused) {
      setIsPaused(false);
      isPausedRef.current = false;
      setInterviewState('LISTENING');
      interviewStateRef.current = 'LISTENING';
      setAvatarVisualState('listening');
      setAvatarHeadGesture('idle');
      setAvatarHandGesture('idle');
      if (!isMicMutedRef.current && startRecognitionRef.current) {
        startRecognitionRef.current();
      }
    } else {
      setIsPaused(true);
      isPausedRef.current = true;
      setAvatarVisualState('idle');
      setAvatarHeadGesture('idle');
      setAvatarHandGesture('idle');
      stopRecognitionSafely();
      stopTTS();
    }
  };

  // 17. Safe Exit to Configuration with complete MediaStream track shutdown
  const handleExitToConfig = useCallback(() => {
    stopRecognitionSafely();
    stopTTS();
    if (faceMonitorIntervalRef.current) {
      clearInterval(faceMonitorIntervalRef.current);
      faceMonitorIntervalRef.current = null;
    }
    stopAllMediaStreams();
    mediaStreamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (onBackToConfig) onBackToConfig();
  }, [stopRecognitionSafely, stopTTS, onBackToConfig]);

  // Clean up all resources on unmount
  useEffect(() => {
    return () => {
      stopRecognitionSafely();
      stopTTS();
      if (faceMonitorIntervalRef.current) {
        clearInterval(faceMonitorIntervalRef.current);
        faceMonitorIntervalRef.current = null;
      }
      stopAllMediaStreams();
      mediaStreamRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [stopRecognitionSafely, stopTTS]);

  // Ensure camera stops immediately when interview state transitions to COMPLETED
  useEffect(() => {
    if (interviewState === 'COMPLETED') {
      if (faceMonitorIntervalRef.current) {
        clearInterval(faceMonitorIntervalRef.current);
        faceMonitorIntervalRef.current = null;
      }
      stopAllMediaStreams();
      mediaStreamRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  }, [interviewState]);

  // Combined real-time transcript for candidate textarea display
  const combinedTranscriptDisplay = finalTranscript + (interimTranscript ? (finalTranscript ? ' ' : '') + interimTranscript : '');

  // If terminated due to Anti-Malpractice Security, render dedicated SecurityTerminationView
  if (interviewState === 'COMPLETED' && (securityTerminationData || completionSummary?.terminationStatus === 'terminated_face_absent')) {
    return (
      <div className="container" style={{ padding: '2.5rem var(--space-6)', maxWidth: '900px' }}>
        <SecurityTerminationView
          candidate={candidate}
          sessionConfig={sessionConfig}
          sessionHistory={sessionHistory}
          terminatedAt={securityTerminationData?.terminatedAt || completionSummary?.terminatedAt || null}
          terminationReason={securityTerminationData?.terminationReason || completionSummary?.terminationReason}
          securityEvents={securityTerminationData?.securityEvents || securityEventLog}
          currentLanguage={activeLang}
          onExitToDashboard={onBackToDashboard || handleExitToConfig}
        />
      </div>
    );
  }

  // If completed, render the rich completion report
  if (interviewState === 'COMPLETED' && completionSummary) {
    return (
      <div className="container" style={{ padding: '2.5rem var(--space-6)', maxWidth: '1000px' }}>
        <InterviewCompletionReport
          summary={completionSummary}
          currentLanguage={activeLang}
          onRestart={onBackToConfig}
          onViewHistory={onViewHistory}
        />
      </div>
    );
  }

  // While compiling final evaluation report
  if (isFinishing || (interviewState === 'COMPLETED' && !completionSummary)) {
    return (
      <div className="container" style={{
        padding: '5rem 2rem',
        maxWidth: '680px',
        margin: '0 auto',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '1.5rem'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: '#EEF2FF',
          border: '2px solid #C7D2FE',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(99, 102, 241, 0.2)'
        }}>
          <div style={{
            width: '30px',
            height: '30px',
            border: '3px solid #E0E7FF',
            borderTopColor: '#6366F1',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1E1B4B', marginBottom: '0.5rem' }}>
            Compiling Final Interview Assessment...
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#6B7280', maxWidth: '460px', lineHeight: 1.6, margin: '0 auto' }}>
            Ismav is aggregating your question transcripts, category rubric scores, and evidence-based recommendation report.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem var(--space-6)', maxWidth: '1060px', position: 'relative' }}>
      
      {/* Window Focus Warning */}
      {focusLostWarning && (
        <div style={{
          position: 'sticky',
          top: '1rem',
          zIndex: 100,
          marginBottom: '1rem',
          padding: '0.85rem 1.25rem',
          backgroundColor: '#FFFBEB',
          border: '1.5px solid #F59E0B',
          borderRadius: 'var(--radius-lg)',
          color: '#92400E',
          fontSize: '0.82rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: 'var(--shadow-md)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <AlertTriangle size={18} color="#D97706" />
            <div>
              <strong>Interview Window Unfocused:</strong> Please return to this browser tab to maintain voice conversation continuity.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFocusLostWarning(false)}
            style={{ fontSize: '0.75rem', color: '#92400E', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 30-Second Face Absence Countdown Warning Banner */}
      {faceAbsenceWarning && interviewState !== 'COMPLETED' && (
        <div style={{
          position: 'sticky',
          top: '1rem',
          zIndex: 110,
          marginBottom: '1rem',
          padding: '1rem 1.25rem',
          backgroundColor: '#FEF2F2',
          border: '2px solid #EF4444',
          borderRadius: 'var(--radius-lg)',
          color: '#991B1B',
          fontSize: '0.86rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          boxShadow: '0 8px 24px rgba(239, 68, 68, 0.25)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShieldAlert size={26} color="#DC2626" />
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.96rem' }}>
                {t('security.faceAbsentBannerTitle', null, activeLang) || 'Face Not Detected — Automatic Save & Exit Countdown'}
              </div>
              <div style={{ fontSize: '0.82rem', marginTop: '0.15rem', color: '#7F1D1D' }}>
                {t('security.faceAbsentBannerDesc', null, activeLang) || 'Please return directly in front of the camera. Camera visibility is compulsory throughout the interview. If your face remains undetected for 30 consecutive seconds, your session will be automatically saved and ended.'}
              </div>
            </div>
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: '#DC2626',
            color: '#FFFFFF',
            padding: '0.5rem 0.9rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: 800,
            minWidth: '90px',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '1.35rem', lineHeight: 1 }}>{absenceSecondsRemaining}s</span>
            <span style={{ fontSize: '0.62rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {t('security.secondsRemaining', null, activeLang) || 'remaining'}
            </span>
          </div>
        </div>
      )}

      {/* Top Session Status Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem',
        padding: '0.85rem 1.25rem',
        backgroundColor: '#FFFFFF',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={handleExitToConfig}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.82rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              border: 'none',
              background: 'none'
            }}
          >
            <ArrowLeft size={14} /> Exit Setup
          </button>
          <span style={{ color: 'var(--border-strong)' }}>|</span>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {sessionConfig?.role || 'Full Stack Developer'}
          </span>
          <span className="badge badge-lavender" style={{ fontSize: '0.72rem' }}>
            Turn {currentTurnIndex} of {totalTurnsConfigured}
          </span>
          <span
            className={isSimulation ? 'badge badge-amber' : 'badge badge-emerald'}
            style={{ fontSize: '0.72rem' }}
            title={isSimulation
              ? 'Simulation Mode: Deterministic rubric rule engine (No external API calls)'
              : `Connected to Google Gemini (${serverStatus?.activeModel || serverStatus?.configuredModel || 'gemini-2.0-flash'})`}
          >
            {isSimulation ? 'Simulation Mode' : `Gemini AI (${serverStatus?.activeModel || serverStatus?.configuredModel || '2.0-flash'})`}
          </span>
        </div>

        {/* Action Controls: Pause / Camera / End */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {interviewState !== 'READY' && (
            <>
              {/* Pause / Resume */}
              <button
                type="button"
                onClick={handleTogglePause}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: isPaused ? '#FEF3C7' : '#FFFFFF',
                  color: isPaused ? '#92400E' : 'var(--text-primary)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {isPaused ? <Play size={13} /> : <Pause size={13} />}
                <span>{isPaused ? t('room.resumeBtn', {}, activeLang) : t('room.pauseBtn', {}, activeLang)}</span>
              </button>

              {/* Camera Self-View Toggle */}
              <button
                type="button"
                onClick={() => setCameraActive(!cameraActive)}
                title={cameraActive ? 'Hide Camera Self-View' : 'Show Camera Self-View'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: cameraActive ? 'var(--lavender-50)' : '#FFFFFF',
                  color: cameraActive ? 'var(--lavender-700)' : 'var(--text-secondary)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {cameraActive ? <Camera size={13} /> : <CameraOff size={13} />}
                <span>{cameraActive ? 'Camera On' : 'Camera Off'}</span>
              </button>

              {/* End Interview Early */}
              <button
                type="button"
                onClick={() => setShowExitConfirm(true)}
                disabled={isFinishing}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #FECACA',
                  backgroundColor: '#FEF2F2',
                  color: '#DC2626',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Square size={12} fill="#DC2626" />
                <span>{t('room.endBtn', {}, activeLang)}</span>
              </button>

              {/* Security Audit Log Drawer Toggle */}
              <button
                type="button"
                id="security-log-toggle-btn"
                onClick={() => setShowSecurityLogModal(prev => !prev)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: faceAbsenceWarning ? '1px solid #FCA5A5' : '1px solid var(--border-subtle)',
                  backgroundColor: faceAbsenceWarning ? '#FEF2F2' : '#FFFFFF',
                  color: faceAbsenceWarning ? '#DC2626' : 'var(--text-secondary)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                title="View Anti-Malpractice Security Audit Log"
              >
                <Shield size={13} color={faceAbsenceWarning ? '#DC2626' : 'var(--lavender-600)'} />
                <span>Security ({securityEventLog.length})</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Real-time Security Event Audit Log Drawer */}
      {showSecurityLogModal && (
        <div style={{
          marginBottom: '1.25rem',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 'var(--radius-lg)',
          padding: '1rem 1.25rem',
          boxShadow: 'var(--shadow-md)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.75rem',
            paddingBottom: '0.5rem',
            borderBottom: '1px solid #F1F5F9'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.86rem', color: '#1E293B' }}>
              <ShieldAlert size={16} color="#DC2626" />
              <span>{t('security.eventLogTitle', null, activeLang) || 'Security Event Log'}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowSecurityLogModal(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748B',
                fontSize: '0.78rem',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              ✕ Close
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '160px', overflowY: 'auto' }}>
            {securityEventLog.map((evt, idx) => (
              <div key={evt.id || idx} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                fontSize: '0.78rem',
                padding: '0.4rem 0.6rem',
                borderRadius: '6px',
                backgroundColor: evt.level === 'critical' ? '#FEF2F2' : evt.level === 'warning' ? '#FFFDF5' : '#F8FAFC',
                border: `1px solid ${evt.level === 'critical' ? '#FECACA' : evt.level === 'warning' ? '#FEF08A' : '#E2E8F0'}`
              }}>
                <span style={{ fontFamily: 'monospace', color: '#64748B', fontSize: '0.72rem' }}>{evt.displayTime}</span>
                <span style={{
                  fontWeight: 700,
                  fontSize: '0.66rem',
                  textTransform: 'uppercase',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '3px',
                  backgroundColor: evt.level === 'critical' ? '#FEE2E2' : evt.level === 'warning' ? '#FEF3C7' : '#EEF2FF',
                  color: evt.level === 'critical' ? '#991B1B' : evt.level === 'warning' ? '#92400E' : '#3730A3'
                }}>
                  {evt.type}
                </span>
                <span style={{ color: '#1F2937', flex: 1 }}>{evt.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Interactive Room Box */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        backgroundColor: '#FFFFFF',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        padding: '1.25rem 1.5rem',
        boxShadow: 'var(--shadow-lg)'
      }}>

        {/* Turn Progress Tracker */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{
              backgroundColor: 'var(--lavender-600)',
              color: '#FFFFFF',
              fontSize: '0.78rem',
              fontWeight: 700,
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px'
            }}>
              {t('room.questionBadge', { current: currentTurnIndex, total: totalTurnsConfigured }, activeLang)}
            </span>
            <span style={{
              backgroundColor: 'var(--lavender-50)',
              color: 'var(--lavender-800)',
              border: '1px solid var(--lavender-200)',
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '0.2rem 0.65rem',
              borderRadius: '9999px'
            }}>
              {currentQuestion?.categoryLabel || currentQuestion?.category || 'Technical Assessment'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              fontSize: '0.75rem',
              color: 'var(--lavender-700)',
              backgroundColor: 'var(--lavender-50)',
              padding: '0.2rem 0.65rem',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600
            }}>
              {currentQuestion?.contextRationale || 'Resume-Grounded Conversation'}
            </span>
            <span style={{
              fontSize: '0.72rem',
              color: currentQuestion?.isSimulation ? '#B45309' : '#059669',
              backgroundColor: currentQuestion?.isSimulation ? '#FEF3C7' : '#D1FAE5',
              padding: '0.2rem 0.55rem',
              borderRadius: '9999px',
              fontWeight: 600
            }}>
              {currentQuestion?.isSimulation ? 'Simulation Mode' : 'Gemini AI'}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{
          height: '5px',
          backgroundColor: 'var(--lavender-100)',
          borderRadius: '9999px',
          overflow: 'hidden',
          marginTop: '-0.75rem'
        }}>
          <div style={{
            height: '100%',
            width: `${(currentTurnIndex / totalTurnsConfigured) * 100}%`,
            backgroundColor: 'var(--lavender-500)',
            borderRadius: '9999px',
            transition: 'width 0.4s ease'
          }} />
        </div>

        {/* READY STATE: Introductory Screen */}
        {interviewState === 'READY' && (
          <div style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.5rem',
            backgroundColor: 'var(--bg-canvas)',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--lavender-300)'
          }}>
            <AvatarInterviewer
              state="idle"
              size={220}
              name="Ismav"
              role="TalentTrail AI Interviewer"
              language={activeLang}
              isSpeaking={false}
              handGesture="wave"
              showVisualizer={true}
            />
            <div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                {t('room.startPrompt', {}, activeLang)}
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '580px', margin: '0 auto', lineHeight: 1.6 }}>
                {t('room.startPromptDesc', {}, activeLang)}
              </p>
            </div>

            {(!isDeviceValidated || cameraDeviceError) ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                backgroundColor: '#FEF2F2',
                border: '1.5px solid #EF4444',
                padding: '0.85rem 1.25rem',
                borderRadius: 'var(--radius-lg)',
                color: '#991B1B',
                fontSize: '0.84rem',
                maxWidth: '540px',
                textAlign: 'left'
              }}>
                <ShieldAlert size={22} color="#DC2626" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <strong>Camera Access Compulsory:</strong> {cameraDeviceError || 'Camera permissions are required before the interview can begin.'}
                </div>
                <button
                  type="button"
                  onClick={handleRequestCameraAccess}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', whiteSpace: 'nowrap' }}
                >
                  Enable Camera
                </button>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.78rem',
                color: '#059669',
                backgroundColor: '#ECFDF5',
                border: '1px solid #A7F3D0',
                padding: '0.4rem 0.85rem',
                borderRadius: '9999px',
                fontWeight: 600
              }}>
                <Shield size={14} color="#059669" />
                <span>Live Camera & Microphone Connected</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleStartAutonomousInterview}
              disabled={!currentQuestion || !isDeviceValidated}
              className="btn btn-primary"
              style={{
                padding: '0.85rem 2.25rem',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                opacity: (!currentQuestion || !isDeviceValidated) ? 0.7 : 1,
                cursor: (!currentQuestion || !isDeviceValidated) ? 'not-allowed' : 'pointer'
              }}
            >
              <span>
                {!isDeviceValidated 
                  ? 'Camera Access Required' 
                  : (!currentQuestion ? 'Preparing First Question...' : t('room.startBtn', {}, activeLang))}
              </span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* ACTIVE INTERVIEW ROOM (Asking, Listening, Processing) — SPLIT 2-COLUMN NO-SCROLL LAYOUT */}
        {interviewState !== 'READY' && (
          <div 
            className="interview-layout-2col"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(310px, 360px) 1fr',
              gap: '1.15rem',
              alignItems: 'start'
            }}
          >
            {/* ======================================================== */}
            {/* LEFT COLUMN: ISMAV ROBOT (TOP) + CANDIDATE CAMERA (BOTTOM) */}
            {/* ======================================================== */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              
              {/* Top Section — Ismav AI Interviewer */}
              <div style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1.5px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '0.85rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'relative',
                boxShadow: 'var(--shadow-sm)',
                minHeight: '215px'
              }}>
                {/* Stage Header Tag */}
                <div style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.35rem',
                  paddingBottom: '0.35rem',
                  borderBottom: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: interviewState === 'ASKING_QUESTION' ? '#8B5CF6' : '#10B981',
                      boxShadow: '0 0 6px rgba(139, 92, 246, 0.5)'
                    }} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-heading)', letterSpacing: '0.02em' }}>
                      ISMAV
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      • AI Interviewer
                    </span>
                  </div>
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '9999px',
                    backgroundColor: interviewState === 'ASKING_QUESTION' 
                      ? 'var(--lavender-100)' 
                      : interviewState === 'LISTENING' 
                      ? '#ECFDF5' 
                      : 'var(--bg-canvas)',
                    color: interviewState === 'ASKING_QUESTION' 
                      ? 'var(--lavender-800)' 
                      : interviewState === 'LISTENING' 
                      ? '#065F46' 
                      : 'var(--text-secondary)',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    {interviewState === 'ASKING_QUESTION' ? 'Speaking' : interviewState === 'LISTENING' ? 'Listening' : interviewState === 'PROCESSING_ANSWER' ? 'Evaluating' : 'Ready'}
                  </span>
                </div>

                {/* Ismav SVG Avatar (Scaled for clean split layout) */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, padding: '0.2rem 0' }}>
                  <AvatarInterviewer
                    state={avatarVisualState}
                    size={155}
                    name="Ismav"
                    role="TalentTrail AI Interviewer"
                    language={activeLang}
                    headGesture={avatarHeadGesture}
                    handGesture={avatarHandGesture}
                    isSpeaking={interviewState === 'ASKING_QUESTION'}
                    showVisualizer={true}
                  />
                </div>

                {/* Footnote status */}
                <div style={{
                  fontSize: '0.70rem',
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                  width: '100%',
                  paddingTop: '0.3rem',
                  borderTop: '1px dashed var(--border-subtle)'
                }}>
                  {interviewState === 'ASKING_QUESTION' ? 'Ismav is presenting question...' : interviewState === 'LISTENING' ? 'Ismav is attentively listening to your answer' : 'Analyzing your response...'}
                </div>
              </div>

              {/* Bottom Section — Candidate Live Camera Preview */}
              <div style={{
                backgroundColor: '#0F172A',
                border: '1.5px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                boxShadow: 'var(--shadow-sm)',
                minHeight: '220px'
              }}>
                {/* Camera Top Bar */}
                <div style={{
                  padding: '0.35rem 0.75rem',
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  zIndex: 2
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: cameraActive ? '#10B981' : '#EF4444',
                      boxShadow: cameraActive ? '0 0 8px #10B981' : 'none'
                    }} />
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#F8FAFC' }}>
                      YOU
                    </span>
                    <span style={{ fontSize: '0.68rem', color: '#94A3B8' }}>
                      • Candidate Self-View
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      background: faceDetected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.25)',
                      border: `1px solid ${faceDetected ? '#10B981' : '#EF4444'}`,
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.15rem 0.5rem',
                      color: faceDetected ? '#A7F3D0' : '#FECACA',
                      fontSize: '0.68rem',
                      fontWeight: 700
                    }}>
                      <span style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        backgroundColor: faceDetected ? '#10B981' : '#EF4444',
                        boxShadow: faceDetected ? '0 0 6px #10B981' : '0 0 6px #EF4444'
                      }} />
                      <span>{faceDetected ? 'Face Verified' : `Face Absent (${absenceSecondsRemaining}s)`}</span>
                    </div>
                  </div>
                </div>

                {/* Live Video Display Container */}
                <div style={{
                  position: 'relative',
                  height: '170px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#020617',
                  overflow: 'hidden'
                }}>
                  {cameraActive && (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      onCanPlay={(e) => {
                        e.currentTarget.play?.().catch(() => {});
                      }}
                      onLoadedMetadata={(e) => {
                        e.currentTarget.play?.().catch(() => {});
                      }}
                      onClick={(e) => {
                        if (e.currentTarget.paused) {
                          e.currentTarget.play?.().catch(() => {});
                        }
                      }}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transform: 'scaleX(-1)', // Horizontal mirror for natural candidate self-view
                        display: 'block'
                      }}
                    />
                  )}

                  {(!isDeviceValidated || cameraDeviceError) && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: 'rgba(15, 23, 42, 0.92)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '1rem',
                      textAlign: 'center',
                      gap: '0.5rem',
                      zIndex: 3
                    }}>
                      <ShieldAlert size={28} color="#EF4444" />
                      <div style={{ fontSize: '0.78rem', color: '#FECACA', fontWeight: 600, maxWidth: '280px' }}>
                        {cameraDeviceError || 'Camera feed disconnected. Camera presence is compulsory.'}
                      </div>
                      <button
                        type="button"
                        onClick={handleRequestCameraAccess}
                        style={{
                          backgroundColor: '#4F46E5',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: 'var(--radius-md)',
                          padding: '0.35rem 0.85rem',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Retry Camera Access
                      </button>
                    </div>
                  )}

                  {/* On-video Posture Indicator Overlay */}
                  {cameraActive && effectiveCalibration && sessionConfig?.consentGranted !== false && (
                    <div style={{
                      position: 'absolute',
                      bottom: '0.5rem',
                      left: '0.5rem',
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: outOfFrameWarning ? 'rgba(220, 38, 38, 0.85)' : 'rgba(15, 23, 42, 0.75)',
                      backdropFilter: 'blur(4px)',
                      border: `1px solid ${outOfFrameWarning ? '#EF4444' : 'rgba(255, 255, 255, 0.2)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.67rem',
                      color: '#F8FAFC',
                      fontWeight: 600
                    }}>
                      <span style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        backgroundColor: outOfFrameWarning ? '#FCA5A5' : '#34D399'
                      }} />
                      <span>Posture: {postureObservation}</span>
                    </div>
                  )}
                </div>

                {/* Footer disclaimer */}
                <div style={{
                  padding: '0.3rem 0.75rem',
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.64rem',
                  color: '#94A3B8'
                }}>
                  <span>Local confidence preview</span>
                  <span style={{ color: '#64748B' }}>0% scoring impact • Not stored</span>
                </div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* RIGHT COLUMN: QUESTION CARD (TOP) + ANSWER WORKSPACE (BOTTOM) */}
            {/* ======================================================== */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              
              {/* Honest Voice Availability Notification */}
              {voiceUnavailableNotice && (
                <div style={{
                  padding: '0.65rem 0.95rem',
                  backgroundColor: '#FFFBEB',
                  border: '1.5px solid #FDE68A',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  fontSize: '0.78rem',
                  color: '#B45309'
                }}>
                  <Info size={16} color="#D97706" style={{ flexShrink: 0 }} />
                  <span>{t('room.ttsVoiceUnavailable', { lang: activeLang }, activeLang)}</span>
                </div>
              )}

              {/* Dedicated Question Dialogue Card */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                backgroundColor: 'var(--bg-canvas)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.15rem 1.35rem',
                border: '1.5px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    color: 'var(--lavender-800)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}>
                    {t('room.questionBadge', { current: currentTurnIndex, total: totalTurnsConfigured }, activeLang)}
                  </span>
                  <span style={{
                    fontSize: '0.72rem',
                    color: 'var(--text-muted)',
                    backgroundColor: 'var(--bg-surface)',
                    padding: '0.18rem 0.55rem',
                    borderRadius: '9999px',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    {t('room.topicLabel', { topic: currentQuestion?.topic || 'General Competency' }, activeLang)}
                  </span>
                </div>

                <div style={{
                  fontSize: '1.12rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  lineHeight: 1.5
                }}>
                  {getLocalizedQuestionText(currentQuestion)}
                </div>

                {/* Subtitle translation if non-English language active */}
                {activeLang !== 'en-US' && currentQuestion?.question && (
                  <div style={{
                    fontSize: '0.82rem',
                    color: 'var(--text-secondary)',
                    fontStyle: 'italic',
                    borderTop: '1px dashed var(--border-subtle)',
                    paddingTop: '0.35rem'
                  }}>
                    English: {currentQuestion.question}
                  </div>
                )}

                {/* Question Audio Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', paddingTop: '0.15rem' }}>
                  <button
                    type="button"
                    onClick={handleReplayQuestion}
                    disabled={interviewState === 'ASKING_QUESTION'}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.3rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--lavender-300)',
                      backgroundColor: interviewState === 'ASKING_QUESTION' ? 'var(--lavender-500)' : '#FFFFFF',
                      color: interviewState === 'ASKING_QUESTION' ? '#FFFFFF' : 'var(--lavender-700)',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      cursor: interviewState === 'ASKING_QUESTION' ? 'default' : 'pointer'
                    }}
                  >
                    <Volume2 size={13} />
                    <span>{interviewState === 'ASKING_QUESTION' ? t('room.ismavSpeaking', {}, activeLang) : t('room.replayQuestion', {}, activeLang)}</span>
                  </button>

                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    {interviewState === 'ASKING_QUESTION'
                      ? t('room.speakingPrompt', {}, activeLang)
                      : isMicMuted
                      ? t('room.micMutedMode', {}, activeLang)
                      : speechDetected
                      ? t('room.speechDetected', {}, activeLang)
                      : t('room.micListening', {}, activeLang)}
                  </span>
                </div>

                {/* Audio Blocked / Autoplay Restricted Banner */}
                {audioPlayBlocked && (
                  <div style={{
                    padding: '0.65rem 0.95rem',
                    backgroundColor: '#EFF6FF',
                    border: '1.5px solid #93C5FD',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    marginTop: '0.35rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1E40AF', fontSize: '0.8rem' }}>
                      <Volume2 size={15} color="#2563EB" />
                      <span>Audio playback paused or blocked by browser. Click to hear Ismav speak Question {currentTurnIndex}.</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRetryQuestionAudio}
                      className="btn btn-primary"
                      style={{ fontSize: '0.74rem', padding: '0.3rem 0.75rem', whiteSpace: 'nowrap' }}
                    >
                      Play Question Audio
                    </button>
                  </div>
                )}
              </div>

              {/* Candidate Response Workspace & Dynamic Live Transcript Area */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
                backgroundColor: '#FFFFFF',
                border: `1.5px solid ${interviewState === 'LISTENING' ? 'var(--lavender-400)' : 'var(--border-subtle)'}`,
                borderRadius: 'var(--radius-lg)',
                padding: '1.15rem 1.35rem',
                boxShadow: interviewState === 'LISTENING' ? '0 0 0 3px rgba(139, 92, 246, 0.12)' : 'none',
                transition: 'all 0.25s ease'
              }}>
                {/* Live Status Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.65rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                    <div style={{
                      width: '9px',
                      height: '9px',
                      borderRadius: '50%',
                      backgroundColor: interviewState === 'LISTENING' ? '#10B981' : interviewState === 'ASKING_QUESTION' ? 'var(--lavender-500)' : '#8B5CF6',
                      animation: interviewState === 'LISTENING' ? 'avatar-pulse 1.2s infinite' : 'none'
                    }} />
                    <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {interviewState === 'LISTENING'
                        ? t('room.currentTranscript', {}, activeLang)
                        : interviewState === 'ASKING_QUESTION'
                        ? t('room.speakingPrompt', {}, activeLang)
                        : t('room.stateThinking', {}, activeLang)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                    {/* Microphone Toggle Button (Mute / Unmute) */}
                    {interviewState === 'LISTENING' && sttSupported && !micPermissionDenied && (
                      <button
                        type="button"
                        onClick={handleToggleMic}
                        title={isMicMuted ? 'Unmute microphone' : 'Mute microphone to type manually'}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '9999px',
                          border: `1px solid ${isMicMuted ? '#FCA5A5' : '#86EFAC'}`,
                          backgroundColor: isMicMuted ? '#FEF2F2' : '#F0FDF4',
                          color: isMicMuted ? '#DC2626' : '#15803D',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {isMicMuted ? <MicOff size={12} /> : <Mic size={12} />}
                        <span>{isMicMuted ? t('room.micMutedMode', {}, activeLang) : t('room.micActive', {}, activeLang)}</span>
                      </button>
                    )}

                    {/* Mandatory Silence Threshold Countdown Meter */}
                    {interviewState === 'LISTENING' && speechDetected && !isMicMuted && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.55rem',
                        backgroundColor: 'var(--lavender-50)',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '9999px',
                        border: '1px solid var(--lavender-200)'
                      }}>
                        <Clock size={12} color="var(--lavender-600)" />
                        <span style={{ fontSize: '0.72rem', color: 'var(--lavender-900)', fontWeight: 600 }}>
                          {t('room.silenceMeter', { sec: silenceRemainingSec.toFixed(1) }, activeLang)}
                        </span>
                        <div style={{
                          width: '42px',
                          height: '5px',
                          backgroundColor: 'var(--lavender-200)',
                          borderRadius: '9999px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${silenceProgress}%`,
                            height: '100%',
                            backgroundColor: 'var(--lavender-600)',
                            transition: 'width 0.1s linear'
                          }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Transcript Textarea (Live Speech + Typing Fallback) */}
                <div style={{ position: 'relative' }}>
                  <textarea
                    value={combinedTranscriptDisplay}
                    onChange={(e) => {
                      const val = e.target.value;
                      finalTranscriptRef.current = val;
                      interimTranscriptRef.current = '';
                      setFinalTranscript(val);
                      setInterimTranscript('');
                      isTypingRef.current = true;
                      clearSilenceTimers();
                      if (val.trim().length > 0) {
                        setSpeechDetected(true);
                        speechDetectedRef.current = true;
                      }
                    }}
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                        e.preventDefault();
                        handleFinalizeAnswerAndAdvance();
                      }
                    }}
                    rows={4}
                    placeholder={
                      interviewState === 'LISTENING'
                        ? (isMicMuted
                          ? 'Microphone muted. Type your response and press Ctrl+Enter or click Submit Answer...'
                          : (micPermissionDenied ? 'Microphone unavailable. Type your answer here...' : t('room.listeningPrompt', {}, activeLang)))
                        : t('room.speakingPrompt', {}, activeLang)
                    }
                    style={{
                      width: '100%',
                      minHeight: '85px',
                      maxHeight: '140px',
                      padding: '0.75rem 0.9rem',
                      fontSize: '0.92rem',
                      lineHeight: 1.55,
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-strong)',
                      backgroundColor: '#FFFFFF',
                      color: 'var(--text-primary)',
                      fontFamily: 'inherit',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                  />

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '0.35rem',
                    fontSize: '0.74rem',
                    color: 'var(--text-muted)'
                  }}>
                    <span>
                      {t('room.wordCount', { count: combinedTranscriptDisplay.trim() ? combinedTranscriptDisplay.trim().split(/\s+/).length : 0 }, activeLang)}
                      <span style={{ marginLeft: '0.5rem', color: 'var(--text-subtle)' }}>• <strong>{t('room.ctrlEnterSubmit', {}, activeLang)}</strong></span>
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
                      {/* Processing State */}
                      {interviewState === 'PROCESSING_ANSWER' && (
                        <span style={{ color: 'var(--lavender-700)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <span className="status-dot status-dot-violet" style={{ animation: 'spin 1s infinite' }} />
                          {t('room.evaluatingAnswer', {}, activeLang)}
                        </span>
                      )}

                      {/* Microphone Unavailable State */}
                      {(micPermissionDenied || !sttSupported) && (
                        <span style={{ color: '#DC2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }} title="Microphone access is unavailable. Editable text mode is active.">
                          <MicOff size={12} />
                          {t('room.micBlocked', {}, activeLang)}
                        </span>
                      )}

                      {/* Microphone Muted State */}
                      {!micPermissionDenied && sttSupported && isMicMuted && (
                        <span style={{ color: '#B45309', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <MicOff size={12} />
                          {t('room.micMutedMode', {}, activeLang)}
                        </span>
                      )}

                      {/* Candidate Speaking State */}
                      {!micPermissionDenied && sttSupported && !isMicMuted && interviewState === 'LISTENING' && isSpeakingNow && (
                        <span style={{ color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Mic size={13} color="#059669" />
                          {t('room.speechDetected', {}, activeLang)}
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', height: '10px', marginLeft: '2px' }}>
                            <span style={{ width: '2.5px', height: '10px', backgroundColor: '#059669', borderRadius: '1px' }} />
                            <span style={{ width: '2.5px', height: '6px', backgroundColor: '#059669', borderRadius: '1px' }} />
                            <span style={{ width: '2.5px', height: '8px', backgroundColor: '#059669', borderRadius: '1px' }} />
                          </span>
                        </span>
                      )}

                      {/* Candidate Listening State */}
                      {!micPermissionDenied && sttSupported && !isMicMuted && interviewState === 'LISTENING' && !isSpeakingNow && (
                        <span style={{ color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <span className="status-dot status-dot-active" />
                          {isAudioCapturing ? t('room.micListening', {}, activeLang) : t('room.stateListening', {}, activeLang)}
                        </span>
                      )}

                      {/* Ismav Speaking State */}
                      {interviewState === 'ASKING_QUESTION' && (
                        <span style={{ color: 'var(--lavender-700)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Volume2 size={12} />
                          {t('room.ismavSpeaking', {}, activeLang)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* General Error or Permission Warning */}
                {generalError && (
                  <div style={{
                    padding: '0.6rem 0.85rem',
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    borderRadius: 'var(--radius-md)',
                    color: '#991B1B',
                    fontSize: '0.80rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem'
                  }}>
                    <AlertTriangle size={14} color="#DC2626" />
                    <span>{generalError}</span>
                  </div>
                )}

                {/* Action Toolbar: Advance / Submit */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.65rem',
                  paddingTop: '0.45rem',
                  borderTop: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                    {interviewState === 'PROCESSING_ANSWER' ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--lavender-700)', fontWeight: 600 }}>
                        <span className="status-dot status-dot-violet" style={{ animation: 'spin 1s infinite' }} />
                        Ismav is analyzing answer...
                      </span>
                    ) : (
                      <span>{t('room.silenceNotice', {}, activeLang)}</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.65rem' }}>
                    <button
                      type="button"
                      onClick={handleFinalizeAnswerAndAdvance}
                      disabled={interviewState === 'PROCESSING_ANSWER' || isFinishing}
                      className="btn btn-primary"
                      style={{
                        padding: '0.55rem 1.25rem',
                        fontSize: '0.82rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      {interviewState === 'PROCESSING_ANSWER' ? (
                        <span>{t('room.stateThinking', {}, activeLang)}</span>
                      ) : (
                        <>
                          <span>{t('room.submitAnswerBtn', {}, activeLang)}</span>
                          <ArrowRight size={14} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Early Exit Confirmation Modal */}
      {showExitConfirm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-xl)',
            padding: '2rem',
            maxWidth: '460px',
            width: '100%',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#FEF2F2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AlertTriangle size={20} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {t('room.confirmEndTitle', {}, activeLang)}
              </h3>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {t('room.confirmEndDesc', {}, activeLang)}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="btn btn-secondary"
              >
                {t('room.confirmNo', {}, activeLang)}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExitConfirm(false);
                  handleFinishInterview();
                }}
                className="btn"
                style={{ backgroundColor: '#DC2626', color: '#FFFFFF' }}
              >
                {t('room.confirmYes', {}, activeLang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Note: Candidate self-view camera is now persistently integrated side-by-side beside Ismav on the main stage */}
    </div>
  );
}

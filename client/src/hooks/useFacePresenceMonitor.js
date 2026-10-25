import { useState, useRef, useEffect, useCallback } from 'react';
import { detectFacePresence } from '../utils/faceDetector';
import { SECURITY_CONFIG } from '../config/securityConfig';
import { t } from '../i18n';

/**
 * TalentTrail AI — Isolated Face-Presence Monitoring Hook
 * 
 * Operates strictly during the active interview lifecycle.
 * - Reuses the existing live camera stream from the HTML5 video element
 * - Detects human face presence in-browser using local anthropometric computer vision & native Shape Detection
 * - Implements conservative grace periods to filter transient blinks, head turns, and lighting shifts
 * - Maintains an in-memory, deduplicated, timestamped security event audit log
 * - Enforces strict 30-second continuous absence termination threshold with monotonic timing
 * - Distinguishes hardware track disconnection from deliberate candidate face absence
 */
export function useFacePresenceMonitor({
  videoRef,
  isActive = true,
  currentLanguage = 'en-US',
  onTerminate,
  config = SECURITY_CONFIG
}) {
  const [faceDetected, setFaceDetected] = useState(true);
  const [faceAbsenceWarning, setFaceAbsenceWarning] = useState(false);
  const [absenceSecondsRemaining, setAbsenceSecondsRemaining] = useState(
    config.TERMINATION_COUNTDOWN_SECONDS || 30
  );
  const [cameraStatus, setCameraStatus] = useState('ready'); // 'ready' | 'disconnected' | 'unready'
  const [securityEventLog, setSecurityEventLog] = useState(() => [
    {
      id: 'sec_init_' + Date.now(),
      timestamp: new Date().toISOString(),
      displayTime: new Date().toLocaleTimeString(),
      type: 'MONITORING_START',
      message: t('security.eventInitialized', null, currentLanguage) || 'Face-presence security monitoring initialized',
      level: 'info'
    }
  ]);

  // Absence & countdown tracking refs
  const absenceStartTimeRef = useRef(null);
  const consecutiveAbsentTicksRef = useRef(0);
  const isTerminatedRef = useRef(false);
  const inWarningRef = useRef(false);
  const cameraDisconnectedRef = useRef(false);
  const monitorIntervalRef = useRef(null);
  const onTerminateRef = useRef(onTerminate);
  const currentLangRef = useRef(currentLanguage);

  // Keep callback refs synchronized to prevent stale closures
  useEffect(() => {
    onTerminateRef.current = onTerminate;
  }, [onTerminate]);

  useEffect(() => {
    currentLangRef.current = currentLanguage;
  }, [currentLanguage]);

  /**
   * Append a deduplicated event to the session security audit log
   */
  const logSecurityEvent = useCallback((type, message, level = 'info') => {
    const newEvent = {
      id: 'sec_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      timestamp: new Date().toISOString(),
      displayTime: new Date().toLocaleTimeString(),
      type,
      message,
      level
    };

    setSecurityEventLog(prev => {
      // Guard against duplicate immediate consecutive messages of same type
      if (prev.length > 0 && prev[prev.length - 1].type === type) {
        return prev;
      }
      const updated = [...prev, newEvent];
      if (updated.length > (config.MAX_SECURITY_EVENTS || 50)) {
        return updated.slice(updated.length - (config.MAX_SECURITY_EVENTS || 50));
      }
      return updated;
    });

    return newEvent;
  }, [config.MAX_SECURITY_EVENTS]);

  /**
   * Idempotent Termination Handler
   */
  const triggerTermination = useCallback((reason) => {
    if (isTerminatedRef.current) return;
    isTerminatedRef.current = true;

    if (monitorIntervalRef.current) {
      clearInterval(monitorIntervalRef.current);
      monitorIntervalRef.current = null;
    }

    const terminationEvent = {
      id: 'sec_term_' + Date.now(),
      timestamp: new Date().toISOString(),
      displayTime: new Date().toLocaleTimeString(),
      type: 'TERMINATION_TRIGGERED',
      message: t('security.eventTerminated', null, currentLangRef.current) || 'Session stopped: continuous face absence reached 30 seconds',
      level: 'critical'
    };

    setSecurityEventLog(prev => [...prev, terminationEvent]);

    if (onTerminateRef.current) {
      onTerminateRef.current({
        reason: reason || 'Face not detected in camera feed for 30 consecutive seconds',
        securityEvent: terminationEvent
      });
    }
  }, []);

  /**
   * Real-time continuous detection loop
   */
  useEffect(() => {
    if (!isActive || isTerminatedRef.current) {
      if (monitorIntervalRef.current) {
        clearInterval(monitorIntervalRef.current);
        monitorIntervalRef.current = null;
      }
      return;
    }

    const runDetectionTick = async () => {
      if (!isActive || isTerminatedRef.current) return;

      const video = videoRef?.current;
      // Do not treat camera initialization, video playback delays, zero dimensions, or paused states as candidate absence
      if (!video || video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0 || video.paused) {
        return;
      }

      try {
        const result = await detectFacePresence(video);
        if (!isActive || isTerminatedRef.current) return;

        // Skip safely if frame was not ready or detector encountered an unavailable state
        if (!result || !result.isVideoReady) {
          return;
        }

        // Hardware track disconnection: isolate from candidate absence
        if (result.reason === 'CAMERA_TRACK_INACTIVE') {
          setCameraStatus('disconnected');
          if (!cameraDisconnectedRef.current) {
            cameraDisconnectedRef.current = true;
            logSecurityEvent(
              'CAMERA_DISCONNECTED',
              t('security.eventCameraLost', null, currentLangRef.current) || 'Camera video track ended or disconnected',
              'warning'
            );
          }
          return; // Do NOT count as deliberate face absence
        }

        // Track is active
        if (cameraDisconnectedRef.current) {
          cameraDisconnectedRef.current = false;
          setCameraStatus('ready');
          logSecurityEvent(
            'CAMERA_RESTORED',
            'Camera video feed restored',
            'info'
          );
        }

        if (result.faceDetected) {
          // Face reliably detected on live frame
          setFaceDetected(true);
          consecutiveAbsentTicksRef.current = 0;

          // If returning from an active warning state, reset cleanly and record single recovery event
          if (inWarningRef.current) {
            inWarningRef.current = false;
            setFaceAbsenceWarning(false);
            setAbsenceSecondsRemaining(config.TERMINATION_COUNTDOWN_SECONDS || 30);
            absenceStartTimeRef.current = null;

            logSecurityEvent(
              'FACE_RESTORED',
              t('security.eventFaceRestored', null, currentLangRef.current) || 'Candidate face detected; presence verified',
              'info'
            );
          } else {
            absenceStartTimeRef.current = null;
          }
        } else if (result.reason === 'BELOW_FACIAL_THRESHOLD') {
          // Candidate face genuinely absent on evaluated valid frames
          consecutiveAbsentTicksRef.current += 1;

          // Grace period filter: requires at least WARNING_CONSECUTIVE_TICKS (~1000ms)
          // to tolerate natural blinks, slight head movement, or lighting shifts
          if (consecutiveAbsentTicksRef.current >= (config.WARNING_CONSECUTIVE_TICKS || 2)) {
            setFaceDetected(false);
            const now = Date.now();

            if (absenceStartTimeRef.current === null) {
              absenceStartTimeRef.current = now - (config.WARNING_GRACE_PERIOD_MS || 1000);
            }

            const elapsedMs = now - absenceStartTimeRef.current;
            const thresholdMs = config.TERMINATION_THRESHOLD_MS || 30000;
            const remainingSec = Math.max(0, Math.ceil((thresholdMs - elapsedMs) / 1000));

            setAbsenceSecondsRemaining(remainingSec);
            setFaceAbsenceWarning(true);

            // Log single warning event on transition to warning state
            if (!inWarningRef.current) {
              inWarningRef.current = true;
              logSecurityEvent(
                'FACE_ABSENT',
                t('security.faceNotDetectedWarning', null, currentLangRef.current) || 'Face not detected. Please stay in front of the camera.',
                'warning'
              );
            }

            // Hard termination threshold reached
            if (elapsedMs >= thresholdMs) {
              triggerTermination('Face not detected in camera feed for 30 consecutive seconds');
            }
          }
        }
      } catch (err) {
        console.warn('Face presence monitoring tick caught exception:', err?.message);
      }
    };

    monitorIntervalRef.current = setInterval(runDetectionTick, config.DETECTION_INTERVAL_MS || 500);

    return () => {
      if (monitorIntervalRef.current) {
        clearInterval(monitorIntervalRef.current);
        monitorIntervalRef.current = null;
      }
    };
  }, [isActive, videoRef, config, logSecurityEvent, triggerTermination]);

  /**
   * Monotonic time accounting for background tab throttling or window blur
   */
  useEffect(() => {
    if (!isActive) return;

    const handleFocusCheck = () => {
      if (absenceStartTimeRef.current !== null && !isTerminatedRef.current) {
        const elapsedMs = Date.now() - absenceStartTimeRef.current;
        const thresholdMs = config.TERMINATION_THRESHOLD_MS || 30000;
        if (elapsedMs >= thresholdMs) {
          triggerTermination('Face not detected in camera feed for 30 consecutive seconds (monotonic catch-up)');
        } else {
          const remainingSec = Math.max(0, Math.ceil((thresholdMs - elapsedMs) / 1000));
          setAbsenceSecondsRemaining(remainingSec);
        }
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        handleFocusCheck();
      }
    };

    window.addEventListener('focus', handleFocusCheck);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocusCheck);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isActive, config.TERMINATION_THRESHOLD_MS, triggerTermination]);

  return {
    faceDetected,
    faceAbsenceWarning,
    absenceSecondsRemaining,
    securityEventLog,
    cameraStatus,
    isTerminated: isTerminatedRef.current,
    logSecurityEvent,
    resetMonitor: () => {
      consecutiveAbsentTicksRef.current = 0;
      absenceStartTimeRef.current = null;
      inWarningRef.current = false;
      isTerminatedRef.current = false;
      setFaceDetected(true);
      setFaceAbsenceWarning(false);
      setAbsenceSecondsRemaining(config.TERMINATION_COUNTDOWN_SECONDS || 30);
    }
  };
}

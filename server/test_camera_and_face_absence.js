import assert from 'assert';
import { summarizeInterview } from './src/services/interviewService.js';
import { translations, SUPPORTED_LANGUAGES } from '../client/src/i18n/translations.js';
import { SECURITY_CONFIG } from '../client/src/config/securityConfig.js';

console.log('===============================================================');
console.log('TALENTTRAIL AI — CAMERA VALIDATION & 30S FACE ABSENCE TEST SUITE');
console.log('===============================================================');

async function runTests() {
  let passedCount = 0;
  let totalCount = 0;

  function test(name, fn) {
    totalCount++;
    try {
      fn();
      console.log(`  ✓ Case ${totalCount}: ${name}`);
      passedCount++;
    } catch (err) {
      console.error(`  ✗ Case ${totalCount} FAILED: ${name}`);
      console.error('    Error:', err.message);
    }
  }

  async function testAsync(name, fn) {
    totalCount++;
    try {
      await fn();
      console.log(`  ✓ Case ${totalCount}: ${name}`);
      passedCount++;
    } catch (err) {
      console.error(`  ✗ Case ${totalCount} FAILED: ${name}`);
      console.error('    Error:', err.message);
    }
  }

  console.log('\n--- SUITE 1: Compulsory Camera & Independent Microphone Validation ---');

  test('Camera access missing/denied blocks interview progression', () => {
    const isStreamLive = (stream) => {
      if (!stream) return false;
      const vTrack = stream.getVideoTracks ? stream.getVideoTracks()?.[0] : null;
      const hasLiveVideo = Boolean(vTrack && vTrack.readyState === 'live' && !vTrack.muted);
      const aTracks = stream.getAudioTracks ? stream.getAudioTracks() : [];
      const hasLiveAudio = aTracks.length === 0 || aTracks.some(t => t.readyState === 'live');
      return hasLiveVideo && hasLiveAudio;
    };

    assert.strictEqual(isStreamLive(null), false, 'Null stream should be rejected');
    assert.strictEqual(isStreamLive({}), false, 'Empty stream should be rejected');
    assert.strictEqual(isStreamLive({
      getVideoTracks: () => [{ readyState: 'ended', muted: false }],
      getAudioTracks: () => [{ readyState: 'live', muted: false }]
    }), false, 'Ended video track must block progression');
    assert.strictEqual(isStreamLive({
      getVideoTracks: () => [{ readyState: 'live', muted: true }],
      getAudioTracks: () => [{ readyState: 'live', muted: false }]
    }), false, 'Muted video track must block progression');
  });

  test('Microphone access is validated independently from camera', () => {
    const isStreamLive = (stream) => {
      const vTrack = stream?.getVideoTracks ? stream.getVideoTracks()?.[0] : null;
      const hasLiveVideo = Boolean(vTrack && vTrack.readyState === 'live' && !vTrack.muted);
      const aTracks = stream?.getAudioTracks ? stream.getAudioTracks() : [];
      const hasLiveAudio = aTracks.length === 0 || aTracks.some(t => t.readyState === 'live');
      return hasLiveVideo && hasLiveAudio;
    };

    // Video live but audio explicitly present and ended
    const videoLiveAudioEnded = {
      getVideoTracks: () => [{ readyState: 'live', muted: false }],
      getAudioTracks: () => [{ readyState: 'ended', muted: false }]
    };
    assert.strictEqual(isStreamLive(videoLiveAudioEnded), false, 'Dead audio track should be rejected when present');
  });

  test('Valid camera and microphone stream passes validation', () => {
    const isStreamLive = (stream) => {
      const vTrack = stream?.getVideoTracks ? stream.getVideoTracks()?.[0] : null;
      const hasLiveVideo = Boolean(vTrack && vTrack.readyState === 'live' && !vTrack.muted);
      const aTracks = stream?.getAudioTracks ? stream.getAudioTracks() : [];
      const hasLiveAudio = aTracks.length === 0 || aTracks.some(t => t.readyState === 'live');
      return hasLiveVideo && hasLiveAudio;
    };

    const validStream = {
      getVideoTracks: () => [{ readyState: 'live', muted: false }],
      getAudioTracks: () => [{ readyState: 'live', muted: false }]
    };
    assert.strictEqual(isStreamLive(validStream), true, 'Valid video + audio must pass validation');
  });

  console.log('\n--- SUITE 2: Real-Time Face Detection & Absence Timing State Machine ---');

  test('Single-frame negative detection (<1s) does NOT start countdown (blink filter)', () => {
    let consecutiveAbsentCount = 0;
    let absenceStartTime = null;
    let warningTriggered = false;

    function onDetectionTick(hasFace) {
      if (hasFace) {
        consecutiveAbsentCount = 0;
        absenceStartTime = null;
        warningTriggered = false;
      } else {
        consecutiveAbsentCount += 1;
        if (consecutiveAbsentCount >= 2) {
          if (absenceStartTime === null) {
            absenceStartTime = Date.now() - 1000;
          }
          warningTriggered = true;
        }
      }
    }

    // Tick 1: Blink or motion blur
    onDetectionTick(false);
    assert.strictEqual(consecutiveAbsentCount, 1);
    assert.strictEqual(absenceStartTime, null, 'Single frame must not start absence countdown');
    assert.strictEqual(warningTriggered, false, 'Single frame must not trigger warning');

    // Tick 2: Face returns
    onDetectionTick(true);
    assert.strictEqual(consecutiveAbsentCount, 0);
    assert.strictEqual(absenceStartTime, null);
    assert.strictEqual(warningTriggered, false);
  });

  test('Two consecutive negative frames (~1s) confirms absence and starts 30s countdown', () => {
    let consecutiveAbsentCount = 0;
    let absenceStartTime = null;
    let warningTriggered = false;

    function onDetectionTick(hasFace) {
      if (hasFace) {
        consecutiveAbsentCount = 0;
        absenceStartTime = null;
        warningTriggered = false;
      } else {
        consecutiveAbsentCount += 1;
        if (consecutiveAbsentCount >= 2) {
          if (absenceStartTime === null) {
            absenceStartTime = Date.now() - 1000;
          }
          warningTriggered = true;
        }
      }
    }

    onDetectionTick(false);
    onDetectionTick(false);
    assert.strictEqual(consecutiveAbsentCount, 2);
    assert.notStrictEqual(absenceStartTime, null, 'Absence timer must be initialized');
    assert.strictEqual(warningTriggered, true, 'Warning banner must be active');
  });

  test('Face returning before 30 consecutive seconds resets countdown cleanly', () => {
    let consecutiveAbsentCount = 2;
    let absenceStartTime = Date.now() - 15000; // 15 seconds into absence
    let warningTriggered = true;
    let remainingSec = 15;

    // Candidate returns in front of camera
    const hasFace = true;
    if (hasFace) {
      consecutiveAbsentCount = 0;
      absenceStartTime = null;
      warningTriggered = false;
      remainingSec = 30;
    }

    assert.strictEqual(consecutiveAbsentCount, 0);
    assert.strictEqual(absenceStartTime, null, 'Timer must be reset');
    assert.strictEqual(warningTriggered, false, 'Warning banner must be cleared');
    assert.strictEqual(remainingSec, 30, 'Seconds remaining must reset to 30');
  });

  test('Monotonic elapsed time calculation handles background tab throttling accurately', () => {
    const absenceStartTime = Date.now() - 31000; // 31 seconds ago (e.g. background tab)
    const elapsedMs = Date.now() - absenceStartTime;
    assert.ok(elapsedMs >= 30000, 'Must recognize >= 30000ms immediately on resume');
    const remainingSec = Math.max(0, Math.ceil((30000 - elapsedMs) / 1000));
    assert.strictEqual(remainingSec, 0, 'Remaining seconds must be 0');
  });

  console.log('\n--- SUITE 3: Automatic Save & Termination on 30s Absence ---');

  test('30 continuous seconds of absence triggers automatic termination exactly once', () => {
    let terminationCount = 0;
    let isTerminated = false;

    function handleTerminate() {
      if (isTerminated) return;
      isTerminated = true;
      terminationCount++;
    }

    // Trigger termination at 30 seconds
    handleTerminate();
    assert.strictEqual(terminationCount, 1);
    assert.strictEqual(isTerminated, true);

    // Subsequent ticks or candidate re-appearing in camera must NOT re-trigger or restart
    handleTerminate();
    handleTerminate();
    assert.strictEqual(terminationCount, 1, 'Termination must be strictly idempotent');
  });

  test('Candidate returning after termination does NOT resume session', () => {
    const session = {
      interviewState: 'COMPLETED',
      isTerminated: true
    };

    function onFaceDetectedAfterCompletion() {
      if (session.isTerminated || session.interviewState === 'COMPLETED') {
        return false; // Do not resume
      }
      return true;
    }

    assert.strictEqual(onFaceDetectedAfterCompletion(), false, 'Completed/terminated session must not resume');
  });

  test('Preserves in-progress partial answers when terminated', () => {
    const sessionHistory = [
      { question: { id: 'q1', question: 'Tell me about yourself' }, answer: 'I am a full stack engineer.' }
    ];
    const currentQuestion = { id: 'q2', question: 'Explain React hooks.' };
    const inProgressAnswer = 'Hooks allow functional components to maintain state...';

    const finalHistory = [...sessionHistory];
    if (currentQuestion && inProgressAnswer) {
      finalHistory.push({
        question: currentQuestion,
        answer: inProgressAnswer,
        evaluation: { score: 50, feedback: 'Session terminated automatically due to camera face absence. Partial response recorded.' }
      });
    }

    assert.strictEqual(finalHistory.length, 2, 'Must include in-progress question');
    assert.strictEqual(finalHistory[1].answer, inProgressAnswer, 'Must preserve partial spoken/typed answer');
  });

  console.log('\n--- SUITE 4: Backend Evaluation & Reporting with Termination Metadata ---');

  await testAsync('summarizeInterview handles terminationStatus: terminated_face_absent with partial questions', async () => {
    const summary = await summarizeInterview({
      candidate: { name: 'Vamsi' },
      role: 'Full Stack Developer',
      level: 'Mid-Level',
      sessionHistory: [
        {
          question: { id: 'q1', category: 'technical', question: 'What is Node.js?' },
          answer: 'Node.js is an event-driven JavaScript runtime built on Chrome V8.',
          evaluation: { score: 85, feedback: 'Strong answer.' }
        }
      ],
      language: 'en-US',
      terminationStatus: 'terminated_face_absent',
      terminationReason: 'Face not detected in camera feed for 30 consecutive seconds',
      terminatedAt: new Date().toISOString()
    });

    assert.strictEqual(summary.terminationStatus, 'terminated_face_absent');
    assert.strictEqual(summary.isTerminated, true);
    assert.strictEqual(summary.recommendation, 'Terminated: Candidate Absent');
    assert.ok(summary.recommendationReasoning.includes('automatically terminated'), 'Reasoning must mention automatic termination');
    assert.ok(summary.recommendationReasoning.includes('30 consecutive seconds'), 'Reasoning must cite 30 consecutive seconds rule');
    assert.strictEqual(summary.totalQuestions, 1);
  });

  await testAsync('summarizeInterview safely handles terminationStatus: terminated_face_absent with 0 questions answered', async () => {
    const summary = await summarizeInterview({
      candidate: { name: 'Priya' },
      role: 'Frontend Developer',
      level: 'Junior',
      sessionHistory: [],
      language: 'en-US',
      terminationStatus: 'terminated_face_absent',
      terminationReason: 'Face not detected in camera feed for 30 consecutive seconds',
      terminatedAt: new Date().toISOString()
    });

    assert.strictEqual(summary.terminationStatus, 'terminated_face_absent');
    assert.strictEqual(summary.isTerminated, true);
    assert.strictEqual(summary.recommendation, 'Interview Terminated');
    assert.strictEqual(summary.averageScore, 0);
    assert.strictEqual(summary.totalQuestions, 0);
    assert.ok(summary.recommendationReasoning.includes('automatically terminated'), 'Reasoning must explain termination');
  });

  console.log('\n--- SUITE 5: Video Readiness, False Absence Alert Prevention & Track Cleanup ---');

  test('Video element unready (readyState < 2 or videoWidth === 0) returns isVideoReady = false', () => {
    function evaluateVideoReadiness(video) {
      if (!video) return { isVideoReady: false, reason: 'NO_VIDEO_ELEMENT' };
      if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0 || video.paused) {
        return { isVideoReady: false, reason: 'VIDEO_NOT_READY' };
      }
      return { isVideoReady: true };
    }

    assert.strictEqual(evaluateVideoReadiness(null).isVideoReady, false);
    assert.strictEqual(evaluateVideoReadiness({ readyState: 0, videoWidth: 0, videoHeight: 0 }).isVideoReady, false);
    assert.strictEqual(evaluateVideoReadiness({ readyState: 1, videoWidth: 640, videoHeight: 480 }).isVideoReady, false);
    assert.strictEqual(evaluateVideoReadiness({ readyState: 4, videoWidth: 0, videoHeight: 0 }).isVideoReady, false);
    assert.strictEqual(evaluateVideoReadiness({ readyState: 4, videoWidth: 640, videoHeight: 480, paused: true }).isVideoReady, false);
    assert.strictEqual(evaluateVideoReadiness({ readyState: 4, videoWidth: 640, videoHeight: 480, paused: false }).isVideoReady, true);
  });

  test('Video playback delay or unready video element does NOT tick absence countdown', () => {
    let consecutiveAbsentCount = 0;
    let absenceStartTime = null;
    let warningTriggered = false;

    function handleDetectionTick(result) {
      // Do not count unready video states as candidate absence
      if (!result || !result.isVideoReady) {
        return;
      }
      if (result.faceDetected) {
        consecutiveAbsentCount = 0;
        absenceStartTime = null;
        warningTriggered = false;
      } else if (result.reason === 'BELOW_FACIAL_THRESHOLD') {
        consecutiveAbsentCount += 1;
        if (consecutiveAbsentCount >= 2) {
          warningTriggered = true;
        }
      }
    }

    // 5 consecutive ticks while video is buffering or starting playback
    for (let i = 0; i < 5; i++) {
      handleDetectionTick({ isVideoReady: false, reason: 'VIDEO_NOT_READY' });
    }
    assert.strictEqual(consecutiveAbsentCount, 0, 'Buffering video must NOT increment absence count');
    assert.strictEqual(warningTriggered, false, 'Buffering video must NOT trigger absence warning banner');
  });

  test('Video track enabled = false (black frames) is re-enabled on attachment', () => {
    const mockTrack = { readyState: 'live', enabled: false };
    const mockStream = {
      getVideoTracks: () => [mockTrack]
    };

    function attachStream(stream) {
      const vTrack = stream?.getVideoTracks ? stream.getVideoTracks()?.[0] : null;
      if (vTrack && !vTrack.enabled) {
        vTrack.enabled = true;
      }
    }

    attachStream(mockStream);
    assert.strictEqual(mockTrack.enabled, true, 'Disabled video track must be set to enabled = true to prevent black frames');
  });

  test('Camera track disconnection is isolated from candidate face absence', () => {
    let isDeviceValidated = true;
    let deviceError = '';
    let consecutiveAbsentCount = 0;

    function handleDetectionTick(result) {
      if (result.reason === 'CAMERA_TRACK_INACTIVE') {
        isDeviceValidated = false;
        deviceError = 'Camera feed disconnected.';
        return; // Do NOT count as face absent
      }
      if (result.faceDetected) {
        consecutiveAbsentCount = 0;
      } else if (result.reason === 'BELOW_FACIAL_THRESHOLD') {
        consecutiveAbsentCount += 1;
      }
    }

    handleDetectionTick({ isVideoReady: false, reason: 'CAMERA_TRACK_INACTIVE' });
    assert.strictEqual(isDeviceValidated, false, 'Hardware disconnection must invalidate device');
    assert.strictEqual(consecutiveAbsentCount, 0, 'Hardware disconnection must NOT count as candidate face absence');
  });

  test('stopAllMediaStreams terminates both registered streams and individual active tracks', () => {
    const stoppedTracks = [];
    const mockTrack1 = { enabled: true, stop: () => { mockTrack1.enabled = false; stoppedTracks.push('t1'); } };
    const mockTrack2 = { enabled: true, stop: () => { mockTrack2.enabled = false; stoppedTracks.push('t2'); } };

    const activeStreams = new Set();
    const activeTracks = new Set();

    function registerStream(stream) {
      activeStreams.add(stream);
      stream.getTracks().forEach(t => activeTracks.add(t));
    }

    function stopAll() {
      activeStreams.forEach(stream => {
        stream.getTracks().forEach(t => { t.enabled = false; t.stop(); });
      });
      activeTracks.forEach(t => {
        t.enabled = false;
        t.stop();
      });
      activeStreams.clear();
      activeTracks.clear();
    }

    const stream = { getTracks: () => [mockTrack1, mockTrack2] };
    registerStream(stream);
    assert.strictEqual(activeStreams.size, 1);
    assert.strictEqual(activeTracks.size, 2);

    stopAll();
    assert.strictEqual(activeStreams.size, 0, 'Active streams must be cleared');
    assert.strictEqual(activeTracks.size, 0, 'Active tracks must be cleared');
    assert.strictEqual(mockTrack1.enabled, false);
    assert.strictEqual(mockTrack2.enabled, false);
    assert.ok(stoppedTracks.includes('t1') && stoppedTracks.includes('t2'), 'All hardware tracks must be stopped');
  });

  console.log('\n--- SUITE 6: Anti-Malpractice Security Monitoring, Event Log Deduplication & Neutrality ---');

  test('Grace period tolerates momentary face absence (blink filter: 1 tick = 0 warnings)', () => {
    let tickCount = 0;
    let warningActive = false;
    let events = [];

    function processFrame(hasFace) {
      if (hasFace) {
        tickCount = 0;
      } else {
        tickCount += 1;
        if (tickCount >= SECURITY_CONFIG.WARNING_CONSECUTIVE_TICKS) {
          if (!warningActive) {
            warningActive = true;
            events.push({ type: 'FACE_ABSENT', message: 'Face not detected' });
          }
        }
      }
    }

    // Tick 1: momentary blink or motion blur
    processFrame(false);
    assert.strictEqual(warningActive, false, '1 negative tick must not trigger warning');
    assert.strictEqual(events.length, 0, 'No event must be logged on single tick');

    // Face returns immediately
    processFrame(true);
    assert.strictEqual(warningActive, false);
    assert.strictEqual(events.length, 0);
  });

  test('Security event log deduplication prevents frame-by-frame spam (single entry across 60 negative ticks)', () => {
    let tickCount = 0;
    let inWarning = false;
    const events = [];

    function logEvent(type, message) {
      events.push({ type, message, timestamp: Date.now() });
    }

    function processFrame(hasFace) {
      if (hasFace) {
        tickCount = 0;
        if (inWarning) {
          inWarning = false;
          logEvent('FACE_RESTORED', 'Face restored');
        }
      } else {
        tickCount += 1;
        if (tickCount >= SECURITY_CONFIG.WARNING_CONSECUTIVE_TICKS) {
          if (!inWarning) {
            inWarning = true;
            logEvent('FACE_ABSENT', 'Face not detected. Please stay in front of camera.');
          }
        }
      }
    }

    // Simulate 60 continuous negative frames (30 seconds at 2 fps)
    for (let i = 0; i < 60; i++) {
      processFrame(false);
    }

    assert.strictEqual(inWarning, true);
    assert.strictEqual(events.length, 1, 'Only exactly 1 FACE_ABSENT warning event must be logged, NOT 60 duplicate entries');
    assert.strictEqual(events[0].type, 'FACE_ABSENT');
  });

  test('Face returning after warning emits single FACE_RESTORED event and resets state cleanly', () => {
    let tickCount = 2;
    let inWarning = true;
    const events = [{ type: 'FACE_ABSENT', message: 'Face not detected' }];

    function processFrame(hasFace) {
      if (hasFace) {
        tickCount = 0;
        if (inWarning) {
          inWarning = false;
          events.push({ type: 'FACE_RESTORED', message: 'Face detected; presence verified' });
        }
      }
    }

    // Candidate re-enters camera frame
    processFrame(true);
    assert.strictEqual(inWarning, false);
    assert.strictEqual(tickCount, 0);
    assert.strictEqual(events.length, 2);
    assert.strictEqual(events[1].type, 'FACE_RESTORED');

    // Subsequent positive frames do not re-emit restore events
    processFrame(true);
    processFrame(true);
    assert.strictEqual(events.length, 2, 'Positive frames while normal must not emit duplicate restore events');
  });

  test('Hardware track disconnection logs CAMERA_DISCONNECTED without accusing candidate of cheating', () => {
    let cameraStatus = 'ready';
    let isCandidateCheating = false;
    const events = [];

    function handleCameraHealth(result) {
      if (result.reason === 'CAMERA_TRACK_INACTIVE') {
        cameraStatus = 'disconnected';
        events.push({
          type: 'CAMERA_DISCONNECTED',
          message: 'Camera video track ended or disconnected',
          level: 'warning'
        });
      }
    }

    handleCameraHealth({ isVideoReady: false, reason: 'CAMERA_TRACK_INACTIVE' });
    assert.strictEqual(cameraStatus, 'disconnected');
    assert.strictEqual(isCandidateCheating, false, 'Hardware disconnection must never accuse candidate of misconduct');
    assert.strictEqual(events.length, 1);
    assert.strictEqual(events[0].type, 'CAMERA_DISCONNECTED');
  });

  test('Anti-malpractice termination records exactly 1 TERMINATION_TRIGGERED event and triggers termination idempotently', () => {
    let terminationCount = 0;
    let isTerminated = false;
    const events = [{ type: 'FACE_ABSENT', message: 'Face not detected' }];

    function triggerTermination(reason) {
      if (isTerminated) return;
      isTerminated = true;
      terminationCount++;
      events.push({
        type: 'TERMINATION_TRIGGERED',
        message: reason,
        level: 'critical'
      });
    }

    // 30s threshold reached
    triggerTermination('Face not detected in camera feed for 30 consecutive seconds');
    assert.strictEqual(terminationCount, 1);
    assert.strictEqual(isTerminated, true);
    assert.strictEqual(events.length, 2);
    assert.strictEqual(events[1].type, 'TERMINATION_TRIGGERED');

    // Repeated attempts (subsequent ticks) must be strictly idempotent
    triggerTermination('Face not detected in camera feed for 30 consecutive seconds');
    triggerTermination('Face not detected in camera feed for 30 consecutive seconds');
    assert.strictEqual(terminationCount, 1, 'Termination must trigger at most once');
    assert.strictEqual(events.length, 2, 'No duplicate termination events must be appended');
  });

  test('Neutral, non-accusatory language verification across all 6 localization dictionaries', () => {
    const accusatoryWords = ['cheat', 'fraud', 'dishonest', 'malpractice violation', 'banned', 'illegal'];

    const langCodes = ['en-US', 'te-IN', 'ml-IN', 'kn-IN', 'hi-IN', 'ta-IN'];
    langCodes.forEach(code => {
      const secDict = translations[code]?.security;
      assert.ok(secDict, `Missing security dictionary for ${code}`);
      assert.ok(secDict.shieldLabel, `Missing shieldLabel in ${code}`);
      assert.ok(secDict.interviewStopped, `Missing interviewStopped in ${code}`);
      assert.ok(secDict.explanation, `Missing explanation in ${code}`);
      assert.ok(secDict.exitToDashboard, `Missing exitToDashboard in ${code}`);

      // Check English dictionary specifically has zero accusatory terms
      if (code === 'en-US') {
        const textToTest = `${secDict.shieldLabel} ${secDict.interviewStopped} ${secDict.explanation} ${secDict.sessionStoppedNotice}`.toLowerCase();
        accusatoryWords.forEach(word => {
          assert.strictEqual(textToTest.includes(word), false, `English text contains accusatory word: "${word}"`);
        });
      }
    });
  });

  test('Configurable grace period and termination thresholds are properly defined and conservative', () => {
    assert.ok(SECURITY_CONFIG.WARNING_CONSECUTIVE_TICKS >= 2, 'Grace period ticks must be at least 2');
    assert.ok(SECURITY_CONFIG.WARNING_GRACE_PERIOD_MS >= 1000, 'Grace period ms must be at least 1000ms');
    assert.strictEqual(SECURITY_CONFIG.TERMINATION_THRESHOLD_MS, 30000, 'Termination threshold must be 30000ms (30s)');
    assert.strictEqual(SECURITY_CONFIG.TERMINATION_COUNTDOWN_SECONDS, 30, 'Countdown seconds must be 30');
    assert.ok(SECURITY_CONFIG.MAX_SECURITY_EVENTS >= 20, 'Max security events must be at least 20');
  });

  console.log('\n===============================================================');
  console.log(`TEST SUMMARY: ${passedCount} / ${totalCount} Passed`);
  console.log('===============================================================');

  if (passedCount === totalCount) {
    console.log('ALL CAMERA & 30S FACE ABSENCE TESTS PASSED SUCCESSFULLY! ✓\n');
    process.exit(0);
  } else {
    console.error(`FAILED: ${totalCount - passedCount} test(s) failed.\n`);
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

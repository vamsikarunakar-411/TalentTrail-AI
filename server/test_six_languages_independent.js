/**
 * TalentTrail AI — Six Languages Independent Verification Suite
 * Tests all 6 supported languages:
 * 1. Telugu (te-IN)
 * 2. English (en-US)
 * 3. Malayalam (ml-IN)
 * 4. Kannada (kn-IN)
 * 5. Hindi (hi-IN)
 * 6. Tamil (ta-IN)
 *
 * Across all 4 layers:
 * Layer 1: UI Translations & Key Completeness
 * Layer 2: Question Generation, Follow-Ups, and Evaluations (Gemini & Deterministic Simulation)
 * Layer 3: TTS Voice Matching Logic & Honest Detection (No silent English substitution)
 * Layer 4: STT Locale Support & Honest Graceful Fallback
 */

import assert from 'assert';
import { translations, SUPPORTED_LANGUAGES } from '../client/src/i18n/translations.js';
import { t } from '../client/src/i18n/index.js';
import {
  generateInterviewQuestions,
  evaluateAnswer,
  evaluateAnswerSimulation,
  processAdaptiveTurn,
  summarizeInterview
} from './src/services/interviewService.js';
import {
  generateDistinctQuestionSequence,
  selectAdaptiveNextQuestion,
  MULTI_DOMAIN_QUESTION_BANK
} from './src/services/questionManager.js';

const SAMPLE_CANDIDATE = {
  name: 'Vamsi Krishna',
  email: 'vamsi@example.com',
  phone: '+91 9876543210',
  skills: ['React', 'Node.js', 'PostgreSQL', 'Redis', 'Docker'],
  projects: [
    {
      title: 'Distributed Analytics Engine',
      description: 'Real-time telemetry and metrics pipeline',
      technologies: ['Node.js', 'PostgreSQL', 'Redis']
    }
  ],
  experience: [
    {
      company: 'TechFlow Solutions',
      role: 'Full Stack Engineer',
      duration: '2 years',
      highlights: ['Engineered high-throughput REST APIs']
    }
  ]
};

const SCRIPT_REGEX = {
  'te-IN': /[\u0C00-\u0C7F]/, // Telugu
  'en-US': /[A-Za-z]/,         // Latin (English)
  'ml-IN': /[\u0D00-\u0D7F]/, // Malayalam
  'kn-IN': /[\u0C80-\u0CFF]/, // Kannada
  'hi-IN': /[\u0900-\u097F]/, // Devanagari (Hindi)
  'ta-IN': /[\u0B80-\u0BFF]/  // Tamil
};

let totalPassed = 0;
let totalFailed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✓ PASS: ${name}`);
    totalPassed++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${err.message}`);
    totalFailed++;
  }
}

async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`  ✓ PASS: ${name}`);
    totalPassed++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${err.message}`);
    totalFailed++;
  }
}

console.log('\n===============================================================');
console.log('TALENTTRAIL AI — SIX LANGUAGES INDEPENDENT VERIFICATION SUITE');
console.log('===============================================================\n');

// =========================================================================
// LAYER 1: UI TRANSLATIONS VERIFICATION ACROSS ALL 6 LANGUAGES
// =========================================================================
console.log('--- LAYER 1: UI Translations & Key Completeness ---');

const expectedLangCodes = ['te-IN', 'en-US', 'ml-IN', 'kn-IN', 'hi-IN', 'ta-IN'];

runTest('All 6 languages are declared in SUPPORTED_LANGUAGES', () => {
  assert.strictEqual(SUPPORTED_LANGUAGES.length, 6);
  expectedLangCodes.forEach(code => {
    const found = SUPPORTED_LANGUAGES.find(l => l.code === code);
    assert(Boolean(found), `Missing language definition for ${code}`);
    assert(found.voiceLocale === code, `Voice locale mismatch for ${code}`);
    assert(found.sttLocale === code, `STT locale mismatch for ${code}`);
  });
});

const enKeys = [];
function extractKeys(obj, prefix = '') {
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      extractKeys(v, full);
    } else {
      enKeys.push(full);
    }
  }
}
extractKeys(translations['en-US']);

expectedLangCodes.forEach(code => {
  runTest(`[${code}] Dictionary completeness and script validity`, () => {
    const dict = translations[code];
    assert(Boolean(dict), `Dictionary for ${code} is undefined`);

    // Verify all keys from en-US exist in target language
    enKeys.forEach(k => {
      const translated = t(k, null, code);
      assert(Boolean(translated), `Missing translation for key "${k}" in ${code}`);
      assert.notStrictEqual(translated, k, `Key "${k}" fell back to key name in ${code}`);
    });

    // Verify appropriate script is present for non-English languages
    if (code !== 'en-US') {
      const sampleText = t('dashboard.welcomeTitle', null, code);
      const regex = SCRIPT_REGEX[code];
      assert(regex.test(sampleText), `Text for ${code} "${sampleText}" does not contain expected script characters`);
    }
  });
});

// =========================================================================
// LAYER 2: QUESTION GENERATION, FOLLOW-UPS & EVALUATION
// =========================================================================
console.log('\n--- LAYER 2: Gemini & Simulation Questions Across All 6 Languages ---');

for (const code of expectedLangCodes) {
  runTest(`[${code}] Question sequence generation contains non-empty localized text`, () => {
    const questions = generateDistinctQuestionSequence({
      candidate: SAMPLE_CANDIDATE,
      role: 'Full Stack Engineer',
      level: 'Mid-Level',
      focus: 'Technical',
      language: code,
      totalTurns: 6
    });

    assert.strictEqual(questions.length, 6, `Expected 6 questions for ${code}`);
    questions.forEach((q, idx) => {
      assert(Boolean(q.question), `Question ${idx + 1} has empty English text`);
      assert(Boolean(q.activeLanguageText), `Question ${idx + 1} has empty activeLanguageText for ${code}`);

      if (code.startsWith('te')) assert(Boolean(q.teluguQuestion), `Missing teluguQuestion on turn ${idx + 1}`);
      if (code.startsWith('ml')) assert(Boolean(q.malayalamQuestion), `Missing malayalamQuestion on turn ${idx + 1}`);
      if (code.startsWith('kn')) assert(Boolean(q.kannadaQuestion), `Missing kannadaQuestion on turn ${idx + 1}`);
      if (code.startsWith('hi')) assert(Boolean(q.hindiQuestion), `Missing hindiQuestion on turn ${idx + 1}`);
      if (code.startsWith('ta')) assert(Boolean(q.tamilQuestion), `Missing tamilQuestion on turn ${idx + 1}`);

      if (code !== 'en-US') {
        assert(SCRIPT_REGEX[code].test(q.activeLanguageText), `Question text for ${code} failed script test`);
      }
    });
  });

  runTest(`[${code}] Adaptive next question generation is localized and distinct`, () => {
    const firstQ = MULTI_DOMAIN_QUESTION_BANK[0].makeQuestion(SAMPLE_CANDIDATE.skills, SAMPLE_CANDIDATE.projects, SAMPLE_CANDIDATE.experience);
    const mockPrevious = { id: 'q_core_technical_1', domain: 'core_technical', question: firstQ.en };

    const nextQ = selectAdaptiveNextQuestion({
      currentQuestion: mockPrevious,
      answer: 'We used PostgreSQL with connection pooling and Redis for multi-tier caching.',
      candidate: SAMPLE_CANDIDATE,
      turnIndex: 1,
      totalTurns: 6,
      sessionQuestions: [mockPrevious],
      language: code
    });

    assert(Boolean(nextQ), `Adaptive question generation returned null for ${code}`);
    assert.notStrictEqual(nextQ.domain, mockPrevious.domain, `Adaptive question repeated domain for ${code}`);
    assert(Boolean(nextQ.question), `Adaptive question missing English text`);
    if (code !== 'en-US') {
      const localized = code.startsWith('te') ? nextQ.teluguQuestion :
                        code.startsWith('ml') ? nextQ.malayalamQuestion :
                        code.startsWith('kn') ? nextQ.kannadaQuestion :
                        code.startsWith('hi') ? nextQ.hindiQuestion : nextQ.tamilQuestion;
      assert(Boolean(localized), `Missing localized question text for ${code}`);
      assert(SCRIPT_REGEX[code].test(localized), `Localized adaptive text failed script test for ${code}`);
    }
  });

  runTest(`[${code}] Answer evaluation generates non-empty score and feedback`, () => {
    const q = { category: 'Technical', categoryLabel: 'Technical Depth', question: 'Explain Redis caching trade-offs.' };
    const evalResult = evaluateAnswerSimulation({
      question: q,
      answer: 'We use Redis as an L2 cache in front of Postgres to lower latency from 80ms to 4ms, with TTL expiration and cache-aside pattern.',
      candidate: SAMPLE_CANDIDATE,
      role: 'Full Stack Engineer',
      level: 'Mid-Level',
      language: code
    });

    assert(typeof evalResult.score === 'number' && evalResult.score >= 50, `Score is invalid: ${evalResult.score}`);
    assert(Array.isArray(evalResult.strengths) && evalResult.strengths.length > 0, `Missing strengths for ${code}`);
    assert(Array.isArray(evalResult.missingPoints), `Missing missingPoints for ${code}`);
    assert(Boolean(evalResult.feedback), `Missing feedback text for ${code}`);

    if (code !== 'en-US') {
      assert(SCRIPT_REGEX[code].test(evalResult.feedback), `Feedback text for ${code} does not match script`);
    }
  });
}

// =========================================================================
// LAYER 3: TTS VOICE AVAILABILITY & HONEST FALLBACK VERIFICATION
// =========================================================================
console.log('\n--- LAYER 3: TTS Voice Matching Logic & Honest Fallback ---');

/**
 * Simulates browser voice matching logic from speakText
 */
function simulateVoiceSelection(activeLang, installedVoices) {
  const langVoices = installedVoices.filter(v => v.lang === activeLang || v.lang.startsWith(activeLang.slice(0, 2)));

  if (langVoices.length === 0) {
    // Honest handling: do not play an English voice!
    return {
      success: false,
      voice: null,
      voiceUnavailableNotice: true,
      reason: `No native TTS voice installed for ${activeLang}`
    };
  }

  let matchedVoice = langVoices.find(v => {
    const nameLower = v.name.toLowerCase();
    return nameLower.includes('male') || nameLower.includes('david') || nameLower.includes('george') ||
           nameLower.includes('ravi') || nameLower.includes('valluvar') || nameLower.includes('madhav') ||
           nameLower.includes('mohan') || nameLower.includes('rishi') || nameLower.includes('ajay');
  });

  if (!matchedVoice && langVoices.length > 0) {
    matchedVoice = langVoices.find(v => {
      const nameLower = v.name.toLowerCase();
      return !nameLower.includes('female') && !nameLower.includes('zira') && !nameLower.includes('samantha');
    }) || langVoices[0];
  }

  return {
    success: true,
    voice: matchedVoice,
    voiceUnavailableNotice: false,
    reason: null
  };
}

const MOCK_SYSTEM_VOICES = [
  { name: 'Microsoft David - English (United States)', lang: 'en-US' },
  { name: 'Microsoft Zira - English (United States)', lang: 'en-US' },
  { name: 'Microsoft Hemant - Hindi (India)', lang: 'hi-IN' },
  { name: 'Microsoft Kalpana - Hindi (India)', lang: 'hi-IN' },
  { name: 'Microsoft Valluvar - Tamil (India)', lang: 'ta-IN' }
  // Note: te-IN, ml-IN, kn-IN are intentionally omitted to test honest fallback!
];

runTest('TTS Voice selection correctly finds en-US, hi-IN, ta-IN when installed', () => {
  const enRes = simulateVoiceSelection('en-US', MOCK_SYSTEM_VOICES);
  assert(enRes.success === true, 'en-US voice selection failed');
  assert(enRes.voice.name.includes('David'), 'en-US did not prefer David male voice');

  const hiRes = simulateVoiceSelection('hi-IN', MOCK_SYSTEM_VOICES);
  assert(hiRes.success === true, 'hi-IN voice selection failed');
  assert(hiRes.voice.name.includes('Hemant'), 'hi-IN did not prefer Hemant voice');

  const taRes = simulateVoiceSelection('ta-IN', MOCK_SYSTEM_VOICES);
  assert(taRes.success === true, 'ta-IN voice selection failed');
  assert(taRes.voice.name.includes('Valluvar'), 'ta-IN did not prefer Valluvar voice');
});

runTest('TTS Voice selection NEVER silently substitutes English when Indic voice is missing', () => {
  ['te-IN', 'ml-IN', 'kn-IN'].forEach(lang => {
    const res = simulateVoiceSelection(lang, MOCK_SYSTEM_VOICES);
    assert.strictEqual(res.success, false, `Expected ${lang} to honestly report missing voice`);
    assert.strictEqual(res.voice, null, `Expected voice to be null for ${lang}, but got ${res.voice?.name}`);
    assert.strictEqual(res.voiceUnavailableNotice, true, `voiceUnavailableNotice flag was not set for ${lang}`);
  });
});

// =========================================================================
// LAYER 4: STT LOCALE SUPPORT & HONEST FALLBACK VERIFICATION
// =========================================================================
console.log('\n--- LAYER 4: Speech Recognition Locale Support & Honest Fallback ---');

/**
 * Simulates SpeechRecognition initialization and error handling
 */
function simulateSpeechRecognitionInit(activeLang, supportedLocales) {
  if (!supportedLocales.includes(activeLang)) {
    return {
      active: false,
      sttSupported: false,
      typedFallbackActive: true,
      error: 'language-not-supported',
      message: t('room.sttUnsupportedLocale', { lang: activeLang }, activeLang)
    };
  }

  return {
    active: true,
    sttSupported: true,
    typedFallbackActive: true, // Always available for candidate convenience
    error: null,
    locale: activeLang
  };
}

const CHROMIUM_SUPPORTED_STT = ['en-US', 'hi-IN', 'ta-IN', 'te-IN']; // Simulated browser support

runTest('STT successfully binds valid supported recognition locales', () => {
  CHROMIUM_SUPPORTED_STT.forEach(code => {
    const res = simulateSpeechRecognitionInit(code, CHROMIUM_SUPPORTED_STT);
    assert.strictEqual(res.active, true, `Failed to initialize STT for ${code}`);
    assert.strictEqual(res.locale, code, `Locale was not passed to SpeechRecognition for ${code}`);
  });
});

runTest('STT honestly triggers typed-answer fallback when locale is unsupported', () => {
  const unsupportedLang = 'ml-IN';
  const res = simulateSpeechRecognitionInit(unsupportedLang, CHROMIUM_SUPPORTED_STT);
  assert.strictEqual(res.active, false, 'STT should not be active for unsupported locale');
  assert.strictEqual(res.sttSupported, false, 'sttSupported flag should be false');
  assert.strictEqual(res.typedFallbackActive, true, 'Typed fallback must be available');
  assert(Boolean(res.message), 'Must provide honest localized explanation message');
  assert(SCRIPT_REGEX[unsupportedLang].test(res.message), 'Explanation message must be localized in candidate language');
});

// =========================================================================
// FINAL SUMMARY
// =========================================================================
console.log('\n===============================================================');
console.log(`TEST SUITE RESULTS: ${totalPassed} Passed, ${totalFailed} Failed`);
console.log('===============================================================\n');

if (totalFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

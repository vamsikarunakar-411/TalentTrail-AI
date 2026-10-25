process.env.NODE_ENV = 'test';
import http from 'http';
import app from './src/index.js';

const TEST_PORT = 5002;

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING COMPREHENSIVE INTERVIEW BACKEND TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function report(name, condition, details = '') {
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name} - ${details}`);
      failed++;
    }
  }

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(TEST_PORT, resolve));
  const BASE_URL = `http://localhost:${TEST_PORT}`;

  try {
    // 1. Test sample candidate profile
    const candidateProfile = {
      name: 'Ananya Rao',
      email: 'ananya.rao@example.com',
      skills: ['React', 'Node.js', 'Express', 'JavaScript', 'PostgreSQL', 'Docker'],
      experience: [
        {
          role: 'Full Stack Engineering Intern',
          company: 'CloudScale Technologies',
          duration: 'Jan 2024 - Jun 2024',
          highlights: ['Engineered backend microservices in Node.js & Express with 99.9% uptime']
        }
      ],
      projects: [
        {
          title: 'Neural Vision Medical Diagnostic Tool',
          description: 'Deep learning imaging pipeline with automated report generation',
          technologies: ['Python', 'Docker', 'PostgreSQL']
        }
      ],
      education: [
        {
          degree: 'B.Tech in Computer Science',
          institution: 'IIT Hyderabad',
          year: '2020 - 2024'
        }
      ]
    };

    // 2. Test Question Generation Endpoint (Default 8 questions)
    console.log('\n--- 1. Testing Question Generation Endpoint ---');
    const genRes = await fetch(`${BASE_URL}/api/interview/generate-questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidate: candidateProfile,
        role: 'Full Stack Developer',
        level: 'Mid-Level (2-5 Years)',
        focus: 'Technical & Coding Depth',
        language: 'en-US',
        totalTurns: 8
      })
    });

    const genData = await genRes.json();
    report('1a. Question generation returns HTTP 200', genRes.status === 200 && genData.success === true);
    report('1b. Generates exactly 8 questions by default', Array.isArray(genData.questions) && genData.questions.length === 8);
    
    const categories = (genData.questions || []).map(q => q.category);
    report('1c. Includes Technical questions', categories.includes('Technical'));
    report('1d. Includes Project-based questions', categories.includes('Project-based'));
    report('1e. Includes Problem-solving questions', categories.includes('Problem-solving'));
    report('1f. Includes HR questions', categories.includes('HR'));

    const techQ = genData.questions?.find(q => q.category === 'Technical');
    report(
      '1g. Technical question grounds candidate skills (React / Node.js)',
      Boolean(techQ?.question?.includes('React') || techQ?.contextRationale?.includes('React') || techQ?.question?.includes('Node.js')),
      `Got: ${techQ?.question}`
    );

    const projQ = genData.questions?.find(q => q.category === 'Project-based');
    report(
      '1h. Project question grounds candidate project ("Neural Vision Medical Diagnostic Tool")',
      Boolean(projQ?.question?.includes('Neural Vision') || projQ?.contextRationale?.includes('Neural Vision')),
      `Got: ${projQ?.question}`
    );

    report(
      '1i. Distinguishes simulation mode from live AI with explicit labels',
      (genData.isSimulation === false && genData.source === 'LIVE_GEMINI_AI') ||
      (genData.isSimulation === true && genData.source === 'SIMULATION_ENGINE')
    );

    report(
      '1j. Telugu questions provided for bilingual support',
      Boolean(techQ?.teluguQuestion && techQ.teluguQuestion.length > 10)
    );

    // 3. Test Missing Candidate on Question Generation
    console.log('\n--- 2. Testing Question Generation Error Handling ---');
    const badGenRes = await fetch(`${BASE_URL}/api/interview/generate-questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const badGenData = await badGenRes.json();
    report(
      '2a. Missing candidate rejected with HTTP 400 and MISSING_CANDIDATE_DATA',
      badGenRes.status === 400 && badGenData.error?.code === 'MISSING_CANDIDATE_DATA'
    );

    // 4. Test Answer Evaluation Endpoint
    console.log('\n--- 3. Testing Answer Evaluation Endpoint ---');
    const sampleAnswer = "In my project at CloudScale Technologies, I architected the state synchronization using React context and custom hooks. On the backend in Node.js, we implemented Redis caching layer with optimistic concurrency control to prevent race conditions during high request volume. We also set up error boundary middleware and comprehensive API logging.";

    const evalRes = await fetch(`${BASE_URL}/api/interview/evaluate-answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: techQ,
        answer: sampleAnswer,
        candidate: candidateProfile,
        role: 'Full Stack Developer',
        level: 'Mid-Level',
        language: 'en-US'
      })
    });

    const evalData = await evalRes.json();
    report('3a. Answer evaluation returns HTTP 200', evalRes.status === 200 && evalData.success === true);
    report('3b. Evaluation score is within 0-100 range', evalData.evaluation?.score >= 0 && evalData.evaluation?.score <= 100);
    report('3c. Category scores provided for all 4 rubrics', 
      Boolean(evalData.evaluation?.categoryScores?.technicalDepth &&
              evalData.evaluation?.categoryScores?.contextualRelevance &&
              evalData.evaluation?.categoryScores?.communicationClarity &&
              evalData.evaluation?.categoryScores?.problemSolving)
    );
    report('3d. Specific strengths generated', Array.isArray(evalData.evaluation?.strengths) && evalData.evaluation.strengths.length > 0);
    report('3e. Missing points / improvement areas provided', Array.isArray(evalData.evaluation?.missingPoints) && evalData.evaluation.missingPoints.length > 0);
    report('3f. Detailed feedback provided', Boolean(evalData.evaluation?.feedback && evalData.evaluation.feedback.length > 20));
    report('3g. Accurately reports evaluation method (Live AI vs Simulation)', 
      (evalData.evaluation?.isSimulation === false && (evalData.evaluation?.evaluationMethod === 'LIVE_GEMINI_AI' || evalData.evaluation?.evaluationMethod === 'GEMINI_AI_RUBRIC_EVALUATION')) ||
      (evalData.evaluation?.isSimulation === true && evalData.evaluation?.evaluationMethod === 'RULE_BASED_RUBRIC_SIMULATION')
    );

    // 5. Test Empty Answer Validation
    console.log('\n--- 4. Testing Empty Answer Validation ---');
    const emptyRes = await fetch(`${BASE_URL}/api/interview/evaluate-answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: techQ,
        answer: "   ",
        candidate: candidateProfile
      })
    });
    const emptyData = await emptyRes.json();
    report(
      '4a. Empty answer rejected with HTTP 400 and EMPTY_ANSWER code',
      emptyRes.status === 400 && emptyData.error?.code === 'EMPTY_ANSWER'
    );

    // 6. Test Interview Completion & Final Summary Endpoint
    console.log('\n--- 5. Testing Interview Completion Endpoint ---');
    const mockSessionHistory = [
      {
        question: genData.questions[0],
        answer: sampleAnswer,
        evaluation: evalData.evaluation
      },
      {
        question: genData.questions[1],
        answer: "For the Neural Vision project, we selected Docker and Python because of TensorFlow container stability. The main trade-off was initial cold-start image load vs runtime execution speed.",
        evaluation: {
          score: 82,
          categoryScores: { technicalDepth: 84, contextualRelevance: 82, communicationClarity: 80, problemSolving: 80 },
          strengths: ['Identified trade-off between cold start and inference speed', 'Clear containerization rationale'],
          missingPoints: ['Could discuss GPU memory pooling'],
          feedback: 'Solid project overview.',
          isSimulation: true
        }
      },
      {
        question: genData.questions[2],
        answer: "If 500 errors spike, step one is checking telemetry metrics in Datadog/Grafana. Next, inspect database connection pool metrics and slow query logs. Then apply rate limiting if traffic is anomalous, and scale worker replicas.",
        evaluation: {
          score: 88,
          categoryScores: { technicalDepth: 90, contextualRelevance: 88, communicationClarity: 86, problemSolving: 88 },
          strengths: ['Methodical triage sequence', 'Clear distinction between diagnosis and mitigation'],
          missingPoints: ['Mention circuit breaker patterns'],
          feedback: 'Excellent troubleshooting clarity.',
          isSimulation: true
        }
      },
      {
        question: genData.questions[3],
        answer: "When our team debated whether to use GraphQL or REST APIs for our analytics dashboard, I set up a quick prototype to benchmark latency and payload sizes. Based on the objective data, the team agreed to adopt REST with selective field filtering, delivering on schedule.",
        evaluation: {
          score: 85,
          categoryScores: { technicalDepth: 82, contextualRelevance: 88, communicationClarity: 86, problemSolving: 84 },
          strengths: ['Utilized STAR format effectively', 'Used objective benchmarking to resolve team debate'],
          missingPoints: ['Could touch upon long-term schema evolution'],
          feedback: 'Strong leadership and communication.',
          isSimulation: true
        }
      }
    ];

    const compRes = await fetch(`${BASE_URL}/api/interview/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidate: candidateProfile,
        role: 'Full Stack Developer',
        level: 'Mid-Level',
        sessionHistory: mockSessionHistory
      })
    });

    const compData = await compRes.json();
    report('5a. Completion summary returns HTTP 200', compRes.status === 200 && compData.success === true);
    report('5b. Computes average score across questions', typeof compData.summary?.averageScore === 'number' && compData.summary.averageScore > 70);
    report('5c. Transparent recommendation assigned (Recommended / Needs Improvement / Not Yet Recommended)', 
      ['Recommended', 'Needs Improvement', 'Not Yet Recommended'].includes(compData.summary?.recommendation)
    );
    report('5d. Evidence-based reasoning provided for recommendation', 
      Boolean(compData.summary?.recommendationReasoning && compData.summary.recommendationReasoning.length > 30)
    );
    report('5e. Prominent educational mock-interview disclaimer present', 
      Boolean(compData.summary?.educationalDisclaimer && compData.summary.educationalDisclaimer.includes('educational practice'))
    );
    report('5f. Aggregates key strengths and improvement areas', 
      Array.isArray(compData.summary?.keyStrengths) && compData.summary.keyStrengths.length > 0 &&
      Array.isArray(compData.summary?.keyImprovementAreas) && compData.summary.keyImprovementAreas.length > 0
    );

    // 6. Test Adaptive Turn Endpoint (Section C, D, E)
    console.log('\n--- 6. Testing Adaptive Turn Endpoint ---');
    const adaptiveRes = await fetch(`${BASE_URL}/api/interview/adaptive-turn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: genData.questions[0],
        answer: 'I use Redis for distributed caching and PostgreSQL with connection pooling. Under heavy loads, caching reduces database reads by 85%.',
        candidate: candidateProfile,
        turnIndex: 1,
        totalTurns: 6,
        sessionHistory: [],
        role: 'Full Stack Developer',
        level: 'Mid-Level',
        language: 'en-US'
      })
    });

    const adaptiveData = await adaptiveRes.json();
    report('6a. Adaptive turn returns HTTP 200', adaptiveRes.status === 200 && adaptiveData.success === true);
    report('6b. Evaluates candidate answer internally', typeof adaptiveData.evaluation?.score === 'number');
    report('6c. Generates nextQuestion adaptive progression', Boolean(adaptiveData.nextQuestion?.question));
    report(
      '6d. Adaptive question is distinct and non-duplicate of previous question',
      Boolean(adaptiveData.nextQuestion?.id !== genData.questions[0]?.id && adaptiveData.nextQuestion?.question !== genData.questions[0]?.question),
      `Got: ${adaptiveData.nextQuestion?.question}`
    );
    report('6e. Identifies not final turn when turnIndex < totalTurns', adaptiveData.isFinalTurn === false);

    // Test final turn behavior
    const finalTurnRes = await fetch(`${BASE_URL}/api/interview/adaptive-turn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: genData.questions[3],
        answer: 'I worked closely with cross-functional partners and delivered the project on time.',
        candidate: candidateProfile,
        turnIndex: 6,
        totalTurns: 6,
        sessionHistory: mockSessionHistory,
        role: 'Full Stack Developer',
        level: 'Mid-Level',
        language: 'en-US'
      })
    });
    const finalTurnData = await finalTurnRes.json();
    report('6f. Final turn identifies isFinalTurn=true with nextQuestion=null', 
      finalTurnData.isFinalTurn === true && finalTurnData.nextQuestion === null
    );

    // Test empty answer rejection
    const emptyTurnRes = await fetch(`${BASE_URL}/api/interview/adaptive-turn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: genData.questions[0],
        answer: '   ',
        candidate: candidateProfile,
        turnIndex: 1,
        totalTurns: 6
      })
    });
    report('6g. Empty turn answer returns HTTP 400', emptyTurnRes.status === 400);

    // 7. Deduplication & Anti-Repetition Regression Suite (Section 2 of prompt)
    console.log('\n--- 7. Deduplication & Anti-Repetition Regression Suite ---');
    const { isDuplicateOrParaphrase, computeJaccardSimilarity, normalizeQuestionText } = await import('./src/services/questionManager.js');

    const baseQ = {
      id: 'q_test_1',
      question: 'How do you architect distributed caching to prevent cache stampedes in a multi-node system?'
    };

    // Test exact ID match
    const exactIdDup = isDuplicateOrParaphrase({ id: 'q_test_1', question: 'Different text entirely' }, [baseQ]);
    report('7a. Flags exact question ID as duplicate', exactIdDup.isDuplicate === true && exactIdDup.reason === 'EXACT_ID_MATCH');

    // Test exact text match
    const exactTextDup = isDuplicateOrParaphrase({ id: 'q_test_2', question: 'How do you architect distributed caching to prevent cache stampedes in a multi-node system?' }, [baseQ]);
    report('7b. Flags exact question text as duplicate', exactTextDup.isDuplicate === true && exactTextDup.reason === 'EXACT_TEXT_MATCH');

    // Test paraphrased duplicate (>50% Jaccard token overlap)
    const paraphraseCandidate = {
      id: 'q_test_3',
      question: 'In a multi-node system, how do you design distributed caching to avoid cache stampede issues?'
    };
    const paraphraseDup = isDuplicateOrParaphrase(paraphraseCandidate, [baseQ]);
    report(
      '7c. Flags semantically paraphrased question (>=40% Jaccard) as duplicate',
      paraphraseDup.isDuplicate === true && paraphraseDup.similarity >= 0.40,
      `Similarity: ${paraphraseDup.similarity}, reason: ${paraphraseDup.reason}`
    );

    // Test genuinely distinct question is NOT flagged as duplicate
    const distinctCandidate = {
      id: 'q_test_4',
      question: 'Tell me about a time when you had a major disagreement with a product manager over project scope and deadlines.'
    };
    const distinctCheck = isDuplicateOrParaphrase(distinctCandidate, [baseQ]);
    report('7d. Allows genuinely distinct question across different domains', distinctCheck.isDuplicate === false);

    // 8. Full 8-Turn Complete Interview Progression with ZERO duplicates
    console.log('\n--- 8. Full 8-Turn Interview Progression with ZERO Duplicates ---');
    let sessionHistoryProgression = [];
    let currentQ = genData.questions[0];
    let progressionHasDuplicates = false;
    const askedQuestionIds = new Set();
    const askedQuestionTexts = new Set();

    for (let turn = 1; turn <= 8; turn++) {
      if (askedQuestionIds.has(currentQ.id) || askedQuestionTexts.has(normalizeQuestionText(currentQ.question))) {
        progressionHasDuplicates = true;
        console.error(`Duplicate detected at turn ${turn}: [${currentQ.id}] "${currentQ.question}"`);
      }
      askedQuestionIds.add(currentQ.id);
      askedQuestionTexts.add(normalizeQuestionText(currentQ.question));

      sessionHistoryProgression.push({
        question: currentQ,
        answer: `Comprehensive answer for turn ${turn} detailing architectural trade-offs, metrics, and STAR structured delivery.`,
        evaluation: { score: 85, isSimulation: true }
      });

      if (turn < 8) {
        const turnRes = await fetch(`${BASE_URL}/api/interview/adaptive-turn`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: currentQ,
            answer: `Answer for turn ${turn} demonstrating deep technical and project execution.`,
            candidate: candidateProfile,
            turnIndex: turn,
            totalTurns: 8,
            sessionHistory: sessionHistoryProgression,
            role: 'Full Stack Developer',
            level: 'Mid-Level',
            language: 'en-US'
          })
        });
        const turnData = await turnRes.json();
        currentQ = turnData.nextQuestion;
      }
    }

    report('8a. Progresses through all 8 turns with ZERO duplicate question IDs', askedQuestionIds.size === 8 && !progressionHasDuplicates);
    report('8b. Progresses through all 8 turns with ZERO duplicate question texts', askedQuestionTexts.size === 8 && !progressionHasDuplicates);

    // 9. Six Languages Coverage Test
    console.log('\n--- 9. Six Languages Coverage Verification ---');
    const languages = [
      { code: 'te-IN', name: 'Telugu', field: 'teluguQuestion' },
      { code: 'en-US', name: 'English', field: 'question' },
      { code: 'ml-IN', name: 'Malayalam', field: 'malayalamQuestion' },
      { code: 'kn-IN', name: 'Kannada', field: 'kannadaQuestion' },
      { code: 'hi-IN', name: 'Hindi', field: 'hindiQuestion' },
      { code: 'ta-IN', name: 'Tamil', field: 'tamilQuestion' }
    ];

    for (const lang of languages) {
      const langGenRes = await fetch(`${BASE_URL}/api/interview/generate-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate: candidateProfile,
          role: 'Full Stack Developer',
          level: 'Mid-Level',
          focus: 'Technical',
          language: lang.code,
          totalTurns: 8
        })
      });
      const langData = await langGenRes.json();
      const hasAllTranslations = langData.questions?.every(q => Boolean(q[lang.field] || q.activeLanguageText));
      report(`9.${lang.name}. Generates full question sequence with valid ${lang.name} translations`, Boolean(hasAllTranslations));
    }

    // 10. Branding Audit in Server Outputs
    console.log('\n--- 10. Branding Audit in Server Outputs ---');
    const stringifiedAll = JSON.stringify([genData, adaptiveData, compData]);
    const hasOldHCL = /HCL|Berri/i.test(stringifiedAll);
    report('10a. Zero obsolete HCL / Berri / BerriAI references in API outputs', !hasOldHCL);
  } catch (err) {
    report('Unexpected test suite error', false, err.message);
  } finally {
    console.log('\n====================================================');
    console.log(`📊 INTERVIEW TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');
    server.close();
    if (failed > 0) {
      process.exitCode = 1;
    }
  }
}

runTests();

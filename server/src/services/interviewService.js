import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');

dotenv.config({ path: envPath });

import {
  isDuplicateOrParaphrase,
  computeJaccardSimilarity,
  generateDistinctQuestionSequence,
  selectAdaptiveNextQuestion,
  MULTI_DOMAIN_QUESTION_BANK
} from './questionManager.js';

let GoogleGenAIClass = null;
try {
  const genaiModule = await import('@google/genai');
  GoogleGenAIClass = genaiModule.GoogleGenAI;
} catch (e) {
  console.warn('[INTERVIEW SERVICE] @google/genai not dynamically loaded:', e.message);
}

/**
 * Retrieve dynamic Gemini configuration safely
 */
export function getGeminiConfig() {
  try {
    dotenv.config({ path: envPath, override: true });
  } catch {
    // Ignored
  }
  const rawKey = (process.env.GEMINI_API_KEY || '').trim();
  const hasApiKey = rawKey.length > 0 && rawKey !== 'YOUR_KEY_HERE';
  const configuredModel = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
  return {
    apiKey: hasApiKey ? rawKey : '',
    hasApiKey,
    configuredModel,
    activeModel: hasApiKey ? configuredModel : null,
    mode: hasApiKey ? 'LIVE_AI' : 'SIMULATION_MODE',
    simulationReason: hasApiKey ? null : 'NO_API_KEY_CONFIGURED'
  };
}

/**
 * Deterministic fallback question generator grounded in parsed candidate resume
 */
/**
 * Deterministic fallback question generator grounded in parsed candidate resume
 */
export function generateSimulationQuestions(candidate, role = 'Full Stack Developer', level = 'Mid-Level', focus = 'Technical', language = 'en-US', totalTurns = 8) {
  return generateDistinctQuestionSequence({
    candidate,
    role,
    level,
    focus,
    language,
    totalTurns: Number(totalTurns) || 8
  });
}

/**
 * Generate interview questions via Gemini or fallback simulation with zero duplicates
 */
export async function generateInterviewQuestions({
  candidate,
  role = 'Full Stack Developer',
  level = 'Mid-Level',
  focus = 'Technical',
  language = 'en-US',
  totalTurns = 8
}) {
  const turnsCount = Math.max(4, Math.min(12, Number(totalTurns) || 8));
  const { apiKey, hasApiKey, configuredModel } = getGeminiConfig();
  let failureReason = null;

  if (hasApiKey && GoogleGenAIClass) {
    try {
      const ai = new GoogleGenAIClass({ apiKey });
      const prompt = `You are Ismav, a senior AI technical interviewer at TalentTrail AI conducting a professional mock interview for the role of "${role}" (${level}), focusing on "${focus}".
The candidate's parsed resume details:
Candidate Name: ${candidate?.name || 'Candidate'}
Skills: ${(candidate?.skills || []).join(', ') || 'General Software Engineering'}
Experience: ${(candidate?.experience || []).map(e => `${e.role} at ${e.company} (${e.duration}): ${(e.highlights || []).join('; ')}`).join(' | ') || 'None listed'}
Projects: ${(candidate?.projects || []).map(p => `${p.title} (${p.description}) using ${(p.technologies || []).join(', ')}`).join(' | ') || 'None listed'}
Education: ${(candidate?.education || []).map(ed => `${ed.degree} at ${ed.institution}`).join(' | ') || 'Engineering'}

CRITICAL REQUIREMENT:
Generate exactly ${turnsCount} completely DISTINCT, UNIQUE interview questions strictly grounded in the candidate's actual resume items.
The questions MUST explicitly include all of these categories across the sequence:
1. "Technical" (grounded in candidate's skills)
2. "Project-based" (grounded in candidate's specific project: "${candidate?.projects?.[0]?.title || 'Key Project'}")
3. "Problem-solving" (concurrency, system trade-offs, architecture, edge cases)
4. "HR" (behavioral leadership, conflict resolution, STAR method)

For each question object in the array, the "category" field MUST be EXACTLY one of: "Technical", "Project-based", "Problem-solving", or "HR".
Ensure the "teluguQuestion", "malayalamQuestion", "kannadaQuestion", "hindiQuestion", and "tamilQuestion" fields contain natural, fluent translations of the question in Telugu, Malayalam, Kannada, Hindi, and Tamil scripts respectively.

ABSOLUTELY NO DUPLICATES or paraphrased questions. Each question must target a completely distinct technical or behavioral domain.
Return a JSON array of ${turnsCount} objects with this exact structure:
[
  {
    "id": "q_gen_1",
    "number": 1,
    "category": "Technical",
    "categoryLabel": "Technical Depth & Architecture",
    "domain": "core_technical",
    "weight": "25%",
    "contextRationale": "Grounded in resume skills: ...",
    "question": "English question text...",
    "teluguQuestion": "Telugu question text...",
    "malayalamQuestion": "Malayalam question text...",
    "kannadaQuestion": "Kannada question text...",
    "hindiQuestion": "Hindi question text...",
    "tamilQuestion": "Tamil question text...",
    "sampleIdealPoints": ["point 1", "point 2"]
  }
]
Output ONLY valid JSON. No markdown fences or commentary.`;

      const candidateModels = Array.from(new Set([configuredModel, 'gemini-3.5-flash-lite', 'gemini-3.5-flash']));
      let response = null;
      let effectiveModel = configuredModel;
      for (const m of candidateModels) {
        try {
          response = await ai.models.generateContent({
            model: m,
            contents: prompt
          });
          effectiveModel = m;
          break;
        } catch (mErr) {
          console.warn(`[INTERVIEW SERVICE] Model ${m} attempt failed (${mErr.message}), trying next candidate...`);
        }
      }
      if (!response) {
        throw new Error('All candidate Gemini models were unavailable or returned high demand errors.');
      }

      const rawText = response.text || '';
      let cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const match = cleanJson.match(/\[[\s\S]*\]/);
      if (match) cleanJson = match[0];
      const parsed = JSON.parse(cleanJson);

      if (Array.isArray(parsed) && parsed.length > 0) {
        // Validate each question with deduplication against prior accepted questions
        const validatedQuestions = [];
        for (let i = 0; i < parsed.length; i++) {
          const cand = parsed[i];
          if (!cand.question) continue;

          let cat = cand.category || 'Technical';
          if (/project/i.test(cat) || (i === 1 && candidate?.projects?.length > 0)) {
            cat = 'Project-based';
          } else if (/problem|algorithm|design|trade-off/i.test(cat) || i === 2) {
            cat = 'Problem-solving';
          } else if (/hr|behavioral|lead|team|conflict/i.test(cat) || i === 3) {
            cat = 'HR';
          } else {
            cat = 'Technical';
          }

          let rationale = cand.contextRationale || '';
          if (cat === 'Project-based' && candidate?.projects?.[0]?.title) {
            rationale = `Grounded in project: ${candidate.projects[0].title}`;
            if (!cand.question.toLowerCase().includes(candidate.projects[0].title.toLowerCase())) {
              cand.question = `Regarding your project "${candidate.projects[0].title}": ${cand.question}`;
            }
          }

          const dupCheck = isDuplicateOrParaphrase(cand, validatedQuestions);
          if (!dupCheck.isDuplicate) {
            const langCode = (language || 'en-US').toLowerCase();
            const teluguQ = cand.teluguQuestion || `${cand.question} (దయచేసి వివరించండి)`;
            const malayalamQ = cand.malayalamQuestion || `${cand.question} (ദയവായി വിശദീകരിക്കുക)`;
            const kannadaQ = cand.kannadaQuestion || `${cand.question} (ದಯವಿಟ್ಟು ವಿವರಿಸಿ)`;
            const hindiQ = cand.hindiQuestion || `${cand.question} (कृपया विस्तार से बताएं)`;
            const tamilQ = cand.tamilQuestion || `${cand.question} (தயவுசெய்து விளக்குங்கள்)`;
            const activeText = langCode.startsWith('te') ? teluguQ :
                              langCode.startsWith('ml') ? malayalamQ :
                              langCode.startsWith('kn') ? kannadaQ :
                              langCode.startsWith('hi') ? hindiQ :
                              langCode.startsWith('ta') ? tamilQ :
                              cand.question;

            validatedQuestions.push({
              ...cand,
              category: cat,
              categoryLabel: cat === 'Technical' ? 'Technical Depth & Architecture' : cat === 'Project-based' ? 'Project Architecture & Decisions' : cat === 'Problem-solving' ? 'Problem Solving & Systems Thinking' : 'Behavioral & Leadership',
              contextRationale: rationale || cand.contextRationale || 'Resume-grounded question',
              teluguQuestion: teluguQ,
              malayalamQuestion: malayalamQ,
              kannadaQuestion: kannadaQ,
              hindiQuestion: hindiQ,
              tamilQuestion: tamilQ,
              activeLanguageText: activeText,
              id: cand.id || `q_gemini_${validatedQuestions.length + 1}_${Date.now()}`,
              number: validatedQuestions.length + 1,
              isSimulation: false,
              source: 'LIVE_GEMINI_AI',
              activeModel: effectiveModel,
              configuredModel
            });
          }
        }

        // If Gemini provided enough unique questions
        if (validatedQuestions.length >= turnsCount) {
          return {
            success: true,
            isSimulation: false,
            source: 'LIVE_GEMINI_AI',
            activeModel: effectiveModel,
            configuredModel,
            simulationReason: null,
            generationBadge: 'Gemini Generative Engine',
            questions: validatedQuestions.slice(0, turnsCount)
          };
        }

        // If fewer than turnsCount unique questions, fill the remainder with distinct multi-domain bank
        const fallbackBank = generateDistinctQuestionSequence({
          candidate,
          role,
          level,
          focus,
          language,
          totalTurns: turnsCount
        });

        for (const fbQ of fallbackBank) {
          if (validatedQuestions.length >= turnsCount) break;
          const dupCheck = isDuplicateOrParaphrase(fbQ, validatedQuestions);
          if (!dupCheck.isDuplicate) {
            validatedQuestions.push({
              ...fbQ,
              number: validatedQuestions.length + 1
            });
          }
        }

        return {
          success: true,
          isSimulation: false,
          source: 'LIVE_GEMINI_AI',
          activeModel: configuredModel,
          configuredModel,
          simulationReason: null,
          generationBadge: 'Gemini Generative Engine (Hybrid Deduplicated)',
          questions: validatedQuestions
        };
      }
    } catch (err) {
      failureReason = `API_ERROR: ${err.message}`;
      console.warn('[INTERVIEW SERVICE] Gemini question generation failed (' + err.message + '), falling back to deterministic deduplicated sequence');
    }
  }

  // Deterministic multi-domain sequence with guaranteed zero duplicates
  const simQuestions = generateSimulationQuestions(candidate, role, level, focus, language, turnsCount);
  return {
    success: true,
    isSimulation: true,
    source: 'SIMULATION_ENGINE',
    activeModel: null,
    configuredModel,
    simulationReason: hasApiKey ? failureReason : 'NO_API_KEY_CONFIGURED',
    generationBadge: 'Resume Grounded (Simulation Mode)',
    notice: hasApiKey
      ? `Gemini API call failed (${failureReason}) — switched to deterministic rubric engine.`
      : 'Questions deterministically generated from parsed candidate resume without external API calls.',
    questions: simQuestions
  };
}

/**
 * Deterministic rubric-based answer evaluator
 */
export function evaluateAnswerSimulation({ question, answer, candidate, role, level, language, simulationReason }) {
  const cleanAnswer = (answer || '').trim();
  const wordCount = cleanAnswer.split(/\s+/).filter(Boolean).length;

  // Domain terms to check for grounding and depth
  const resumeSkills = (candidate?.skills || []).map(s => s.toLowerCase());
  const technicalTerms = [
    'architecture', 'latency', 'caching', 'redis', 'database', 'async', 'promise',
    'concurrency', 'state', 'component', 'api', 'microservice', 'docker', 'scale',
    'benchmark', 'security', 'token', 'index', 'query', 'star', 'situation',
    'metric', 'log', 'monitoring', 'trade-off', 'load', 'optimization', 'test'
  ];

  const matchedKeywords = technicalTerms.filter(term => cleanAnswer.toLowerCase().includes(term));
  const matchedSkills = resumeSkills.filter(skill => cleanAnswer.toLowerCase().includes(skill));

  let technicalDepth = 65;
  let contextualRelevance = 70;
  let communicationClarity = 70;
  let problemSolving = 65;

  // Length & depth scoring
  if (wordCount >= 70) {
    technicalDepth += 18;
    communicationClarity += 15;
    problemSolving += 15;
  } else if (wordCount >= 35) {
    technicalDepth += 10;
    communicationClarity += 10;
    problemSolving += 8;
  } else if (wordCount < 15) {
    technicalDepth -= 25;
    contextualRelevance -= 20;
    communicationClarity -= 20;
    problemSolving -= 25;
  }

  // Keyword relevance boost
  const keywordBonus = Math.min(matchedKeywords.length * 4, 16);
  technicalDepth += keywordBonus;
  problemSolving += Math.min(matchedKeywords.length * 3, 12);

  // Skill grounding boost
  if (matchedSkills.length > 0) {
    contextualRelevance += Math.min(matchedSkills.length * 5, 15);
  }

  // Structure keywords (e.g. STAR or methodical words)
  const structureWords = ['first', 'initially', 'then', 'because', 'result', 'therefore', 'trade-off', 'for example', 'measure'];
  const hasStructure = structureWords.some(w => cleanAnswer.toLowerCase().includes(w));
  if (hasStructure) {
    communicationClarity += 8;
    problemSolving += 6;
  }

  // Cap between 20 and 96
  const clamp = (val) => Math.max(25, Math.min(96, Math.round(val)));
  const scores = {
    technicalDepth: clamp(technicalDepth),
    contextualRelevance: clamp(contextualRelevance),
    communicationClarity: clamp(communicationClarity),
    problemSolving: clamp(problemSolving)
  };

  // Weighted overall score: Tech 35%, Relevance 30%, Comm 20%, Problem 15%
  const overallScore = Math.round(
    scores.technicalDepth * 0.35 +
    scores.contextualRelevance * 0.30 +
    scores.communicationClarity * 0.20 +
    scores.problemSolving * 0.15
  );

  // Generate evidence-based strengths
  const strengths = [];
  if (wordCount >= 35) {
    strengths.push('Provided a comprehensive and articulate explanation with appropriate technical detail.');
  } else {
    strengths.push('Directly targeted the core question subject concisely.');
  }

  if (matchedKeywords.length > 0 || matchedSkills.length > 0) {
    const cited = [...matchedSkills, ...matchedKeywords].slice(0, 3).join(', ');
    strengths.push(`Effective conceptual application referencing domain concepts (${cited}).`);
  } else {
    strengths.push('Exhibited clear conversational understanding of the interview prompt.');
  }

  if (hasStructure) {
    strengths.push('Structured response logically with clear sequential reasoning.');
  }

  // Generate evidence-based missing points
  const missingPoints = [];
  if (wordCount < 40) {
    missingPoints.push('Elaborate with concrete architectural examples or metrics achieved (e.g., latency numbers, QPS).');
  }
  if (!cleanAnswer.toLowerCase().includes('trade-off')) {
    missingPoints.push('Discuss alternative approaches and technical trade-offs considered.');
  }
  if (question.category === 'Problem-solving' && !cleanAnswer.toLowerCase().includes('log') && !cleanAnswer.toLowerCase().includes('metric')) {
    missingPoints.push('Mention observability tools and proactive alerting (e.g., Prometheus, APM telemetry).');
  }

  if (missingPoints.length === 0) {
    missingPoints.push('Consider detailing long-term maintenance and unit/integration testing strategies.');
  }

  let feedback = '';
  const topicLabel = (question.categoryLabel || question.category || 'the topic').toLowerCase();
  if (overallScore >= 80) {
    feedback = `Strong response demonstrating solid grasp of ${topicLabel}. The candidate clearly addressed the core prompt while maintaining professional engineering terminology.`;
  } else if (overallScore >= 65) {
    feedback = `Good foundational response addressing the prompt. To reach senior calibration, provide deeper architectural specifics, quantitative impact metrics, and explicit trade-off justification.`;
  } else {
    feedback = `The response offers basic familiarity but remains surface-level. For a ${role} interview, expand on implementation mechanics, edge-case mitigation, and methodical problem-solving.`;
  }

  // Localized feedback across 6 languages
  const localizedFeedback = {
    'te-IN': overallScore >= 80
      ? `${topicLabel} పై మీ వివరణ చాలా బాగుంది. ముఖ్య భావనలను చక్కగా వివరించారు.`
      : overallScore >= 65
      ? `${topicLabel} పై మంచి పునాది సమాధానం. ఆర్కిటెక్చరల్ వివరాలు మరియు మెట్రిక్స్‌పై మరింత దృష్టి పెట్టండి.`
      : `${topicLabel} పై మీ సమాధానం ప్రాథమిక స్థాయిలో ఉంది. సమస్య పరిష్కార విధానాన్ని మరింత వివరంగా వివరించండి.`,
    'hi-IN': overallScore >= 80
      ? `${topicLabel} पर आपकी प्रतिक्रिया बहुत अच्छी है। प्रमुख अवधारणाओं को स्पष्ट रूप से समझाया गया।`
      : overallScore >= 65
      ? `${topicLabel} पर एक अच्छा बुनियादी उत्तर। वास्तुशिल्प विवरण और मेट्रिक्स पर अधिक ध्यान दें।`
      : `${topicLabel} पर आपकी प्रतिक्रिया बुनियादी स्तर पर है। समस्या समाधान के दृष्टिकोण को और विस्तार से बताएं।`,
    'ta-IN': overallScore >= 80
      ? `${topicLabel} குறித்த உங்கள் பதில் சிறப்பானது. முக்கிய கருத்துக்கள் தெளிவாக விளக்கப்பட்டுள்ளன.`
      : overallScore >= 65
      ? `${topicLabel} குறித்த திருப்திகரமான அடிப்படை பதில். கட்டமைப்பு விவரங்களை மேலும் விரிவாக விவரிக்கவும்.`
      : `${topicLabel} குறித்த உங்கள் பதில் ஆரம்ப நிலையில் உள்ளது. நடைமுறை தீர்வுகளை இன்னும் ஆழமாக விளக்குங்கள்.`,
    'kn-IN': overallScore >= 80
      ? `${topicLabel} ಕುರಿತು ನಿಮ್ಮ ವಿವರಣೆ ಅತ್ಯುತ್ತಮವಾಗಿದೆ. ಪ್ರಮುಖ ತಾಂತ್ರಿಕ ಪರಿಕಲ್ಪನೆಗಳನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ವಿವರಿಸಲಾಗಿದೆ.`
      : overallScore >= 65
      ? `${topicLabel} ಕುರಿತು ಉತ್ತಮ ಮೂಲಭೂತ ಪ್ರತಿಕ್ರಿಯೆ. ವಾಸ್ತುಶಿಲ್ಪದ ವಿವರಗಳ ಮೇಲೆ ಹೆಚ್ಚಿನ ಗಮನ ನೀಡಿ.`
      : `${topicLabel} ಕುರಿತು ನಿಮ್ಮ ಪ್ರತಿಕ್ರಿಯೆ ಆರಂಭಿಕ ಹಂತದಲ್ಲಿದೆ. ಸಮಸ್ಯೆ ಪರಿಹರಿಸುವ ವಿಧಾನವನ್ನು ಮತ್ತಷ್ಟು ವಿಸ್ತರಿಸಿ.`,
    'ml-IN': overallScore >= 80
      ? `${topicLabel} സംബന്ധിച്ച നിങ്ങളുടെ വിശദീകരണം മികച്ചതാണ്. പ്രധാന ആശയങ്ങൾ വ്യക്തമായി പ്രതിപാദിച്ചു.`
      : overallScore >= 65
      ? `${topicLabel} സംബന്ധിച്ച മികച്ച അടിസ്ഥാനപരമായ ഉത്തരം. കൂടുതൽ സാങ്കേതിക വിശദാംശങ്ങൾ നൽകാൻ ശ്രദ്ധിക്കുക.`
      : `${topicLabel} സംബന്ധിച്ച നിങ്ങളുടെ മറുപടി പ്രാഥമിക തലത്തിലാണ്. പ്രശ്നപരിഹാര രീതി കൂടുതൽ ആഴത്തിൽ വ്യക്തമാക്കുക.`
  };

  const finalFeedback = (language && localizedFeedback[language]) ? localizedFeedback[language] : feedback;

  const { configuredModel } = getGeminiConfig();
  return {
    score: overallScore,
    categoryScores: scores,
    strengths: strengths.slice(0, 3),
    missingPoints: missingPoints.slice(0, 2),
    feedback: finalFeedback,
    wordCount,
    isSimulation: true,
    activeModel: null,
    configuredModel,
    simulationReason: simulationReason || 'NO_API_KEY_CONFIGURED',
    evaluationMethod: 'RULE_BASED_RUBRIC_SIMULATION',
    evaluationNotice: simulationReason?.startsWith('API_ERROR')
      ? `Gemini API call failed (${simulationReason.replace('API_ERROR: ', '')}) — evaluated via deterministic rubric simulation.`
      : 'Evaluated using deterministic rubric simulation (No external LLM API used).'
  };
}

/**
 * Evaluate submitted candidate answer
 */
export async function evaluateAnswer({ question, answer, candidate, role = 'Full Stack Developer', level = 'Mid-Level', language = 'en-US' }) {
  const cleanAnswer = (answer || '').trim();

  // Validate empty answers
  if (!cleanAnswer) {
    const error = new Error('Answer cannot be empty. Please provide a typed or spoken answer before submitting.');
    error.status = 400;
    error.code = 'EMPTY_ANSWER';
    throw error;
  }

  const { apiKey, hasApiKey, configuredModel } = getGeminiConfig();
  let failureReason = null;

  if (hasApiKey && GoogleGenAIClass) {
    try {
      const ai = new GoogleGenAIClass({ apiKey });
      const prompt = `You are a senior technical interviewer scoring a candidate answer according to strict rubrics.
Role: ${role} (${level})
Interview Language: ${language}
Question Category: ${question?.category || 'Technical'} (${question?.categoryLabel || 'Technical Depth'})
Context Rationale: ${question?.contextRationale || 'Resume grounded'}
Question Asked: "${question?.question || 'Technical assessment question'}"
Candidate Resume Skills: ${(candidate?.skills || []).join(', ')}
Candidate Answer Submitted: "${cleanAnswer}"

Score the answer on 4 rubrics from 0-100:
1. technicalDepth (weight 35%): Accuracy of concepts, terminology, system design
2. contextualRelevance (weight 30%): Directly addresses the prompt without rambling
3. communicationClarity (weight 20%): Clarity, professional tone, structured flow
4. problemSolving (weight 15%): Trade-off analysis, edge cases, mitigation

Compute overallScore = round(technicalDepth*0.35 + contextualRelevance*0.30 + communicationClarity*0.20 + problemSolving*0.15).
Provide strengths, missingPoints, and feedback in a professional and constructive manner, tailored for the candidate in their selected interview language (${language}).

Return strict JSON with this exact structure:
{
  "score": 85,
  "categoryScores": {
    "technicalDepth": 85,
    "contextualRelevance": 90,
    "communicationClarity": 80,
    "problemSolving": 80
  },
  "strengths": ["Clear explanation of caching", "Mentioned graceful degradation"],
  "missingPoints": ["Did not mention database write bottlenecks"],
  "feedback": "Comprehensive constructive paragraph...",
  "isSimulation": false,
  "evaluationMethod": "LIVE_GEMINI_AI"
}
Output ONLY valid JSON. No markdown fences.`;

      const candidateModels = Array.from(new Set([configuredModel, 'gemini-3.5-flash-lite', 'gemini-3.5-flash']));
      let response = null;
      let effectiveModel = configuredModel;
      for (const m of candidateModels) {
        try {
          response = await ai.models.generateContent({
            model: m,
            contents: prompt
          });
          effectiveModel = m;
          break;
        } catch (mErr) {
          console.warn(`[INTERVIEW SERVICE] Model ${m} evaluation attempt failed (${mErr.message}), trying next candidate...`);
        }
      }
      if (!response) {
        throw new Error('All candidate Gemini models were unavailable or returned high demand errors.');
      }

      const rawText = response.text || '';
      let cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const match = cleanJson.match(/\{[\s\S]*\}/);
      if (match) cleanJson = match[0];
      const parsed = JSON.parse(cleanJson);

      if (parsed && typeof parsed.score === 'number') {
        return {
          ...parsed,
          wordCount: cleanAnswer.split(/\s+/).filter(Boolean).length,
          isSimulation: false,
          activeModel: effectiveModel,
          configuredModel,
          simulationReason: null,
          evaluationMethod: 'LIVE_GEMINI_AI',
          evaluationNotice: `Evaluated by Google Gemini (${effectiveModel})`
        };
      }
    } catch (err) {
      failureReason = `API_ERROR: ${err.message}`;
      console.warn('[INTERVIEW SERVICE] Gemini answer evaluation failed (' + err.message + '), falling back to deterministic simulation');
    }
  }

  // Deterministic simulation fallback
  return evaluateAnswerSimulation({
    question,
    answer: cleanAnswer,
    candidate,
    role,
    level,
    language,
    simulationReason: hasApiKey ? failureReason : 'NO_API_KEY_CONFIGURED'
  });
}

/**
 * Generate final interview summary, scores, and transparent recommendation
 */
export function summarizeInterview({
  candidate,
  role = 'Full Stack Developer',
  level = 'Mid-Level',
  sessionHistory = [],
  language = 'en-US',
  terminationStatus = null,
  terminationReason = null,
  terminatedAt = null
}) {
  const safeHistory = Array.isArray(sessionHistory) ? sessionHistory : [];
  if (safeHistory.length === 0 && !terminationStatus) {
    const error = new Error('No interview questions or answers provided for completion.');
    error.status = 400;
    error.code = 'NO_SESSION_DATA';
    throw error;
  }

  const totalQuestions = safeHistory.length;
  const totalScore = safeHistory.reduce((acc, curr) => acc + (curr.evaluation?.score || 0), 0);
  const averageScore = totalQuestions > 0 ? Math.round(totalScore / totalQuestions) : 0;

  // Category breakdowns
  const categoryScores = {
    technical: [],
    project: [],
    problemSolving: [],
    hr: []
  };

  safeHistory.forEach(item => {
    const cat = item.question?.category?.toLowerCase() || '';
    const score = item.evaluation?.score || 0;
    if (cat.includes('tech')) categoryScores.technical.push(score);
    else if (cat.includes('proj')) categoryScores.project.push(score);
    else if (cat.includes('prob')) categoryScores.problemSolving.push(score);
    else categoryScores.hr.push(score);
  });

  const avg = (arr) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : averageScore;

  const categoryAverages = {
    technical: avg(categoryScores.technical),
    project: avg(categoryScores.project),
    problemSolving: avg(categoryScores.problemSolving),
    hr: avg(categoryScores.hr)
  };

  // Evidence-based transparent recommendation
  let recommendation = 'Recommended';
  let recommendationBadgeClass = 'badge-emerald';
  let recommendationReasoning = '';

  if (terminationStatus === 'terminated_face_absent') {
    recommendation = totalQuestions > 0 ? 'Terminated: Candidate Absent' : 'Interview Terminated';
    recommendationBadgeClass = 'badge-rose';
    recommendationReasoning = totalQuestions > 0
      ? `The interview was automatically terminated after ${totalQuestions} question(s) because candidate face presence was not detected in the camera feed for 30 consecutive seconds. All recoverable answers prior to termination were saved with an average score of ${averageScore}/100.`
      : 'The interview was automatically terminated because candidate face presence was not detected in the camera feed for 30 consecutive seconds before responses could be recorded.';
  } else if (averageScore >= 75) {
    recommendation = 'Recommended';
    recommendationBadgeClass = 'badge-emerald';
    recommendationReasoning = `The candidate demonstrated strong proficiency across both domain technical depth (${categoryAverages.technical}/100) and project architecture (${categoryAverages.project}/100), effectively grounding explanations in their resume background. Their problem-solving approach exhibited solid engineering reasoning.`;
  } else if (averageScore >= 60) {
    recommendation = 'Needs Improvement';
    recommendationBadgeClass = 'badge-amber';
    recommendationReasoning = `The candidate displays satisfactory conceptual understanding (${averageScore}/100) but would benefit from deeper elaboration on architectural trade-offs, quantitative metrics, and production-grade edge cases in high-concurrency systems.`;
  } else {
    recommendation = 'Not Yet Recommended';
    recommendationBadgeClass = 'badge-rose';
    recommendationReasoning = `The candidate provided brief or introductory-level answers averaging ${averageScore}/100. Additional preparation in core technical implementation mechanics and systematic problem troubleshooting is advised prior to formal senior evaluation.`;
  }

  // Compile top overall strengths & improvement areas
  const allStrengths = [];
  const allMissing = [];

  sessionHistory.forEach(item => {
    if (Array.isArray(item.evaluation?.strengths)) {
      allStrengths.push(...item.evaluation.strengths);
    }
    if (Array.isArray(item.evaluation?.missingPoints)) {
      allMissing.push(...item.evaluation.missingPoints);
    }
  });

  // Deduplicate
  const uniqueStrengths = [...new Set(allStrengths)].slice(0, 4);
  const uniqueImprovementAreas = [...new Set(allMissing)].slice(0, 3);

  const isSimulation = sessionHistory.some(item => item.evaluation?.isSimulation === true);
  const { configuredModel } = getGeminiConfig();
  const activeModel = isSimulation ? null : configuredModel;
  const simulationReason = isSimulation
    ? (sessionHistory.find(item => item.evaluation?.simulationReason)?.evaluation?.simulationReason || 'NO_API_KEY_CONFIGURED')
    : null;

  return {
    candidateName: candidate?.name || 'Candidate',
    role,
    level,
    language,
    completedAt: new Date().toISOString(),
    totalQuestions,
    averageScore,
    categoryAverages,
    recommendation,
    recommendationBadgeClass,
    recommendationReasoning,
    keyStrengths: uniqueStrengths,
    keyImprovementAreas: uniqueImprovementAreas,
    isSimulation,
    activeModel,
    configuredModel,
    simulationReason,
    evaluationMode: isSimulation ? 'SIMULATION_MODE' : 'LIVE_GEMINI_AI',
    evaluationNotice: isSimulation 
      ? (simulationReason?.startsWith('API_ERROR')
          ? `Evaluated via deterministic rubric simulation engine (${simulationReason}).`
          : 'Evaluated via deterministic rubric simulation engine without external LLM API calls.')
      : `Evaluated dynamically via Google Gemini (${configuredModel}) generative AI.`,
    educationalDisclaimer: 'Educational Mock-Interview Assessment: This recommendation is generated solely for educational practice and interview skill development in a laboratory mock environment. It is NOT an actual employer hiring decision or employment guarantee.',
    terminationStatus: terminationStatus || 'completed',
    terminationReason: terminationReason || (terminationStatus ? 'Interview terminated early' : null),
    terminatedAt: terminatedAt || (terminationStatus ? new Date().toISOString() : null),
    isTerminated: Boolean(terminationStatus && terminationStatus !== 'completed'),
    sessionRecords: safeHistory.map(item => ({
      questionId: item.question?.id,
      category: item.question?.category,
      categoryLabel: item.question?.categoryLabel,
      questionText: item.question?.question,
      contextRationale: item.question?.contextRationale,
      candidateAnswer: item.answer,
      score: item.evaluation?.score,
      categoryScores: item.evaluation?.categoryScores,
      feedback: item.evaluation?.feedback,
      strengths: item.evaluation?.strengths,
      missingPoints: item.evaluation?.missingPoints,
      isSimulation: item.evaluation?.isSimulation ?? true,
      activeModel: item.evaluation?.activeModel || null,
      configuredModel: item.evaluation?.configuredModel || configuredModel,
      simulationReason: item.evaluation?.simulationReason || null
    }))
  };
}

/**
 * Process an adaptive interview turn:
 * 1. Evaluates candidate answer internally
 * 2. Generates the next adaptive resume-grounded question or follow-up probe
 */
export async function processAdaptiveTurn({
  question,
  answer,
  candidate,
  turnIndex = 1,
  totalTurns = 6,
  sessionHistory = [],
  role = 'Full Stack Developer',
  level = 'Mid-Level',
  language = 'en-US'
}) {
  const cleanAnswer = (answer || '').trim();
  if (!cleanAnswer) {
    const error = new Error('Answer cannot be empty. Please speak or type your answer.');
    error.status = 400;
    error.code = 'EMPTY_ANSWER';
    throw error;
  }

  // 1. Evaluate answer internally
  const evaluation = await evaluateAnswer({
    question,
    answer: cleanAnswer,
    candidate,
    role,
    level,
    language
  });

  const isFinalTurn = turnIndex >= totalTurns;
  if (isFinalTurn) {
    return {
      success: true,
      turnIndex,
      isFinalTurn: true,
      evaluation,
      nextQuestion: null,
      source: evaluation.isSimulation ? 'SIMULATION_ENGINE' : 'LIVE_GEMINI_AI'
    };
  }

  // 2. Identify all prior questions asked in the session
  const priorQuestions = [];
  if (Array.isArray(sessionHistory)) {
    sessionHistory.forEach(item => {
      if (item.question) priorQuestions.push(item.question);
    });
  }
  if (question && !priorQuestions.some(q => q.id === question.id)) {
    priorQuestions.push(question);
  }

  const skills = Array.isArray(candidate?.skills) && candidate.skills.length > 0
    ? candidate.skills
    : ['JavaScript', 'React', 'Node.js', 'REST APIs'];
  const projects = Array.isArray(candidate?.projects) && candidate.projects.length > 0
    ? candidate.projects
    : [{ title: 'Full Stack Platform', description: 'Enterprise web application', technologies: ['React', 'Node.js'] }];

  let nextQuestion = null;

  // If Gemini is active, generate with bounded retries and anti-repetition constraints
  const { apiKey, hasApiKey, configuredModel } = getGeminiConfig();
  if (hasApiKey && GoogleGenAIClass && !evaluation.isSimulation) {
    const ai = new GoogleGenAIClass({ apiKey });
    const priorQuestionsList = priorQuestions
      .map((q, idx) => `${idx + 1}. [Category: ${q.category || 'General'}] "${q.question}"`)
      .join('\n');

    // Bounded retries: max 3 attempts
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const prompt = `You are Ismav, a friendly, professional AI interviewer at TalentTrail AI conducting a mock interview for "${role}" (${level}).
Candidate Resume Context:
- Skills: ${skills.join(', ')}
- Projects: ${projects.map(p => `${p.title} (${p.description})`).join('; ')}

Current Turn: ${turnIndex} of ${totalTurns}.
Previous Question Asked: "${question.question}"
Candidate's Spoken Answer: "${cleanAnswer}"

CRITICAL ANTI-REPETITION RULES:
You MUST NOT ask any question that is semantically similar to or repeats any of the following questions already asked in this session:
${priorQuestionsList}

Generate a completely UNIQUE question for turn ${turnIndex + 1}:
1. Either ask a specific, natural probing follow-up directly analyzing a claim in their answer, OR transition smoothly to an unaddressed domain (project trade-offs, database consistency, distributed caching, incident triage, security, or behavioral STAR).
2. Grounded strictly in their resume.
3. Provide translations for: teluguQuestion, malayalamQuestion, kannadaQuestion, hindiQuestion, tamilQuestion.

Return ONLY a valid JSON object matching this schema:
{
  "id": "q_adaptive_${turnIndex + 1}_${Date.now()}",
  "number": ${turnIndex + 1},
  "category": "Technical",
  "categoryLabel": "Technical Depth & Adaptive Probe",
  "weight": "25%",
  "contextRationale": "Adaptive probe based on previous answer and resume skill: ...",
  "question": "English question...",
  "teluguQuestion": "Telugu question...",
  "malayalamQuestion": "Malayalam question...",
  "kannadaQuestion": "Kannada question...",
  "hindiQuestion": "Hindi question...",
  "tamilQuestion": "Tamil question...",
  "sampleIdealPoints": ["point 1", "point 2"]
}`;

        const candidateModels = Array.from(new Set([configuredModel, 'gemini-3.5-flash-lite', 'gemini-3.5-flash']));
        let response = null;
        let effectiveModel = configuredModel;
        for (const m of candidateModels) {
          try {
            response = await ai.models.generateContent({
              model: m,
              contents: prompt
            });
            effectiveModel = m;
            break;
          } catch (mErr) {
            console.warn(`[INTERVIEW SERVICE] Model ${m} adaptive attempt failed (${mErr.message}), trying next candidate...`);
          }
        }
        if (!response) {
          throw new Error('All candidate Gemini models were unavailable or returned high demand errors.');
        }

        const rawText = response.text || '';
        let cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const match = cleanJson.match(/\{[\s\S]*\}/);
        if (match) cleanJson = match[0];
        const parsed = JSON.parse(cleanJson);

        if (parsed && parsed.question) {
          const dupCheck = isDuplicateOrParaphrase(parsed, priorQuestions);
          if (!dupCheck.isDuplicate) {
            const langCode = (language || 'en-US').toLowerCase();
            const teluguQ = parsed.teluguQuestion || `${parsed.question} (దయచేసి వివరించండి)`;
            const malayalamQ = parsed.malayalamQuestion || `${parsed.question} (ദയവായി വിശദീകരിക്കുക)`;
            const kannadaQ = parsed.kannadaQuestion || `${parsed.question} (ದಯವಿಟ್ಟು ವಿವರಿಸಿ)`;
            const hindiQ = parsed.hindiQuestion || `${parsed.question} (कृपया विस्तार से बताएं)`;
            const tamilQ = parsed.tamilQuestion || `${parsed.question} (தயவுசெய்து விளக்குங்கள்)`;
            const activeText = langCode.startsWith('te') ? teluguQ :
                              langCode.startsWith('ml') ? malayalamQ :
                              langCode.startsWith('kn') ? kannadaQ :
                              langCode.startsWith('hi') ? hindiQ :
                              langCode.startsWith('ta') ? tamilQ :
                              parsed.question;

            nextQuestion = {
              ...parsed,
              teluguQuestion: teluguQ,
              malayalamQuestion: malayalamQ,
              kannadaQuestion: kannadaQ,
              hindiQuestion: hindiQ,
              tamilQuestion: tamilQ,
              activeLanguageText: activeText,
              number: turnIndex + 1,
              isSimulation: false,
              source: 'LIVE_GEMINI_AI',
              activeModel: effectiveModel,
              configuredModel,
              simulationReason: null
            };
            break; // Successfully generated unique non-duplicate question
          } else {
            console.warn(`[INTERVIEW SERVICE] Gemini generated duplicate question on attempt ${attempt} (${dupCheck.reason}): "${parsed.question.slice(0, 50)}...". Retrying...`);
          }
        }
      } catch (err) {
        console.warn(`[INTERVIEW SERVICE] Gemini adaptive turn attempt ${attempt} failed:`, err.message);
      }
    }
  }

  // Deterministic fallback: Guaranteed 100% unique question from multi-domain bank
  if (!nextQuestion) {
    nextQuestion = selectAdaptiveNextQuestion({
      currentQuestion: question,
      answer: cleanAnswer,
      candidate,
      turnIndex,
      totalTurns,
      sessionQuestions: priorQuestions,
      language
    });
  }

  return {
    success: true,
    turnIndex,
    isFinalTurn: false,
    evaluation, // Kept internal for session history; not shown to candidate per-question
    nextQuestion,
    source: nextQuestion.isSimulation ? 'SIMULATION_ENGINE' : 'LIVE_GEMINI_AI'
  };
}


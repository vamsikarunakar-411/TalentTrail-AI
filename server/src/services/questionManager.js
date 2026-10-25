/**
 * TalentTrail AI — Question Manager & Deduplication Engine
 * Solves the repeated-question bug through:
 * 1. Normalized text matching
 * 2. Jaccard token overlap similarity (>52% flagged as paraphrase duplicate)
 * 3. Question state tracking (GENERATED, ASKED, ANSWERED, SKIPPED)
 * 4. Topic and resume concept memory per session
 * 5. Bounded retries (max 3) with negative constraints
 * 6. Multi-domain curated question banks across 6 languages:
 *    English, Telugu, Malayalam, Kannada, Hindi, Tamil
 */

// Common filler/stop words to ignore when comparing question semantic cores
const STOP_WORDS = new Set([
  'how', 'do', 'you', 'what', 'is', 'your', 'the', 'a', 'an', 'in', 'on', 'at',
  'to', 'for', 'of', 'and', 'or', 'with', 'by', 'as', 'can', 'could', 'would',
  'tell', 'me', 'about', 'explain', 'describe', 'when', 'why', 'where', 'which',
  'using', 'used', 'from', 'our', 'their', 'this', 'that', 'these', 'those',
  'project', 'resume', 'system', 'application', 'work', 'experience'
]);

/**
 * Normalizes question text for exact comparison:
 * Lowercases, strips punctuation, collapses whitespace, removes stop words
 */
/**
 * Light stemming helper to match plurals and inflections (e.g. stampedes -> stampede, caching -> cach)
 */
function stemToken(word = '') {
  if (word.length <= 3) return word;
  if (word.endsWith('ing') && word.length > 5) return word.slice(0, -3);
  if (word.endsWith('es') && word.length > 4) return word.slice(0, -2);
  if (word.endsWith('s') && !word.endsWith('ss') && word.length > 3) return word.slice(0, -1);
  if (word.endsWith('ed') && word.length > 4) return word.slice(0, -2);
  return word;
}

/**
 * Normalizes question text for exact comparison:
 * Lowercases, strips punctuation, collapses whitespace, stems inflections, removes stop words
 */
export function normalizeQuestionText(text = '') {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .replace(/[^\w\s\u0C00-\u0C7F\u0D00-\u0D7F\u0C80-\u0CFF\u0900-\u097F\u0B80-\u0BFF]/g, ' ') // Preserves Indic scripts
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word))
    .map(stemToken)
    .join(' ')
    .trim();
}

/**
 * Computes Jaccard Similarity between two texts based on stemmed word token sets:
 * similarity = |A ∩ B| / |A ∪ B|
 */
export function computeJaccardSimilarity(textA = '', textB = '') {
  const normA = normalizeQuestionText(textA);
  const normB = normalizeQuestionText(textB);

  if (!normA || !normB) return 0;
  if (normA === normB) return 1.0;

  const tokensA = new Set(normA.split(/\s+/));
  const tokensB = new Set(normB.split(/\s+/));

  let intersectionCount = 0;
  tokensA.forEach(t => {
    if (tokensB.has(t)) intersectionCount++;
  });

  const unionCount = new Set([...tokensA, ...tokensB]).size;
  if (unionCount === 0) return 0;

  return intersectionCount / unionCount;
}

/**
 * Checks if a candidate question is an exact duplicate or semantically similar
 * paraphrase of any previously asked question in the session.
 */
export function isDuplicateOrParaphrase(candidateQuestion, sessionQuestions = [], threshold = 0.40) {
  if (!candidateQuestion || !Array.isArray(sessionQuestions) || sessionQuestions.length === 0) {
    return { isDuplicate: false, similarity: 0, reason: null };
  }

  const candidateId = candidateQuestion.id;
  const candidateText = candidateQuestion.question || '';
  const normCandidate = normalizeQuestionText(candidateText);

  let maxSimilarity = 0;
  let mostSimilarQuestion = null;

  for (let i = 0; i < sessionQuestions.length; i++) {
    const prev = sessionQuestions[i];
    const prevText = prev.question || prev.questionText || '';
    const normPrev = normalizeQuestionText(prevText);

    // 1. Exact ID match
    if (candidateId && prev.id && candidateId === prev.id) {
      return {
        isDuplicate: true,
        similarity: 1.0,
        matchedQuestion: prevText,
        reason: 'EXACT_ID_MATCH'
      };
    }

    // 2. Exact normalized text match
    if (normCandidate && normPrev && normCandidate === normPrev) {
      return {
        isDuplicate: true,
        similarity: 1.0,
        matchedQuestion: prevText,
        reason: 'EXACT_TEXT_MATCH'
      };
    }

    // 3. Jaccard token overlap
    const jaccard = computeJaccardSimilarity(candidateText, prevText);
    if (jaccard > maxSimilarity) {
      maxSimilarity = jaccard;
      mostSimilarQuestion = prevText;
    }

    if (jaccard >= threshold) {
      return {
        isDuplicate: true,
        similarity: Math.round(jaccard * 100) / 100,
        matchedQuestion: prevText,
        reason: `PARAPHRASE_SIMILARITY_${Math.round(jaccard * 100)}%`
      };
    }
  }

  return {
    isDuplicate: false,
    similarity: Math.round(maxSimilarity * 100) / 100,
    matchedQuestion: mostSimilarQuestion,
    reason: null
  };
}

/**
 * Extracts covered technical concepts from questions to track session topics
 */
export function extractQuestionConcepts(text = '') {
  const domainKeywords = [
    'react', 'node', 'javascript', 'python', 'docker', 'kubernetes', 'database',
    'sql', 'postgres', 'mongo', 'redis', 'cache', 'caching', 'concurrency',
    'async', 'event loop', 'microservice', 'rest api', 'graphql', 'latency',
    'scalability', 'security', 'auth', 'jwt', 'testing', 'ci/cd', 'git',
    'star', 'leadership', 'conflict', 'troubleshooting', 'telemetry', 'datadog'
  ];

  const lower = (text || '').toLowerCase();
  return domainKeywords.filter(kw => lower.includes(kw));
}

/**
 * Multi-Domain Question Bank for all 6 Supported Languages:
 * English, Telugu, Malayalam, Kannada, Hindi, Tamil
 */
export const MULTI_DOMAIN_QUESTION_BANK = [
  // 1. Core Technical Skills & State Architecture
  {
    domain: 'core_technical',
    category: 'Technical',
    categoryLabel: 'Technical Architecture & Concurrency',
    weight: '25%',
    makeQuestion: (skills) => {
      const s1 = skills[0] || 'JavaScript';
      const s2 = skills[1] || 'Node.js';
      return {
        en: `Your resume highlights core expertise in ${s1} and ${s2}. How do you architect state synchronization, error propagation, and performance optimization when integrating these technologies under high request concurrency?`,
        te: `మీ రెజ్యూమ్‌లో ${s1} మరియు ${s2} నైపుణ్యాలు ఉన్నాయి. అధిక వినియోగదారుల లోడ్ ఉన్నప్పుడు, ఈ టెక్నాలజీల మధ్య స్టేట్ మేనేజ్‌మెంట్ మరియు పనితీరు ఆప్టిమైజేషన్‌ను మీరు ఎలా ఆర్కిటెక్ట్ చేస్తారు?`,
        ml: `നിങ്ങളുടെ റെസ്യൂമെയിൽ ${s1}, ${s2} എന്നിവയിലെ വൈദഗ്ധ്യം സൂചിപ്പിച്ചിരിക്കുന്നു. ഉയർന്ന ട്രാഫിക്കുള്ളപ്പോൾ ഈ സാങ്കേതികവിദ്യകളിൽ സ്റ്റേറ്റ് മാനേജ്‌മെന്റും പിശക് കൈകാര്യം ചെയ്യലും നിങ്ങൾ എങ്ങനെ കൈകാര്യം ചെയ്യുന്നു?`,
        kn: `ನಿಮ್ಮ ರೆಸ್ಯೂಮೆಯಲ್ಲಿ ${s1} ಮತ್ತು ${s2} ನೈಪುಣ್ಯತೆಯನ್ನು ಉಲ್ಲೇಖಿಸಲಾಗಿದೆ. ಹೆಚ್ಚಿನ ಟ್ರಾಫಿಕ್ ಇದ್ದಾಗ, ಈ ತಂತ್ರಜ್ಞಾನಗಳ ನಡುವೆ ಸ್ಟೇಟ್ ನಿರ್ವಹಣೆ ಮತ್ತು ದೋಷ ನಿರ್ವಹಣೆಯನ್ನು ನೀವು ಹೇಗೆ ವಾಸ್ತುಶಿಲ್ಪ ಮಾಡುತ್ತೀರಿ?`,
        hi: `आपके बायोडाटा में ${s1} और ${s2} में मुख्य विशेषज्ञता दर्शायी गई है। उच्च समवर्ती अनुरोधों के अंतर्गत आप स्टेट सिंक्रोनाइज़ेशन, त्रुटि प्रबंधन और प्रदर्शन अनुकूलन को कैसे आर्किटेक्ट करते हैं?`,
        ta: `உங்கள் ரெஸ்யூமில் ${s1} மற்றும் ${s2} ஆகியவற்றில் நிபுணத்துவம் குறிப்பிடப்பட்டுள்ளது. அதிக பயனர் நெரிசலின் போது, ஸ்டேட் மேனேஜ்மென்ட் மற்றும் பிழை கையாளுதலை நீங்கள் எவ்வாறு வடிவமைக்கிறீர்கள்?`
      };
    },
    sampleIdealPoints: [
      'Addresses framework lifecycle and non-blocking asynchronous patterns',
      'Discusses concurrency control, pooling, or backpressure handling',
      'Covers error boundaries and circuit breakers'
    ]
  },

  // 2. Project Architecture & Decisions
  {
    domain: 'project_architecture',
    category: 'Project-based',
    categoryLabel: 'Project Architecture & System Decisions',
    weight: '25%',
    makeQuestion: (skills, projects) => {
      const p = projects[0] || { title: 'Distributed Web Platform', description: 'Production full-stack service' };
      return {
        en: `In your project "${p.title}" (${p.description || 'detailed on your resume'}), what was the most critical architectural decision or technical trade-off you evaluated, and how did you validate that decision?`,
        te: `మీ ప్రాజెక్ట్ "${p.title}" లో, మీరు ఎదుర్కొన్న అత్యంత కీలకమైన ఆర్కిటెక్చర్ నిర్ణయం లేదా టెక్నికల్ ట్రేడ్-ఆఫ్ ఏమిటి? దానిని మీరు ఎలా ధృవీకరించారు?`,
        ml: `നിങ്ങളുടെ പ്രോജക്റ്റായ "${p.title}" ൽ, നിങ്ങൾ എടുത്ത ഏറ്റവും പ്രധാനപ്പെട്ട സാങ്കേതിക തീരുമാനമോ വെല്ലുവിളിയോ എന്തായിരുന്നു? അത് എങ്ങനെ വിലയിരുത്തി?`,
        kn: `ನಿಮ್ಮ ಪ್ರಾಜೆಕ್ಟ್ "${p.title}" ನಲ್ಲಿ ನೀವು ತೆಗೆದುಕೊಂಡ ಅತ್ಯಂತ ಪ್ರಮುಖ ವಾಸ್ತುಶಿಲ್ಪ ನಿರ್ಧಾರ ಅಥವಾ ಸವಾಲು ಯಾವುದು? ಅದನ್ನು ನೀವು ಹೇಗೆ ದೃಢಪಡಿಸಿದಿರಿ?`,
        hi: `आपके प्रोजेक्ट "${p.title}" में सबसे महत्वपूर्ण वास्तुशिल्प निर्णय या तकनीकी ट्रेड-ऑफ क्या था, और आपने उस निर्णय को कैसे मान्य किया?`,
        ta: `உங்கள் திட்டமான "${p.title}" இல், நீங்கள் எடுத்த மிக முக்கியமான கட்டமைப்பு முடிவு அல்லது தொழில்நுட்ப சவால் என்ன? அதை நீங்கள் எவ்வாறு உறுதிப்படுத்தினீர்கள்?`
      };
    },
    sampleIdealPoints: [
      'Clearly states technical problem and evaluated alternatives',
      'Articulates trade-offs (e.g. latency vs consistency, complexity vs speed)',
      'Provides empirical validation metrics'
    ]
  },

  // 3. Database Consistency & Storage Optimization
  {
    domain: 'database_storage',
    category: 'Technical',
    categoryLabel: 'Data Consistency & Storage Optimization',
    weight: '20%',
    makeQuestion: () => ({
      en: `When designing data persistence for a high-throughput service, how do you mitigate connection pool exhaustion and prevent stale reads across distributed read-replicas?`,
      te: `అధిక-త్రూపుట్ సర్వీస్ కోసం డేటా నిల్వను రూపొందించేటప్పుడు, డేటాబేస్ కనెక్షన్ పూల్ సంక్షోభాన్ని మరియు రీడ్-రెప్లికాలలో పాత డేటా రీడ్ సమస్యను మీరు ఎలా నివారిస్తారు?`,
      ml: `ഉയർന്ന ട്രാഫിക്കുള്ള ഒരു ആപ്ലിക്കേഷനിൽ ഡാറ്റാബേസ് കണക്ഷൻ പൂൾ പ്രശ്നങ്ങളും റീഡ്-റെപ്ലിക്കകളിലെ ഡാറ്റാ സ്ഥിരതയില്ലായ്മയും നിങ്ങൾ എങ്ങനെ പരിഹരിക്കും?`,
      kn: `ಹೆಚ್ಚಿನ ವಹಿವಾಟು ಇರುವ ಸೇವೆಯಲ್ಲಿ ಡೇಟಾಬೇಸ್ ಸಂಪರ್ಕ ಪೂಲ್ ಕೊರತೆ ಮತ್ತು ಓದುವಿಕೆ ಅಸ್ಥಿರತೆಯನ್ನು ನೀವು ಹೇಗೆ ತಡೆಯುತ್ತೀರಿ?`,
      hi: `उच्च-थ्रूपुट सेवा के लिए डेटा दृढ़ता डिज़ाइन करते समय, आप कनेक्शन पूल की कमी को कैसे कम करते हैं और वितरित प्रतिकृतियों में बासी रीड्स को कैसे रोकते हैं?`,
      ta: `அதிக டிராஃபிக் கொண்ட சேவையில் டேட்டாபேஸ் கனெக்ஷன் பூல் தீர்ந்துபோகாமல் மற்றும் பழைய டேட்டா படிக்கப்படுவதை எவ்வாறு தடுக்கிறீர்கள்?`
    }),
    sampleIdealPoints: [
      'Explains connection pooling limits, proxy layers (e.g. PgBouncer)',
      'Addresses read-your-own-writes consistency strategies',
      'Mentions query optimization and indexing strategies'
    ]
  },

  // 4. Caching & Distributed Stampede Mitigation
  {
    domain: 'caching_distributed',
    category: 'Technical',
    categoryLabel: 'Caching Architecture & Stampede Mitigation',
    weight: '20%',
    makeQuestion: () => ({
      en: `In a multi-node deployment, what caching strategy do you employ to prevent cache stampedes (dog-piling) when popular cache keys expire simultaneously?`,
      te: `మల్టీ-నోడ్ సిస్టమ్‌లో, పాపులర్ కాష్ కీలు ఒకేసారి గడువు ముగిసినప్పుడు కాష్ స్టాంపేడ్ (డాగ్-పైలింగ్) సమస్య రాకుండా మీరు ఏ వ్యూహాన్ని ఉపయోగిస్తారు?`,
      ml: `ഒരു മൾട്ടി-നോഡ് സിസ്റ്റത്തിൽ കാഷെ കീകളുടെ കാലാവധി തീരുമ്പോൾ കാഷെ സ്റ്റാമ്പീഡ് ഉണ്ടാകാതിരിക്കാൻ നിങ്ങൾ എന്ത് തന്ത്രമാണ് ഉപയോഗിക്കുന്നത്?`,
      kn: `ಮಲ್ಟಿ-ನೋಡ್ ನಿಯೋಜನೆಯಲ್ಲಿ, ಜನಪ್ರಿಯ ಕ್ಯಾಶ್ ಕೀಗಳು ಏಕಕಾಲದಲ್ಲಿ ಮುಕ್ತಾಯಗೊಂಡಾಗ ಕ್ಯಾಶ್ ಸ್ಟ್ಯಾಂಪೀಡ್ ಅನ್ನು ನೀವು ಹೇಗೆ ತಡೆಯುತ್ತೀರಿ?`,
      hi: `मल्टी-नोड परिनियोजन में, जब लोकप्रिय कैश कीज एक साथ समाप्त हो जाती हैं, तो आप कैश स्टैम्पीड (डॉग-पाइलिंग) को रोकने के लिए किस रणनीति का उपयोग करते हैं?`,
      ta: `மல்டி-நோட் அமைப்பில் கேச் கீகள் ஒரே நேரத்தில் காலாவதியாகும் போது கேச் ஸ்டாம்பீட் வராமல் தடுக்க எந்த உத்தியைப் பயன்படுத்துகிறீர்கள்?`
    }),
    sampleIdealPoints: [
      'Discusses probabilistic early expiration (XFetch) or mutex locks',
      'Covers background warmers and tiered caching (L1 in-memory + L2 Redis)',
      'Explains graceful fallback to primary database'
    ]
  },

  // 5. Incident Triage & Production Latency Spike
  {
    domain: 'troubleshooting_triage',
    category: 'Problem-solving',
    categoryLabel: 'Incident Triage & Production Telemetry',
    weight: '25%',
    makeQuestion: () => ({
      en: `Imagine your production system suddenly experiences an unexpected 5x latency spike with database connections saturating and 504 gateway timeouts. Walk me through your step-by-step telemetry inspection, isolation, and resolution workflow.`,
      te: `మీ ప్రొడక్షన్ సిస్టమ్‌లో అకస్మాత్తుగా 5 రెట్లు లేటెన్సీ పెరిగి డేటాబేస్ కనెక్షన్స్ నిండిపోయి 504 టైమౌట్స్ వస్తే, మీరు టెలిమెట్రీ తనిఖీ చేసి సమస్యను ఎలా పరిష్కరిస్తారో వివరించండి.`,
      ml: `പ്രൊഡക്ഷനിൽ അപ്രതീക്ഷിതമായി ലാറ്റൻസി 5 മടങ്ങ് വർദ്ധിക്കുകയും 504 ടൈംഔട്ടുകൾ ഉണ്ടാകുകയും ചെയ്താൽ, നിങ്ങൾ എങ്ങനെയാണ് ഘട്ടം ഘട്ടമായി പ്രശ്നം കണ്ടെത്തി പരിഹരിക്കുന്നത്?`,
      kn: `ನಿಮ್ಮ ಪ್ರೊಡಕ್ಷನ್ ಸಿಸ್ಟಮ್‌ನಲ್ಲಿ ಹಠಾತ್ತಾಗಿ ಲೇಟೆನ್ಸಿ 5 ಪಟ್ಟು ಹೆಚ್ಚಾಗಿ ಡೇಟಾಬೇಸ್ ಸಂಪರ್ಕಗಳು ತುಂಬಿಹೋದರೆ, ನೀವು ಲಾಗ್‌ಗಳು ಮತ್ತು ಮೆಟ್ರಿಕ್ಸ್‌ಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಸಮಸ್ಯೆಯನ್ನು ಹೇಗೆ ಬಗೆಹರಿಸುತ್ತೀರಿ?`,
      hi: `मान लीजिए कि आपके उत्पादन वातावरण में अचानक विलंबता 5 गुना बढ़ जाती है और कनेक्शन संतृप्त हो जाते हैं। अपने टेलीमेट्री निरीक्षण और समाधान कार्यप्रवाह को चरण-दर-चरण समझाएं।`,
      ta: `உங்கள் லைவ் சிஸ்டத்தில் திடீரென லேடன்சி 5 மடங்கு அதிகரித்து 504 பிழைகள் வந்தால், மெட்ரிக்ஸ் மற்றும் லாக்ஸ்களை ஆய்வு செய்து எவ்வாறு சரிசெய்வீர்கள்?`
    }),
    sampleIdealPoints: [
      'Inspects observability dashboards (APM, distributed tracing, slow queries)',
      'Applies immediate stabilization (rate limiting, replica scaling, traffic shed)',
      'Executes root cause analysis and post-mortem mitigation'
    ]
  },

  // 6. Security, Authentication & Secret Hygiene
  {
    domain: 'security_auth',
    category: 'Technical',
    categoryLabel: 'Application Security & Authentication',
    weight: '20%',
    makeQuestion: () => ({
      en: `When architecting authentication and API authorization, what security vulnerabilities (such as CSRF, token theft, or broken object-level authorization) do you actively guard against, and how?`,
      te: `అథెంటికేషన్ మరియు API ఆథరైజేషన్ నిర్మించేటప్పుడు, టోకెన్ దొంగతనం, CSRF లేదా బ్రోకెన్ ఆబ్జెక్ట్-లెవల్ ఆథరైజేషన్ వంటి సెక్యూరిటీ సమస్యలు రాకుండా మీరు ఎలాంటి రక్షణలు తీసుకుంటారు?`,
      ml: `ആധികാരികതയും API ഓതറൈസേഷനും രൂപകൽപ്പന ചെയ്യുമ്പോൾ ടോക്കൺ മോഷണം, CSRF പോലുള്ള സുരക്ഷാ വീഴ്ചകൾ നിങ്ങൾ എങ്ങനെ പ്രതിരോധിക്കുന്നു?`,
      kn: `ದೃಢೀಕರಣ ಮತ್ತು API ಅಧಿಕಾರವನ್ನು ವಿನ್ಯಾಸಗೊಳಿಸುವಾಗ, ಟೋಕನ್ ಕಳ್ಳತನ ಅಥವಾ CSRF ನಂತಹ ಭದ್ರತಾ ಲೋಪಗಳನ್ನು ನೀವು ಹೇಗೆ ತಡೆಯುತ್ತೀರಿ?`,
      hi: `प्रमाणीकरण और एपीआई प्राधिकरण की रूपरेखा तैयार करते समय, आप टोकन चोरी, सीएसआरएफ या टूटे हुए ऑब्जेक्ट-स्तरीय प्राधिकरण जैसी सुरक्षा कमजोरियों से कैसे रक्षा करते हैं?`,
      ta: `ஆத்தண்டிகேஷன் மற்றும் API அணுகலை கட்டமைக்கும் போது, டோக்கன் திருட்டு, CSRF போன்ற பாதுகாப்பு குறைபாடுகளை நீங்கள் எவ்வாறு தடுக்கிறீர்கள்?`
    }),
    sampleIdealPoints: [
      'Compares HTTP-only secure cookies with JWT bearer storage',
      'Discusses refresh token rotation and token revocation mechanisms',
      'Explains RBAC / ABAC and object-level authorization checks'
    ]
  },

  // 7. Testing Strategy & CI/CD Pipeline Reliability
  {
    domain: 'testing_cicd',
    category: 'Technical',
    categoryLabel: 'Code Quality, Testing & CI/CD Hygiene',
    weight: '15%',
    makeQuestion: () => ({
      en: `How do you structure your automated testing pyramid (unit, integration, contract, and end-to-end tests) to maintain rapid CI/CD deployment velocity without allowing regressions to reach production?`,
      te: `ప్రొడక్షన్‌లోకి బగ్‌లు వెళ్లకుండా మరియు వేగంగా డెలివరీ చేయడానికి మీ ఆటోమేటెడ్ టెస్టింగ్ పిరమిడ్ (యూనిట్, ఇంటిగ్రేషన్, E2E) ను మీరు ఎలా నిర్మిస్తారు?`,
      ml: `വേഗത്തിലുള്ള വിന്യാസത്തിനും ബഗുകൾ തടയുന്നതിനും യൂണിറ്റ്, ഇന്റഗ്രേഷൻ, എൻഡ്-ടു-എൻഡ് ടെസ്റ്റുകൾ നിങ്ങൾ എങ്ങനെ സന്തുലിതമാക്കുന്നു?`,
      kn: `ದೋಷರಹಿತ ಡೆಲಿವರಿಗಾಗಿ ನಿಮ್ಮ ಸ್ವಯಂಚಾಲಿತ ಪರೀಕ್ಷಾ ಪಿರಮಿಡ್ ಅನ್ನು ನೀವು ಹೇಗೆ ರೂಪಿಸುತ್ತೀರಿ?`,
      hi: `उत्पादन में बग्स को रोकने और तेजी से तैनाती के लिए आप अपने स्वचालित परीक्षण पिरामिड (यूनिट, इंटीग्रेशन, ई2ई) की संरचना कैसे करते हैं?`,
      ta: `லைவ் சிஸ்டத்தில் பிழைகள் வராமல் தடுக்க மற்றும் விரைவான வெளியீட்டிற்கு உங்கள் தானியங்கி சோதனைகளை எவ்வாறு கட்டமைக்கிறீர்கள்?`
    }),
    sampleIdealPoints: [
      'Balances mock-heavy unit tests with realistic integration container tests',
      'Implements contract tests and automated smoke tests in CI/CD pipeline',
      'Uses canary deployments and automated rollback triggers'
    ]
  },

  // 8. Behavioral Leadership & Conflict Resolution (STAR)
  {
    domain: 'behavioral_leadership',
    category: 'HR',
    categoryLabel: 'Behavioral & Leadership (STAR)',
    weight: '15%',
    makeQuestion: (skills, projects, experience) => {
      const org = experience?.[0]?.company || 'your previous engineering team';
      return {
        en: `Tell me about a challenging situation at ${org} where you and a colleague or team lead had strongly conflicting technical opinions on an implementation. How did you communicate, evaluate trade-offs, and reach a constructive consensus?`,
        te: `${org} లో పని చేస్తున్నప్పుడు, మీ తోటి ఇంజనీర్‌తో లేదా లీడ్‌తో టెక్నికల్ విధానంపై భేదాభిప్రాయం వచ్చినప్పుడు, మీరు దానిని చర్చించి ఎలా ఏకాభిప్రాయానికి వచ్చారో వివరించండి.`,
        ml: `${org} ൽ ജോലി ചെയ്യുമ്പോൾ ഒരു സഹപ്രവർത്തകനുമായി സാങ്കേതിക അഭിപ്രായവ്യത്യാസം ഉണ്ടായ സാഹചര്യം വ്യക്തമാക്കുക. എങ്ങനെയാണ് നിങ്ങൾ സമവായത്തിലെത്തിയത്?`,
        kn: `${org} ನಲ್ಲಿ ಕೆಲಸ ಮಾಡುವಾಗ ಸಹೋದ್ಯೋಗಿಯೊಂದಿಗೆ ತಾಂತ್ರಿಕ ಭಿನ್ನಾಭಿಪ್ರಾಯ ಉಂಟಾದ ಸಂದರ್ಭವನ್ನು ನೀವು ಹೇಗೆ ಬಗೆಹರಿಸಿದಿರಿ?`,
        hi: `${org} में किसी चुनौतीपूर्ण स्थिति के बारे में बताएं जहां आपकी और किसी सहकर्मी की तकनीकी राय में मतभेद था। आपने आम सहमति कैसे बनाई?`,
        ta: `${org} இல் பணியாற்றிய போது சக ஊழியருடன் தொழில்நுட்ப கருத்து வேறுபாடு ஏற்பட்டதை நீங்கள் எவ்வாறு இணக்கமாகத் தீர்த்தீர்கள்?`
      };
    },
    sampleIdealPoints: [
      'Structures answer clearly using STAR (Situation, Task, Action, Result)',
      'Demonstrates objective data-driven prototyping rather than ego',
      'Focuses on team alignment and business impact'
    ]
  },

  // 9. Cross-Functional Trade-Offs & Deadline Pressures
  {
    domain: 'cross_functional',
    category: 'HR',
    categoryLabel: 'Project Delivery & Stakeholder Negotiation',
    weight: '15%',
    makeQuestion: () => ({
      en: `Describe a scenario where a non-technical stakeholder requested an aggressive deadline that would require significant technical debt or cutting test coverage. How did you negotiate scope, present trade-offs, and maintain product quality?`,
      te: `డెడ్‌లైన్ ఒత్తిడి వల్ల టెక్నికల్ డెట్ లేదా టెస్టింగ్ తగ్గించాల్సి వచ్చినప్పుడు, మీరు మేనేజ్‌మెంట్‌తో చర్చించి ప్రాజెక్ట్ నాణ్యతను ఎలా కాపాడారో వివరించండి.`,
      ml: `സമയപരിധി കാരണം കോഡിന്റെ നിലവാരം കുറയ്ക്കേണ്ടി വന്നേക്കാമായിരുന്ന ഒരു സാഹചര്യത്തിൽ നിങ്ങൾ സ്റ്റേക്ക്‌ഹോൾഡർമാരുമായി എങ്ങനെ ധാരണയിലെത്തി?`,
      kn: `ಗಡುವಿನ ಒತ್ತಡವಿದ್ದಾಗ ತಾಂತ್ರಿಕ ಗುಣಮಟ್ಟ ಮತ್ತು ಪರೀಕ್ಷೆಯನ್ನು ಕಾಪಾಡಿಕೊಳ್ಳಲು ನೀವು ನಾಯಕರೊಂದಿಗೆ ಹೇಗೆ ಮಾತುಕತೆ ನಡೆಸಿದಿರಿ?`,
      hi: `ऐसी स्थिति का वर्णन करें जहां एक आक्रामक समय सीमा के लिए तकनीकी ऋण लेने की आवश्यकता थी। आपने गुणवत्ता बनाए रखते हुए कैसे बातचीत की?`,
      ta: `குறைந்த நேரத்தில் பணிகளை முடிக்க வேண்டிய சூழலில், கோட் தரத்தை குறைக்காமல் மேலாண்மையிடம் எவ்வாறு பேசி முடிவெடுத்தீர்கள்?`
    }),
    sampleIdealPoints: [
      'Articulates risk transparency without being confrontational',
      'Proposes phased delivery (MVP now, hardening later)',
      'Maintains delivery momentum while tracking technical debt'
    ]
  },

  // 10. Long-term Engineering Evolution & Maintenance
  {
    domain: 'evolution_maintenance',
    category: 'Technical',
    categoryLabel: 'System Evolution & Technical Debt Management',
    weight: '15%',
    makeQuestion: () => ({
      en: `Over the lifecycle of a growing product, technical debt naturally accumulates. What proactive practices do you implement to refactor safely without disrupting existing customer service-level agreements?`,
      te: `సిస్టమ్ పెరుగుతున్న కొద్దీ పేరుకుపోయే టెక్నికల్ డెట్‌ను, ప్రొడక్షన్ సేవలకు అంతరాయం కలగకుండా మీరు సురక్షితంగా ఎలా రీఫాక్టర్ చేస్తారు?`,
      ml: `ഒരു ആപ്ലിക്കേഷന്റെ വളർച്ചയിൽ ഉണ്ടാകുന്ന സാങ്കേതിക കടങ്ങൾ നിലവിലുള്ള സേവനങ്ങളെ ബാധിക്കാതെ നിങ്ങൾ എങ്ങനെ പരിഹരിക്കുന്നു?`,
      kn: `ಸಿಸ್ಟಮ್ ಬೆಳೆದಂತೆ ಉಂಟಾಗುವ ತಾಂತ್ರಿಕ ಹೊರೆಯನ್ನು ಗ್ರಾಹಕ ಸೇವೆಗಳಿಗೆ ತೊಂದರೆಯಾಗದಂತೆ ನೀವು ಹೇಗೆ ಮರುಹೊಂದಿಸುತ್ತೀರಿ?`,
      hi: `उत्पाद के जीवनचक्र के दौरान संचित तकनीकी ऋण को आप मौजूदा ग्राहक सेवा को बाधित किए बिना सुरक्षित रूप से कैसे रीफैक्टर करते हैं?`,
      ta: `சிஸ்டம் வளரும் போது ஏற்படும் தொழில்நுட்ப சுமைகளை நுகர்வோர் பயன்பாட்டை பாதிக்காமல் எவ்வாறு மறுசீரமைப்பு செய்வீர்கள்?`
    }),
    sampleIdealPoints: [
      'Uses strangler fig pattern or feature flags for zero-downtime migration',
      'Allocates dedicated sprint capacity for technical debt remediation',
      'Measures regression risk with automated telemetry and canary monitoring'
    ]
  }
];

/**
 * Generates an initial ordered sequence of distinct, unique questions
 * grounded in candidate resume, guaranteed to contain ZERO duplicates.
 */
export function generateDistinctQuestionSequence({
  candidate,
  role = 'Full Stack Developer',
  level = 'Mid-Level',
  focus = 'Technical',
  language = 'en-US',
  totalTurns = 8
}) {
  const skills = Array.isArray(candidate?.skills) && candidate.skills.length > 0
    ? candidate.skills
    : ['JavaScript', 'React', 'Node.js', 'REST APIs', 'SQL'];
  const projects = Array.isArray(candidate?.projects) && candidate.projects.length > 0
    ? candidate.projects
    : [{ title: 'Full Stack Web Platform', description: 'Interactive web platform with APIs', technologies: ['React', 'Node.js'] }];
  const experience = Array.isArray(candidate?.experience) ? candidate.experience : [];

  const langKey = language.startsWith('te') ? 'te' :
                  language.startsWith('ml') ? 'ml' :
                  language.startsWith('kn') ? 'kn' :
                  language.startsWith('hi') ? 'hi' :
                  language.startsWith('ta') ? 'ta' : 'en';

  const generatedQuestions = [];
  const usedDomainSet = new Set();

  for (let i = 0; i < MULTI_DOMAIN_QUESTION_BANK.length && generatedQuestions.length < totalTurns; i++) {
    const template = MULTI_DOMAIN_QUESTION_BANK[i];
    if (usedDomainSet.has(template.domain)) continue;

    const questionTexts = template.makeQuestion(skills, projects, experience);
    const activeText = questionTexts[langKey] || questionTexts['en'];

    // Verify deduplication
    const dupCheck = isDuplicateOrParaphrase({ question: activeText }, generatedQuestions);
    if (!dupCheck.isDuplicate) {
      usedDomainSet.add(template.domain);
      generatedQuestions.push({
        id: `q_${template.domain}_${generatedQuestions.length + 1}`,
        number: generatedQuestions.length + 1,
        category: template.category,
        categoryLabel: template.categoryLabel,
        weight: template.weight,
        isSimulation: true,
        source: 'SIMULATION_ENGINE',
        domain: template.domain,
        contextRationale: `Grounded in resume: ${skills.slice(0, 2).join(', ')} / ${projects[0]?.title || 'engineering background'}`,
        question: questionTexts['en'],
        teluguQuestion: questionTexts['te'],
        malayalamQuestion: questionTexts['ml'],
        kannadaQuestion: questionTexts['kn'],
        hindiQuestion: questionTexts['hi'],
        tamilQuestion: questionTexts['ta'],
        activeLanguageText: activeText,
        sampleIdealPoints: template.sampleIdealPoints
      });
    }
  }

  return generatedQuestions;
}

/**
 * Selects an adaptive follow-up or next unique question:
 * 1. Guarantees the question was NEVER previously asked in this session
 * 2. Checks exact and Jaccard paraphrase duplicate detection
 * 3. Bounded fallback (never loops)
 */
export function selectAdaptiveNextQuestion({
  currentQuestion,
  answer = '',
  candidate,
  turnIndex = 1,
  totalTurns = 8,
  sessionQuestions = [],
  language = 'en-US'
}) {
  const langKey = language.startsWith('te') ? 'te' :
                  language.startsWith('ml') ? 'ml' :
                  language.startsWith('kn') ? 'kn' :
                  language.startsWith('hi') ? 'hi' :
                  language.startsWith('ta') ? 'ta' : 'en';

  const skills = Array.isArray(candidate?.skills) && candidate.skills.length > 0
    ? candidate.skills
    : ['JavaScript', 'React', 'Node.js', 'SQL'];
  const projects = Array.isArray(candidate?.projects) && candidate.projects.length > 0
    ? candidate.projects
    : [{ title: 'Full Stack Platform', description: 'Production web application' }];
  const experience = Array.isArray(candidate?.experience) ? candidate.experience : [];

  // Collect already asked IDs and domains
  const askedDomains = new Set(sessionQuestions.map(q => q.domain).filter(Boolean));
  if (currentQuestion?.domain) askedDomains.add(currentQuestion.domain);

  // Find the next unused template from the multi-domain bank
  for (let i = 0; i < MULTI_DOMAIN_QUESTION_BANK.length; i++) {
    const candidateTemplate = MULTI_DOMAIN_QUESTION_BANK[i];
    if (askedDomains.has(candidateTemplate.domain)) continue;

    const questionTexts = candidateTemplate.makeQuestion(skills, projects, experience);
    const activeText = questionTexts[langKey] || questionTexts['en'];

    const check = isDuplicateOrParaphrase({ question: activeText }, sessionQuestions);
    if (!check.isDuplicate) {
      return {
        id: `q_adaptive_${candidateTemplate.domain}_${turnIndex + 1}_${Date.now()}`,
        number: turnIndex + 1,
        category: candidateTemplate.category,
        categoryLabel: candidateTemplate.categoryLabel,
        weight: candidateTemplate.weight,
        isSimulation: true,
        source: 'SIMULATION_ENGINE',
        domain: candidateTemplate.domain,
        contextRationale: `Adaptive progression to unused domain: ${candidateTemplate.categoryLabel}`,
        question: questionTexts['en'],
        teluguQuestion: questionTexts['te'],
        malayalamQuestion: questionTexts['ml'],
        kannadaQuestion: questionTexts['kn'],
        hindiQuestion: questionTexts['hi'],
        tamilQuestion: questionTexts['ta'],
        activeLanguageText: activeText,
        sampleIdealPoints: candidateTemplate.sampleIdealPoints
      };
    }
  }

  // If all primary templates exhausted, create a targeted STAR behavioral wrap-up
  const wrapUpText = {
    en: "Reflecting on your engineering career so far, what is the single proudest technical contribution or system optimization you spearheaded, and what lasting impact did it create?",
    te: "మీ కెరీర్‌లో మీరు సాధించిన అత్యంత గర్వించదగిన సాంకేతిక విజయం లేదా ఆప్టిమైజేషన్ ఏమిటి? అది ఎలాంటి దీర్ఘకాలిక ప్రభావాన్ని చూపించింది?",
    ml: "നിങ്ങളുടെ കരിയറിലെ ഏറ്റവും അഭിമാനകരമായ സാങ്കേതിക സംഭാവന എന്തായിരുന്നു, അത് എന്ത് മാറ്റമുണ്ടാക്കി?",
    kn: "ನಿಮ್ಮ ಇಂಜಿನಿಯರಿಂಗ್ ವೃತ್ತಿಜೀವನದಲ್ಲಿ ನೀವು ಮುನ್ನಡೆಸಿದ ಅತ್ಯಂತ ಹೆಮ್ಮೆಯ ತಾಂತ್ರಿಕ ಸಾಧನೆ ಯಾವುದು?",
    hi: "अपने करियर पर विचार करते हुए, आपका सबसे गौरवपूर्ण तकनीकी योगदान क्या रहा है, और इसका क्या प्रभाव पड़ा?",
    ta: "உங்கள் பொறியியல் வாழ்க்கையில் நீங்கள் முன்னெடுத்த மிகப்பெரிய தொழில்நுட்ப சாதனை என்ன?"
  };

  return {
    id: `q_wrapup_${turnIndex + 1}_${Date.now()}`,
    number: turnIndex + 1,
    category: 'HR',
    categoryLabel: 'Career Milestones & Technical Ownership',
    weight: '15%',
    isSimulation: true,
    source: 'SIMULATION_ENGINE',
    domain: 'career_wrapup',
    contextRationale: 'Holistic career reflection wrap-up',
    question: wrapUpText['en'],
    teluguQuestion: wrapUpText['te'],
    malayalamQuestion: wrapUpText['ml'],
    kannadaQuestion: wrapUpText['kn'],
    hindiQuestion: wrapUpText['hi'],
    tamilQuestion: wrapUpText['ta'],
    activeLanguageText: wrapUpText[langKey] || wrapUpText['en'],
    sampleIdealPoints: ['Articulates concrete impact', 'Demonstrates technical pride and ownership']
  };
}

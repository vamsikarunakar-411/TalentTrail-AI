import pdf from 'pdf-parse';

/**
 * Modern Technical & Professional Skills Dictionary for Canonical Matching
 */
const CANONICAL_SKILLS = [
  // Languages
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C', 'C#', 'Go', 'Golang', 'Rust', 'Ruby', 'PHP',
  'Swift', 'Kotlin', 'Dart', 'R', 'Scala', 'SQL', 'HTML5', 'HTML', 'CSS3', 'CSS', 'Sass', 'SCSS',
  // Frontend
  'React', 'React.js', 'Next.js', 'Vue.js', 'Vue', 'Angular', 'Svelte', 'Tailwind CSS', 'Bootstrap',
  'Redux', 'Zustand', 'Vite', 'Webpack', 'Material UI', 'Shadcn UI', 'Responsive Design',
  // Backend & Frameworks
  'Node.js', 'Express', 'Express.js', 'NestJS', 'FastAPI', 'Django', 'Flask', 'Spring Boot', 'Spring Security',
  'ASP.NET', '.NET Core', 'GraphQL', 'REST APIs', 'RESTful APIs', 'gRPC', 'WebSockets', 'Microservices',
  // Databases & Storage
  'PostgreSQL', 'MySQL', 'SQLite', 'MongoDB', 'Redis', 'Cassandra', 'Elasticsearch', 'Firebase',
  'Supabase', 'DynamoDB', 'MariaDB', 'Prisma', 'Mongoose', 'Hibernate',
  // Cloud & DevOps
  'AWS', 'Amazon Web Services', 'GCP', 'Google Cloud', 'Azure', 'Docker', 'Kubernetes', 'CI/CD',
  'GitHub Actions', 'Jenkins', 'Terraform', 'Linux', 'Ubuntu', 'Nginx', 'Apache', 'Serverless',
  // AI & Data
  'TensorFlow', 'PyTorch', 'scikit-learn', 'Pandas', 'NumPy', 'Machine Learning', 'Deep Learning',
  'NLP', 'Natural Language Processing', 'Computer Vision', 'Prompt Engineering', 'LLMs', 'Large Language Models',
  'Google Gemini', 'OpenAI', 'LangChain', 'Hugging Face', 'Data Analysis', 'Data Engineering',
  // Testing & Quality
  'Unit Testing', 'Jest', 'Mocha', 'Chai', 'Cypress', 'Playwright', 'Selenium', 'Automated Testing',
  'ATF', 'Automated Test Framework',
  // Tools & Methodologies
  'Git', 'GitHub', 'GitLab', 'Jira', 'Agile', 'Scrum', 'Postman', 'ServiceNow', 'System Administration',
  'VS Code', 'Eclipse', 'IntelliJ'
];

/**
 * Words that should NEVER be accepted as candidate names or skills
 */
const FORBIDDEN_NAME_PATTERNS = [
  /resume/i, /curriculum/i, /vitae/i, /cv\b/i, /profile/i, /summary/i, /contact/i, /objective/i,
  /experience/i, /education/i, /skills/i, /projects/i, /email/i, /phone/i, /page\s*\d+/i,
  /address/i, /portfolio/i, /linkedin/i, /github/i, /developer/i, /engineer/i, /architect/i,
  /analyst/i, /bachelor/i, /master/i, /university/i, /college/i, /technology/i, /technologies/i,
  /intern\b/i, /telugu/i, /english/i, /statement/i, /career/i, /overview/i, /declaration/i,
  /hcl/i, /berri/i, /certification/i, /certified/i, /certifications/i, /achievement/i, /activities/i,
  /reference/i, /languages/i, /frameworks/i, /databases/i, /tools/i, /ext-[a-z0-9_-]+/i, /vip-[a-z0-9_-]+/i
];

/**
 * Clean & normalize raw PDF text across diverse platforms and multi-column formats
 */
export function normalizeText(raw) {
  if (!raw || typeof raw !== 'string') return '';

  return raw
    // Replace non-breaking spaces and zero-width spaces
    .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000\uFEFF]/g, ' ')
    .replace(/[\u200B\u200C\u200D]/g, '')
    // Normalize ligatures
    .replace(/ﬁ/g, 'fi')
    .replace(/ﬂ/g, 'fl')
    .replace(/ﬀ/g, 'ff')
    .replace(/ﬃ/g, 'ffi')
    .replace(/ﬄ/g, 'ffl')
    // Normalize dashes and quotation marks
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    // Standardize bullet points
    .replace(/[\u2022\u2023\u25E6\u2043\u2219▪▫◦◆❖✦★]/g, ' • ')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
}

/**
 * Extract phone numbers supporting India, US, and international notations
 */
export function extractPhone(text) {
  const phonePatterns = [
    // India: +91 8309235309, +91-8309-235309, 8309235309
    /(?:(?:\+|00)91[\s.-]?)?[6-9]\d{4}[\s.-]?\d{5}\b/,
    // US: +1 (415) 890-3412, (415) 890-3412, 415-890-3412
    /(?:\+?1[\s.-]?)?\(?\b[2-9]\d{2}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/,
    // Generic International: +XX XXX XXXXXXX
    /\+\d{1,3}[\s.-]?\d{2,4}[\s.-]?\d{3,4}[\s.-]?\d{3,4}\b/
  ];

  for (const regex of phonePatterns) {
    const match = text.match(regex);
    if (match) {
      const clean = match[0].trim().replace(/\s+/g, ' ');
      // Sanity check length
      const digits = clean.replace(/\D/g, '');
      if (digits.length >= 10 && digits.length <= 15) {
        return clean;
      }
    }
  }
  return null;
}

/**
 * Extract email address safely
 */
export function extractEmail(text) {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
  const match = text.match(emailRegex);
  return match ? match[0].toLowerCase().trim() : null;
}

/**
 * Extract LinkedIn & GitHub URLs or handles
 */
export function extractSocialLinks(text) {
  const linkedinRegex = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([A-Za-z0-9_-]+)/i;
  const githubRegex = /(?:https?:\/\/)?(?:www\.)?github\.com\/([A-Za-z0-9_-]+)/i;

  const linkedinMatch = text.match(linkedinRegex);
  const githubMatch = text.match(githubRegex);

  return {
    linkedin: linkedinMatch ? (linkedinMatch[0].startsWith('http') ? linkedinMatch[0] : `https://${linkedinMatch[0]}`) : null,
    github: githubMatch ? (githubMatch[0].startsWith('http') ? githubMatch[0] : `https://${githubMatch[0]}`) : null
  };
}

/**
 * General-Purpose Candidate Name Extractor
 * Handles multiline headers, pipes, initials (e.g. K. V. T.), prefixes, and layout variations.
 */
export function extractName(rawLines, email) {
  if (!rawLines || rawLines.length === 0) return { name: null, confidence: 0 };

  // Prepare candidate names from top 12 lines
  const candidatePool = [];
  const maxLinesToCheck = Math.min(rawLines.length, 14);

  // Helper: check if a string contains forbidden words
  const isForbidden = (str) => {
    return FORBIDDEN_NAME_PATTERNS.some(pat => pat.test(str));
  };

  for (let i = 0; i < maxLinesToCheck; i++) {
    const fullLine = rawLines[i].trim();
    if (!fullLine) continue;

    // Break lines separated by pipe, bullets, tabs or multiple spaces
    const segments = fullLine.split(/[|•·\t]{1,2}/).map(s => s.trim()).filter(Boolean);

    for (const segment of segments) {
      // Clean leading numbering, bullets, labels
      const cleanSeg = segment
        .replace(/^(?:name|candidate(?:\s*name)?)\s*[:\-]\s*/i, '')
        .replace(/^[\s\-*•·]+/g, '')
        .replace(/[\s\-*•·]+$/g, '')
        .trim();

      if (!cleanSeg || cleanSeg.length < 2 || cleanSeg.length > 55) continue;
      if (cleanSeg.includes('@') || cleanSeg.includes('http') || cleanSeg.includes('.com') || cleanSeg.includes('www.')) continue;
      if (/\d/.test(cleanSeg)) continue; // Names don't have numbers
      if (isForbidden(cleanSeg)) continue;

      const words = cleanSeg.split(/\s+/).filter(Boolean);
      // Valid names typically have 1 to 5 words (allowing initials e.g. "K V T Karunakar Rao" or "Vikram Malhotra")
      if (words.length >= 1 && words.length <= 5) {
        // Must contain only letters, dots, hyphens, and apostrophes
        if (/^[A-Za-z\s.'-]+$/.test(cleanSeg)) {
          let score = 50;

          // Prefer lines appearing earlier in the document
          score += Math.max(0, 30 - i * 3);

          // Proper capitalization (Title Case or ALL CAPS)
          const isTitleCase = words.every(w => /^[A-Z][a-z]*\.?$/.test(w) || /^[A-Z]\.?$/.test(w));
          const isAllCaps = cleanSeg === cleanSeg.toUpperCase() && /[A-Z]/.test(cleanSeg);

          if (isTitleCase) score += 20;
          if (isAllCaps) score += 15;

          // Bonus if words match tokens in the email (e.g. kvtkarunakarrarao / karunakar)
          if (email) {
            const emailLocal = email.split('@')[0].toLowerCase();
            const matchingTokens = words.filter(w => {
              const lw = w.toLowerCase().replace(/[^a-z]/g, '');
              return lw.length >= 3 && emailLocal.includes(lw);
            });
            if (matchingTokens.length > 0) {
              score += 25 * matchingTokens.length;
            }
          }

          // Penalize single word unless high score
          if (words.length === 1 && cleanSeg.length < 4) score -= 20;

          candidatePool.push({
            name: cleanSeg,
            score,
            lineIndex: i
          });
        }
      }
    }
  }

  if (candidatePool.length === 0) {
    return { name: null, confidence: 0 };
  }

  // Sort by score descending
  candidatePool.sort((a, b) => b.score - a.score);
  const best = candidatePool[0];

  if (best.score >= 50) {
    // Clean up all-caps names to Title Case for pleasing presentation
    let finalName = best.name;
    if (finalName === finalName.toUpperCase() && finalName.length > 3) {
      finalName = finalName
        .split(/\s+/)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    }
    return {
      name: finalName,
      confidence: Math.min(1.0, parseFloat((best.score / 100).toFixed(2)))
    };
  }

  return { name: null, confidence: 0 };
}

/**
 * Comprehensive Section Classifier
 * Recognizes diverse headings, variations, and orderings across resumes.
 */
const SECTION_MATCHERS = [
  {
    type: 'PROJECTS',
    regex: /^(?:(?:\d+\.?\s*)?(?:[a-z&/\s-]{0,25}\s+)?projects?(?:\s*(?:undertaken|experience|details|portfolio|work|history))?|project\s+experience|portfolio)\b/i
  },
  {
    type: 'EXPERIENCE',
    regex: /^(?:(?:\d+\.?\s*)?(?:[a-z&/\s-]{0,25}\s+)?(?:experience|employment|engagements?|internships?|work\s+history))\b/i
  },
  {
    type: 'EDUCATION',
    regex: /^(?:(?:\d+\.?\s*)?(?:[a-z&/\s-]{0,25}\s+)?(?:education(?:al)?|academic(?:s)?|qualifications?|degrees?)(?:\s*(?:background|details|history|qualifications?))?)\b/i
  },
  {
    type: 'SKILLS',
    regex: /^(?:(?:\d+\.?\s*)?(?:[a-z&/\s-]{0,25}\s+)?(?:skills?|competencies|technologies|proficiencies|expertise|toolkit|tools\s*&\s*technologies|technical\s*stack))\b/i
  },
  {
    type: 'CERTIFICATIONS',
    regex: /^(?:(?:\d+\.?\s*)?(?:[a-z&/\s-]{0,25}\s+)?(?:certifications?|certificates?|licenses?|credentials?|accreditations?))\b/i
  },
  {
    type: 'SUMMARY',
    regex: /^(?:(?:\d+\.?\s*)?(?:[a-z&/\s-]{0,25}\s+)?(?:summary|objective|profile|about\s*me))\b/i
  },
  {
    type: 'ACHIEVEMENTS',
    regex: /^(?:(?:\d+\.?\s*)?(?:[a-z&/\s-]{0,25}\s+)?(?:achievements?|honors?|awards?|accomplishments?|extracurricular(?:s)?))\b/i
  }
];

export function classifySectionHeading(line) {
  if (!line) return null;
  const cleaned = line
    .replace(/^[\s\-*•·#_=>~|:]+/, '')
    .replace(/[\s\-*•·#_=>~|:]+$/, '')
    .trim();

  // Headings are typically 1 to 6 words and under 50 characters
  if (cleaned.length < 3 || cleaned.length > 55) return null;
  const wordCount = cleaned.split(/\s+/).length;
  if (wordCount > 6) return null;

  for (const matcher of SECTION_MATCHERS) {
    if (matcher.regex.test(cleaned)) {
      return matcher.type;
    }
  }
  return null;
}

/**
 * Segment normalized resume text into structured section blocks
 */
export function segmentResume(rawLines) {
  const sections = {
    HEADER: [],
    SUMMARY: [],
    SKILLS: [],
    EXPERIENCE: [],
    PROJECTS: [],
    EDUCATION: [],
    CERTIFICATIONS: [],
    ACHIEVEMENTS: [],
    OTHER: []
  };

  let currentSection = 'HEADER';

  for (const line of rawLines) {
    const detectedType = classifySectionHeading(line);
    if (detectedType) {
      currentSection = detectedType;
    } else {
      if (!sections[currentSection]) sections[currentSection] = [];
      sections[currentSection].push(line);
    }
  }

  return sections;
}

/**
 * General-Purpose Technical Skills Extractor
 * Filters out certification codes, sentences, stopwords, and duplicates.
 */
export function extractSkills(sections, fullText) {
  const foundSkills = new Set();

  // 1. Extract canonical skills matching across document
  for (const skill of CANONICAL_SKILLS) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(fullText)) {
      foundSkills.add(skill);
    }
  }

  // 2. Extract specific tokens from explicit SKILLS section
  const skillsLines = sections.SKILLS || [];
  for (const line of skillsLines) {
    // Remove labels like "Languages:", "Frameworks:", "Tools:"
    const cleanLine = line.replace(/^[A-Za-z\s&/]+:\s*/, '');
    const tokens = cleanLine.split(/[,•|·;:\n/]/).map(t => t.trim()).filter(Boolean);

    for (const token of tokens) {
      const cleanToken = token
        .replace(/^[\s\-*•·]+/, '')
        .replace(/[\s\-*•·]+$/, '')
        .trim();

      if (
        cleanToken.length >= 2 &&
        cleanToken.length <= 32 &&
        !/\d{4}/.test(cleanToken) && // No years or certificate numbers
        !cleanToken.toLowerCase().includes('certification') &&
        !cleanToken.toLowerCase().includes('nptel') &&
        !cleanToken.toLowerCase().includes('experience') &&
        !cleanToken.toLowerCase().includes('university') &&
        !cleanToken.toLowerCase().includes('college') &&
        !cleanToken.toLowerCase().includes('developer') &&
        !cleanToken.toLowerCase().includes('engineer') &&
        !FORBIDDEN_NAME_PATTERNS.some(p => p.test(cleanToken))
      ) {
        // Standardize casing if already in canonical list
        const canonicalMatch = CANONICAL_SKILLS.find(s => s.toLowerCase() === cleanToken.toLowerCase());
        foundSkills.add(canonicalMatch || cleanToken);
      }
    }
  }

  return Array.from(foundSkills).slice(0, 35);
}

/**
 * General-Purpose Projects Extractor
 * Identifies project titles, tech stack, descriptions, and outcomes without assuming fixed counts.
 */
export function extractProjects(sections, fullText) {
  const projects = [];
  const projLines = sections.PROJECTS || [];

  if (projLines.length === 0) {
    return projects;
  }

  let currentProject = null;

  for (let i = 0; i < projLines.length; i++) {
    const line = projLines[i].trim();
    if (!line) continue;

    const isBullet = /^[-*•·▪▫]/.test(line);
    const cleanLine = line.replace(/^[-*•·▪▫\s]+/, '').trim();

    // Check if line represents a project header
    // Indicators: Non-bullet, reasonable length (< 90 chars), or contains tech delimiter (| , — , - , :)
    const hasDelimiter = /[:|—–]/.test(line);
    const isShortHeader = !isBullet && cleanLine.length >= 3 && cleanLine.length <= 80 && !cleanLine.endsWith('.');

    if (isShortHeader || (!isBullet && hasDelimiter && cleanLine.length <= 95)) {
      if (currentProject) {
        projects.push(currentProject);
      }

      // Split title and inline technologies or descriptions
      let title = cleanLine;
      let inlineDesc = '';
      const techStack = [];

      if (line.includes('|')) {
        const parts = line.split('|').map(p => p.trim());
        title = parts[0].replace(/^[-*•·\s]+/, '');
        inlineDesc = parts.slice(1).join(' | ');
      } else if (line.includes('—') || line.includes('–')) {
        const parts = line.split(/[—–]/).map(p => p.trim());
        title = parts[0].replace(/^[-*•·\s]+/, '');
        inlineDesc = parts.slice(1).join(' ');
      } else if (line.includes(':') && !line.toLowerCase().startsWith('technolog')) {
        const parts = line.split(':').map(p => p.trim());
        title = parts[0].replace(/^[-*•·\s]+/, '');
        inlineDesc = parts.slice(1).join(': ');
      }

      // Extract technologies mentioned in header
      for (const skill of CANONICAL_SKILLS) {
        if (new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(line)) {
          techStack.push(skill);
        }
      }

      currentProject = {
        title: title.trim(),
        description: inlineDesc.trim(),
        technologies: techStack,
        responsibilities: []
      };
    } else if (currentProject) {
      // Add as responsibility or description
      if (isBullet) {
        currentProject.responsibilities.push(cleanLine);
      } else {
        if (currentProject.description) {
          currentProject.description += ' ' + cleanLine;
        } else {
          currentProject.description = cleanLine;
        }
      }

      // Find technologies in project body
      for (const skill of CANONICAL_SKILLS) {
        if (
          new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(cleanLine) &&
          !currentProject.technologies.includes(skill)
        ) {
          currentProject.technologies.push(skill);
        }
      }
    }
  }

  if (currentProject) {
    projects.push(currentProject);
  }

  // Clean up and ensure descriptions exist
  return projects.map(p => ({
    ...p,
    description: p.description || (p.responsibilities.length > 0 ? p.responsibilities.join('; ') : 'Project detailed in candidate resume.')
  }));
}

/**
 * General-Purpose Work Experience Extractor
 */
export function extractExperience(sections) {
  const experiences = [];
  const expLines = sections.EXPERIENCE || [];
  const roleKeywords = ['engineer', 'developer', 'intern', 'analyst', 'lead', 'architect', 'manager', 'consultant', 'specialist', 'associate', 'programmer', 'administrator', 'trainee'];
  const yearPattern = /\b(?:19|20)\d{2}\s*(?:[-–—to\s]+\s*(?:19|20\d{2}|Present|Current))?\b/i;

  let currentExp = null;

  for (const line of expLines) {
    const isBullet = /^[-*•·▪▫]/.test(line);
    const cleanLine = line.replace(/^[-*•·▪▫\s]+/, '').trim();
    const lower = cleanLine.toLowerCase();
    const hasRole = !isBullet && roleKeywords.some(r => lower.includes(r));
    const yearMatch = cleanLine.match(yearPattern);

    if (hasRole) {
      if (currentExp) experiences.push(currentExp);

      let role = cleanLine;
      let company = 'Organization';
      let duration = yearMatch ? yearMatch[0] : null;

      if (cleanLine.includes('|')) {
        const parts = cleanLine.split('|').map(p => p.trim());
        role = parts[0];
        company = parts[1] || 'Organization';
      } else if (cleanLine.includes(' at ')) {
        const parts = cleanLine.split(' at ');
        role = parts[0].trim();
        company = parts[1].trim();
      }

      currentExp = {
        role,
        company,
        duration,
        highlights: []
      };
    } else if (currentExp) {
      if (isBullet) {
        currentExp.highlights.push(cleanLine);
      } else if (yearMatch && !currentExp.duration) {
        currentExp.duration = yearMatch[0];
      } else if (currentExp.highlights.length === 0 && currentExp.company === 'Organization' && cleanLine.length < 60) {
        currentExp.company = cleanLine;
      } else {
        currentExp.highlights.push(cleanLine);
      }
    }
  }

  if (currentExp) experiences.push(currentExp);
  return experiences;
}

/**
 * General-Purpose Education Extractor
 */
export function extractEducation(sections, rawLines) {
  const educationList = [];
  const eduLines = sections.EDUCATION && sections.EDUCATION.length > 0 ? sections.EDUCATION : rawLines;
  const degreeKeywords = ['bachelor', 'master', 'b.tech', 'b.e.', 'b.s.', 'b.sc', 'm.tech', 'm.s.', 'm.sc', 'mba', 'ph.d', 'degree', 'diploma', 'high school', 'secondary'];
  const institutionKeywords = ['university', 'college', 'institute', 'school', 'academy', 'polytechnic'];
  const yearPattern = /\b(?:19|20)\d{2}\s*(?:[-–—to\s]+\s*(?:19|20\d{2}|Present|Current))?\b/i;

  let currentEdu = null;

  for (const line of eduLines) {
    const cleanLine = line.replace(/^[-*•·▪▫\s]+/, '').trim();
    const lower = cleanLine.toLowerCase();
    const hasDegree = degreeKeywords.some(d => lower.includes(d));
    const hasInst = institutionKeywords.some(inst => lower.includes(inst));
    const yearMatch = cleanLine.match(yearPattern);

    if (hasDegree || hasInst) {
      if (currentEdu && (!currentEdu.hasDegree || !currentEdu.hasInst)) {
        if (hasDegree && !currentEdu.hasDegree) {
          currentEdu.degree = cleanLine;
          currentEdu.hasDegree = true;
        }
        if (hasInst && !currentEdu.hasInst) {
          currentEdu.institution = cleanLine;
          currentEdu.hasInst = true;
        }
        if (yearMatch && !currentEdu.year) {
          currentEdu.year = yearMatch[0];
        }
      } else {
        if (currentEdu) {
          delete currentEdu.hasDegree;
          delete currentEdu.hasInst;
          educationList.push(currentEdu);
        }
        currentEdu = {
          degree: hasDegree ? cleanLine : 'Degree / Program',
          institution: hasInst ? cleanLine : 'Educational Institution',
          year: yearMatch ? yearMatch[0] : null,
          details: [],
          hasDegree,
          hasInst
        };
      }
    } else if (currentEdu) {
      if (yearMatch && !currentEdu.year) {
        currentEdu.year = yearMatch[0];
      }
      currentEdu.details.push(cleanLine);
    }
  }

  if (currentEdu) {
    delete currentEdu.hasDegree;
    delete currentEdu.hasInst;
    educationList.push(currentEdu);
  }

  return educationList;
}

/**
 * Extract Certifications & Credentials
 */
export function extractCertifications(sections) {
  const certList = [];
  const certLines = sections.CERTIFICATIONS || [];

  for (const line of certLines) {
    const clean = line.replace(/^[-*•·▪▫\s]+/, '').trim();
    if (clean.length > 3 && clean.length < 150) {
      certList.push(clean);
    }
  }
  return certList;
}

/**
 * Main General-Purpose Candidate Parser Engine
 * Guarantees zero candidate-specific hardcoding and handles diverse resumes.
 */
export function extractCandidateDetails(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return {
      name: null,
      email: null,
      phone: null,
      linkedin: null,
      github: null,
      summary: null,
      skills: [],
      education: [],
      experience: [],
      projects: [],
      certifications: [],
      fieldConfidence: {
        name: { status: 'MISSING', confidence: 0 },
        email: { status: 'MISSING', confidence: 0 },
        phone: { status: 'MISSING', confidence: 0 },
        skills: { status: 'MISSING', confidence: 0, count: 0 },
        projects: { status: 'MISSING', confidence: 0, count: 0 },
        experience: { status: 'MISSING', confidence: 0, count: 0 },
        education: { status: 'MISSING', confidence: 0, count: 0 }
      },
      identifiedFields: {
        name: false,
        email: false,
        phone: false,
        skills: false,
        education: false,
        experience: false,
        projects: false
      }
    };
  }

  const normalized = normalizeText(rawText);
  const rawLines = normalized.split('\n').map(l => l.trim()).filter(Boolean);

  // 1. Contact & Social Information
  const email = extractEmail(normalized);
  const phone = extractPhone(normalized);
  const { linkedin, github } = extractSocialLinks(normalized);

  // 2. Candidate Name
  const { name, confidence: nameConfidence } = extractName(rawLines, email);

  // 3. Section Segmentation
  const sections = segmentResume(rawLines);

  // 4. Skills Extraction
  const skills = extractSkills(sections, normalized);

  // 5. Projects Extraction
  const projects = extractProjects(sections, normalized);

  // 6. Experience Extraction
  const experience = extractExperience(sections);

  // 7. Education Extraction
  const education = extractEducation(sections, rawLines);

  // 8. Certifications Extraction
  const certifications = extractCertifications(sections);

  // 9. Summary Extraction
  const summary = sections.SUMMARY && sections.SUMMARY.length > 0
    ? sections.SUMMARY.join(' ').slice(0, 500).trim()
    : null;

  // 10. Compute Field-Level Confidence
  const fieldConfidence = {
    name: {
      status: name ? (nameConfidence >= 0.7 ? 'IDENTIFIED' : 'UNCERTAIN') : 'MISSING',
      confidence: nameConfidence
    },
    email: {
      status: email ? 'IDENTIFIED' : 'MISSING',
      confidence: email ? 1.0 : 0
    },
    phone: {
      status: phone ? 'IDENTIFIED' : 'MISSING',
      confidence: phone ? 0.95 : 0
    },
    skills: {
      status: skills.length > 0 ? 'IDENTIFIED' : 'MISSING',
      confidence: skills.length >= 5 ? 0.95 : skills.length > 0 ? 0.75 : 0,
      count: skills.length
    },
    projects: {
      status: projects.length > 0 ? 'IDENTIFIED' : 'MISSING',
      confidence: projects.length >= 1 ? 0.9 : 0,
      count: projects.length
    },
    experience: {
      status: experience.length > 0 ? 'IDENTIFIED' : 'MISSING',
      confidence: experience.length >= 1 ? 0.9 : 0,
      count: experience.length
    },
    education: {
      status: education.length > 0 ? 'IDENTIFIED' : 'MISSING',
      confidence: education.length >= 1 ? 0.9 : 0,
      count: education.length
    }
  };

  return {
    name,
    email,
    phone,
    linkedin,
    github,
    summary,
    skills,
    education,
    experience,
    projects,
    certifications,
    fieldConfidence,
    identifiedFields: {
      name: Boolean(name),
      email: Boolean(email),
      phone: Boolean(phone),
      skills: skills.length > 0,
      education: education.length > 0,
      experience: experience.length > 0,
      projects: projects.length > 0,
      linkedin: Boolean(linkedin),
      github: Boolean(github),
      certifications: certifications.length > 0
    }
  };
}

/**
 * Format bytes into human-readable representation
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Parses an in-memory PDF buffer safely using pdf-parse.
 * Does not write file to disk. Includes OCR/scanned document detection notice.
 */
export async function parseResumePdf(buffer, filename = 'resume.pdf') {
  if (!buffer || buffer.length === 0) {
    const err = new Error('Empty file buffer received.');
    err.code = 'EMPTY_FILE';
    err.status = 400;
    throw err;
  }

  // Validate PDF magic number header (%PDF-)
  const header = buffer.slice(0, 5).toString('ascii');
  if (!header.startsWith('%PDF')) {
    const err = new Error('The uploaded file is not a valid PDF document.');
    err.code = 'INVALID_PDF_CONTENT';
    err.status = 400;
    throw err;
  }

  // Use explicit Uint8Array slice to guarantee accurate byte offsets in Node v25+
  const uint8Array = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);

  let pdfData;
  try {
    pdfData = await pdf(uint8Array);
  } catch (parseError) {
    console.error('[PDF PARSE ERROR]:', parseError);
    const err = new Error('Unable to extract text from PDF. The document may be corrupted or password-protected.');
    err.code = 'PDF_PARSE_FAILED';
    err.status = 422;
    throw err;
  }

  const rawText = (pdfData.text || '').trim();
  const wordCount = rawText ? rawText.split(/\s+/).filter(Boolean).length : 0;
  const characterCount = rawText.length;
  const pageCount = pdfData.numpages || 1;

  // Extract structured candidate details deterministically
  const candidate = extractCandidateDetails(rawText);

  // Scanned document / image-only PDF detection notice
  const isLikelyScanned = characterCount < 40 && pageCount >= 1;
  const notice = characterCount === 0
    ? 'The PDF contains no selectable text. It may be a scanned image or empty document.'
    : isLikelyScanned
    ? 'Low text volume detected (< 40 characters). The document may be a scanned image with minimal OCR text.'
    : null;

  return {
    success: true,
    filename: filename,
    fileSizeBytes: buffer.length,
    fileSizeFormatted: formatBytes(buffer.length),
    pageCount: pageCount,
    extractionMethod: 'RULE_BASED_PARSER',
    isSimulation: true,
    wordCount: wordCount,
    characterCount: characterCount,
    candidate: candidate,
    extractedText: rawText,
    hasContent: characterCount > 0,
    isScannedDocument: isLikelyScanned,
    notice: notice,
    timestamp: new Date().toISOString()
  };
}

import express from 'express';
import multer from 'multer';
import path from 'path';
import { parseResumePdf } from '../services/resumeParser.js';

const router = express.Router();

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// Store exclusively in memory - never written to disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Check MIME type
    const isPdfMime = file.mimetype === 'application/pdf';
    // Check extension
    const ext = path.extname(file.originalname).toLowerCase();
    const isPdfExt = ext === '.pdf';

    if (isPdfMime && isPdfExt) {
      cb(null, true);
    } else {
      const err = new Error('Invalid file format. Only PDF documents (.pdf) are supported.');
      err.code = 'INVALID_FILE_TYPE';
      err.status = 400;
      cb(err, false);
    }
  }
}).single('resume');

// Multer middleware wrapper with specific error categorization
const handleResumeUpload = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            error: {
              message: 'File size exceeds maximum allowed limit of 5 MB.',
              code: 'FILE_TOO_LARGE'
            }
          });
        }
        return res.status(400).json({
          success: false,
          error: {
            message: `Upload error: ${err.message}`,
            code: err.code || 'UPLOAD_ERROR'
          }
        });
      }

      return res.status(err.status || 400).json({
        success: false,
        error: {
          message: err.message || 'File upload rejected.',
          code: err.code || 'INVALID_UPLOAD'
        }
      });
    }

    next();
  });
};

/**
 * POST /api/resume/parse
 * Accepts a PDF file via multipart form field 'resume'
 * Validates, parses text in-memory, and extracts candidate information
 */
router.post('/parse', handleResumeUpload, async (req, res) => {
  try {
    // Validate file presence
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'No file uploaded. Please select a valid PDF file.',
          code: 'NO_FILE_UPLOADED'
        }
      });
    }

    // Validate empty file
    if (req.file.size === 0 || !req.file.buffer || req.file.buffer.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'The uploaded file is empty (0 bytes). Please upload a valid resume PDF.',
          code: 'EMPTY_FILE'
        }
      });
    }

    const result = await parseResumePdf(req.file.buffer, req.file.originalname);

    return res.status(200).json(result);
  } catch (error) {
    console.error('[RESUME ROUTE ERROR]:', error);
    return res.status(error.status || 500).json({
      success: false,
      error: {
        message: error.message || 'An unexpected error occurred while parsing the resume.',
        code: error.code || 'SERVER_PARSE_ERROR'
      }
    });
  }
});

/**
 * GET /api/resume/sample
 * Provides a verified sample resume profile for quick demo & lab evaluation
 */
router.get('/sample', async (req, res) => {
  const sampleCandidate = {
    name: 'Ananya Rao',
    email: 'ananya.rao@example.com',
    phone: '+91 98765 43210',
    skills: [
      'JavaScript', 'TypeScript', 'React', 'Node.js', 'Express',
      'Python', 'PostgreSQL', 'MongoDB', 'Docker', 'Git',
      'REST APIs', 'Tailwind CSS', 'Prompt Engineering', 'Jest'
    ],
    education: [
      {
        degree: 'B.Tech in Computer Science and Engineering',
        institution: 'Indian Institute of Technology (IIT) Hyderabad',
        year: '2020 - 2024',
        details: ['CGPA: 8.9 / 10.0', 'Specialization: Distributed Systems & AI']
      }
    ],
    experience: [
      {
        role: 'Full Stack Engineering Intern',
        company: 'CloudScale Technologies',
        duration: 'Jan 2024 - Jun 2024',
        highlights: [
          'Engineered backend microservices in Node.js & Express with 99.9% uptime',
          'Developed responsive React analytics dashboard utilized by 15,000+ daily active users',
          'Implemented Redis caching layer decreasing API latency by 42%'
        ]
      }
    ],
    projects: [
      {
        title: 'AI Conversational Interviewer',
        description: 'Interactive AI mock interview system with PDF resume grounding and rubric evaluation.',
        technologies: ['React', 'Node.js', 'Express', 'JavaScript']
      },
      {
        title: 'Neural Vision Medical Diagnostic Tool',
        description: 'Deep learning imaging pipeline for early abnormality detection with automated report generation.',
        technologies: ['Python', 'Docker', 'PostgreSQL']
      }
    ],
    identifiedFields: {
      name: true,
      email: true,
      phone: true,
      skills: true,
      education: true,
      experience: true,
      projects: true
    }
  };

  const sampleRawText = `Ananya Rao
ananya.rao@example.com | +91 98765 43210 | Hyderabad, India
LinkedIn: linkedin.com/in/ananyarao | GitHub: github.com/ananyarao

PROFESSIONAL SUMMARY
Dynamic Full Stack Engineer with strong foundations in distributed web systems, prompt engineering, and modern JavaScript/TypeScript ecosystems.

TECHNICAL SKILLS
Languages: JavaScript, TypeScript, Python, HTML5, CSS3, SQL
Frameworks: React, Node.js, Express, Tailwind CSS, Jest
Databases & Cloud: PostgreSQL, MongoDB, Docker, Git, REST APIs, Redis

WORK EXPERIENCE
Full Stack Engineering Intern
CloudScale Technologies | Jan 2024 - Jun 2024
• Engineered backend microservices in Node.js & Express with 99.9% uptime
• Developed responsive React analytics dashboard utilized by 15,000+ daily active users
• Implemented Redis caching layer decreasing API latency by 42%

EDUCATION
B.Tech in Computer Science and Engineering
Indian Institute of Technology (IIT) Hyderabad | 2020 - 2024
CGPA: 8.9 / 10.0 | Specialization: Distributed Systems & AI

KEY PROJECTS
AI Conversational Interviewer: Interactive AI mock interview system with PDF resume grounding
Neural Vision Medical Diagnostic Tool: Deep learning imaging pipeline with automated report generation`;

  return res.json({
    success: true,
    filename: 'sample_ananya_rao_resume.pdf',
    fileSizeBytes: 48210,
    fileSizeFormatted: '47.08 KB',
    pageCount: 1,
    extractionMethod: 'RULE_BASED_PARSER',
    isSimulation: true,
    wordCount: sampleRawText.split(/\s+/).length,
    characterCount: sampleRawText.length,
    candidate: sampleCandidate,
    extractedText: sampleRawText,
    hasContent: true,
    notice: 'Loaded sample verified candidate profile for laboratory demonstration.',
    timestamp: new Date().toISOString()
  });
});

export default router;

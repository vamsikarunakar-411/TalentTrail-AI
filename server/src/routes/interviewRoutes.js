import express from 'express';
import {
  generateInterviewQuestions,
  evaluateAnswer,
  summarizeInterview,
  processAdaptiveTurn
} from '../services/interviewService.js';

const router = express.Router();

/**
 * POST /api/interview/generate-questions
 * Generates resume-grounded questions across technical, project, problem-solving, and HR categories
 */
router.post('/generate-questions', async (req, res) => {
  try {
    const { candidate, role, level, focus, language, totalTurns } = req.body;

    if (!candidate) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Candidate profile data is required to generate grounded interview questions.',
          code: 'MISSING_CANDIDATE_DATA'
        }
      });
    }

    const result = await generateInterviewQuestions({
      candidate,
      role: role || 'Full Stack Developer',
      level: level || 'Mid-Level (2-5 Years)',
      focus: focus || 'Technical & Coding Depth',
      language: language || 'en-US',
      totalTurns: Number(totalTurns) || 8
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('[GENERATE QUESTIONS ERROR]:', error);
    return res.status(error.status || 500).json({
      success: false,
      error: {
        message: error.message || 'Failed to generate interview questions.',
        code: error.code || 'QUESTION_GENERATION_FAILED'
      }
    });
  }
});

/**
 * POST /api/interview/evaluate-answer
 * Evaluates candidate response using structured rubrics against question and candidate context
 */
router.post('/evaluate-answer', async (req, res) => {
  try {
    const { question, answer, candidate, role, level, language } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Interview question context is required for evaluation.',
          code: 'MISSING_QUESTION'
        }
      });
    }

    if (answer === undefined || answer === null || String(answer).trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Answer cannot be empty. Please provide a typed or spoken response before submitting.',
          code: 'EMPTY_ANSWER'
        }
      });
    }

    const evaluation = await evaluateAnswer({
      question,
      answer: String(answer).trim(),
      candidate: candidate || {},
      role: role || 'Full Stack Developer',
      level: level || 'Mid-Level',
      language: language || 'en-US'
    });

    return res.status(200).json({
      success: true,
      evaluation
    });
  } catch (error) {
    console.error('[EVALUATE ANSWER ERROR]:', error);
    return res.status(error.status || 500).json({
      success: false,
      error: {
        message: error.message || 'Failed to evaluate interview answer.',
        code: error.code || 'EVALUATION_FAILED'
      }
    });
  }
});

/**
 * POST /api/interview/adaptive-turn
 * Processes a single turn: evaluates candidate answer internally and generates adaptive next question
 */
router.post('/adaptive-turn', async (req, res) => {
  try {
    const {
      question,
      answer,
      candidate,
      turnIndex,
      totalTurns,
      sessionHistory,
      role,
      level,
      language
    } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Question context is required to process the interview turn.',
          code: 'MISSING_QUESTION'
        }
      });
    }

    if (answer === undefined || answer === null || String(answer).trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Answer cannot be empty. Please provide a spoken or typed response before advancing.',
          code: 'EMPTY_ANSWER'
        }
      });
    }

    const result = await processAdaptiveTurn({
      question,
      answer: String(answer).trim(),
      candidate: candidate || {},
      turnIndex: Number(turnIndex) || 1,
      totalTurns: Number(totalTurns) || 6,
      sessionHistory: Array.isArray(sessionHistory) ? sessionHistory : [],
      role: role || 'Full Stack Developer',
      level: level || 'Mid-Level',
      language: language || 'en-US'
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('[ADAPTIVE TURN ERROR]:', error);
    return res.status(error.status || 500).json({
      success: false,
      error: {
        message: error.message || 'Failed to process interview turn.',
        code: error.code || 'ADAPTIVE_TURN_FAILED'
      }
    });
  }
});

/**
 * POST /api/interview/complete
 * Aggregates all answers and rubrics to provide final score, strengths, and evidence-based recommendation
 */
router.post('/complete', async (req, res) => {
  try {
    const {
      candidate,
      role,
      level,
      sessionHistory,
      language,
      terminationStatus,
      terminationReason,
      terminatedAt
    } = req.body;

    const safeHistory = Array.isArray(sessionHistory) ? sessionHistory : [];

    if (safeHistory.length === 0 && !terminationStatus) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Session history containing questions and evaluations is required.',
          code: 'INVALID_SESSION_HISTORY'
        }
      });
    }

    const summary = summarizeInterview({
      candidate: candidate || {},
      role: role || 'Full Stack Developer',
      level: level || 'Mid-Level',
      sessionHistory: safeHistory,
      language: language || 'en-US',
      terminationStatus,
      terminationReason,
      terminatedAt
    });

    return res.status(200).json({
      success: true,
      summary
    });
  } catch (error) {
    console.error('[COMPLETE INTERVIEW ERROR]:', error);
    return res.status(error.status || 500).json({
      success: false,
      error: {
        message: error.message || 'Failed to generate interview completion summary.',
        code: error.code || 'SUMMARY_FAILED'
      }
    });
  }
});

export default router;

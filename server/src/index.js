import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import resumeRoutes from './routes/resumeRoutes.js';
import interviewRoutes from './routes/interviewRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
const HAS_API_KEY = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);

// Middleware
app.use(cors({
  origin: '*', // Allows local dev connections from Vite
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

import fs from 'fs';

// Helper to retrieve current Gemini configuration dynamically
function getGeminiConfig() {
  if (!process.env.GEMINI_API_KEY || !process.env.GEMINI_API_KEY.trim()) {
    try {
      dotenv.config({ override: true });
    } catch {
      // Ignored
    }
  }
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  const hasApiKey = apiKey.length > 0;
  const configuredModel = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
  return {
    hasApiKey,
    configuredModel,
    activeModel: hasApiKey ? configuredModel : null,
    mode: hasApiKey ? 'LIVE_AI' : 'SIMULATION_MODE',
    simulationReason: hasApiKey ? null : 'NO_API_KEY_CONFIGURED'
  };
}

// Health & Status Check Endpoint
app.get('/api/health', (req, res) => {
  const config = getGeminiConfig();
  res.json({
    status: 'ok',
    service: 'TalentTrail AI Gateway',
    version: '1.0.0',
    mode: config.mode,
    hasApiKey: config.hasApiKey,
    configuredModel: config.configuredModel,
    activeModel: config.activeModel,
    simulationReason: config.simulationReason,
    simulationEngine: 'Deterministic Resume-Grounded Multi-Domain Rubric Engine',
    timestamp: new Date().toISOString(),
    supportedLanguages: ['te-IN', 'en-US', 'ml-IN', 'kn-IN', 'hi-IN', 'ta-IN'],
    maxUploadSize: process.env.MAX_FILE_SIZE_BYTES || 5242880
  });
});

// Resume Upload & PDF Parsing Routes
app.use('/api/resume', resumeRoutes);

// Interview Question Generation, Evaluation & Completion Routes
app.use('/api/interview', interviewRoutes);

// Static Client Dist Serving (If Built)
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Centralized safe error handler
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      code: err.code || 'INTERNAL_ERROR'
    }
  });
});

// 404 handler for unknown API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: {
      message: `API endpoint ${req.originalUrl} not found`,
      code: 'NOT_FOUND'
    }
  });
});


const isDirectRun = process.argv[1] && (
  process.argv[1].endsWith('index.js') ||
  process.argv[1].replace(/\\/g, '/').endsWith('src/index.js')
);

let server = null;
if (isDirectRun) {
  server = app.listen(PORT, () => {
    console.log(`[TalentTrail AI Server] Listening on http://localhost:${PORT}`);
    console.log(`[Mode] ${HAS_API_KEY ? 'LIVE GEMINI AI (' + GEMINI_MODEL + ')' : 'SIMULATION MODE (No API Key detected)'}`);
  });
}

export default app;

# TalentTrail AI — Autonomous Voice Interview Experience

> **Autonomous AI-Powered Resume-Based Mock Interview Platform**  
> AI Interviewer: **Ismav** | Theme: **Lavender + White** | Independent Product Identity

TalentTrail AI is a modern, responsive mock interview platform featuring in-memory PDF resume parsing, autonomous voice interviews conducted by AI interviewer **Ismav**, intelligent resume-grounded adaptive questioning, real-time speech recognition with dynamic silence detection, silent rubric evaluation during active turns, and comprehensive post-interview assessment reports.

---

## 🎨 Product Identity & Design Philosophy

- **Platform Identity**: TalentTrail AI
- **AI Interviewer**: Ismav — A friendly, professional AI interviewer character with animated visual states:
  - `idle`: Welcoming and calm.
  - `speaking`: Synchronized lip-sync speech waves and lavender audio equalizers.
  - `listening`: Attentive posture with listening halo ring and real-time audio detection.
  - `thinking` (processing): Contemplative expression with rotating lavender orbit.
  - `completed`: Celebratory halo with performance badge.
- **Color Palette**:
  - Canvas: Pale Lavender (`#FAF9FE`)
  - Cards & Surfaces: Crisp Pure White (`#FFFFFF`)
  - Accents: Restrained Soft Lavender (`#8B5CF6`, `#A78BFA`, `#EDE9FE`)
  - Typography: Dark, highly readable slate text (`#0F172A`, `#334155`, `#64748B`)
  - Semantic Statuses: Emerald (`#10B981`), Amber (`#F59E0B`), Crimson (`#EF4444`)
- **Aesthetic**: Premium, minimalist, accessible focus states, deliberate spacing, responsive desktop/mobile layouts, and zero unnecessary visual clutter.

---

## 🏗️ Architecture

```
activity-1/
├── client/                     # Frontend (React 19 + Vite + Lucide Icons)
│   ├── src/
│   │   ├── components/
│   │   │   ├── avatar/         # Ismav: Animated SVG AI Interviewer Avatar
│   │   │   ├── common/         # Header, Footer, navigation tabs
│   │   │   ├── dashboard/      # Focused dashboard with Ismav voice test & engine indicator
│   │   │   ├── interview/      # Setup, resume ingestion, autonomous room & report
│   │   │   │   ├── InterviewSetupView.jsx        # Stepper controller
│   │   │   │   ├── ResumeUploadSection.jsx       # In-memory drag-and-drop PDF parser
│   │   │   │   ├── ParsedResumePreview.jsx       # Verified candidate profile
│   │   │   │   ├── InterviewConfigSection.jsx    # Pre-interview mic & camera check
│   │   │   │   ├── InterviewRoomView.jsx         # Autonomous voice state machine
│   │   │   │   └── InterviewCompletionReport.jsx # Comprehensive final scorecard
│   │   │   ├── rubrics/        # Transparent 4-dimensional prompt scoring rubrics
│   │   │   └── history/        # Candidate archive and scorecard records
│   │   ├── styles/             # Lavender + White design tokens & global CSS
│   │   ├── App.jsx             # Shell & API health integration
│   │   └── main.jsx
│   └── vite.config.js          # API proxy to Express backend
├── server/                     # Backend API Gateway (Node.js + Express)
│   ├── src/
│   │   ├── index.js            # Express server, CORS, error handler
│   │   ├── routes/
│   │   │   ├── resumeRoutes.js # In-memory PDF upload and parsing endpoints
│   │   │   └── interviewRoutes.js # Questions, adaptive turns, completion
│   │   └── services/
│   │       ├── resumeParserService.js # In-memory regex & layout extractor
│   │       └── interviewService.js    # Gemini / Simulation question & rubric engine
│   ├── test_resume_api.js      # Resume ingestion regression test suite (15 tests)
│   ├── test_interview_api.js   # Interview turn & rubric test suite (25 tests)
│   ├── .env.example            # Gemini configuration template
│   └── package.json
├── .gitignore                  # Prevents committing .env secrets or node_modules
└── README.md
```

---

## 🎙️ Autonomous Voice Interview State Machine

TalentTrail AI eliminates the manual "Click to Speak" and "Submit Answer" friction. The interview operates on an automated state machine:

```
[ READY ] 
    │
    ▼ (Candidate initiates interview)
[ ASKING_QUESTION ] 
    │ (Ismav speaks question via SpeechSynthesis; mic is muted during speech)
    ▼ (TTS finishes)
[ LISTENING ] 
    │ (SpeechRecognition automatically activates; live transcript streams)
    │ (Dynamic silence detection: resets on new speech; 4.5s pause detected)
    ▼
[ PROCESSING_ANSWER ] 
    │ (Transcript finalized; evaluated silently on backend; next question generated)
    ▼
[ NEXT_QUESTION ] ───── (Turn < Total) ─────► [ ASKING_QUESTION ]
    │
    ▼ (Final turn completed)
[ COMPLETED ] ───► [ Full Assessment Report with Rubrics & Recommendation ]
```

### Key Technical Safeguards:
1. **Self-Capture Prevention**: When Ismav speaks, browser speech recognition is safely stopped/paused to ensure Ismav's voice is never transcribed as candidate speech.
2. **Dynamic Silence Detection**: Rather than a fixed timer that cuts candidates off mid-sentence, the silence timer resets on every `onresult` speech event. Auto-advance triggers only after a continuous 10-second silence threshold after speech has occurred.
3. **No Per-Question Scores Shown**: During active turns, candidate answers are scored internally on the backend. No scores, rubric breakdowns, strengths, or missing points are shown until the candidate completes all interview turns.
4. **Safety & Fallback Controls**: Candidate can pause/resume anytime, manually type or edit technical terms in the live transcript box, or click "Finish Answer & Advance" immediately without waiting 4.5 seconds.
5. **Camera & Tab-Focus Behavior**:
   - Optional local camera self-view pip box (never recorded, never uploaded, no biometric surveillance).
   - Non-invasive window focus warning if the candidate switches tabs or minimizes the window (no false claims of blocking OS split-screen, no automated penalties).

---

## 🔑 AI Engine & Simulation Mode

The backend supports two operation modes:

1. **Live Gemini AI Mode**:
   - Set a valid Google Gemini API key in `server/.env`.
   - Uses `@google/genai` with model `gemini-2.0-flash` (or `gemini-1.5-flash`).
   - Dynamically probes candidate claims, generates follow-up questions, and evaluates responses against strict rubrics.
2. **Deterministic Simulation Engine**:
   - If no API key is supplied, TalentTrail AI automatically runs in **[SIMULATION MODE]**.
   - Questions and follow-up probes are deterministically derived from the candidate's parsed resume skills, projects, and work history.
   - Evaluates answers using structured semantic rubrics with zero external API calls at **zero cost**.
   - Clearly labelled badges inform users of simulation mode.

> **Privacy & Security**: The frontend **never** has access to API keys. Resumes are processed strictly in-memory (`multer.memoryStorage`) and raw files are never persisted to disk.

---

## 🚀 Setup & Execution Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Step 1: Install Dependencies
Open a terminal in the project root (`activity-1`):

```bash
# Install server dependencies
npm --prefix server install

# Install client dependencies
npm --prefix client install
```

### Step 2: Configure Environment (Optional)
To test with Google Gemini AI:
```bash
cp server/.env.example server/.env
```
Edit `server/.env` and paste your Gemini API key:
```env
PORT=5000
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash
```
*(If left blank, TalentTrail AI automatically runs in Deterministic Simulation Mode).*

### Step 3: Run the Application
In terminal 1, start the backend server:
```bash
npm run server:dev
```
*Backend server runs on:* `http://localhost:5000`

In terminal 2, start the Vite frontend:
```bash
npm run client:dev
```
*Frontend runs on:* `http://localhost:5173`

---

## 🧪 Testing & Verification

Run the automated backend test suites:

```bash
# Run resume parsing API tests (15 tests)
node server/test_resume_api.js

# Run interview turn, rubric, and completion tests (25 tests)
node server/test_interview_api.js
```

Validate client build:
```bash
npm --prefix client run build
```

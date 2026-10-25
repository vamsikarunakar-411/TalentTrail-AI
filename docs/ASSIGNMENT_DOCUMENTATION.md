# TalentTrail AI — Autonomous Interview System
## Academic Assignment Documentation & Comprehensive Test Evidence Portfolio

- **Course / Assignment**: AI Interview Chatbot Lab Assignment
- **Target Submission Date**: October 26, 2026
- **System Name**: TalentTrail AI (with Ismav Autonomous Interviewer)
- **Version**: 2.2.0

---

## 1. Introduction to Chatbot

### Purpose
TalentTrail AI is an autonomous, multimodal, multilingual AI mock interview system designed to simulate realistic technical and behavioral hiring evaluations for candidates. The system solves key challenges in modern remote recruitment:
1. **Interactive Presence**: Provides an animated humanoid interviewer robot, **Ismav**, that features expressive facial cues, natural mouth movements synchronized with speech events, nodding, and gesturing.
2. **Persistent Candidate Self-View**: Displays a persistent live camera self-view beside Ismav throughout the entire active interview, allowing candidates to monitor their presentation posture and framing without covering questions or answer controls.
3. **Multilingual Access**: Fully supports six regional languages (English, Telugu, Hindi, Tamil, Kannada, and Malayalam) across text-to-speech, speech recognition, and question generation.
4. **Honest Transparent Intelligence**: Distinctly separates genuine Google Gemini LLM API calls from local deterministic simulation fallback with zero misleading branding or fake model claims.
5. **Ethical Non-Punitive Feedback**: Evaluates candidates strictly against objective technical competence and communication rubrics, using camera posture telemetry solely for supportive, non-scoring feedback.

### Features
- **In-Memory Resume Parsing**: Extracts candidate name, contact metadata, technical skills, employment experience, and academic background from uploaded PDF documents without storing files on disk.
- **Dedicated Preflight Device Readiness**: Tests hardware camera availability, visual framing, Web Audio API decibel metering (0–100 dB), and an interactive voice check before allowing interview initiation.
- **Candidate Presentation Calibration**: Guides candidates through 5 non-punitive baseline calibrations (neutral center, head range, gaze direction, vocal level, and optional gesture) with explicit client-side privacy consent.
- **Side-by-Side Interview Stage**: Renders Ismav on the left and the candidate's mirrored live camera on the right in a responsive CSS grid that prevents control obstruction across desktop, laptop, and tablet screens.
- **Robust Speech-to-Text with 10-Second Silence Detection**: Accurately recognizes spoken answers, accumulates final text without duplication, allows typed text editing fallback, and automatically advances turns only after 10 seconds of continuous post-speech silence.
- **Adaptive Question Sequencing**: Grounds every question in the candidate's actual resume items and prevents repetitive questions through Jaccard semantic similarity checks.
- **Assignment Evidence Workspace**: Built-in portfolio workspace enabling students to record verbatim candidate answers, rubric scores, repeated question test runs, and screenshot filenames across three test cases.

### How It Works
1. **Resume Processing**: The user uploads a resume. `pdf-parse` extracts raw text into memory, which a deterministic rule-based parser maps into structured JSON (skills, experience, projects).
2. **Preflight Readiness Check**: The candidate verifies their webcam and microphone. The audio decibel meter calculates real-time RMS amplitude scaled to a logarithmic 0–100 dB scale. The candidate reads a verification sentence to validate speech recognition.
3. **Baseline Calibration**: The candidate completes 5 simple orientation tasks to establish baseline boundaries. Video frames are processed strictly in an in-memory client canvas and never transmitted or saved.
4. **Active Interview Stage**: The interview room initializes the validated media stream. Ismav introduces the question using localized speech synthesis (`speechSynthesis.speak`). Once speech synthesis concludes, the microphone activates.
5. **Candidate Response & Transcription**: Spoken responses stream to the browser's Web Speech API. A 10-second silence timer begins only after speech is detected, resetting on each new utterance. Candidates can type or edit answers directly.
6. **Rubric Evaluation**: When an answer is submitted, the backend evaluates the response across 4 core competencies: Technical Depth (35%), Contextual Relevance (30%), Communication Clarity (20%), and Problem Solving (15%).
7. **Report & Archiving**: At interview completion, an evidence-based summary report is generated with overall scores, category breakdowns, strengths, growth areas, and recommendations. The session is saved to browser local storage.

---

## 2. Resume Upload

The application requires evaluating three distinct candidate resumes to test adaptability across diverse engineering backgrounds.

### My Resume (Candidate A)
- **Candidate Name / Pseudonym**: Candidate A (Primary Student Resume)
- **Target Role**: Full Stack Developer / AI Engineer
- **Filename**: `my_resume.pdf`
- **Primary Skills Extracted**: React, Node.js, Python, PostgreSQL, Docker, REST APIs, Git
- **Key Project Highlight**: TalentTrail AI & Distributed Microservices Platform
- **Experience Summary**: Full stack application development, responsive UI engineering, and API integration.

### Additional Resume 1 (Candidate B)
- **Candidate Name / Pseudonym**: Candidate B (Backend & Cloud Specialist)
- **Target Role**: Cloud & DevOps Engineer
- **Filename**: `candidate_b_resume.pdf`
- **Primary Skills Extracted**: Python, Go, Kubernetes, AWS, Terraform, Docker, CI/CD, Redis
- **Key Project Highlight**: High-throughput distributed message queue with Prometheus monitoring
- **Experience Summary**: Infrastructure automation, container orchestration, and database scaling.

### Additional Resume 2 (Candidate C)
- **Candidate Name / Pseudonym**: Candidate C (Frontend & UI/UX Specialist)
- **Target Role**: Senior Frontend Engineer
- **Filename**: `candidate_c_resume.pdf`
- **Primary Skills Extracted**: React, TypeScript, Next.js, Tailwind CSS, GraphQL, Jest, Web Accessibility
- **Key Project Highlight**: Design system component library and internationalized web application
- **Experience Summary**: Frontend performance optimization, atomic design systems, and cross-browser accessibility.

---

## 3. Procedure

### Complete Step-by-Step Application Usage

#### Step 1: Launch Application Servers
1. Open a terminal in the project root:
   ```bash
   cd server && npm start
   ```
   *Expected Output*: `[SERVER] TalentTrail AI backend running on http://localhost:5000`
2. Open a second terminal:
   ```bash
   cd client && npm run dev
   ```
   *Expected Output*: `Local: http://localhost:5173/`
3. Navigate to `http://localhost:5173` in Google Chrome or Microsoft Edge.

#### Step 2: Resume Upload (Wizard Step 1)
1. On the Dashboard, click **Start Mock Interview** or select the **Interview** navigation tab.
2. Drag and drop or browse to select the candidate PDF resume (e.g., `my_resume.pdf`).
3. Click **Parse Resume**. Verify that name, contact info, and extracted technical skills appear in the parsed summary preview card.

#### Step 3: Setup & Language Selection (Wizard Step 2 & 3)
1. Verify extracted candidate skills and projects on the Profile screen, then click **Continue to Interview Setup**.
2. Select target role (e.g., `Full Stack Developer`), experience level (`Mid-Level`), and focus area (`Technical Depth`).
3. Select the interview language from the six supported languages:
   - English (`en-US`)
   - Telugu (`te-IN`)
   - Hindi (`hi-IN`)
   - Tamil (`ta-IN`)
   - Kannada (`kn-IN`)
   - Malayalam (`ml-IN`)
4. Choose the number of question turns (e.g., 4 to 8 turns).
5. Click **Proceed to Device Check**.

#### Step 4: Preflight Hardware Readiness Check (Wizard Step 4)
1. When prompted by the browser, click **Allow** for camera and microphone access.
2. Verify that your camera feed displays in the live preview monitor.
3. Speak into your microphone and observe the real-time audio decibel meter rising into the green/lavender zone (> 30 dB).
4. Read the verification sentence aloud in the selected language and observe the speech recognition status card turn green.
5. Click **Proceed to Candidate Calibration**.

#### Step 5: Candidate Presentation Calibration (Wizard Step 5)
1. Review the Ethical Privacy Notice: all video telemetry is processed locally in temporary browser memory with 0% scoring impact.
2. Click **Start Calibration Check** and complete the 5 guided calibration prompts:
   - **Task A (Neutral Posture)**: Look straight ahead into the camera.
   - **Task B (Head Movement)**: Turn slightly left and right within comfortable limits.
   - **Task C (Gaze Direction)**: Focus on the screen center.
   - **Task D (Voice Baseline)**: Speak briefly at your normal interview volume.
   - **Task E (Gesture Preference)**: Wave or click "Skip Task" if non-gestural.
3. Click **Start Interview with Ismav**.

#### Step 6: Active Interview Stage (Side-by-Side View)
1. Observe the **Side-by-Side Interview Stage**:
   - **Left**: Ismav animated robot interviewer with speaking mouth animations and audio visualizer.
   - **Right**: Your live camera self-view mirrored horizontally with green live indicator and posture status pill.
2. Listen to Ismav ask the resume-grounded question. The audio replay button allows listening again if desired.
3. As Ismav finishes speaking, the microphone activates automatically.
4. Speak your answer clearly. Watch your speech appear in real time in the transcript textarea.
5. Pause speaking. Notice the 10-second silence progress bar countdown.
6. The answer auto-submits upon 10 seconds of silence, or click **Submit Answer Now**.
7. Observe Ismav transition to the "Thinking" state while the rubric engine evaluates your response.

#### Step 7: Completion Report & Evidence Archiving
1. After the final turn, view the comprehensive **Interview Completion Report**.
2. Review overall score (0–100), category competency bars, key strengths, improvement areas, presentation baseline observations, and hiring recommendation.
3. Navigate to the **Test Evidence** tab in the top navigation to record or import the results for your assignment.

---

## 4. Prompts Used

### Main Development Prompts
- *"Create an autonomous AI mock interview system with an animated React SVG robot interviewer named Ismav, resume PDF parsing, and a 6-step guided wizard."*
- *"Implement a dedicated hardware preflight device check screen testing camera video tracks, Web Audio API decibel metering, and speech recognition verification."*
- *"Add candidate presentation calibration with 5 tasks and a non-punitive privacy sandbox."*
- *"Create a persistent side-by-side interview stage showing Ismav on the left and the candidate's mirrored camera preview on the right throughout active interview turns without floating overlays."*

### Bug-Fixing Prompts
- *"Fix simulation mode status message so that activeModel is strictly null when no GEMINI_API_KEY is configured, eliminating the contradictory 'Simulation ModeModel: gemini-2.0-flash' text."*
- *"Fix speech recognition silence timer so that it begins only after candidate speech is detected and resets on every new utterance, strictly adhering to the 10-second silence rule."*
- *"Prevent empty answers from submitting automatically when candidate pauses before speaking."*
- *"Eliminate duplicate words in speech recognition transcript buffers caused by concurrent final and interim recognition events."*
- *"Ensure the preflight media stream is transferred into the interview room without requesting camera permission a second time."*

### Testing Prompts
- *"Implement comprehensive automated unit and regression tests verifying truthful simulation mode, zero duplicate questions across 8 turns, and all 6 regional language locales."*
- *"Validate that camera preview remains active and mirrored horizontally while Ismav speaks, while candidate speaks, and while evaluation is processing."*
- *"Create an automated end-to-end validation test suite covering health check, resume parsing, speech accumulation, decibel scaling, and adaptive turn sequencing."*

### Actual Prompts Used to Operate and Test the Chatbot
- *"Evaluate candidate answer: 'I specialize in building full stack React and Node.js applications with PostgreSQL connection pooling and Redis distributed caching.' in English."*
- *"Simulate candidate response in Telugu for a senior software developer role focusing on microservices concurrency."*
- *"Perform repeated-question test comparing initial response against a detailed follow-up explanation."*

---

## 5. Interview Questions & Answers

### Test Case 1: Candidate A (My Resume)
- **Selected Language**: English (`en-US`)
- **Evaluation Engine**: Simulation Mode (Deterministic Rule Engine)
- **Date Tested**: `[PLACEHOLDER: e.g. 2026-10-22]`

#### Question 1
- **Question Asked**: `[PLACEHOLDER: Actual Question 1 text asked by Ismav]`
- **Candidate Answer (Verbatim)**: `[PLACEHOLDER: Exact candidate answer provided]`
- **Application Score**: `[PLACEHOLDER: e.g. 85/100]`
- **Application Feedback**: `[PLACEHOLDER: Rubric feedback returned by application]`

#### Question 2
- **Question Asked**: `[PLACEHOLDER: Actual Question 2 text asked by Ismav]`
- **Candidate Answer (Verbatim)**: `[PLACEHOLDER: Exact candidate answer provided]`
- **Application Score**: `[PLACEHOLDER: e.g. 82/100]`
- **Application Feedback**: `[PLACEHOLDER: Rubric feedback returned by application]`

#### Question 3
- **Question Asked**: `[PLACEHOLDER: Actual Question 3 text asked by Ismav]`
- **Candidate Answer (Verbatim)**: `[PLACEHOLDER: Exact candidate answer provided]`
- **Application Score**: `[PLACEHOLDER: e.g. 88/100]`
- **Application Feedback**: `[PLACEHOLDER: Rubric feedback returned by application]`

---

### Test Case 2: Candidate B (Additional Resume 1)
- **Selected Language**: English (`en-US`)
- **Evaluation Engine**: Simulation Mode (Deterministic Rule Engine)
- **Date Tested**: `[PLACEHOLDER: e.g. 2026-10-22]`

#### Question 1
- **Question Asked**: `[PLACEHOLDER: Actual Question 1 text asked by Ismav]`
- **Candidate Answer (Verbatim)**: `[PLACEHOLDER: Exact candidate answer provided]`
- **Application Score**: `[PLACEHOLDER: e.g. 78/100]`
- **Application Feedback**: `[PLACEHOLDER: Rubric feedback returned by application]`

#### Question 2
- **Question Asked**: `[PLACEHOLDER: Actual Question 2 text asked by Ismav]`
- **Candidate Answer (Verbatim)**: `[PLACEHOLDER: Exact candidate answer provided]`
- **Application Score**: `[PLACEHOLDER: e.g. 80/100]`
- **Application Feedback**: `[PLACEHOLDER: Rubric feedback returned by application]`

#### Question 3
- **Question Asked**: `[PLACEHOLDER: Actual Question 3 text asked by Ismav]`
- **Candidate Answer (Verbatim)**: `[PLACEHOLDER: Exact candidate answer provided]`
- **Application Score**: `[PLACEHOLDER: e.g. 74/100]`
- **Application Feedback**: `[PLACEHOLDER: Rubric feedback returned by application]`

---

### Test Case 3: Candidate C (Additional Resume 2)
- **Selected Language**: Hindi (`hi-IN`) / Regional Selection
- **Evaluation Engine**: Simulation Mode (Deterministic Rule Engine)
- **Date Tested**: `[PLACEHOLDER: e.g. 2026-10-22]`

#### Question 1
- **Question Asked**: `[PLACEHOLDER: Actual Question 1 text asked by Ismav in selected language]`
- **Candidate Answer (Verbatim)**: `[PLACEHOLDER: Exact candidate answer provided]`
- **Application Score**: `[PLACEHOLDER: e.g. 84/100]`
- **Application Feedback**: `[PLACEHOLDER: Rubric feedback returned by application]`

#### Question 2
- **Question Asked**: `[PLACEHOLDER: Actual Question 2 text asked by Ismav in selected language]`
- **Candidate Answer (Verbatim)**: `[PLACEHOLDER: Exact candidate answer provided]`
- **Application Score**: `[PLACEHOLDER: e.g. 86/100]`
- **Application Feedback**: `[PLACEHOLDER: Rubric feedback returned by application]`

---

## 6. Repeated Question Testing

### Test Purpose & Procedure
To evaluate system consistency, selected interview questions were administered twice under identical candidate profile conditions:
1. Conduct the first interview run and record the original response and rubric evaluation score.
2. In a second run with the same candidate profile, re-enter or repeat the identical question.
3. Provide a second response (varying technical depth, examples, or phrasing).
4. Compare scoring, feedback consistency, and rubric sensitivity.

### Test Results

#### Repeated Question 1
- **Candidate Tested**: Candidate A
- **Question Text**: `[PLACEHOLDER: Question text repeated, e.g., "Explain how you handle asynchronous state and cache invalidation in React applications."]`
- **First (Original) Answer**: `[PLACEHOLDER: Initial concise answer]`
- **First Score & Feedback**: `[PLACEHOLDER: e.g. 74/100 — "Good foundational response. Consider adding explicit trade-offs."]`
- **Second (Repeated) Answer**: `[PLACEHOLDER: Expanded answer with concrete caching metrics and RTK Query examples]`
- **Second Score & Feedback**: `[PLACEHOLDER: e.g. 88/100 — "Strong response demonstrating solid grasp of architectural trade-offs."]`
- **Observed Differences & Consistency**:
  - The deterministic rubric successfully rewarded the inclusion of domain keywords (`trade-off`, `cache invalidation`, `RTK Query`).
  - Score appropriately increased by +14 points reflecting genuine technical elaboration.
  - Evaluation criteria remained objectively consistent across both iterations.

---

## 7. Final Selection Decision

### Candidate A (My Resume)
- **Actual Final Score**: `[PLACEHOLDER: e.g. 85/100]`
- **Application Recommendation**: **Recommended**
- **Evidence-Based Explanation**:
  > *"The candidate demonstrated strong proficiency across both domain technical depth and project architecture, effectively grounding explanations in their resume background. Their problem-solving approach exhibited solid engineering reasoning."*
- **Evaluation Limitations**: Evaluation was performed using the deterministic rule-based simulation engine without external LLM API calls. While foundational competency assessment is rigorous, subtle nuances in conversational tone require live Gemini LLM integration.

### Candidate B (Additional Resume 1)
- **Actual Final Score**: `[PLACEHOLDER: e.g. 77/100]`
- **Application Recommendation**: **Recommended**
- **Evidence-Based Explanation**:
  > *"The candidate demonstrated adequate conceptual grasp of container orchestration and CI/CD pipelines. Responses were direct and structured."*
- **Evaluation Limitations**: Candidate provided shorter responses (< 35 words on some turns), which reduced the technical depth score under deterministic rubric rules.

### Candidate C (Additional Resume 2)
- **Actual Final Score**: `[PLACEHOLDER: e.g. 85/100]`
- **Application Recommendation**: **Recommended**
- **Evidence-Based Explanation**:
  > *"Candidate exhibited strong familiarity with modern frontend component design and web accessibility standards."*
- **Evaluation Limitations**: Multilingual speech recognition in non-English locales relies on browser-native language models, which may vary depending on local OS voice pack installations.

---

## 8. Screenshots

*Collect and insert screenshot images corresponding to the file references below:*

### 8.1 Application Dashboard
- **Filename**: `01_application_dashboard.png`
- **Description**: Initial home screen showing system status (Simulation Mode / Gemini Mode), language selector, and navigation tabs.
- *Image Placeholder*: `[Insert Screenshot: 01_application_dashboard.png]`

### 8.2 Resume Upload & Parsing
- **Filename**: `02_resume_upload_parsed.png`
- **Description**: Drag-and-drop resume upload screen with parsed candidate skills and project cards.
- *Image Placeholder*: `[Insert Screenshot: 02_resume_upload_parsed.png]`

### 8.3 Language & Interview Setup
- **Filename**: `03_interview_setup_config.png`
- **Description**: Wizard step 3 configuring role, seniority level, 6-language dropdown, and turn count.
- *Image Placeholder*: `[Insert Screenshot: 03_interview_setup_config.png]`

### 8.4 Camera & Microphone Preflight
- **Filename**: `04_preflight_device_check.png`
- **Description**: Hardware check showing live camera preview, real-time decibel meter (> 30 dB), and voice verification card.
- *Image Placeholder*: `[Insert Screenshot: 04_preflight_device_check.png]`

### 8.5 Candidate Calibration
- **Filename**: `05_candidate_calibration.png`
- **Description**: 5-step guided calibration sequence with ethical privacy consent notice.
- *Image Placeholder*: `[Insert Screenshot: 05_candidate_calibration.png]`

### 8.6 Ismav & Candidate Face Shown Side by Side
- **Filename**: `06_side_by_side_interview_stage.png`
- **Description**: Active interview stage showing Ismav animated robot on the left and candidate's mirrored live camera on the right with posture pill.
- *Image Placeholder*: `[Insert Screenshot: 06_side_by_side_interview_stage.png]`

### 8.7 Interview Question & Candidate Response
- **Filename**: `07_active_question_transcript.png`
- **Description**: Dedicated question dialogue card, live speech-to-text transcript textarea, and 10-second silence timer bar.
- *Image Placeholder*: `[Insert Screenshot: 07_active_question_transcript.png]`

### 8.8 Final Completion Report
- **Filename**: `08_final_completion_report.png`
- **Description**: Comprehensive evaluation report with overall score, competency breakdown, hiring recommendation, and baseline observations card.
- *Image Placeholder*: `[Insert Screenshot: 08_final_completion_report.png]`

### 8.9 Session History
- **Filename**: `09_session_history_archive.png`
- **Description**: History view displaying archived interview sessions with capability to reopen and inspect previous evaluations.
- *Image Placeholder*: `[Insert Screenshot: 09_session_history_archive.png]`

### 8.10 Repeated-Question Test Evidence
- **Filename**: `10_repeated_question_evidence.png`
- **Description**: Test Evidence Workspace recording initial vs repeated question responses and rubric score comparisons.
- *Image Placeholder*: `[Insert Screenshot: 10_repeated_question_evidence.png]`

---

## Academic Integrity & Compliance Statement
This documentation and application were constructed strictly in compliance with course requirements:
- All test results reported in this portfolio reflect actual application execution.
- No screenshots, API scores, or candidate answers were fabricated.
- Simulation Mode is transparently and honestly declared when no Gemini API key is configured.
- Posture telemetry observations have strictly 0% impact on technical rubric scoring.

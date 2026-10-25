process.env.NODE_ENV = 'test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import app from './src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_PORT = 5003;

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING COMPREHENSIVE BACKEND STEP 2 TEST SUITE');
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

  // 1. Health check verification (dashboard regression check)
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    const data = await res.json();
    report('1. Health check returns status 200 & ok', res.status === 200 && data.status === 'ok');
  } catch (err) {
    report('1. Health check reachable', false, err.message);
  }

  // Helper to send multipart/form-data using FormData
  async function uploadFile(filePath, fieldName = 'resume') {
    const formData = new FormData();
    if (filePath) {
      const fileBytes = fs.readFileSync(filePath);
      const fileName = path.basename(filePath);
      const mimeType = filePath.endsWith('.pdf') ? 'application/pdf' : 'text/plain';
      const blob = new Blob([fileBytes], { type: mimeType });
      formData.append(fieldName, blob, fileName);
    }
    return fetch(`${BASE_URL}/api/resume/parse`, {
      method: 'POST',
      body: formData
    });
  }

  // 2. Test Valid PDF
  try {
    const validPath = path.resolve(__dirname, '../test_fixtures/valid_candidate_resume.pdf');
    const res = await uploadFile(validPath);
    const data = await res.json();

    report('2a. Valid PDF returns HTTP 200', res.status === 200 && data.success === true);
    report('2b. Candidate name extracted correctly ("Vikram Malhotra")', data.candidate?.name === 'Vikram Malhotra', `Got: ${data.candidate?.name}`);
    report('2c. Candidate email extracted correctly', data.candidate?.email === 'vikram.malhotra@techlab.io', `Got: ${data.candidate?.email}`);
    report('2d. Candidate phone extracted correctly', Boolean(data.candidate?.phone?.includes('415')), `Got: ${data.candidate?.phone}`);
    report('2e. Technical skills extracted', Array.isArray(data.candidate?.skills) && data.candidate.skills.length > 5, `Skills count: ${data.candidate?.skills?.length}`);
    report('2f. Education extracted', Array.isArray(data.candidate?.education) && data.candidate.education.length > 0, `Edu entries: ${data.candidate?.education?.length}`);
    report('2g. Work experience extracted', Array.isArray(data.candidate?.experience) && data.candidate.experience.length > 0, `Exp entries: ${data.candidate?.experience?.length}`);
    report('2h. Projects extracted', Array.isArray(data.candidate?.projects) && data.candidate.projects.length > 0, `Proj entries: ${data.candidate?.projects?.length}`);
    report('2i. Extraction method declared as RULE_BASED_PARSER (no fake AI claim)', data.extractionMethod === 'RULE_BASED_PARSER');
  } catch (err) {
    report('2. Valid PDF test exception', false, err.message);
  }

  // 3. Test Non-PDF File (.txt)
  try {
    const txtPath = path.resolve(__dirname, '../test_fixtures/invalid_resume.txt');
    const res = await uploadFile(txtPath);
    const data = await res.json();
    report(
      '3. Non-PDF upload rejected with HTTP 400 & INVALID_FILE_TYPE',
      res.status === 400 && data.success === false && data.error?.code === 'INVALID_FILE_TYPE',
      `Status: ${res.status}, code: ${data.error?.code}`
    );
  } catch (err) {
    report('3. Non-PDF test exception', false, err.message);
  }

  // 4. Test Oversized PDF (> 5 MB)
  try {
    const largePath = path.resolve(__dirname, '../test_fixtures/oversized_resume.pdf');
    const res = await uploadFile(largePath);
    const data = await res.json();
    report(
      '4. PDF larger than 5 MB rejected with HTTP 400 & FILE_TOO_LARGE',
      res.status === 400 && data.success === false && data.error?.code === 'FILE_TOO_LARGE',
      `Status: ${res.status}, code: ${data.error?.code}, msg: ${data.error?.message}`
    );
  } catch (err) {
    report('4. Oversized PDF test exception', false, err.message);
  }

  // 5. Test Empty Upload (0-byte file)
  try {
    const emptyPath = path.resolve(__dirname, '../test_fixtures/empty_resume.pdf');
    const res = await uploadFile(emptyPath);
    const data = await res.json();
    report(
      '5. 0-byte PDF upload rejected with HTTP 400 & EMPTY_FILE',
      res.status === 400 && data.success === false && data.error?.code === 'EMPTY_FILE',
      `Status: ${res.status}, code: ${data.error?.code}`
    );
  } catch (err) {
    report('5. Empty file test exception', false, err.message);
  }

  // 6. Test No-File Form Post
  try {
    const res = await uploadFile(null);
    const data = await res.json();
    report(
      '6. No-file upload rejected with HTTP 400 & NO_FILE_UPLOADED',
      res.status === 400 && data.success === false && data.error?.code === 'NO_FILE_UPLOADED',
      `Status: ${res.status}, code: ${data.error?.code}`
    );
  } catch (err) {
    report('6. No-file test exception', false, err.message);
  }

  // 7. Test Sample Endpoint
  try {
    const res = await fetch(`${BASE_URL}/api/resume/sample`);
    const data = await res.json();
    report(
      '7. Sample resume endpoint returns 200 with candidate profile',
      res.status === 200 && data.success === true && Boolean(data.candidate?.name)
    );
  } catch (err) {
    report('7. Sample endpoint exception', false, err.message);
  }

  console.log('\n====================================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  server.close();
  if (failed > 0) {
    process.exitCode = 1;
  }
}

runTests();

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseResumePdf } from './src/services/resumeParser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FIXTURES_DIR = path.resolve(__dirname, '../test_fixtures/diverse');

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

async function runGeneralizedParserTests() {
  console.log('\n====================================================');
  console.log('🧪 RUNNING GENERALIZED RESUME PARSER REGRESSION SUITE');
  console.log('====================================================\n');

  // Test Fixture 1: Multi-line Initials, Projects, Certifications (DevPrep-AI / Karunakar Rao pattern)
  try {
    const f1 = fs.readFileSync(path.join(FIXTURES_DIR, 'fixture_multiline_initials.pdf'));
    const res1 = await parseResumePdf(f1, 'fixture_multiline_initials.pdf');
    const c1 = res1.candidate;

    report('1a. Multi-word name with initials extracted', c1.name === 'K. V. T. Karunakar Rao', `Got: "${c1.name}"`);
    report('1b. Email extracted correctly', c1.email === 'karunakar.rao@example.com', `Got: "${c1.email}"`);
    report('1c. Phone extracted (+91 format)', Boolean(c1.phone?.includes('8309235309')), `Got: "${c1.phone}"`);
    report('1d. Projects accurately extracted without fixed count', Array.isArray(c1.projects) && c1.projects.length === 2, `Count: ${c1.projects?.length}`);
    report('1e. Project 1 title is DevPrep-AI', c1.projects?.[0]?.title?.includes('DevPrep-AI'), `Got: "${c1.projects?.[0]?.title}"`);
    report('1f. Project 2 title is Smart Campus Portal', c1.projects?.[1]?.title?.includes('Smart Campus'), `Got: "${c1.projects?.[1]?.title}"`);
    report('1g. Certifications cleanly segregated from skills', Array.isArray(c1.certifications) && c1.certifications.length === 3, `Count: ${c1.certifications?.length}`);
    report('1h. Skills list excludes certificate IDs and VIP codes', !c1.skills?.some(s => /VIP-|EXT-|SN-2026/i.test(s)), `Skills: ${JSON.stringify(c1.skills)}`);
    report('1i. Field confidence reports IDENTIFIED for name and projects', c1.fieldConfidence?.name?.status === 'IDENTIFIED' && c1.fieldConfidence?.projects?.status === 'IDENTIFIED');
  } catch (err) {
    report('Fixture 1 exception', false, err.message);
  }

  // Test Fixture 2: Mononym / Self-Taught with 0 Projects
  try {
    const f2 = fs.readFileSync(path.join(FIXTURES_DIR, 'fixture_mononym_minimal.pdf'));
    const res2 = await parseResumePdf(f2, 'fixture_mononym_minimal.pdf');
    const c2 = res2.candidate;

    report('2a. Single-word mononym candidate name extracted', c2.name === 'Priyanka', `Got: "${c2.name}"`);
    report('2b. Gracefully handles 0 projects without crash', Array.isArray(c2.projects) && c2.projects.length === 0, `Count: ${c2.projects?.length}`);
    report('2c. Distinguishes missing projects from failure', c2.fieldConfidence?.projects?.status === 'MISSING');
    report('2d. Experience extracted for non-project candidate', Array.isArray(c2.experience) && c2.experience.length === 1, `Exp count: ${c2.experience?.length}`);
  } catch (err) {
    report('Fixture 2 exception', false, err.message);
  }

  // Test Fixture 3: Academic Researcher with 3 Projects & Social Handles
  try {
    const f3 = fs.readFileSync(path.join(FIXTURES_DIR, 'fixture_academic_researcher.pdf'));
    const res3 = await parseResumePdf(f3, 'fixture_academic_researcher.pdf');
    const c3 = res3.candidate;

    report('3a. Name with title extracted ("Dr. Elena Rostova")', c3.name?.includes('Elena Rostova'), `Got: "${c3.name}"`);
    report('3b. LinkedIn URL extracted', Boolean(c3.linkedin?.includes('elena-rostova')), `Got: "${c3.linkedin}"`);
    report('3c. GitHub URL extracted', Boolean(c3.github?.includes('erostova')), `Got: "${c3.github}"`);
    report('3d. Exactly 3 research projects extracted', Array.isArray(c3.projects) && c3.projects.length === 3, `Count: ${c3.projects?.length}`);
    report('3e. Academic education extracted', Array.isArray(c3.education) && c3.education.length > 0 && c3.education[0].institution?.includes('Oxford'), `Edu: ${JSON.stringify(c3.education)}`);
  } catch (err) {
    report('Fixture 3 exception', false, err.message);
  }

  // Test Fixture 4: Pipe-Separated Single Line Header
  try {
    const f4 = fs.readFileSync(path.join(FIXTURES_DIR, 'fixture_pipe_separated_header.pdf'));
    const res4 = await parseResumePdf(f4, 'fixture_pipe_separated_header.pdf');
    const c4 = res4.candidate;

    report('4a. Name extracted from line with pipes ("Alex Chen")', c4.name === 'Alex Chen', `Got: "${c4.name}"`);
    report('4b. Email extracted from same line', c4.email === 'alex.chen@startup.io', `Got: "${c4.email}"`);
    report('4c. Phone extracted from same line', Boolean(c4.phone?.includes('408')), `Got: "${c4.phone}"`);
    report('4d. Work history extracted (2 roles)', Array.isArray(c4.experience) && c4.experience.length === 2, `Count: ${c4.experience?.length}`);
    report('4e. Project experience extracted (1 project)', Array.isArray(c4.projects) && c4.projects.length === 1, `Count: ${c4.projects?.length}`);
  } catch (err) {
    report('Fixture 4 exception', false, err.message);
  }

  // Test Fixture 5: All-Caps Name & Irregular Spacing
  try {
    const f5 = fs.readFileSync(path.join(FIXTURES_DIR, 'fixture_irregular_spacing_caps.pdf'));
    const res5 = await parseResumePdf(f5, 'fixture_irregular_spacing_caps.pdf');
    const c5 = res5.candidate;

    report('5a. All-caps name converted to Title Case ("Sarah Connor")', c5.name === 'Sarah Connor', `Got: "${c5.name}"`);
    report('5b. Custom bordered headings (--- KEY PROJECTS ---) parsed', Array.isArray(c5.projects) && c5.projects.length === 2, `Count: ${c5.projects?.length}`);
    report('5c. Technical skills extracted despite irregular spacing', Array.isArray(c5.skills) && c5.skills.length >= 4, `Count: ${c5.skills?.length}`);
  } catch (err) {
    report('Fixture 5 exception', false, err.message);
  }

  // Test Fixture 6: Scanned / Image-only Document Stub
  try {
    const f6 = fs.readFileSync(path.join(FIXTURES_DIR, 'fixture_scanned_stub.pdf'));
    const res6 = await parseResumePdf(f6, 'fixture_scanned_stub.pdf');

    report('6a. Flags empty/minimal selectable text document', res6.hasContent === false || res6.wordCount === 0);
    report('6b. Provides clear, honest candidate notice rather than crash', typeof res6.notice === 'string' && res6.notice.length > 10, `Notice: "${res6.notice}"`);
    report('6c. All candidate fields default safely to null/empty without throwing', res6.candidate?.name === null && res6.candidate?.skills?.length === 0);
  } catch (err) {
    report('Fixture 6 exception', false, err.message);
  }

  console.log('\n====================================================');
  console.log(`📊 GENERALIZED PARSER RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exitCode = 1;
  }
}

runGeneralizedParserTests();

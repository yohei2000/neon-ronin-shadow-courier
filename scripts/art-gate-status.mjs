import fs from 'node:fs/promises';
import path from 'node:path';
import { rootDir, writeJson } from './art-lib.mjs';

const statusPath = path.join(rootDir, 'art', 'approvals', 'GATE_A_STATUS.json');
const requestPath = path.join(rootDir, 'art', 'approvals', 'GATE_A_REQUEST.md');
const reportPath = path.join(rootDir, 'art', 'reviews', 'gate-a', 'gate-status-report.json');

const errors = [];

let status = null;
try {
  status = JSON.parse(await fs.readFile(statusPath, 'utf8'));
} catch (error) {
  errors.push(`Could not read Gate A status: ${error.message}`);
}

let requestText = '';
try {
  requestText = await fs.readFile(requestPath, 'utf8');
} catch (error) {
  errors.push(`Could not read Gate A request: ${error.message}`);
}

if (status) {
  if (status.gate !== 'A') errors.push('Gate status file is not for Gate A.');
  if (status.status !== 'pending') errors.push(`Gate A status must remain pending before explicit approval, got ${status.status}.`);
  if (status.approved !== false) errors.push('Gate A approved flag must be false before explicit approval.');
  if (status.approvalPhrase !== 'Approve Gate A') errors.push('Gate A approval phrase drifted.');
}

if (requestText) {
  if (!requestText.includes('Approve Gate A')) errors.push('Gate A request does not include the exact approval phrase.');
  if (!requestText.includes('Silence is not approval')) errors.push('Gate A request does not preserve the silence-is-not-approval rule.');
  if (!requestText.includes('representative-composite-960x540.png')) errors.push('Gate A request does not point to the representative composite.');
}

const report = {
  generatedAt: new Date().toISOString(),
  gate: 'A',
  status: status?.status ?? 'unreadable',
  approved: status?.approved ?? null,
  requestFile: 'art/approvals/GATE_A_REQUEST.md',
  statusFile: 'art/approvals/GATE_A_STATUS.json',
  valid: errors.length === 0,
  errors
};

await writeJson(reportPath, report);

if (!report.valid) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log(`art:gate-status PASS ${JSON.stringify({ gate: report.gate, status: report.status, approved: report.approved })}`);

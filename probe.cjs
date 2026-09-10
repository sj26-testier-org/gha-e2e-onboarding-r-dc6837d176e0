const fs = require('node:fs');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const assert = require('node:assert/strict');

function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') {
    return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
  }
  return JSON.stringify(value);
}

const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
const actual = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const observed = {
  event: process.env.GITHUB_EVENT_NAME,
  action: event.action,
  repository: process.env.GITHUB_REPOSITORY,
  payload_repository: event.repository.full_name,
  sha: process.env.GITHUB_SHA,
  ref: process.env.GITHUB_REF,
  workflow_sha: process.env.GITHUB_WORKFLOW_SHA,
  workflow_ref: process.env.GITHUB_WORKFLOW_REF,
  context_sha: process.env.CTX_SHA,
  context_ref: process.env.CTX_REF,
  context_workflow_sha: process.env.CTX_WORKFLOW_SHA,
  context_workflow_ref: process.env.CTX_WORKFLOW_REF,
  actual,
  workflow_marker: process.env.WORKFLOW_MARKER,
  source_marker: fs.readFileSync('source-marker.txt', 'utf8').trim(),
  first: fs.existsSync('first-pr.txt'),
  second: fs.existsSync('second-pr.txt'),
  event_hash: crypto.createHash('sha256').update(canonical(event)).digest('hex'),
  group: event.merge_group ? Object.fromEntries(
    ['head_sha', 'head_ref', 'base_sha', 'base_ref'].map(k => [k, event.merge_group[k]])) : null,
};
if (observed.event === 'merge_group') {
  assert.equal(observed.action, 'checks_requested');
  assert.equal(actual, event.merge_group.head_sha);
  assert.equal(observed.sha, actual);
  assert.equal(observed.context_sha, actual);
  assert.equal(observed.workflow_sha, actual);
  assert.equal(observed.context_workflow_sha, actual);
  assert.equal(observed.ref, event.merge_group.head_ref);
  assert.equal(observed.context_ref, observed.ref);
  assert.equal(observed.context_workflow_ref, observed.workflow_ref);
}
const evidence = JSON.stringify(observed);
fs.appendFileSync(process.env.GITHUB_OUTPUT, `evidence_sha256=${crypto.createHash('sha256').update(canonical(observed)).digest('hex')}\n`);
console.log('MG_EXECUTED ' + evidence);

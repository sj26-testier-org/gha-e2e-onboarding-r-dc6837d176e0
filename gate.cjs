const fs = require('node:fs');
const failing = process.env.GITHUB_EVENT_NAME === 'merge_group' && fs.existsSync('first-pr.txt');
const delay = failing ? (fs.existsSync('second-pr.txt') ? 240 : 90) : 0;
console.log(`MG_GATE_START failure=${failing} delay=${delay}`);
setTimeout(() => {
  console.log(`MG_GATE_DONE failure=${failing}`);
  process.exitCode = failing ? 1 : 0;
}, delay * 1000);

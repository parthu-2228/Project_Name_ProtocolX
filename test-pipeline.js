const fs = require('fs');
const http = require('http');

const chatText = fs.readFileSync('./public/sample-chat.txt', 'utf8');

// Regex patterns matching lib/parser.ts
const PATTERNS = [
  /^\[(\d{1,2}[./\-]\d{1,2}[./\-]\d{2,4}[,\s]+[\d:]+(?:\s*[APap][Mm])?)\]\s+([^:]+):\s+(.*)$/,
  /^(\d{1,2}[./\-]\d{1,2}[./\-]\d{2,4}[,\s]+[\d:]+(?:\s*[APap][Mm])?)\s+-\s+([^:]+):\s+(.*)$/,
];

const lines = chatText.replace(/\r\n/g, '\n').split('\n');
const parsed = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (const p of PATTERNS) {
    const match = line.match(p);
    if (match) {
      parsed.push({
        id: 'msg-' + i,
        rawTimestamp: match[1].trim(),
        sender: match[2].trim(),
        text: match[3].trim(),
        isSystem: false,
      });
      break;
    }
  }
}

console.log('Successfully parsed ' + parsed.length + ' WhatsApp messages from sample-chat.txt');

const payload = JSON.stringify({
  messages: parsed,
  settings: {
    displayName: 'Partha',
    nicknames: ['Partha', 'Parth', 'PS', 'me'],
    priorityKeywords: ['urgent', 'asap', 'blocker', 'deadline', 'jaldi', 'kal tak'],
    aiMode: 'quick'
  }
});

const req = http.request('http://localhost:3000/api/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('HTTP Status Code:', res.statusCode);
    const result = JSON.parse(body);
    console.log('Processed with engine:', result.processedWith);
    console.log('Execution time:', result.processingTimeMs + 'ms');
    console.log('\n--- 5-LINE EXECUTIVE TL;DR ---');
    result.summary.tldr.forEach((l, idx) => console.log(`[${idx+1}] ${l}`));

    console.log('\n--- EXTRACTED ACTION ITEMS --- (' + result.actionItems.length + ')');
    result.actionItems.forEach(a => console.log(`- [${a.assignee}] ${a.task}`));

    console.log('\n--- EXTRACTED DECISIONS --- (' + result.decisions.length + ')');
    result.decisions.forEach(d => console.log(`- ${d.decision} (${d.context})`));

    console.log('\n--- EXTRACTED DEADLINES --- (' + result.deadlines.length + ')');
    result.deadlines.forEach(dl => console.log(`- ${dl.relativeText}: ${dl.title}`));

    console.log('\n--- DETECTED MENTIONS --- (' + result.mentions.length + ')');
    result.mentions.forEach(m => console.log(`- From ${m.sender}: "${m.text}"`));
  });
});

req.on('error', (err) => console.error('Request error:', err));
req.write(payload);
req.end();

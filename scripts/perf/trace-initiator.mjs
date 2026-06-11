#!/usr/bin/env node
/**
 * Capture the JS initiator stack of matching API requests on a page —
 * answers "which component/hook fired this request?".
 *
 * Usage: node scripts/perf/trace-initiator.mjs <path> <urlSubstring> [domain]
 *   e.g. node scripts/perf/trace-initiator.mjs /dashboard/overview "/api/v1/classes/" student
 */
import fs from 'node:fs';
import { chromium } from 'playwright';

const [, , pagePath = '/dashboard/overview', match = '/api/v1/classes/', domain] = process.argv;
const baseUrl = 'http://localhost:3000';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: '.perf/auth.json' });
if (domain) {
  await context.addCookies([
    { name: 'elimika-active-dashboard', value: domain, url: baseUrl, sameSite: 'Lax' },
  ]);
}
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
await cdp.send('Network.enable');

const stacks = [];
cdp.on('Network.requestWillBeSent', event => {
  if (!event.request.url.includes(match)) return;
  const frames = [];
  let stack = event.initiator?.stack;
  while (stack && frames.length < 12) {
    for (const f of stack.callFrames) {
      frames.push(`${f.functionName || '(anon)'} @ ${f.url.split('/').pop()}:${f.lineNumber}`);
    }
    stack = stack.parent;
  }
  stacks.push({ url: event.request.url.replace(baseUrl, ''), frames: frames.slice(0, 12) });
});

await page.goto(`${baseUrl}${pagePath}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(20_000);
await browser.close();

console.log(`Matched ${stacks.length} requests for "${match}" on ${pagePath}${domain ? ` (domain=${domain})` : ''}`);
if (stacks[0]) {
  console.log('\nFirst matching request:', stacks[0].url);
  console.log(stacks[0].frames.join('\n'));
}
fs.writeFileSync('/tmp/initiator-trace.json', JSON.stringify(stacks, null, 2));
console.log('\nFull traces: /tmp/initiator-trace.json');

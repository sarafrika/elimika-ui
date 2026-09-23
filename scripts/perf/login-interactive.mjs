#!/usr/bin/env node
/**
 * Opens a browser window, waits for you to sign in yourself, then saves the session for
 * the admin checks. Nothing is typed for you and no credentials are read from the
 * environment — this is the way to refresh .perf/auth-admin.json without handing a
 * password to a script.
 *
 * Usage: node scripts/perf/login-interactive.mjs [baseUrl] [outputPath]
 */
import fs from 'node:fs';
import { chromium } from 'playwright';

const baseUrl = (process.argv[2] ?? 'http://localhost:3000').replace(/\/$/, '');
const outputPath = process.argv[3] ?? '.perf/auth-admin.json';
const WAIT_MS = 6 * 60 * 1000;

fs.mkdirSync('.perf', { recursive: true });

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

console.log(`Opening ${baseUrl} — sign in as the admin in the window that just opened.`);
await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 });

const startedAt = Date.now();
let identity = null;

while (Date.now() - startedAt < WAIT_MS) {
  try {
    identity = await page.evaluate(async () => {
      const response = await fetch('/api/auth/session');
      const session = await response.json();
      return session?.user?.email ? { email: session.user.email, id: session.user.id } : null;
    });
  } catch {
    // The page is mid-navigation through the identity provider; try again shortly.
  }

  if (identity) break;
  await page.waitForTimeout(2000);
}

if (!identity) {
  console.error('login-interactive: no session appeared within six minutes.');
  await browser.close();
  process.exit(1);
}

await context.storageState({ path: outputPath });
console.log(`✓ Signed in as ${identity.email}. Session saved to ${outputPath}.`);
await browser.close();

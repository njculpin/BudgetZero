#!/usr/bin/env node

import { exec, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const WEB_URL = 'http://localhost:4321';
const SUPABASE_API_URL = 'http://127.0.0.1:55321';
const EMAIL_CLIENT_URL = 'http://127.0.0.1:55324';

async function isSupabaseRunning() {
  try {
    const response = await fetch(`${SUPABASE_API_URL}/rest/v1/`, {
      method: 'HEAD',
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function startSupabase() {
  console.log('🚀 Starting Supabase local instance...');

  try {
    await execAsync('supabase start');
    console.log('✅ Supabase started successfully');
  } catch (error) {
    console.error('❌ Failed to start Supabase:', error.message);
    process.exit(1);
  }
}

async function openEmailClient() {
  console.log('📧 Opening email client...');

  const platform = process.platform;
  let command;

  if (platform === 'win32') {
    command = `start ${EMAIL_CLIENT_URL}`;
  } else if (platform === 'darwin') {
    command = `open ${EMAIL_CLIENT_URL}`;
  } else {
    command = `xdg-open ${EMAIL_CLIENT_URL}`;
  }

  try {
    await execAsync(command);
    console.log('✅ Email client opened');
  } catch {
    console.warn('⚠️  Could not open email client automatically');
    console.log(`   Open manually: ${EMAIL_CLIENT_URL}`);
  }
}

async function openWebClient() {
  console.log('🌐 Opening web client...');

  const platform = process.platform;
  let command;

  if (platform === 'win32') {
    command = `start ${WEB_URL}`;
  } else if (platform === 'darwin') {
    command = `open ${WEB_URL}`;
  } else {
    command = `xdg-open ${WEB_URL}`;
  }

  try {
    await execAsync(command);
    console.log('✅ Web client opened');
  } catch {
    console.warn('⚠️  Could not open web client automatically');
    console.log(`   Open manually: ${WEB_URL}`);
  }
}

/** True when something is already serving the dev URL. */
async function isWebRunning() {
  try {
    await fetch(WEB_URL, { method: 'HEAD' });
    return true;
  } catch {
    return false;
  }
}

/** Poll until the dev server answers, so the browser does not race it. */
async function waitForWeb(timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isWebRunning()) return true;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return false;
}

async function startAstro() {
  // Astro permits one dev server per project and exits non-zero if a second is
  // started. A server already listening is the normal case — someone left one
  // open in another terminal — not a reason to fail with a stack trace.
  if (await isWebRunning()) {
    console.log(`✅ Dev server already running at ${WEB_URL}`);
    console.log('   To replace it: npm run astro -w @gameloopers/web -- dev --force\n');
    await openWebClient();
    return;
  }

  console.log('🌟 Starting Astro dev server...\n');

  const astro = spawn('npm', ['run', 'dev:astro'], {
    stdio: 'inherit',
    shell: true,
  });

  // Opening the browser the instant `spawn` returns raced the server and
  // usually lost, landing on a connection-refused page.
  if (await waitForWeb()) {
    await openWebClient();
  } else {
    console.warn(`⚠️  Dev server did not answer; open manually: ${WEB_URL}`);
  }

  astro.on('close', (code) => {
    console.log(`\n👋 Astro dev server stopped with code ${code}`);
    process.exit(code);
  });
}

async function main() {
  console.log('🎮 Game Loopers Development Environment\n');

  // Check if Supabase is already running
  const isRunning = await isSupabaseRunning();

  if (isRunning) {
    console.log('✅ Supabase is already running');
  } else {
    await startSupabase();
  }

  // Open email client
  await openEmailClient();

  // Wait a moment before starting Astro
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Start Astro
  await startAstro();
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

#!/usr/bin/env node

import { exec, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const SUPABASE_API_URL = 'http://127.0.0.1:54321';
const EMAIL_CLIENT_URL = 'http://127.0.0.1:54324';

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
  } catch (error) {
    console.warn('⚠️  Could not open email client automatically');
    console.log(`   Open manually: ${EMAIL_CLIENT_URL}`);
  }
}

async function startAstro() {
  console.log('🌟 Starting Astro dev server...\n');

  const astro = spawn('npm', ['run', 'dev:astro'], {
    stdio: 'inherit',
    shell: true,
  });

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
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Start Astro
  await startAstro();
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

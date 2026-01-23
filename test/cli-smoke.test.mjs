// SPDX-License-Identifier: AGPL-3.0-or-later
// Smoke tests for CLI tools (verify they can be invoked)

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

// Helper to spawn CLI and immediately terminate
async function smokeTestCLI(script, args = []) {
  return new Promise((resolve) => {
    const proc = spawn('node', [script, ...args], {
      cwd: process.cwd(),
      timeout: 500,
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Kill after seeing first prompt
    const checkTimer = setInterval(() => {
      if (stdout.length > 0 || stderr.length > 0) {
        clearInterval(checkTimer);
        proc.kill('SIGTERM');
      }
    }, 100);

    proc.on('close', (code, signal) => {
      clearInterval(checkTimer);
      resolve({ code, signal, stdout, stderr, started: stdout.length > 0 || stderr.length > 0 });
    });

    // Fallback timeout
    setTimeout(() => {
      clearInterval(checkTimer);
      proc.kill('SIGTERM');
    }, 500);
  });
}

test('CLI smoke: CaptureCLI.res.js - starts and shows prompt (quick mode)', async () => {
  const result = await smokeTestCLI('src-rescript/CaptureCLI.res.js', ['quick']);

  assert.ok(result.started, 'CLI should start and produce output');
  assert.ok(
    result.stdout.includes('UbiCity') || result.stdout.includes('WHO'),
    'Should show UbiCity header or first prompt'
  );
});

test('CLI smoke: CaptureCLI.res.js - starts and shows prompt (full mode)', async () => {
  const result = await smokeTestCLI('src-rescript/CaptureCLI.res.js', ['full']);

  assert.ok(result.started, 'CLI should start and produce output');
  assert.ok(
    result.stdout.includes('UbiCity') || result.stdout.includes('WHO'),
    'Should show UbiCity header or first prompt'
  );
});

test('CLI smoke: CaptureCLI.res.js - template mode generates JSON', async () => {
  return new Promise((resolve) => {
    const proc = spawn('node', ['src-rescript/CaptureCLI.res.js', 'template'], {
      cwd: process.cwd(),
    });

    let stdout = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.on('close', () => {
      assert.ok(stdout.includes('your-pseudonym'), 'Should output template JSON with learner ID');
      assert.ok(stdout.includes('Location Name'), 'Should output template location');
      assert.ok(stdout.includes('experiment'), 'Should output template experience type');
      resolve();
    });
  });
});

test('CLI smoke: Capture module exports', async () => {
  const Capture = await import('../src-rescript/Capture.res.js');

  assert.ok(Capture.CaptureSession, 'Should export CaptureSession module');
  assert.ok(typeof Capture.CaptureSession.make === 'function', 'Should export make function');
  assert.ok(typeof Capture.CaptureSession.capture === 'function', 'Should export capture function');
});

test('CLI smoke: CaptureCLI module structure', async () => {
  // CaptureCLI.res.js runs main() on import, so we can't import it directly
  // Just verify the file exists and is valid JS
  const { readFile } = await import('node:fs/promises');
  const content = await readFile('src-rescript/CaptureCLI.res.js', 'utf-8');

  assert.ok(content.includes('parseMode'), 'Should contain parseMode function');
  assert.ok(content.includes('main'), 'Should contain main function');
  assert.ok(content.includes('Capture.CaptureSession'), 'Should reference CaptureSession');
});

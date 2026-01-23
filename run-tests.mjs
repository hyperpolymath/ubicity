// SPDX-License-Identifier: AGPL-3.0-or-later
// Test runner for UbiCity

import { run } from 'node:test';
import { spec as specReporter } from 'node:test/reporters';
import { glob } from 'glob';

async function runTests() {
  // Find all test files
  const testFiles = await glob('test/**/*.test.mjs');

  console.log(`\n🧪 Running ${testFiles.length} test files...\n`);

  // Run tests with spec reporter
  const stream = run({
    files: testFiles,
    concurrency: true,
  });

  stream.compose(specReporter).pipe(process.stdout);

  // Wait for completion and exit with appropriate code
  let failed = false;
  for await (const event of stream) {
    if (event.type === 'test:fail') {
      failed = true;
    }
  }

  process.exit(failed ? 1 : 0);
}

runTests();

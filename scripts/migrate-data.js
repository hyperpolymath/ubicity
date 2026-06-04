// SPDX-License-Identifier: MPL-2.0
// Copyright (c) Jonathan D.A. Jewell <j.d.a.jewell@open.ac.uk>
#!/usr/bin/env node

/**
 * Data migration helper for v0.1 → v0.2
 * Validates and fixes existing learning experiences
 */

import { promises as fs } from 'fs';
import path from 'path';
import { safeValidateExperience } from '../src/schemas.js';

const STORAGE_DIR = './ubicity-data/experiences';

async function migrateData(options = {}) {
  const { check = false, fix = false, backup = false } = options;

  console.log('\n🔄 UbiCity Data Migration Tool\n');
  console.log('='.repeat(60));

  // Check if directory exists
  try {
    await fs.access(STORAGE_DIR);
  } catch {
    console.log(`\n❌ No data directory found: ${STORAGE_DIR}`);
    console.log('Nothing to migrate!\n');
    return;
  }

  // Load all experiences
  const files = await fs.readdir(STORAGE_DIR);
  const jsonFiles = files.filter(f => f.endsWith('.json'));

  console.log(`\n📂 Found ${jsonFiles.length} experience files\n`);

  const results = {
    total: jsonFiles.length,
    valid: 0,
    invalid: 0,
    fixed: 0,
    errors: [],
  };

  // Backup if requested
  if (backup && (fix || !check)) {
    const backupDir = `./ubicity-data/backup-${Date.now()}`;
    await fs.mkdir(backupDir, { recursive: true });

    console.log(`💾 Creating backup: ${backupDir}`);

    for (const file of jsonFiles) {
      const src = path.join(STORAGE_DIR, file);
      const dest = path.join(backupDir, file);
      await fs.copyFile(src, dest);
    }

    console.log(`✅ Backup complete\n`);
  }

  // Process each file
  for (const file of jsonFiles) {
    const filepath = path.join(STORAGE_DIR, file);
    const content = await fs.readFile(filepath, 'utf8');
    let data = JSON.parse(content);

    const validation = safeValidateExperience(data);

    if (validation.success) {
      results.valid++;
      console.log(`✅ ${file}: Valid`);
    } else {
      results.invalid++;
      console.log(`❌ ${file}: Invalid`);

      validation.errors.forEach(err => {
        console.log(`   - ${err}`);
        results.errors.push({ file, error: err });
      });

      // Try to fix if requested
      if (fix) {
        const fixed = attemptFix(data, validation.errors);

        if (fixed) {
          const revalidation = safeValidateExperience(fixed);

          if (revalidation.success) {
            await fs.writeFile(filepath, JSON.stringify(fixed, null, 2), 'utf8');
            results.fixed++;
            console.log(`   ✅ Fixed and saved`);
          } else {
            console.log(`   ❌ Could not fix automatically`);
          }
        }
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Migration Summary\n');
  console.log(`  Total files:  ${results.total}`);
  console.log(`  ✅ Valid:     ${results.valid}`);
  console.log(`  ❌ Invalid:   ${results.invalid}`);

  if (fix) {
    console.log(`  🔧 Fixed:     ${results.fixed}`);
  }

  if (results.invalid > 0) {
    console.log(`\n⚠️  ${results.invalid} files need attention`);

    if (!fix) {
      console.log('\nRun with --fix to attempt automatic repairs:');
      console.log('  node scripts/migrate-data.js --fix');
      console.log('\nOr with --backup to backup first:');
      console.log('  node scripts/migrate-data.js --backup');
    }
  } else {
    console.log('\n✅ All data is valid! No migration needed.\n');
  }
}

/**
 * Attempt to fix common validation errors
 */
function attemptFix(data, errors) {
  const fixed = JSON.parse(JSON.stringify(data));
  let changed = false;

  errors.forEach(error => {
    // Add missing timestamp
    if (error.includes('timestamp')) {
      fixed.timestamp = fixed.timestamp || new Date().toISOString();
      changed = true;
    }

    // Add missing ID
    if (error.includes('id')) {
      const { randomUUID } = require('crypto');
      fixed.id = fixed.id || `ubi-${randomUUID()}`;
      changed = true;
    }

    // Fix coordinate format
    if (error.includes('coordinates')) {
      const coords = fixed.context?.location?.coordinates;
      if (coords && typeof coords === 'object') {
        if (typeof coords.latitude === 'string') {
          coords.latitude = parseFloat(coords.latitude);
          changed = true;
        }
        if (typeof coords.longitude === 'string') {
          coords.longitude = parseFloat(coords.longitude);
          changed = true;
        }
      }
    }

    // Add version if missing
    if (!fixed.version) {
      fixed.version = '0.2.0';
      changed = true;
    }
  });

  return changed ? fixed : null;
}

// CLI
const args = process.argv.slice(2);
const options = {
  check: args.includes('--check'),
  fix: args.includes('--fix'),
  backup: args.includes('--backup'),
};

// Default to check mode if no options
if (!options.check && !options.fix && !options.backup) {
  options.check = true;
}

migrateData(options).catch(error => {
  console.error('\n❌ Migration failed:', error.message);
  process.exit(1);
});

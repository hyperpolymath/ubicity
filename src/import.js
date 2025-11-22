/**
 * Batch import utilities for UbiCity
 * Import from CSV, JSON, and other formats
 */

import { promises as fs } from 'fs';
import { UrbanKnowledgeMapper } from './mapper.js';
import { safeValidateExperience } from './schemas.js';

/**
 * Import experiences from JSON array
 * @param {string} filepath - Path to JSON file
 * @param {object} options - Import options
 * @returns {Promise<object>} Import results
 */
export async function importFromJSON(filepath, options = {}) {
  const { validate = true, skipInvalid = false, storageDir = './ubicity-data' } =
    options;

  const content = await fs.readFile(filepath, 'utf8');
  const data = JSON.parse(content);

  // Handle both array and single object
  const experiences = Array.isArray(data) ? data : [data];

  const mapper = new UrbanKnowledgeMapper(storageDir);
  await mapper.initialize();

  const results = {
    total: experiences.length,
    imported: 0,
    skipped: 0,
    errors: [],
  };

  for (const [index, exp] of experiences.entries()) {
    try {
      if (validate) {
        const validation = safeValidateExperience(exp);

        if (!validation.success) {
          if (skipInvalid) {
            results.skipped++;
            results.errors.push({
              index,
              id: exp.id,
              errors: validation.errors,
            });
            continue;
          } else {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
          }
        }
      }

      await mapper.captureExperience(exp);
      results.imported++;
    } catch (error) {
      results.errors.push({
        index,
        id: exp.id,
        error: error.message,
      });

      if (!skipInvalid) {
        throw error;
      }

      results.skipped++;
    }
  }

  return results;
}

/**
 * Import experiences from CSV
 * @param {string} filepath - Path to CSV file
 * @param {object} options - Import options
 * @returns {Promise<object>} Import results
 */
export async function importFromCSV(filepath, options = {}) {
  const content = await fs.readFile(filepath, 'utf8');
  const lines = content.split('\n').filter(line => line.trim());

  if (lines.length < 2) {
    throw new Error('CSV file must have header and at least one row');
  }

  // Parse header
  const header = parseCSVLine(lines[0]);
  const experiences = [];

  // Parse rows
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);

    if (values.length !== header.length) {
      console.warn(`Line ${i + 1}: Column count mismatch, skipping`);
      continue;
    }

    const row = {};
    header.forEach((col, idx) => {
      row[col] = values[idx];
    });

    // Convert CSV row to experience object
    const experience = csvRowToExperience(row);
    experiences.push(experience);
  }

  // Use JSON import for the rest
  const tempFile = `/tmp/ubicity-import-${Date.now()}.json`;
  await fs.writeFile(tempFile, JSON.stringify(experiences, null, 2));

  try {
    const results = await importFromJSON(tempFile, options);
    await fs.unlink(tempFile);
    return results;
  } catch (error) {
    await fs.unlink(tempFile);
    throw error;
  }
}

/**
 * Convert CSV row to experience object
 */
function csvRowToExperience(row) {
  const experience = {
    id: row.id,
    timestamp: row.timestamp,
    learner: {
      id: row.learner_id,
    },
    context: {
      location: {
        name: row.location,
      },
    },
    experience: {
      type: row.type,
      description: row.description,
    },
  };

  // Add coordinates if present
  if (row.latitude && row.longitude) {
    experience.context.location.coordinates = {
      latitude: parseFloat(row.latitude),
      longitude: parseFloat(row.longitude),
    };
  }

  // Add domains if present
  if (row.domains) {
    experience.experience.domains = row.domains
      .split(';')
      .map(d => d.trim())
      .filter(Boolean);
  }

  // Add success if present
  if (row.success !== '') {
    experience.experience.outcome = {
      success: row.success === 'true',
    };
  }

  return experience;
}

/**
 * Parse CSV line handling quoted values
 */
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

/**
 * Batch import from directory of JSON files
 * @param {string} dirpath - Directory containing JSON files
 * @param {object} options - Import options
 * @returns {Promise<object>} Import results
 */
export async function importFromDirectory(dirpath, options = {}) {
  const files = await fs.readdir(dirpath);
  const jsonFiles = files.filter(f => f.endsWith('.json'));

  const aggregateResults = {
    files: jsonFiles.length,
    total: 0,
    imported: 0,
    skipped: 0,
    errors: [],
  };

  for (const file of jsonFiles) {
    const filepath = `${dirpath}/${file}`;

    try {
      const results = await importFromJSON(filepath, options);

      aggregateResults.total += results.total;
      aggregateResults.imported += results.imported;
      aggregateResults.skipped += results.skipped;
      aggregateResults.errors.push(...results.errors.map(e => ({ file, ...e })));
    } catch (error) {
      aggregateResults.errors.push({
        file,
        error: error.message,
      });
    }
  }

  return aggregateResults;
}

/**
 * CLI tool for batch import
 */
export async function batchImport(source, format = 'json', options = {}) {
  console.log(`\n📥 Importing from ${format.toUpperCase()}: ${source}\n`);

  let results;

  try {
    switch (format.toLowerCase()) {
      case 'json':
        results = await importFromJSON(source, options);
        break;

      case 'csv':
        results = await importFromCSV(source, options);
        break;

      case 'dir':
      case 'directory':
        results = await importFromDirectory(source, options);
        break;

      default:
        throw new Error(`Unknown format: ${format}`);
    }

    console.log('='.repeat(60));
    console.log('Import Results:');
    console.log('='.repeat(60));
    console.log(`  Total:    ${results.total}`);
    console.log(`  ✅ Imported: ${results.imported}`);
    console.log(`  ⏭️  Skipped:  ${results.skipped}`);

    if (results.errors.length > 0) {
      console.log(`  ❌ Errors:   ${results.errors.length}`);
      console.log('\nErrors:');
      results.errors.slice(0, 10).forEach(err => {
        console.log(`  - ${err.file || err.index}: ${err.error || err.errors?.[0]}`);
      });

      if (results.errors.length > 10) {
        console.log(`  ... and ${results.errors.length - 10} more`);
      }
    }

    console.log('='.repeat(60) + '\n');

    return results;
  } catch (error) {
    console.error(`\n❌ Import failed: ${error.message}\n`);
    throw error;
  }
}

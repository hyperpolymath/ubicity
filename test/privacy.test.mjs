// SPDX-License-Identifier: AGPL-3.0-or-later
// Unit tests for Privacy.res

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  hashString,
  sanitizeText,
  anonymizeLearner,
  anonymizeLocation,
  removePII,
  fullyAnonymize,
  filterByPrivacyLevel,
  generateShareableDataset
} from '../src-rescript/Privacy.res.js';

// Helper to create test experience
function createExperience(id, learnerId, learnerName, location, lat, lon, privacyLevel = 'anonymous') {
  return {
    id,
    timestamp: '2026-01-23T08:00:00Z',
    version: '1.0',
    learner: {
      id: learnerId,
      name: learnerName,
      email: 'learner@example.com',
      interests: ['programming', 'design']
    },
    context: {
      location: {
        name: location,
        coordinates: { latitude: lat, longitude: lon },
        address: '123 Main St'
      },
      connections: ['Alice', 'Bob']
    },
    experience: {
      type: 'workshop',
      description: 'Test experience with email test@example.com and phone 555-1234'
    },
    privacy: {
      level: privacyLevel
    }
  };
}

test('Privacy: hashString - consistent hashing', () => {
  const input = 'test-learner-id';
  const hash1 = hashString(input);
  const hash2 = hashString(input);

  assert.ok(hash1, 'Should produce a hash');
  assert.equal(hash1, hash2, 'Same input should produce same hash');
  assert.notEqual(hash1, input, 'Hash should differ from input');
});

test('Privacy: hashString - different inputs produce different hashes', () => {
  const hash1 = hashString('learner-1');
  const hash2 = hashString('learner-2');

  assert.notEqual(hash1, hash2, 'Different inputs should produce different hashes');
});

test('Privacy: hashString - empty string handling', () => {
  const hash = hashString('');
  assert.ok(hash, 'Should handle empty string');
});

test('Privacy: sanitizeText - removes email addresses', () => {
  const text = 'Contact me at john@example.com for details';
  const sanitized = sanitizeText(text);

  assert.ok(!sanitized.includes('john@example.com'), 'Should remove email');
  assert.ok(sanitized.includes('[email]'), 'Should replace with [email] placeholder');
});

test('Privacy: sanitizeText - removes phone numbers', () => {
  const text = 'Call me at 555-1234 or 555.123.4567';
  const sanitized = sanitizeText(text);

  assert.ok(!sanitized.includes('555-1234'), 'Should remove first phone number');
  assert.ok(sanitized.includes('[phone]'), 'Should replace with [phone] placeholder');
});

test('Privacy: sanitizeText - removes URLs', () => {
  const text = 'Visit https://example.com and http://test.org';
  const sanitized = sanitizeText(text);

  assert.ok(!sanitized.includes('https://example.com'), 'Should remove HTTPS URL');
  assert.ok(!sanitized.includes('http://test.org'), 'Should remove HTTP URL');
  assert.ok(sanitized.includes('[url]'), 'Should replace with [url] placeholder');
});

test('Privacy: sanitizeText - removes person names in context', () => {
  const text = 'I met John yesterday and talked to Mary';
  const sanitized = sanitizeText(text);

  assert.ok(sanitized.includes('[person]'), 'Should replace person names with [person]');
});

test('Privacy: sanitizeText - handles multiple PII types', () => {
  const text = 'Email: test@example.com, Phone: 555-1234, Site: https://example.com';
  const sanitized = sanitizeText(text);

  assert.ok(sanitized.includes('[email]'), 'Should have email placeholder');
  assert.ok(sanitized.includes('[phone]'), 'Should have phone placeholder');
  assert.ok(sanitized.includes('[url]'), 'Should have URL placeholder');
});

test('Privacy: sanitizeText - preserves text without PII', () => {
  const text = 'This is a clean description with no sensitive data';
  const sanitized = sanitizeText(text);

  assert.equal(sanitized, text, 'Should preserve text without PII');
});

test('Privacy: anonymizeLearner - hashes learner ID by default', () => {
  const exp = createExperience('exp-001', 'learner-123', 'John Doe', 'Test Lab', 45.5, -73.6);
  const anonymized = anonymizeLearner(exp);

  assert.ok(anonymized.learner.id.startsWith('anon-'), 'ID should start with anon-');
  assert.notEqual(anonymized.learner.id, 'learner-123', 'ID should be hashed');
  assert.equal(anonymized.learner.name, undefined, 'Name should be removed by default');
  assert.deepEqual(anonymized.learner.interests, ['programming', 'design'], 'Should preserve interests by default');
});

test('Privacy: anonymizeLearner - preserves ID when requested', () => {
  const exp = createExperience('exp-001', 'learner-123', 'John Doe', 'Test Lab', 45.5, -73.6);
  const anonymized = anonymizeLearner(exp, { preserveIds: true });

  assert.equal(anonymized.learner.id, 'learner-123', 'Should preserve original ID');
});

test('Privacy: anonymizeLearner - removes interests when requested', () => {
  const exp = createExperience('exp-001', 'learner-123', 'John Doe', 'Test Lab', 45.5, -73.6);
  const anonymized = anonymizeLearner(exp, { removeInterests: true });

  assert.equal(anonymized.learner.interests, undefined, 'Should remove interests');
});

test('Privacy: anonymizeLocation - rounds GPS coordinates', () => {
  const exp = createExperience('exp-001', 'learner-123', 'John Doe', 'Test Lab', 45.5234, -73.6789);
  const anonymized = anonymizeLocation(exp, { fuzzRadius: 0.01 });

  assert.equal(anonymized.context.location.name, 'Test Lab', 'Should preserve location name');
  assert.ok(anonymized.context.location.coordinates, 'Should have coordinates');

  // Coordinates should be rounded to nearest 0.01
  const lat = anonymized.context.location.coordinates.latitude;
  const lon = anonymized.context.location.coordinates.longitude;

  assert.notEqual(lat, 45.5234, 'Latitude should be rounded');
  assert.notEqual(lon, -73.6789, 'Longitude should be rounded');

  // Rounded values should be multiples of fuzzRadius
  assert.equal(Math.round(lat / 0.01) * 0.01, lat, 'Latitude should be multiple of fuzzRadius');
  assert.equal(Math.round(lon / 0.01) * 0.01, lon, 'Longitude should be multiple of fuzzRadius');
});

test('Privacy: anonymizeLocation - removes address by default', () => {
  const exp = createExperience('exp-001', 'learner-123', 'John Doe', 'Test Lab', 45.5, -73.6);
  const anonymized = anonymizeLocation(exp);

  assert.equal(anonymized.context.location.address, undefined, 'Should remove address by default');
});

test('Privacy: anonymizeLocation - preserves coordinates when fuzzing disabled', () => {
  const exp = createExperience('exp-001', 'learner-123', 'John Doe', 'Test Lab', 45.5234, -73.6789);
  const anonymized = anonymizeLocation(exp, { fuzzyCoordinates: false });

  assert.equal(anonymized.context.location.coordinates.latitude, 45.5234, 'Should preserve exact latitude');
  assert.equal(anonymized.context.location.coordinates.longitude, -73.6789, 'Should preserve exact longitude');
});

test('Privacy: removePII - sanitizes experience description', () => {
  const exp = createExperience('exp-001', 'learner-123', 'John Doe', 'Test Lab', 45.5, -73.6);
  const cleaned = removePII(exp);

  assert.ok(!cleaned.experience.description.includes('test@example.com'), 'Should remove email');
  assert.ok(!cleaned.experience.description.includes('555-1234'), 'Should remove phone');
  assert.ok(cleaned.experience.description.includes('[email]'), 'Should have email placeholder');
  assert.ok(cleaned.experience.description.includes('[phone]'), 'Should have phone placeholder');
});

test('Privacy: removePII - anonymizes connections', () => {
  const exp = createExperience('exp-001', 'learner-123', 'John Doe', 'Test Lab', 45.5, -73.6);
  const cleaned = removePII(exp);

  assert.ok(cleaned.context.connections, 'Should have connections');
  assert.equal(cleaned.context.connections.length, 2, 'Should have 2 connections');
  assert.equal(cleaned.context.connections[0], 'person-1', 'First connection should be person-1');
  assert.equal(cleaned.context.connections[1], 'person-2', 'Second connection should be person-2');
});

test('Privacy: fullyAnonymize - applies all anonymization', () => {
  const exp = createExperience('exp-001', 'learner-123', 'John Doe', 'Test Lab', 45.5234, -73.6789);
  const anonymized = fullyAnonymize(exp);

  // Learner should be anonymized
  assert.ok(anonymized.learner.id.startsWith('anon-'), 'Learner ID should be hashed');
  assert.notEqual(anonymized.learner.id, 'learner-123', 'Learner ID should be changed');
  assert.equal(anonymized.learner.name, undefined, 'Learner name should be removed');

  // Location should be fuzzed
  assert.notEqual(anonymized.context.location.coordinates.latitude, 45.5234, 'Latitude should be fuzzed');
  assert.notEqual(anonymized.context.location.coordinates.longitude, -73.6789, 'Longitude should be fuzzed');
  assert.equal(anonymized.context.location.address, undefined, 'Address should be removed');

  // Description should be sanitized
  assert.ok(!anonymized.experience.description.includes('test@example.com'), 'Should remove email from description');
  assert.ok(!anonymized.experience.description.includes('555-1234'), 'Should remove phone from description');

  // Connections should be anonymized
  assert.equal(anonymized.context.connections[0], 'person-1', 'Connections should be anonymized');

  // Privacy level should be set
  assert.equal(anonymized.privacy.level, 'anonymous', 'Privacy level should be set to anonymous');
});

test('Privacy: filterByPrivacyLevel - excludes private by default', () => {
  const experiences = [
    createExperience('1', 'learner-1', 'Alice', 'Lab A', 45.5, -73.6, 'private'),
    createExperience('2', 'learner-2', 'Bob', 'Lab B', 45.6, -73.7, 'anonymous'),
    createExperience('3', 'learner-3', 'Carol', 'Lab C', 45.7, -73.8, 'public'),
  ];

  const filtered = filterByPrivacyLevel(experiences);

  assert.equal(filtered.length, 2, 'Should exclude private experience by default');
  assert.ok(!filtered.find(e => e.id === '1'), 'Should not include private experience');
  assert.ok(filtered.find(e => e.id === '2'), 'Should include anonymous experience');
  assert.ok(filtered.find(e => e.id === '3'), 'Should include public experience');
});

test('Privacy: filterByPrivacyLevel - includes private when requested', () => {
  const experiences = [
    createExperience('1', 'learner-1', 'Alice', 'Lab A', 45.5, -73.6, 'private'),
    createExperience('2', 'learner-2', 'Bob', 'Lab B', 45.6, -73.7, 'anonymous'),
  ];

  const filtered = filterByPrivacyLevel(experiences, true);

  assert.equal(filtered.length, 2, 'Should include all experiences when includePrivate=true');
});

test('Privacy: generateShareableDataset - creates fully anonymized dataset', () => {
  const experiences = [
    createExperience('1', 'learner-1', 'Alice', 'Lab A', 45.5, -73.6, 'anonymous'),
    createExperience('2', 'learner-2', 'Bob', 'Lab B', 45.6, -73.7, 'public'),
    createExperience('3', 'learner-3', 'Carol', 'Lab C', 45.7, -73.8, 'private'),
  ];

  const shareable = generateShareableDataset(experiences);

  assert.equal(shareable.length, 2, 'Should exclude private experiences by default');

  // Check full anonymization applied
  shareable.forEach(exp => {
    assert.ok(exp.learner.id.startsWith('anon-'), 'Learner ID should be hashed');
    assert.equal(exp.learner.name, undefined, 'Learner name should be removed');
    assert.equal(exp.context.location.address, undefined, 'Address should be removed');
    assert.equal(exp.privacy.level, 'anonymous', 'Privacy level should be anonymous');
  });
});

test('Privacy: generateShareableDataset - partial anonymization', () => {
  const experiences = [
    createExperience('1', 'learner-1', 'Alice', 'Lab A', 45.5, -73.6, 'public'),
  ];

  const shareable = generateShareableDataset(experiences, false, 'Partial');

  assert.equal(shareable.length, 1, 'Should have one experience');

  // Check only learner anonymization applied
  assert.ok(shareable[0].learner.id.startsWith('anon-'), 'Learner ID should be hashed');
  assert.equal(shareable[0].learner.name, undefined, 'Learner name should be removed');

  // Location should NOT be fuzzed in partial mode
  // (fullyAnonymize not called, so location stays as is)
});

test('Privacy: generateShareableDataset - no anonymization', () => {
  const experiences = [
    createExperience('1', 'learner-1', 'Alice', 'Lab A', 45.5, -73.6, 'public'),
  ];

  const shareable = generateShareableDataset(experiences, false, 'None_');

  assert.equal(shareable.length, 1, 'Should have one experience');
  assert.equal(shareable[0].learner.id, 'learner-1', 'Should preserve original learner ID');
  assert.equal(shareable[0].learner.name, 'Alice', 'Should preserve learner name');
});

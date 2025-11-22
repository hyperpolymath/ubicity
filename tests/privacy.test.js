/**
 * Tests for privacy and anonymization
 */

import { test } from 'node:test';
import assert from 'node:assert';
import {
  anonymizeLearner,
  anonymizeLocation,
  removePII,
  fullyAnonymize,
} from '../src/privacy.js';

test('anonymizeLearner hashes learner IDs consistently', () => {
  const experience = {
    learner: { id: 'alice-smith', name: 'Alice Smith' },
    context: { location: { name: 'Park' } },
    experience: { type: 'test', description: 'Test' },
  };

  const anon1 = anonymizeLearner(experience, { hashIds: true });
  const anon2 = anonymizeLearner(experience, { hashIds: true });

  // Same input should produce same hash
  assert.strictEqual(anon1.learner.id, anon2.learner.id);

  // Should start with anon-
  assert.ok(anon1.learner.id.startsWith('anon-'));

  // Should remove name
  assert.strictEqual(anon1.learner.name, undefined);
});

test('anonymizeLocation fuzzes coordinates', () => {
  const experience = {
    learner: { id: 'test' },
    context: {
      location: {
        name: 'Coffee Shop',
        coordinates: { latitude: 37.774929, longitude: -122.419418 },
        address: '123 Main St',
      },
    },
    experience: { type: 'test', description: 'Test' },
  };

  const anon = anonymizeLocation(experience, {
    fuzzyCoordinates: true,
    fuzzRadius: 0.01,
    removeAddress: true,
  });

  // Coordinates should be rounded
  assert.strictEqual(anon.context.location.coordinates.latitude, 37.77);
  assert.strictEqual(anon.context.location.coordinates.longitude, -122.42);

  // Address should be removed
  assert.strictEqual(anon.context.location.address, undefined);
});

test('removePII sanitizes email addresses', () => {
  const experience = {
    learner: { id: 'test' },
    context: { location: { name: 'Test' } },
    experience: {
      type: 'test',
      description: 'Discussed project with alice@example.com and bob@test.org',
    },
  };

  const sanitized = removePII(experience);

  assert.ok(sanitized.experience.description.includes('[email]'));
  assert.ok(!sanitized.experience.description.includes('alice@example.com'));
  assert.ok(!sanitized.experience.description.includes('bob@test.org'));
});

test('removePII sanitizes phone numbers', () => {
  const experience = {
    learner: { id: 'test' },
    context: { location: { name: 'Test' } },
    experience: {
      type: 'test',
      description: 'Call me at 555-123-4567 or 555.987.6543',
    },
  };

  const sanitized = removePII(experience);

  assert.ok(sanitized.experience.description.includes('[phone]'));
  assert.ok(!sanitized.experience.description.includes('555-123-4567'));
  assert.ok(!sanitized.experience.description.includes('555.987.6543'));
});

test('fullyAnonymize applies all anonymization', () => {
  const experience = {
    id: 'ubi-test',
    timestamp: new Date().toISOString(),
    learner: {
      id: 'alice-smith',
      name: 'Alice Smith',
      interests: ['art', 'tech'],
    },
    context: {
      location: {
        name: 'Coffee Shop',
        coordinates: { latitude: 37.7749, longitude: -122.4194 },
        address: '123 Main St',
      },
      connections: ['Bob', 'Charlie'],
    },
    experience: {
      type: 'conversation',
      description: 'Discussed AI with bob@example.com',
    },
  };

  const anon = fullyAnonymize(experience);

  // Learner should be anonymized
  assert.ok(anon.learner.id.startsWith('anon-'));
  assert.strictEqual(anon.learner.name, undefined);

  // Coordinates should be fuzzed
  assert.notStrictEqual(anon.context.location.coordinates.latitude, 37.7749);

  // PII should be removed
  assert.ok(anon.experience.description.includes('[email]'));

  // Connections should be anonymized
  assert.deepStrictEqual(anon.context.connections, ['person-1', 'person-2']);

  // Privacy flag should be set
  assert.strictEqual(anon.privacy.level, 'anonymous');
  assert.strictEqual(anon.privacy.anonymized, true);
});

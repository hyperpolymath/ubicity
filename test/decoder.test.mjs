// SPDX-License-Identifier: AGPL-3.0-or-later
// Unit tests for Decoder.res

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decodeExperiences } from '../src-rescript/Decoder.res.js';

test('Decoder: decodes valid experience with all fields', async () => {
  const validExperience = [{
    id: 'test-001',
    timestamp: '2026-01-23T21:00:00Z',
    version: '1.0',
    learner: {
      id: 'learner-001',
      name: 'Test Learner',
      interests: ['testing', 'programming'],
    },
    context: {
      location: {
        name: 'Test Lab',
        coordinates: { latitude: 45.5, longitude: -73.6 },
        type: 'makerspace',
        address: '123 Test St',
      },
      situation: 'Testing',
      connections: ['mapper', 'decoder'],
      timeOfDay: 'afternoon',
    },
    experience: {
      type: 'workshop',
      description: 'Test experience',
      domains: ['software', 'testing'],
      outcome: {
        success: true,
        connections_made: ['a', 'b'],
        next_questions: ['q1'],
        artifacts: ['test.js'],
      },
      duration: 30,
      intensity: 'medium',
    },
    privacy: {
      level: 'public',
      shareableWith: null,
    },
    tags: ['test'],
  }];

  const result = decodeExperiences(validExperience);
  assert.equal(result.TAG, 'Ok', 'Should decode successfully');
  assert.equal(result._0.length, 1, 'Should decode one experience');
  assert.equal(result._0[0].id, 'test-001', 'Should preserve ID');
  assert.equal(result._0[0].learner.id, 'learner-001', 'Should decode learner');
  assert.equal(result._0[0].context.location.name, 'Test Lab', 'Should decode location');
});

test('Decoder: handles legacy lat/lon coordinates', async () => {
  const legacyFormat = [{
    learner: { id: 'learner-001' },
    context: {
      location: {
        name: 'Legacy Location',
        coordinates: { lat: 45.5, lon: -73.6 },  // Old format
      },
    },
    experience: {
      type: 'workshop',
      description: 'Legacy test',
    },
  }];

  const result = decodeExperiences(legacyFormat);
  assert.equal(result.TAG, 'Ok', 'Should decode legacy format');
  assert.equal(result._0[0].context.location.coordinates.latitude, 45.5, 'Should convert lat to latitude');
  assert.equal(result._0[0].context.location.coordinates.longitude, -73.6, 'Should convert lon to longitude');
});

test('Decoder: generates missing id, timestamp, version', async () => {
  const minimalExperience = [{
    learner: { id: 'learner-001' },
    context: {
      location: { name: 'Minimal Location' },
    },
    experience: {
      type: 'observation',
      description: 'Minimal test',
    },
  }];

  const result = decodeExperiences(minimalExperience);
  assert.equal(result.TAG, 'Ok', 'Should decode minimal experience');
  assert.ok(result._0[0].id, 'Should generate ID');
  assert.ok(result._0[0].timestamp, 'Should generate timestamp');
  assert.equal(result._0[0].version, '1.0', 'Should default version to 1.0');
});

test('Decoder: handles missing optional fields gracefully', async () => {
  const noOptionals = [{
    learner: { id: 'learner-001' },
    context: {
      location: { name: 'Location' },
    },
    experience: {
      type: 'test',
      description: 'Test',
    },
  }];

  const result = decodeExperiences(noOptionals);
  assert.equal(result.TAG, 'Ok', 'Should decode experience without optional fields');
  assert.equal(result._0[0].learner.name, undefined, 'Optional name should be undefined');
  assert.equal(result._0[0].context.situation, undefined, 'Optional situation should be undefined');
  assert.equal(result._0[0].experience.domains, undefined, 'Optional domains should be undefined');
  assert.equal(result._0[0].tags, undefined, 'Optional tags should be undefined');
});

test('Decoder: converts timeOfDay string to variant', async () => {
  const withTimeOfDay = [{
    learner: { id: 'learner-001' },
    context: {
      location: { name: 'Location' },
      timeOfDay: 'morning',
    },
    experience: {
      type: 'test',
      description: 'Test',
    },
  }];

  const result = decodeExperiences(withTimeOfDay);
  assert.equal(result.TAG, 'Ok', 'Should decode timeOfDay');
  assert.ok(result._0[0].context.timeOfDay, 'TimeOfDay should be present');
});

test('Decoder: converts intensity string to variant', async () => {
  const withIntensity = [{
    learner: { id: 'learner-001' },
    context: {
      location: { name: 'Location' },
    },
    experience: {
      type: 'test',
      description: 'Test',
      intensity: 'high',
    },
  }];

  const result = decodeExperiences(withIntensity);
  assert.equal(result.TAG, 'Ok', 'Should decode intensity');
  assert.ok(result._0[0].experience.intensity, 'Intensity should be present');
});

test('Decoder: returns error for invalid data', async () => {
  const invalidData = [{
    // Missing required learner field
    context: {
      location: { name: 'Location' },
    },
    experience: {
      type: 'test',
      description: 'Test',
    },
  }];

  const result = decodeExperiences(invalidData);
  assert.equal(result.TAG, 'Error', 'Should return error for invalid data');
  assert.ok(result._0.includes('Missing field "learner"'), 'Error should mention missing field');
});

test('Decoder: accumulates multiple errors', async () => {
  const multipleInvalid = [
    { learner: { id: 'l1' } },  // Missing context
    { context: { location: { name: 'L' } } },  // Missing learner
  ];

  const result = decodeExperiences(multipleInvalid);
  assert.equal(result.TAG, 'Error', 'Should return error for multiple invalid items');
  assert.ok(result._0.includes('Failed to decode 2 experiences'), 'Should report count');
});

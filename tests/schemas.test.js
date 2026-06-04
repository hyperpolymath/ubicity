// SPDX-License-Identifier: MPL-2.0
// Copyright (c) Jonathan D.A. Jewell <j.d.a.jewell@open.ac.uk>
/**
 * Tests for Zod schemas
 */

import { test } from 'node:test';
import assert from 'node:assert';
import {
  validateExperience,
  safeValidateExperience,
  LearningExperienceSchema,
} from '../src/schemas.js';

test('minimal valid experience passes validation', () => {
  const minimal = {
    id: 'ubi-123',
    timestamp: new Date().toISOString(),
    learner: { id: 'alex' },
    context: {
      location: { name: 'Makerspace' },
    },
    experience: {
      type: 'experiment',
      description: 'Learned about circuits',
    },
  };

  const result = safeValidateExperience(minimal);
  assert.strictEqual(result.success, true);
});

test('experience with full metadata passes validation', () => {
  const full = {
    id: 'ubi-456',
    timestamp: new Date().toISOString(),
    learner: {
      id: 'alex',
      name: 'Alex Maker',
      interests: ['electronics', 'art'],
    },
    context: {
      location: {
        name: 'TechShop Makerspace',
        coordinates: { latitude: 37.7749, longitude: -122.4194 },
        type: 'makerspace',
      },
      situation: 'Afternoon workshop',
      connections: ['sam', 'jordan'],
    },
    experience: {
      type: 'experiment',
      description: 'Built LED circuit',
      domains: ['electronics', 'sculpture'],
      outcome: {
        success: true,
        connections_made: ['Art can use tech'],
        next_questions: ['How to power outdoor sculpture?'],
      },
      duration: 120,
      intensity: 'high',
    },
    privacy: {
      level: 'anonymous',
    },
    tags: ['workshop', 'LED'],
  };

  const result = safeValidateExperience(full);
  assert.strictEqual(result.success, true);
});

test('missing required fields fails validation', () => {
  const invalid = {
    learner: { id: 'alex' },
    // Missing context and experience
  };

  const result = safeValidateExperience(invalid);
  assert.strictEqual(result.success, false);
  assert.ok(result.errors.length > 0);
});

test('invalid coordinates fail validation', () => {
  const invalid = {
    id: 'ubi-789',
    timestamp: new Date().toISOString(),
    learner: { id: 'alex' },
    context: {
      location: {
        name: 'Park',
        coordinates: { latitude: 999, longitude: -122 }, // Invalid latitude
      },
    },
    experience: {
      type: 'observation',
      description: 'Watched birds',
    },
  };

  const result = safeValidateExperience(invalid);
  assert.strictEqual(result.success, false);
});

test('validateExperience throws on invalid data', () => {
  const invalid = {
    learner: { id: '' }, // Empty ID
  };

  assert.throws(() => {
    validateExperience(invalid);
  });
});

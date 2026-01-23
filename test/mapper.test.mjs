// SPDX-License-Identifier: AGPL-3.0-or-later
// Unit tests for Mapper.res

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { make as makeMapper, captureExperience, getExperienceCount,
         findByLocation, findByDomain, findByLearner,
         getHotspots, getTopDomains } from '../src-rescript/Mapper.res.js';
import { promises as fs } from 'fs';
import path from 'path';

const TEST_DIR = './test-data-mapper';

test.beforeEach(async () => {
  // Clean up test directory
  await fs.rm(TEST_DIR, { recursive: true, force: true });
});

test.afterEach(async () => {
  // Clean up after tests
  await fs.rm(TEST_DIR, { recursive: true, force: true });
});

test('Mapper: creates mapper instance', async () => {
  const mapper = await makeMapper(TEST_DIR);
  assert.ok(mapper, 'Should create mapper');
});

test('Mapper: captures and retrieves experience', async () => {
  const mapper = await makeMapper(TEST_DIR);

  const experience = {
    id: 'test-001',
    timestamp: new Date().toISOString(),
    version: '1.0',
    learner: { id: 'learner-001', name: 'Test' },
    context: {
      location: { name: 'Test Lab' },
    },
    experience: {
      type: 'workshop',
      description: 'Test workshop',
      domains: ['software'],
    },
  };

  const result = await captureExperience(mapper, experience);
  assert.equal(result.TAG, 'Ok', 'Should capture experience');
  assert.equal(result._0, 'test-001', 'Should return experience ID');

  const count = getExperienceCount(mapper);
  assert.equal(count, 1, 'Should have one experience');
});

test('Mapper: indexes by location', async () => {
  const mapper = await makeMapper(TEST_DIR);

  const exp1 = {
    id: 'test-001',
    timestamp: new Date().toISOString(),
    version: '1.0',
    learner: { id: 'learner-001' },
    context: { location: { name: 'Lab A' } },
    experience: { type: 'workshop', description: 'Test 1' },
  };

  const exp2 = {
    id: 'test-002',
    timestamp: new Date().toISOString(),
    version: '1.0',
    learner: { id: 'learner-002' },
    context: { location: { name: 'Lab A' } },
    experience: { type: 'workshop', description: 'Test 2' },
  };

  await captureExperience(mapper, exp1);
  await captureExperience(mapper, exp2);

  const atLabA = findByLocation(mapper, 'Lab A');
  assert.equal(atLabA.length, 2, 'Should find 2 experiences at Lab A');
});

test('Mapper: indexes by domain', async () => {
  const mapper = await makeMapper(TEST_DIR);

  const exp1 = {
    id: 'test-001',
    timestamp: new Date().toISOString(),
    version: '1.0',
    learner: { id: 'learner-001' },
    context: { location: { name: 'Lab' } },
    experience: {
      type: 'workshop',
      description: 'Test',
      domains: ['software', 'hardware'],
    },
  };

  await captureExperience(mapper, exp1);

  const softwareExps = findByDomain(mapper, 'software');
  assert.equal(softwareExps.length, 1, 'Should find software experience');

  const hardwareExps = findByDomain(mapper, 'hardware');
  assert.equal(hardwareExps.length, 1, 'Should find hardware experience');
});

test('Mapper: indexes by learner', async () => {
  const mapper = await makeMapper(TEST_DIR);

  const exp1 = {
    id: 'test-001',
    timestamp: new Date().toISOString(),
    version: '1.0',
    learner: { id: 'learner-001' },
    context: { location: { name: 'Lab' } },
    experience: { type: 'workshop', description: 'Test 1' },
  };

  const exp2 = {
    id: 'test-002',
    timestamp: new Date().toISOString(),
    version: '1.0',
    learner: { id: 'learner-001' },
    context: { location: { name: 'Lab' } },
    experience: { type: 'workshop', description: 'Test 2' },
  };

  await captureExperience(mapper, exp1);
  await captureExperience(mapper, exp2);

  const learner1Exps = findByLearner(mapper, 'learner-001');
  assert.equal(learner1Exps.length, 2, 'Should find 2 experiences for learner-001');
});

test('Mapper: identifies hotspots', async () => {
  const mapper = await makeMapper(TEST_DIR);

  // Add multiple experiences to same location
  for (let i = 0; i < 3; i++) {
    await captureExperience(mapper, {
      id: `test-${i}`,
      timestamp: new Date().toISOString(),
      version: '1.0',
      learner: { id: `learner-${i}` },
      context: { location: { name: 'Popular Lab' } },
      experience: { type: 'workshop', description: `Test ${i}` },
    });
  }

  // Add single experience to different location
  await captureExperience(mapper, {
    id: 'test-solo',
    timestamp: new Date().toISOString(),
    version: '1.0',
    learner: { id: 'learner-solo' },
    context: { location: { name: 'Quiet Lab' } },
    experience: { type: 'workshop', description: 'Solo' },
  });

  const hotspots = getHotspots(mapper, 10);
  assert.ok(hotspots.length >= 2, 'Should have at least 2 locations');
  assert.equal(hotspots[0][0], 'Popular Lab', 'Top hotspot should be Popular Lab');
  assert.equal(hotspots[0][1], 3, 'Popular Lab should have 3 experiences');
});

test('Mapper: identifies top domains', async () => {
  const mapper = await makeMapper(TEST_DIR);

  // Add experiences with software domain
  for (let i = 0; i < 3; i++) {
    await captureExperience(mapper, {
      id: `test-${i}`,
      timestamp: new Date().toISOString(),
      version: '1.0',
      learner: { id: `learner-${i}` },
      context: { location: { name: 'Lab' } },
      experience: {
        type: 'workshop',
        description: `Test ${i}`,
        domains: ['software'],
      },
    });
  }

  // Add one with hardware domain
  await captureExperience(mapper, {
    id: 'test-hw',
    timestamp: new Date().toISOString(),
    version: '1.0',
    learner: { id: 'learner-hw' },
    context: { location: { name: 'Lab' } },
    experience: {
      type: 'workshop',
      description: 'Hardware test',
      domains: ['hardware'],
    },
  });

  const topDomains = getTopDomains(mapper, 10);
  assert.ok(topDomains.length >= 2, 'Should have at least 2 domains');
  assert.equal(topDomains[0][0], 'software', 'Top domain should be software');
  assert.equal(topDomains[0][1], 3, 'Software should have 3 experiences');
});

test('Mapper: returns empty arrays for nonexistent keys', async () => {
  const mapper = await makeMapper(TEST_DIR);

  const noLocation = findByLocation(mapper, 'Nonexistent');
  assert.equal(noLocation.length, 0, 'Should return empty array for nonexistent location');

  const noDomain = findByDomain(mapper, 'Nonexistent');
  assert.equal(noDomain.length, 0, 'Should return empty array for nonexistent domain');

  const noLearner = findByLearner(mapper, 'Nonexistent');
  assert.equal(noLearner.length, 0, 'Should return empty array for nonexistent learner');
});

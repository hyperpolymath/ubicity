// SPDX-License-Identifier: AGPL-3.0-or-later
// Unit tests for UbiCity.res (domain types and utilities)

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  Coordinates,
  $$Location as Location,
  Learner,
  Context,
  Outcome,
  ExperienceData,
  Privacy,
  LearningExperience,
  Analysis
} from '../src-rescript/UbiCity.res.js';

// Coordinates tests
test('UbiCity.Coordinates: make - valid coordinates', () => {
  const coords = Coordinates.make(45.5, -73.6);

  assert.ok(coords, 'Should create coordinates');
  assert.equal(coords.latitude, 45.5, 'Should have correct latitude');
  assert.equal(coords.longitude, -73.6, 'Should have correct longitude');
});

test('UbiCity.Coordinates: make - boundary values', () => {
  assert.ok(Coordinates.make(90.0, 180.0), 'Should accept max valid values');
  assert.ok(Coordinates.make(-90.0, -180.0), 'Should accept min valid values');
  assert.ok(Coordinates.make(0, 0), 'Should accept zero values');
});

test('UbiCity.Coordinates: make - invalid latitude', () => {
  assert.equal(Coordinates.make(91.0, 0), undefined, 'Should reject latitude > 90');
  assert.equal(Coordinates.make(-91.0, 0), undefined, 'Should reject latitude < -90');
});

test('UbiCity.Coordinates: make - invalid longitude', () => {
  assert.equal(Coordinates.make(0, 181.0), undefined, 'Should reject longitude > 180');
  assert.equal(Coordinates.make(0, -181.0), undefined, 'Should reject longitude < -180');
});

test('UbiCity.Coordinates: isValid - valid coordinates', () => {
  const coords = { latitude: 45.5, longitude: -73.6 };
  assert.ok(Coordinates.isValid(coords), 'Should validate valid coordinates');
});

test('UbiCity.Coordinates: isValid - invalid coordinates', () => {
  assert.equal(Coordinates.isValid({ latitude: 91, longitude: 0 }), false, 'Should reject invalid latitude');
  assert.equal(Coordinates.isValid({ latitude: 0, longitude: 181 }), false, 'Should reject invalid longitude');
});

// Location tests
test('UbiCity.Location: make - valid location', () => {
  const result = Location.make('Lab A', undefined, undefined, undefined);

  assert.equal(result.TAG, 'Ok', 'Should return Ok result');
  assert.equal(result._0.name, 'Lab A', 'Should have correct name');
});

test('UbiCity.Location: make - with coordinates', () => {
  const coords = Coordinates.make(45.5, -73.6);
  const result = Location.make('Lab A', coords, 'makerspace', '123 Main St');

  assert.equal(result.TAG, 'Ok', 'Should return Ok result');
  assert.equal(result._0.name, 'Lab A');
  assert.equal(result._0.type, 'makerspace');
  assert.equal(result._0.address, '123 Main St');
  assert.deepEqual(result._0.coordinates, coords);
});

test('UbiCity.Location: make - empty name validation', () => {
  const result = Location.make('', undefined, undefined, undefined);

  assert.equal(result.TAG, 'Error', 'Should return Error result');
  assert.equal(result._0, 'Location name is required', 'Should have error message');
});

// Learner tests
test('UbiCity.Learner: make - valid learner', () => {
  const result = Learner.make('learner-1', undefined, undefined);

  assert.equal(result.TAG, 'Ok', 'Should return Ok result');
  assert.equal(result._0.id, 'learner-1', 'Should have correct ID');
  assert.equal(result._0.name, undefined, 'Should have optional name');
  assert.equal(result._0.interests, undefined, 'Should have optional interests');
});

test('UbiCity.Learner: make - with full details', () => {
  const result = Learner.make('learner-1', 'Alice', ['programming', 'design']);

  assert.equal(result.TAG, 'Ok');
  assert.equal(result._0.id, 'learner-1');
  assert.equal(result._0.name, 'Alice');
  assert.deepEqual(result._0.interests, ['programming', 'design']);
});

test('UbiCity.Learner: make - empty ID validation', () => {
  const result = Learner.make('', 'Alice', undefined);

  assert.equal(result.TAG, 'Error', 'Should return Error result');
  assert.equal(result._0, 'Learner ID is required', 'Should have error message');
});

// Context tests
test('UbiCity.Context: make - creates context', () => {
  const location = { name: 'Lab A' };
  const context = Context.make(location, undefined, undefined, undefined);

  assert.ok(context, 'Should create context');
  assert.equal(context.location.name, 'Lab A');
  assert.equal(context.situation, undefined);
  assert.equal(context.connections, undefined);
  assert.equal(context.timeOfDay, undefined);
});

test('UbiCity.Context: make - with all fields', () => {
  const location = { name: 'Lab A' };
  const context = Context.make(location, 'collaborative', ['Alice', 'Bob'], 'Morning');

  assert.equal(context.location.name, 'Lab A');
  assert.equal(context.situation, 'collaborative');
  assert.deepEqual(context.connections, ['Alice', 'Bob']);
  assert.equal(context.timeOfDay, 'Morning');
});

// Outcome tests
test('UbiCity.Outcome: empty - provides empty outcome', () => {
  const outcome = Outcome.empty;

  assert.equal(outcome.success, undefined);
  assert.equal(outcome.connections_made, undefined);
  assert.equal(outcome.next_questions, undefined);
  assert.equal(outcome.artifacts, undefined);
});

// ExperienceData tests
test('UbiCity.ExperienceData: make - valid experience', () => {
  const result = ExperienceData.make('workshop', 'Test description', undefined, undefined, undefined, undefined);

  assert.equal(result.TAG, 'Ok');
  assert.equal(result._0.type, 'workshop');
  assert.equal(result._0.description, 'Test description');
});

test('UbiCity.ExperienceData: make - with domains', () => {
  const result = ExperienceData.make('workshop', 'Test', ['software', 'hardware'], undefined, undefined, undefined);

  assert.equal(result.TAG, 'Ok');
  assert.deepEqual(result._0.domains, ['software', 'hardware']);
});

test('UbiCity.ExperienceData: make - with outcome', () => {
  const outcome = { success: true };
  const result = ExperienceData.make('workshop', 'Test', undefined, outcome, undefined, undefined);

  assert.equal(result.TAG, 'Ok');
  assert.deepEqual(result._0.outcome, outcome);
});

test('UbiCity.ExperienceData: make - empty type validation', () => {
  const result = ExperienceData.make('', 'Description', undefined, undefined, undefined, undefined);

  assert.equal(result.TAG, 'Error');
  assert.equal(result._0, 'Experience type is required');
});

test('UbiCity.ExperienceData: make - empty description validation', () => {
  const result = ExperienceData.make('workshop', '', undefined, undefined, undefined, undefined);

  assert.equal(result.TAG, 'Error');
  assert.equal(result._0, 'Description is required');
});

// Privacy tests
test('UbiCity.Privacy: makeAnonymous - provides anonymous privacy', () => {
  const privacy = Privacy.makeAnonymous;

  assert.equal(privacy.level, 'anonymous');
  assert.equal(privacy.shareableWith, undefined);
});

// LearningExperience tests
test('UbiCity.LearningExperience: generateId - creates UUID-based ID', () => {
  const id = LearningExperience.generateId();

  assert.ok(id.startsWith('ubi-'), 'Should start with ubi- prefix');
  assert.ok(id.length > 10, 'Should have UUID length');
});

test('UbiCity.LearningExperience: generateId - unique IDs', () => {
  const id1 = LearningExperience.generateId();
  const id2 = LearningExperience.generateId();

  assert.notEqual(id1, id2, 'Should generate unique IDs');
});

test('UbiCity.LearningExperience: make - basic experience', () => {
  const learner = { id: 'learner-1' };
  const location = { name: 'Lab A' };
  const context = { location };
  const experience = { type: 'workshop', description: 'Test' };
  const privacy = { level: 'anonymous' };

  const exp = LearningExperience.make(undefined, undefined, learner, context, experience, privacy, undefined, undefined);

  assert.ok(exp.id, 'Should have generated ID');
  assert.ok(exp.timestamp, 'Should have generated timestamp');
  assert.equal(exp.version, '0.3.0', 'Should have default version');
  assert.deepEqual(exp.learner, learner);
  assert.deepEqual(exp.context, context);
  assert.deepEqual(exp.experience, experience);
  assert.deepEqual(exp.privacy, privacy);
});

test('UbiCity.LearningExperience: make - with custom ID and timestamp', () => {
  const customId = 'exp-123';
  const customTimestamp = '2026-01-23T08:00:00Z';
  const learner = { id: 'learner-1' };
  const location = { name: 'Lab A' };
  const context = { location };
  const experience = { type: 'workshop', description: 'Test' };
  const privacy = { level: 'anonymous' };

  const exp = LearningExperience.make(customId, customTimestamp, learner, context, experience, privacy, undefined, '1.0.0');

  assert.equal(exp.id, customId, 'Should use custom ID');
  assert.equal(exp.timestamp, customTimestamp, 'Should use custom timestamp');
  assert.equal(exp.version, '1.0.0', 'Should use custom version');
});

test('UbiCity.LearningExperience: make - with tags', () => {
  const learner = { id: 'learner-1' };
  const location = { name: 'Lab A' };
  const context = { location };
  const experience = { type: 'workshop', description: 'Test' };
  const privacy = { level: 'anonymous' };
  const tags = ['urgent', 'collaborative'];

  const exp = LearningExperience.make(undefined, undefined, learner, context, experience, privacy, tags, undefined);

  assert.deepEqual(exp.tags, tags, 'Should have tags');
});

// Analysis utility tests
test('UbiCity.Analysis: findInterdisciplinary - finds multi-domain experiences', () => {
  const experiences = [
    { experience: { domains: ['software', 'hardware'] } },
    { experience: { domains: ['design'] } },
    { experience: { domains: ['software', 'design', 'art'] } },
    { experience: { domains: undefined } }
  ];

  const interdisciplinary = Analysis.findInterdisciplinary(experiences);

  assert.equal(interdisciplinary.length, 2, 'Should find 2 interdisciplinary experiences');
  assert.equal(interdisciplinary[0].experience.domains.length, 2);
  assert.equal(interdisciplinary[1].experience.domains.length, 3);
});

test('UbiCity.Analysis: findInterdisciplinary - empty array', () => {
  const interdisciplinary = Analysis.findInterdisciplinary([]);
  assert.deepEqual(interdisciplinary, [], 'Should return empty array');
});

test('UbiCity.Analysis: groupByLocation - groups experiences', () => {
  const experiences = [
    { context: { location: { name: 'Lab A' } } },
    { context: { location: { name: 'Lab B' } } },
    { context: { location: { name: 'Lab A' } } }
  ];

  const grouped = Analysis.groupByLocation(experiences);

  assert.ok(grouped['Lab A'], 'Should have Lab A group');
  assert.ok(grouped['Lab B'], 'Should have Lab B group');
  assert.equal(grouped['Lab A'].length, 2, 'Lab A should have 2 experiences');
  assert.equal(grouped['Lab B'].length, 1, 'Lab B should have 1 experience');
});

test('UbiCity.Analysis: groupByLearner - groups by learner ID', () => {
  const experiences = [
    { learner: { id: 'learner-1' } },
    { learner: { id: 'learner-2' } },
    { learner: { id: 'learner-1' } }
  ];

  const grouped = Analysis.groupByLearner(experiences);

  assert.ok(grouped['learner-1'], 'Should have learner-1 group');
  assert.ok(grouped['learner-2'], 'Should have learner-2 group');
  assert.equal(grouped['learner-1'].length, 2, 'learner-1 should have 2 experiences');
  assert.equal(grouped['learner-2'].length, 1, 'learner-2 should have 1 experience');
});

test('UbiCity.Analysis: calculateDiversity - counts unique domains', () => {
  const experiences = [
    { experience: { domains: ['software', 'hardware'] } },
    { experience: { domains: ['software', 'design'] } },
    { experience: { domains: ['art'] } }
  ];

  const diversity = Analysis.calculateDiversity(experiences);

  assert.equal(diversity, 4, 'Should count 4 unique domains: software, hardware, design, art');
});

test('UbiCity.Analysis: calculateDiversity - handles undefined domains', () => {
  const experiences = [
    { experience: { domains: ['software'] } },
    { experience: { domains: undefined } },
    { experience: { domains: ['hardware'] } }
  ];

  const diversity = Analysis.calculateDiversity(experiences);

  assert.equal(diversity, 2, 'Should count 2 unique domains, ignoring undefined');
});

test('UbiCity.Analysis: calculateDiversity - empty experiences', () => {
  const diversity = Analysis.calculateDiversity([]);
  assert.equal(diversity, 0, 'Should return 0 for empty array');
});

test('UbiCity.Analysis: calculateDiversity - duplicate domains', () => {
  const experiences = [
    { experience: { domains: ['software', 'software', 'hardware'] } },
    { experience: { domains: ['software'] } }
  ];

  const diversity = Analysis.calculateDiversity(experiences);

  assert.equal(diversity, 2, 'Should count unique domains only (software, hardware)');
});

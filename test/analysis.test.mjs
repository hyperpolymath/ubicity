// SPDX-License-Identifier: AGPL-3.0-or-later
// Unit tests for Analysis.res

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getTimeOfDay,
  extractDomains,
  TemporalAnalyzer,
  CollaborativeNetworkAnalyzer,
  RecommendationEngine
} from '../src-rescript/Analysis.res.js';

// Helper to create test experience
function createExperience(id, timestamp, learnerId, location, domains = []) {
  return {
    id,
    timestamp,
    version: '1.0',
    learner: { id: learnerId },
    context: {
      location: { name: location },
      timeOfDay: null
    },
    experience: {
      type: 'workshop',
      description: 'Test',
      domains: domains.length > 0 ? domains : undefined
    }
  };
}

test('Analysis: getTimeOfDay - morning', () => {
  const morningTime = '2026-01-23T08:00:00Z';
  const result = getTimeOfDay(morningTime);
  assert.equal(result, 'Morning', 'Should return Morning');
});

test('Analysis: getTimeOfDay - afternoon', () => {
  const afternoonTime = '2026-01-23T14:00:00Z';
  const result = getTimeOfDay(afternoonTime);
  assert.equal(result, 'Afternoon', 'Should return Afternoon');
});

test('Analysis: getTimeOfDay - evening', () => {
  const eveningTime = '2026-01-23T20:00:00Z';
  const result = getTimeOfDay(eveningTime);
  assert.equal(result, 'Evening', 'Should return Evening');
});

test('Analysis: getTimeOfDay - night', () => {
  const nightTime = '2026-01-23T02:00:00Z';
  const result = getTimeOfDay(nightTime);
  assert.equal(result, 'Night', 'Should return Night');
});

test('Analysis: extractDomains', () => {
  const experiences = [
    createExperience('1', '2026-01-23T08:00:00Z', 'learner-1', 'Lab A', ['software', 'hardware']),
    createExperience('2', '2026-01-23T10:00:00Z', 'learner-1', 'Lab B', ['software', 'design']),
    createExperience('3', '2026-01-23T12:00:00Z', 'learner-2', 'Lab A', ['hardware']),
  ];

  const domains = extractDomains(experiences);

  // Should get all unique domains
  assert.ok(domains.includes('software'), 'Should include software');
  assert.ok(domains.includes('hardware'), 'Should include hardware');
  assert.ok(domains.includes('design'), 'Should include design');
});

test('Analysis: TemporalAnalyzer.analyzeByTimeOfDay', () => {
  const experiences = [
    createExperience('1', '2026-01-23T08:00:00Z', 'learner-1', 'Lab A', ['software']),  // Morning
    createExperience('2', '2026-01-23T09:00:00Z', 'learner-1', 'Lab B', ['hardware']),  // Morning
    createExperience('3', '2026-01-23T14:00:00Z', 'learner-2', 'Lab A', ['design']),  // Afternoon
    createExperience('4', '2026-01-23T20:00:00Z', 'learner-2', 'Lab B', ['art']),  // Evening
  ];

  const distribution = TemporalAnalyzer.analyzeByTimeOfDay(experiences);

  // Format: { morning: [count, domains[]], ... }
  assert.equal(distribution.morning[0], 2, 'Should have 2 morning experiences');
  assert.equal(distribution.afternoon[0], 1, 'Should have 1 afternoon experience');
  assert.equal(distribution.evening[0], 1, 'Should have 1 evening experience');
  assert.equal(distribution.night[0], 0, 'Should have 0 night experiences');

  // Check domains (second element of tuple)
  assert.ok(distribution.morning[1].includes('software'), 'Morning should include software domain');
  assert.ok(distribution.morning[1].includes('hardware'), 'Morning should include hardware domain');
  assert.ok(distribution.afternoon[1].includes('design'), 'Afternoon should include design domain');
});

test('Analysis: TemporalAnalyzer.analyzeByDayOfWeek', () => {
  const experiences = [
    createExperience('1', '2026-01-19T08:00:00Z', 'learner-1', 'Lab A', ['software']),  // Monday
    createExperience('2', '2026-01-19T10:00:00Z', 'learner-1', 'Lab B', ['hardware']),  // Monday
    createExperience('3', '2026-01-20T14:00:00Z', 'learner-2', 'Lab A', ['design']),  // Tuesday
  ];

  const distribution = TemporalAnalyzer.analyzeByDayOfWeek(experiences);

  // Days are keyed by name: "Sunday", "Monday", "Tuesday", etc.
  assert.ok(distribution.Monday, 'Should have Monday entry');
  assert.ok(distribution.Tuesday, 'Should have Tuesday entry');

  // Format: [count, domains[]]
  assert.equal(distribution.Monday[0], 2, 'Monday should have 2 experiences');
  assert.equal(distribution.Tuesday[0], 1, 'Tuesday should have 1 experience');

  assert.ok(distribution.Monday[1].includes('software'), 'Monday should include software domain');
  assert.ok(distribution.Monday[1].includes('hardware'), 'Monday should include hardware domain');
});

test('Analysis: TemporalAnalyzer.detectStreaks', () => {
  // Create experiences across consecutive days
  const experiences = [
    createExperience('1', '2026-01-19T08:00:00Z', 'learner-1', 'Lab A'),  // Jan 19
    createExperience('2', '2026-01-20T08:00:00Z', 'learner-1', 'Lab A'),  // Jan 20 (next day)
    createExperience('3', '2026-01-21T08:00:00Z', 'learner-1', 'Lab A'),  // Jan 21 (next day)
    // Gap
    createExperience('4', '2026-01-24T08:00:00Z', 'learner-1', 'Lab A'),  // Jan 24
    createExperience('5', '2026-01-25T08:00:00Z', 'learner-1', 'Lab A'),  // Jan 25 (next day)
  ];

  const streaks = TemporalAnalyzer.detectStreaks(experiences, 2);

  assert.ok(streaks.length >= 1, 'Should find at least one streak (minDays=2)');

  // Streak format: { start, end_, days, experiences }
  const firstStreak = streaks[0];
  assert.ok(firstStreak.days >= 2, 'First streak should have at least 2 days');
  assert.ok(firstStreak.experiences >= 2, 'First streak should have at least 2 experiences');
  assert.ok(firstStreak.start, 'Should have start timestamp');
  assert.ok(firstStreak.end_, 'Should have end_ timestamp');
});

test('Analysis: CollaborativeNetworkAnalyzer.buildCollaborationNetwork', () => {
  // This function builds network based on explicit connections field, not location proximity
  // We need to add connections field to context
  const experiences = [
    {
      ...createExperience('1', '2026-01-23T08:00:00Z', 'learner-1', 'Lab A'),
      context: {
        ...createExperience('1', '2026-01-23T08:00:00Z', 'learner-1', 'Lab A').context,
        connections: ['learner-2', 'learner-3']
      }
    },
    {
      ...createExperience('2', '2026-01-23T09:00:00Z', 'learner-2', 'Lab A'),
      context: {
        ...createExperience('2', '2026-01-23T09:00:00Z', 'learner-2', 'Lab A').context,
        connections: ['learner-1']
      }
    },
    createExperience('3', '2026-01-23T10:00:00Z', 'learner-3', 'Lab A'),
  ];

  const network = CollaborativeNetworkAnalyzer.buildCollaborationNetwork(experiences);

  assert.ok(network.nodes.length >= 3, 'Should have at least 3 nodes (learners)');
  assert.ok(network.edges.length >= 1, 'Should have edges between connected learners');

  // Find learner-1 node
  const learner1Node = network.nodes.find(n => n.id === 'learner-1');
  assert.ok(learner1Node, 'Should have learner-1 node');
  assert.equal(learner1Node.experiences, 1, 'Learner-1 should have 1 experience');
});

test('Analysis: RecommendationEngine.recommendSimilarLearners', () => {
  const experiences = [
    createExperience('1', '2026-01-23T08:00:00Z', 'learner-1', 'Lab A', ['software', 'hardware']),
    createExperience('2', '2026-01-23T09:00:00Z', 'learner-2', 'Lab B', ['software', 'design']),
    createExperience('3', '2026-01-23T10:00:00Z', 'learner-3', 'Lab C', ['biology']),
  ];

  const recommendations = RecommendationEngine.recommendSimilarLearners(experiences, 'learner-1', 5);

  assert.ok(recommendations.length >= 1, 'Should recommend at least one similar learner');

  // learner-2 should be more similar (shares 'software') than learner-3 (no shared domains)
  const rec2 = recommendations.find(r => r.learnerId === 'learner-2');
  assert.ok(rec2, 'Should recommend learner-2');
  assert.ok(rec2.similarity > 0, 'Similarity should be greater than 0');
  assert.ok(rec2.sharedDomains.includes('software'), 'Should identify shared software domain');
});

test('Analysis: RecommendationEngine.recommendLocations', () => {
  const experiences = [
    createExperience('1', '2026-01-23T08:00:00Z', 'learner-1', 'Lab A', ['software']),
    createExperience('2', '2026-01-23T09:00:00Z', 'learner-1', 'Lab B', ['hardware']),
    createExperience('3', '2026-01-23T10:00:00Z', 'learner-2', 'Lab C', ['software', 'design']),
    createExperience('4', '2026-01-23T11:00:00Z', 'learner-3', 'Lab C', ['software']),
  ];

  const recommendations = RecommendationEngine.recommendLocations(experiences, 'learner-1', 5);

  assert.ok(recommendations.length >= 1, 'Should recommend at least one location');

  // Lab C should be recommended (matches software domain)
  const labC = recommendations.find(r => r.location === 'Lab C');
  assert.ok(labC, 'Should recommend Lab C');
  assert.ok(labC.matchingDomains.includes('software'), 'Should match software domain');
});

test('Analysis: RecommendationEngine.recommendDomains', () => {
  // recommendDomains finds NEW domains that co-occur with learner's existing domains
  // Looks at other people's experiences that share at least one domain with the learner
  const experiences = [
    createExperience('1', '2026-01-23T08:00:00Z', 'learner-1', 'Lab A', ['software']),  // learner-1 has software
    createExperience('2', '2026-01-23T09:00:00Z', 'learner-2', 'Lab B', ['software', 'design']),  // learner-2 has software + design
    createExperience('3', '2026-01-23T10:00:00Z', 'learner-3', 'Lab C', ['software', 'hardware']),  // learner-3 has software + hardware
  ];

  const recommendations = RecommendationEngine.recommendDomains(experiences, 'learner-1', 5);

  // learner-1 has software, so should recommend domains that co-occur with software (design, hardware)
  assert.ok(recommendations.length >= 1, 'Should recommend at least one domain');

  const recommendedDomains = recommendations.map(r => r.domain);
  assert.ok(
    recommendedDomains.includes('hardware') || recommendedDomains.includes('design'),
    'Should recommend hardware or design (co-occurring with software)'
  );
});

test('Analysis: extractDomains with no domains', () => {
  const experiences = [
    createExperience('1', '2026-01-23T08:00:00Z', 'learner-1', 'Lab A'),
    createExperience('2', '2026-01-23T09:00:00Z', 'learner-1', 'Lab B'),
  ];

  const domains = extractDomains(experiences);
  assert.equal(domains.length, 0, 'Should return empty array when no domains');
});

test('Analysis: CollaborativeNetworkAnalyzer.buildCollaborationNetwork with no connections', () => {
  const experiences = [
    createExperience('1', '2026-01-23T08:00:00Z', 'learner-1', 'Lab A'),
    createExperience('2', '2026-01-23T09:00:00Z', 'learner-2', 'Lab B'),
    createExperience('3', '2026-01-23T10:00:00Z', 'learner-3', 'Lab C'),
  ];

  const network = CollaborativeNetworkAnalyzer.buildCollaborationNetwork(experiences);

  assert.equal(network.nodes.length, 3, 'Should have 3 nodes');
  assert.equal(network.edges.length, 0, 'Should have no edges (no explicit connections)');
});

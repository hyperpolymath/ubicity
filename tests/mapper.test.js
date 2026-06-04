// SPDX-License-Identifier: MPL-2.0
// Copyright (c) Jonathan D.A. Jewell <j.d.a.jewell@open.ac.uk>
/**
 * Tests for UrbanKnowledgeMapper
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { LearningExperience, UrbanKnowledgeMapper } from '../src/mapper.js';

test('LearningExperience generates ID if not provided', () => {
  const exp = new LearningExperience({
    learner: { id: 'test' },
    context: { location: { name: 'Place' } },
    experience: { type: 'test', description: 'Testing' },
  });

  assert.ok(exp.data.id);
  assert.ok(exp.data.id.startsWith('ubi-'));
});

test('LearningExperience generates timestamp if not provided', () => {
  const exp = new LearningExperience({
    id: 'ubi-test',
    learner: { id: 'test' },
    context: { location: { name: 'Place' } },
    experience: { type: 'test', description: 'Testing' },
  });

  assert.ok(exp.data.timestamp);
  assert.ok(new Date(exp.data.timestamp));
});

test('UrbanKnowledgeMapper initializes indices', () => {
  const mapper = new UrbanKnowledgeMapper();

  assert.ok(mapper.experiences instanceof Map);
  assert.ok(mapper.locationIndex instanceof Map);
  assert.ok(mapper.domainIndex instanceof Map);
  assert.ok(mapper.learnerIndex instanceof Map);
});

test('captureExperience updates indices', async () => {
  const mapper = new UrbanKnowledgeMapper('/tmp/test-ubicity');
  await mapper.initialize();

  const id = await mapper.captureExperience({
    learner: { id: 'alex' },
    context: { location: { name: 'Makerspace' } },
    experience: {
      type: 'experiment',
      description: 'Testing',
      domains: ['electronics', 'art'],
    },
  });

  assert.ok(id);
  assert.strictEqual(mapper.experiences.size, 1);
  assert.ok(mapper.locationIndex.has('Makerspace'));
  assert.ok(mapper.domainIndex.has('electronics'));
  assert.ok(mapper.domainIndex.has('art'));
  assert.ok(mapper.learnerIndex.has('alex'));
});

test('findInterdisciplinaryConnections identifies multi-domain experiences', async () => {
  const mapper = new UrbanKnowledgeMapper('/tmp/test-ubicity-2');
  await mapper.initialize();

  await mapper.captureExperience({
    learner: { id: 'alex' },
    context: { location: { name: 'Makerspace' } },
    experience: {
      type: 'experiment',
      description: 'Single domain',
      domains: ['electronics'],
    },
  });

  await mapper.captureExperience({
    learner: { id: 'alex' },
    context: { location: { name: 'Makerspace' } },
    experience: {
      type: 'experiment',
      description: 'Multi domain',
      domains: ['electronics', 'art', 'sculpture'],
    },
  });

  const connections = mapper.findInterdisciplinaryConnections();
  assert.strictEqual(connections.length, 1);
  assert.strictEqual(connections[0].domains.length, 3);
});

test('mapByLocation aggregates experiences', async () => {
  const mapper = new UrbanKnowledgeMapper('/tmp/test-ubicity-3');
  await mapper.initialize();

  await mapper.captureExperience({
    learner: { id: 'alex' },
    context: { location: { name: 'Makerspace' } },
    experience: {
      type: 'experiment',
      description: 'Test 1',
      domains: ['electronics'],
    },
  });

  await mapper.captureExperience({
    learner: { id: 'sam' },
    context: { location: { name: 'Makerspace' } },
    experience: {
      type: 'workshop',
      description: 'Test 2',
      domains: ['woodworking'],
    },
  });

  const locationMap = mapper.mapByLocation();
  const makerspace = locationMap['Makerspace'];

  assert.strictEqual(makerspace.count, 2);
  assert.strictEqual(makerspace.learners, 2);
  assert.strictEqual(makerspace.diversity, 2);
  assert.ok(makerspace.domains.includes('electronics'));
  assert.ok(makerspace.domains.includes('woodworking'));
});

test('getLearnerJourney tracks timeline', async () => {
  const mapper = new UrbanKnowledgeMapper('/tmp/test-ubicity-4');
  await mapper.initialize();

  await mapper.captureExperience({
    learner: { id: 'alex' },
    context: { location: { name: 'Makerspace' } },
    experience: {
      type: 'experiment',
      description: 'First',
      domains: ['electronics'],
    },
  });

  await mapper.captureExperience({
    learner: { id: 'alex' },
    context: { location: { name: 'Park' } },
    experience: {
      type: 'observation',
      description: 'Second',
      domains: ['biology'],
    },
  });

  const journey = mapper.getLearnerJourney('alex');

  assert.strictEqual(journey.experienceCount, 2);
  assert.strictEqual(journey.timeline.length, 2);
  assert.strictEqual(journey.domainEvolution.length, 2);
});

test('generateDomainNetwork creates edges', async () => {
  const mapper = new UrbanKnowledgeMapper('/tmp/test-ubicity-5');
  await mapper.initialize();

  await mapper.captureExperience({
    learner: { id: 'alex' },
    context: { location: { name: 'Makerspace' } },
    experience: {
      type: 'experiment',
      description: 'Test',
      domains: ['electronics', 'art'],
    },
  });

  await mapper.captureExperience({
    learner: { id: 'sam' },
    context: { location: { name: 'Studio' } },
    experience: {
      type: 'workshop',
      description: 'Test',
      domains: ['electronics', 'art'],
    },
  });

  const network = mapper.generateDomainNetwork();

  assert.strictEqual(network.nodes.length, 2);
  assert.strictEqual(network.edges.length, 1);
  assert.strictEqual(network.edges[0].weight, 2);
});

test('findLearningHotspots filters by diversity', async () => {
  const mapper = new UrbanKnowledgeMapper('/tmp/test-ubicity-6');
  await mapper.initialize();

  await mapper.captureExperience({
    learner: { id: 'alex' },
    context: { location: { name: 'Library' } },
    experience: { type: 'reading', description: 'Test', domains: ['history'] },
  });

  await mapper.captureExperience({
    learner: { id: 'sam' },
    context: { location: { name: 'Makerspace' } },
    experience: {
      type: 'experiment',
      description: 'Test',
      domains: ['electronics', 'art', 'sculpture'],
    },
  });

  const hotspots = mapper.findLearningHotspots(2);

  assert.strictEqual(hotspots.length, 1);
  assert.strictEqual(hotspots[0].location, 'Makerspace');
  assert.strictEqual(hotspots[0].diversity, 3);
});

/**
 * Tests for export utilities
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { UrbanKnowledgeMapper } from '../src/mapper.js';
import { exportToCSV, exportToGeoJSON, exportToDOT } from '../src/export.js';

test('exportToCSV generates valid CSV', async () => {
  const mapper = new UrbanKnowledgeMapper('/tmp/test-export-csv');
  await mapper.initialize();

  await mapper.captureExperience({
    learner: { id: 'test-user' },
    context: {
      location: {
        name: 'Test Location',
        coordinates: { latitude: 37.7749, longitude: -122.4194 },
      },
    },
    experience: {
      type: 'test',
      description: 'Test experience',
      domains: ['domain1', 'domain2'],
    },
  });

  const csv = exportToCSV(mapper);

  // Should have header
  assert.ok(csv.includes('id,timestamp,learner_id,location'));

  // Should have data row
  assert.ok(csv.includes('test-user'));
  assert.ok(csv.includes('Test Location'));
  assert.ok(csv.includes('domain1; domain2'));
});

test('exportToGeoJSON generates valid GeoJSON', async () => {
  const mapper = new UrbanKnowledgeMapper('/tmp/test-export-geojson');
  await mapper.initialize();

  await mapper.captureExperience({
    learner: { id: 'test-user' },
    context: {
      location: {
        name: 'San Francisco',
        coordinates: { latitude: 37.7749, longitude: -122.4194 },
      },
    },
    experience: {
      type: 'test',
      description: 'Test',
      domains: ['test'],
    },
  });

  const geojson = exportToGeoJSON(mapper);

  assert.strictEqual(geojson.type, 'FeatureCollection');
  assert.ok(Array.isArray(geojson.features));
  assert.strictEqual(geojson.features.length, 1);

  const feature = geojson.features[0];
  assert.strictEqual(feature.type, 'Feature');
  assert.strictEqual(feature.geometry.type, 'Point');
  assert.deepStrictEqual(feature.geometry.coordinates, [-122.4194, 37.7749]);
  assert.strictEqual(feature.properties.name, 'San Francisco');
});

test('exportToDOT generates valid Graphviz format', async () => {
  const mapper = new UrbanKnowledgeMapper('/tmp/test-export-dot');
  await mapper.initialize();

  await mapper.captureExperience({
    learner: { id: 'test-user' },
    context: { location: { name: 'Test' } },
    experience: {
      type: 'test',
      description: 'Test',
      domains: ['electronics', 'art'],
    },
  });

  const dot = exportToDOT(mapper);

  assert.ok(dot.startsWith('graph DomainNetwork {'));
  assert.ok(dot.includes('"electronics"'));
  assert.ok(dot.includes('"art"'));
  // Edge can be in either direction (sorted alphabetically)
  assert.ok(
    dot.includes('"electronics" -- "art"') || dot.includes('"art" -- "electronics"')
  );
  assert.ok(dot.endsWith('}\n'));
});

test('exportToCSV handles special characters', async () => {
  const mapper = new UrbanKnowledgeMapper('/tmp/test-export-special');
  await mapper.initialize();

  await mapper.captureExperience({
    learner: { id: 'test' },
    context: { location: { name: 'Test, Location' } },
    experience: {
      type: 'test',
      description: 'Description with "quotes" and, commas',
    },
  });

  const csv = exportToCSV(mapper);

  // Should quote values with special characters
  assert.ok(csv.includes('"Test, Location"'));
  assert.ok(csv.includes('Description with ""quotes"" and, commas'));
});

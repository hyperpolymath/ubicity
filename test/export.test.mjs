// SPDX-License-Identifier: AGPL-3.0-or-later
// Unit tests for Export.res

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  exportToCSV,
  exportToGeoJSON,
  exportToDOT,
  exportJourneysToMarkdown,
  exportToJSON,
  exportData
} from '../src-rescript/Export.res.js';

// Helper to create test experience
function createExperience(id, timestamp, learnerId, location, lat, lon, type, description, domains = [], outcome = undefined) {
  return {
    id,
    timestamp,
    version: '1.0',
    learner: {
      id: learnerId,
      name: 'Test Learner',
      interests: ['testing']
    },
    context: {
      location: {
        name: location,
        coordinates: lat !== undefined && lon !== undefined ? { latitude: lat, longitude: lon } : undefined
      },
      connections: []
    },
    experience: {
      type,
      description,
      domains: domains.length > 0 ? domains : undefined,
      outcome
    },
    privacy: { level: 'public' }
  };
}

test('Export: exportToCSV - basic CSV export', () => {
  const experiences = [
    createExperience('1', '2026-01-23T08:00:00Z', 'learner-1', 'Lab A', 45.5, -73.6, 'workshop', 'Basic workshop', ['software']),
    createExperience('2', '2026-01-23T09:00:00Z', 'learner-2', 'Lab B', 45.6, -73.7, 'mentorship', 'One-on-one session', ['design'])
  ];

  const csv = exportToCSV(experiences);

  assert.ok(csv.includes('id,timestamp,learner_id,location,type,description,domains,success,latitude,longitude'), 'Should have CSV headers');
  assert.ok(csv.includes('1,2026-01-23T08:00:00Z,learner-1,"Lab A",workshop,"Basic workshop","software"'), 'Should have first row data');
  assert.ok(csv.includes('2,2026-01-23T09:00:00Z,learner-2,"Lab B",mentorship,"One-on-one session","design"'), 'Should have second row data');
  assert.ok(csv.includes('45.5,-73.6'), 'Should include coordinates');
});

test('Export: exportToCSV - escapes double quotes', () => {
  const experiences = [
    createExperience('1', '2026-01-23T08:00:00Z', 'learner-1', 'Lab A', 45.5, -73.6, 'workshop', 'Workshop with "quotes" in description')
  ];

  const csv = exportToCSV(experiences);

  assert.ok(csv.includes('""quotes""'), 'Should escape double quotes by doubling them');
});

test('Export: exportToCSV - handles multiple domains', () => {
  const experiences = [
    createExperience('1', '2026-01-23T08:00:00Z', 'learner-1', 'Lab A', 45.5, -73.6, 'workshop', 'Multi-domain workshop', ['software', 'hardware', 'design'])
  ];

  const csv = exportToCSV(experiences);

  assert.ok(csv.includes('software; hardware; design'), 'Should join domains with semicolons');
});

test('Export: exportToCSV - handles missing coordinates', () => {
  const experiences = [
    createExperience('1', '2026-01-23T08:00:00Z', 'learner-1', 'Lab A', undefined, undefined, 'workshop', 'No coordinates')
  ];

  const csv = exportToCSV(experiences);

  assert.ok(csv.includes(',,\n') || csv.endsWith(',,'), 'Should have empty coordinate fields');
});

test('Export: exportToCSV - handles outcome success', () => {
  const experiences = [
    createExperience('1', '2026-01-23T08:00:00Z', 'learner-1', 'Lab A', 45.5, -73.6, 'workshop', 'Successful', [], { success: true })
  ];

  const csv = exportToCSV(experiences);

  assert.ok(csv.includes(',true,'), 'Should show true for successful outcome');
});

test('Export: exportToGeoJSON - creates FeatureCollection', () => {
  const experiences = [
    createExperience('1', '2026-01-23T08:00:00Z', 'learner-1', 'Lab A', 45.5, -73.6, 'workshop', 'Test', ['software']),
    createExperience('2', '2026-01-23T09:00:00Z', 'learner-2', 'Lab A', 45.5, -73.6, 'mentorship', 'Test', ['hardware'])
  ];

  const geoJSON = exportToGeoJSON(experiences);

  assert.equal(geoJSON.type, 'FeatureCollection', 'Should be a FeatureCollection');
  assert.ok(Array.isArray(geoJSON.features), 'Should have features array');
  assert.equal(geoJSON.features.length, 1, 'Should group experiences by location (Lab A appears twice)');
});

test('Export: exportToGeoJSON - feature properties', () => {
  const experiences = [
    createExperience('1', '2026-01-23T08:00:00Z', 'learner-1', 'Lab A', 45.5, -73.6, 'workshop', 'Test', ['software', 'hardware']),
    createExperience('2', '2026-01-23T09:00:00Z', 'learner-2', 'Lab A', 45.5, -73.6, 'mentorship', 'Test', ['software', 'design'])
  ];

  const geoJSON = exportToGeoJSON(experiences);
  const feature = geoJSON.features[0];

  assert.equal(feature.type, 'Feature', 'Should be a Feature');
  assert.equal(feature.properties.name, 'Lab A', 'Should have location name');
  assert.equal(feature.properties.experiences, 2, 'Should count experiences at location');
  assert.ok(feature.properties.domains.includes('software'), 'Should collect domains');
  assert.ok(feature.properties.domains.includes('hardware'), 'Should collect domains');
  assert.ok(feature.properties.domains.includes('design'), 'Should collect domains');
});

test('Export: exportToGeoJSON - geometry format', () => {
  const experiences = [
    createExperience('1', '2026-01-23T08:00:00Z', 'learner-1', 'Lab A', 45.5, -73.6, 'workshop', 'Test', ['software'])
  ];

  const geoJSON = exportToGeoJSON(experiences);
  const feature = geoJSON.features[0];

  assert.equal(feature.geometry.type, 'Point', 'Should be a Point geometry');
  assert.deepEqual(feature.geometry.coordinates, [-73.6, 45.5], 'Should have [longitude, latitude] order (GeoJSON standard)');
});

test('Export: exportToGeoJSON - skips locations without coordinates', () => {
  const experiences = [
    createExperience('1', '2026-01-23T08:00:00Z', 'learner-1', 'Lab A', undefined, undefined, 'workshop', 'No coords'),
    createExperience('2', '2026-01-23T09:00:00Z', 'learner-2', 'Lab B', 45.5, -73.6, 'workshop', 'Has coords')
  ];

  const geoJSON = exportToGeoJSON(experiences);

  assert.equal(geoJSON.features.length, 1, 'Should only include locations with coordinates');
  assert.equal(geoJSON.features[0].properties.name, 'Lab B', 'Should be the location with coordinates');
});

test('Export: exportToDOT - basic graph structure', () => {
  const experiences = [
    createExperience('1', '2026-01-23T08:00:00Z', 'learner-1', 'Lab A', 45.5, -73.6, 'workshop', 'Test', ['software', 'hardware']),
    createExperience('2', '2026-01-23T09:00:00Z', 'learner-2', 'Lab B', 45.6, -73.7, 'workshop', 'Test', ['software', 'design'])
  ];

  const dot = exportToDOT(experiences);

  assert.ok(dot.includes('graph DomainNetwork {'), 'Should start with graph declaration');
  assert.ok(dot.includes('layout=neato;'), 'Should have layout specification');
  assert.ok(dot.includes('}'), 'Should end with closing brace');
});

test('Export: exportToDOT - node sizing', () => {
  const experiences = [
    createExperience('1', '2026-01-23T08:00:00Z', 'learner-1', 'Lab A', 45.5, -73.6, 'workshop', 'Test', ['software']),
    createExperience('2', '2026-01-23T09:00:00Z', 'learner-2', 'Lab B', 45.6, -73.7, 'workshop', 'Test', ['software'])
  ];

  const dot = exportToDOT(experiences);

  assert.ok(dot.includes('"software"'), 'Should have software node');
  assert.ok(dot.includes('[width='), 'Should have width attribute for node sizing');
});

test('Export: exportToDOT - edge detection', () => {
  const experiences = [
    createExperience('1', '2026-01-23T08:00:00Z', 'learner-1', 'Lab A', 45.5, -73.6, 'workshop', 'Test', ['software', 'hardware'])
  ];

  const dot = exportToDOT(experiences);

  assert.ok(dot.includes('--'), 'Should have edge notation');
  assert.ok(dot.includes('[penwidth='), 'Should have penwidth for edge weight');
});

test('Export: exportToDOT - no edges for single domain experiences', () => {
  const experiences = [
    createExperience('1', '2026-01-23T08:00:00Z', 'learner-1', 'Lab A', 45.5, -73.6, 'workshop', 'Test', ['software']),
    createExperience('2', '2026-01-23T09:00:00Z', 'learner-2', 'Lab B', 45.6, -73.7, 'workshop', 'Test', ['design'])
  ];

  const dot = exportToDOT(experiences);

  // Should have nodes but no edges (no co-occurrence)
  assert.ok(dot.includes('"software"'), 'Should have software node');
  assert.ok(dot.includes('"design"'), 'Should have design node');
  const edgeCount = (dot.match(/--/g) || []).length;
  assert.equal(edgeCount, 0, 'Should have no edges when no domains co-occur');
});

test('Export: exportJourneysToMarkdown - basic structure', () => {
  const experiences = [
    createExperience('1', '2026-01-23T08:00:00Z', 'learner-1', 'Lab A', 45.5, -73.6, 'workshop', 'First experience', ['software'])
  ];

  const markdown = exportJourneysToMarkdown(experiences);

  assert.ok(markdown.includes('# UbiCity Learner Journeys'), 'Should have main heading');
  assert.ok(markdown.includes('## Learner: learner-1'), 'Should have learner heading');
  assert.ok(markdown.includes('**Total Experiences:**'), 'Should show experience count');
  assert.ok(markdown.includes('### Timeline'), 'Should have timeline section');
});

test('Export: exportJourneysToMarkdown - timeline ordering', () => {
  const experiences = [
    createExperience('1', '2026-01-23T10:00:00Z', 'learner-1', 'Lab A', 45.5, -73.6, 'workshop', 'Second'),
    createExperience('2', '2026-01-23T08:00:00Z', 'learner-1', 'Lab A', 45.5, -73.6, 'workshop', 'First')
  ];

  const markdown = exportJourneysToMarkdown(experiences);

  const firstIndex = markdown.indexOf('First');
  const secondIndex = markdown.indexOf('Second');
  assert.ok(firstIndex < secondIndex, 'Should sort experiences by timestamp (First before Second)');
});

test('Export: exportJourneysToMarkdown - domain display', () => {
  const experiences = [
    createExperience('1', '2026-01-23T08:00:00Z', 'learner-1', 'Lab A', 45.5, -73.6, 'workshop', 'Test', ['software', 'hardware'])
  ];

  const markdown = exportJourneysToMarkdown(experiences);

  assert.ok(markdown.includes('- Domains:'), 'Should have Domains label');
  assert.ok(markdown.includes('software'), 'Should list software domain');
  assert.ok(markdown.includes('hardware'), 'Should list hardware domain');
});

test('Export: exportJourneysToMarkdown - questions section', () => {
  const experiences = [
    createExperience('1', '2026-01-23T08:00:00Z', 'learner-1', 'Lab A', 45.5, -73.6, 'workshop', 'Test', [], {
      success: true,
      next_questions: ['How can I improve?', 'What next?']
    })
  ];

  const markdown = exportJourneysToMarkdown(experiences);

  assert.ok(markdown.includes('### Questions Emerged'), 'Should have questions section');
  assert.ok(markdown.includes('How can I improve?'), 'Should list first question');
  assert.ok(markdown.includes('What next?'), 'Should list second question');
});

test('Export: exportJourneysToMarkdown - multiple learners', () => {
  const experiences = [
    createExperience('1', '2026-01-23T08:00:00Z', 'learner-1', 'Lab A', 45.5, -73.6, 'workshop', 'Test'),
    createExperience('2', '2026-01-23T09:00:00Z', 'learner-2', 'Lab B', 45.6, -73.7, 'workshop', 'Test')
  ];

  const markdown = exportJourneysToMarkdown(experiences);

  assert.ok(markdown.includes('## Learner: learner-1'), 'Should have learner-1 section');
  assert.ok(markdown.includes('## Learner: learner-2'), 'Should have learner-2 section');
  assert.ok(markdown.includes('---'), 'Should have separator between learners');
});

test('Export: exportToJSON - serialization', () => {
  const experiences = [
    createExperience('1', '2026-01-23T08:00:00Z', 'learner-1', 'Lab A', 45.5, -73.6, 'workshop', 'Test', ['software'])
  ];

  const json = exportToJSON(experiences);
  const parsed = JSON.parse(json);

  assert.ok(Array.isArray(parsed), 'Should be an array');
  assert.equal(parsed.length, 1, 'Should have one experience');
  assert.equal(parsed[0].id, '1', 'Should preserve id');
  assert.equal(parsed[0].learner.id, 'learner-1', 'Should preserve learner id');
  assert.equal(parsed[0].context.location.name, 'Lab A', 'Should preserve location');
});

test('Export: exportToJSON - preserves all fields', () => {
  const experiences = [
    createExperience('1', '2026-01-23T08:00:00Z', 'learner-1', 'Lab A', 45.5, -73.6, 'workshop', 'Test', ['software'])
  ];

  const json = exportToJSON(experiences);
  const parsed = JSON.parse(json);
  const exp = parsed[0];

  assert.ok(exp.id, 'Should have id');
  assert.ok(exp.timestamp, 'Should have timestamp');
  assert.ok(exp.version, 'Should have version');
  assert.ok(exp.learner, 'Should have learner');
  assert.ok(exp.context, 'Should have context');
  assert.ok(exp.experience, 'Should have experience');
  assert.ok(exp.privacy, 'Should have privacy');
});

test('Export: exportData - routes to CSV', () => {
  const experiences = [
    createExperience('1', '2026-01-23T08:00:00Z', 'learner-1', 'Lab A', 45.5, -73.6, 'workshop', 'Test')
  ];

  const result = exportData(experiences, 'CSV');

  assert.ok(result.includes('id,timestamp'), 'Should be CSV format');
});

test('Export: exportData - routes to GeoJSON', () => {
  const experiences = [
    createExperience('1', '2026-01-23T08:00:00Z', 'learner-1', 'Lab A', 45.5, -73.6, 'workshop', 'Test')
  ];

  const result = exportData(experiences, 'GeoJSON');
  const parsed = JSON.parse(result);

  assert.equal(parsed.type, 'FeatureCollection', 'Should be GeoJSON FeatureCollection');
});

test('Export: exportData - routes to DOT', () => {
  const experiences = [
    createExperience('1', '2026-01-23T08:00:00Z', 'learner-1', 'Lab A', 45.5, -73.6, 'workshop', 'Test', ['software'])
  ];

  const result = exportData(experiences, 'DOT');

  assert.ok(result.includes('graph DomainNetwork'), 'Should be DOT format');
});

test('Export: exportData - routes to Markdown', () => {
  const experiences = [
    createExperience('1', '2026-01-23T08:00:00Z', 'learner-1', 'Lab A', 45.5, -73.6, 'workshop', 'Test')
  ];

  const result = exportData(experiences, 'Markdown');

  assert.ok(result.includes('# UbiCity Learner Journeys'), 'Should be Markdown format');
});

test('Export: exportData - routes to JSON', () => {
  const experiences = [
    createExperience('1', '2026-01-23T08:00:00Z', 'learner-1', 'Lab A', 45.5, -73.6, 'workshop', 'Test')
  ];

  const result = exportData(experiences, 'JSON');
  const parsed = JSON.parse(result);

  assert.ok(Array.isArray(parsed), 'Should be JSON array');
});

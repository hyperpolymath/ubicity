// SPDX-License-Identifier: MPL-2.0
// Copyright (c) Jonathan D.A. Jewell <j.d.a.jewell@open.ac.uk>
/**
 * Examples of using UbiCity programmatically
 */

import {
  createMapper,
  validateExperience,
  exportToCSV,
  fullyAnonymize,
  PerformanceMonitor,
} from '../src/index.js';

/**
 * Example 1: Basic usage
 */
async function basicUsage() {
  console.log('\n📚 Example 1: Basic Usage\n');

  // Create and initialize mapper
  const mapper = await createMapper();

  // Capture a new experience
  const id = await mapper.captureExperience({
    learner: { id: 'example-user' },
    context: {
      location: { name: 'Local Library' },
    },
    experience: {
      type: 'reading',
      description: 'Learned about urban planning',
      domains: ['urban planning', 'architecture'],
    },
  });

  console.log(`✅ Captured experience: ${id}`);

  // Generate analysis
  const hotspots = mapper.findLearningHotspots(1);
  console.log(`\n🔥 Found ${hotspots.length} learning hotspots`);
}

/**
 * Example 2: Data export
 */
async function dataExport() {
  console.log('\n📊 Example 2: Data Export\n');

  const mapper = await createMapper();

  // Export to CSV
  const csv = exportToCSV(mapper);
  console.log('CSV Preview:');
  console.log(csv.split('\n').slice(0, 3).join('\n'));
}

/**
 * Example 3: Privacy and anonymization
 */
async function privacyExample() {
  console.log('\n🔒 Example 3: Privacy & Anonymization\n');

  const experience = {
    id: 'ubi-example',
    timestamp: new Date().toISOString(),
    learner: {
      id: 'alice-smith',
      name: 'Alice Smith',
    },
    context: {
      location: {
        name: 'Coffee Shop',
        coordinates: { latitude: 37.7749, longitude: -122.4194 },
      },
    },
    experience: {
      type: 'conversation',
      description: 'Discussed AI ethics with bob@example.com',
    },
  };

  console.log('Original:', experience.learner);

  const anonymized = fullyAnonymize(experience);

  console.log('Anonymized:', anonymized.learner);
  console.log('Description:', anonymized.experience.description);
}

/**
 * Example 4: Performance monitoring
 */
async function performanceExample() {
  console.log('\n⏱️  Example 4: Performance Monitoring\n');

  const monitor = new PerformanceMonitor();
  const mapper = await createMapper();

  // Time an operation
  monitor.start('findHotspots');
  mapper.findLearningHotspots();
  const duration = monitor.end('findHotspots');

  console.log(`Found hotspots in ${duration.toFixed(2)}ms`);
}

/**
 * Example 5: Validation
 */
async function validationExample() {
  console.log('\n✅ Example 5: Data Validation\n');

  // Valid experience
  const valid = {
    learner: { id: 'test' },
    context: { location: { name: 'Park' } },
    experience: { type: 'observation', description: 'Bird watching' },
  };

  try {
    validateExperience(valid);
    console.log('✅ Valid experience accepted');
  } catch (error) {
    console.log('❌ Validation failed:', error.message);
  }

  // Invalid experience (missing required fields)
  const invalid = {
    learner: { id: 'test' },
    // Missing context and experience
  };

  try {
    validateExperience(invalid);
    console.log('✅ Valid experience accepted');
  } catch (error) {
    console.log('❌ Validation failed (expected)');
  }
}

/**
 * Example 6: Learner journey analysis
 */
async function journeyExample() {
  console.log('\n🗺️  Example 6: Learner Journey Analysis\n');

  const mapper = await createMapper();

  // Get all learners
  const learnerIds = Array.from(mapper.learnerIndex.keys());

  if (learnerIds.length > 0) {
    const firstLearner = learnerIds[0];
    const journey = mapper.getLearnerJourney(firstLearner);

    console.log(`Learner: ${journey.learnerId}`);
    console.log(`Experiences: ${journey.experienceCount}`);
    console.log(`Domain evolution: ${journey.domainEvolution.length} new domains discovered`);
  } else {
    console.log('No learners found in dataset');
  }
}

// Run all examples
async function runAllExamples() {
  console.log('='.repeat(60));
  console.log('UbiCity API Usage Examples');
  console.log('='.repeat(60));

  try {
    await basicUsage();
    await dataExport();
    await privacyExample();
    await performanceExample();
    await validationExample();
    await journeyExample();

    console.log('\n' + '='.repeat(60));
    console.log('✅ All examples completed successfully');
    console.log('='.repeat(60) + '\n');
  } catch (error) {
    console.error('\n❌ Example failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples();
}

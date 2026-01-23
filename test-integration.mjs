// SPDX-License-Identifier: AGPL-3.0-or-later
// Integration test for ReScript modules

import { make as makeMapper, captureExperience, loadAll, getExperienceCount,
         findInterdisciplinary, groupByLocation, generateReport } from './src-rescript/Mapper.res.js';

async function runIntegrationTest() {
  console.log('🧪 UbiCity Integration Test\n');

  try {
    // 1. Create mapper
    console.log('1. Creating mapper...');
    const mapper = await makeMapper('./ubicity-data-test');
    console.log('   ✓ Mapper created');

    // 2. Create a test experience
    console.log('\n2. Creating test experience...');
    const testExperience = {
      id: 'test-001',
      timestamp: new Date().toISOString(),
      version: '1.0',
      learner: {
        id: 'learner-test',
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
        situation: 'Integration testing',
        connections: ['mapper', 'storage'],
        timeOfDay: 'afternoon',
      },
      experience: {
        type: 'workshop',
        description: 'Testing the ReScript integration',
        domains: ['software', 'testing'],
        outcome: {
          success: true,
          connections_made: ['mapper', 'decoder'],
          next_questions: ['Does it all work together?'],
          artifacts: ['test-integration.mjs'],
        },
        duration: 30,
        intensity: 'medium',
      },
      privacy: {
        level: 'public',
        shareableWith: null,
      },
      tags: ['test', 'integration'],
    };

    // 3. Capture experience
    console.log('   Creating experience...');
    const result = await captureExperience(mapper, testExperience);

    if (result.TAG === 'Ok') {
      console.log(`   ✓ Experience captured: ${result._0}`);
    } else {
      throw new Error(`Failed to capture: ${result._0}`);
    }

    // 4. Check count
    console.log('\n3. Checking experience count...');
    const count = getExperienceCount(mapper);
    console.log(`   ✓ Total experiences: ${count}`);

    // 5. Load all experiences
    console.log('\n4. Loading all experiences...');
    const loadResult = await loadAll(mapper);

    if (loadResult.TAG === 'Ok') {
      console.log(`   ✓ Loaded ${loadResult._0} experiences`);
    } else {
      throw new Error(`Failed to load: ${loadResult._0}`);
    }

    // 6. Run analysis
    console.log('\n5. Running analysis...');
    const interdisciplinary = findInterdisciplinary(mapper);
    console.log(`   ✓ Interdisciplinary experiences: ${interdisciplinary.length}`);

    const byLocation = groupByLocation(mapper);
    const locationCount = Object.keys(byLocation).length;
    console.log(`   ✓ Unique locations: ${locationCount}`);

    // 7. Generate report
    console.log('\n6. Generating report...');
    const reportResult = await generateReport(mapper);

    if (reportResult.TAG === 'Ok') {
      const report = reportResult._0;
      console.log(`   ✓ Report generated:`);
      console.log(`     - Total: ${report.summary.totalExperiences}`);
      console.log(`     - Locations: ${report.summary.uniqueLocations}`);
      console.log(`     - Domains: ${report.summary.uniqueDomains}`);
      console.log(`     - Learners: ${report.summary.uniqueLearners}`);
      console.log(`     - Interdisciplinary: ${report.summary.interdisciplinaryExperiences}`);
      console.log(`     - Hotspots: ${report.learningHotspots.length}`);
    } else {
      throw new Error(`Failed to generate report: ${reportResult._0}`);
    }

    console.log('\n✅ All integration tests passed!');
    return 0;

  } catch (error) {
    console.error('\n❌ Integration test failed:');
    console.error(error);
    return 1;
  }
}

runIntegrationTest().then(code => process.exit(code));

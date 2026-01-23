// SPDX-License-Identifier: AGPL-3.0-or-later
// Test loading existing experience data

import { make as makeMapper, loadAll, getExperienceCount,
         findInterdisciplinary, groupByLocation, groupByLearner,
         calculateDiversity, getHotspots, getTopDomains,
         generateReport } from './src-rescript/Mapper.res.js';

async function testExistingData() {
  console.log('🧪 Testing Existing UbiCity Data\n');

  try {
    // 1. Create mapper with existing data directory
    console.log('1. Creating mapper...');
    const mapper = await makeMapper('./ubicity-data');
    console.log('   ✓ Mapper created');

    // 2. Load all experiences
    console.log('\n2. Loading existing experiences...');
    const loadResult = await loadAll(mapper);

    if (loadResult.TAG === 'Ok') {
      console.log(`   ✓ Loaded ${loadResult._0} experiences`);
    } else {
      console.error(`   ✗ Failed to load: ${loadResult._0}`);
      return 1;
    }

    // 3. Check count
    const count = getExperienceCount(mapper);
    console.log(`\n3. Experience count: ${count}`);

    // 4. Run analysis
    console.log('\n4. Running analysis...');

    const interdisciplinary = findInterdisciplinary(mapper);
    console.log(`   - Interdisciplinary: ${interdisciplinary.length}`);

    const diversity = calculateDiversity(mapper);
    console.log(`   - Diversity score: ${diversity}`);

    const hotspots = getHotspots(mapper, 5);
    console.log(`   - Top hotspots: ${hotspots.length}`);
    hotspots.forEach(([location, count]) => {
      console.log(`     • ${location}: ${count} experiences`);
    });

    const topDomains = getTopDomains(mapper, 5);
    console.log(`   - Top domains: ${topDomains.length}`);
    topDomains.forEach(([domain, count]) => {
      console.log(`     • ${domain}: ${count} experiences`);
    });

    const byLocation = groupByLocation(mapper);
    console.log(`   - Unique locations: ${Object.keys(byLocation).length}`);

    const byLearner = groupByLearner(mapper);
    console.log(`   - Unique learners: ${Object.keys(byLearner).length}`);

    // 5. Generate full report
    console.log('\n5. Generating full report...');
    const reportResult = await generateReport(mapper);

    if (reportResult.TAG === 'Ok') {
      const report = reportResult._0;
      console.log('   ✓ Report generated:');
      console.log(`     Summary:`);
      console.log(`       - Total experiences: ${report.summary.totalExperiences}`);
      console.log(`       - Unique locations: ${report.summary.uniqueLocations}`);
      console.log(`       - Unique domains: ${report.summary.uniqueDomains}`);
      console.log(`       - Unique learners: ${report.summary.uniqueLearners}`);
      console.log(`       - Interdisciplinary: ${report.summary.interdisciplinaryExperiences}`);
      console.log(`     Hotspots: ${report.learningHotspots.length}`);
      report.learningHotspots.slice(0, 3).forEach(hotspot => {
        console.log(`       - ${hotspot.location}: ${hotspot.count} experiences, ${hotspot.diversity} domains, ${hotspot.learners} learners`);
      });
    } else {
      console.error(`   ✗ Failed to generate report: ${reportResult._0}`);
      return 1;
    }

    console.log('\n✅ All tests on existing data passed!');
    return 0;

  } catch (error) {
    console.error('\n❌ Test failed:');
    console.error(error.message);
    console.error(error.stack);
    return 1;
  }
}

testExistingData().then(code => process.exit(code));

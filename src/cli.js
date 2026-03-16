#!/usr/bin/env node
// SPDX-License-Identifier: PMPL-1.0-or-later

/**
 * UbiCity CLI - Main entry point
 * Proper argument parsing and command routing
 */

import { parseArgs } from 'node:util';
import { UrbanKnowledgeMapper } from './mapper.js';

const COMMANDS = {
  capture: 'Capture a learning experience',
  report: 'Generate full analysis report',
  hotspots: 'Find learning hotspots',
  network: 'Show domain connection network',
  learner: 'Show journey for a specific learner',
  stats: 'Show storage statistics',
  help: 'Show this help message',
};

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === 'help' || args[0] === '--help') {
    showHelp();
    process.exit(0);
  }

  const command = args[0];

  if (!COMMANDS[command]) {
    console.error(`Unknown command: ${command}`);
    console.error('Run "ubicity help" for usage information');
    process.exit(1);
  }

  try {
    await executeCommand(command, args.slice(1));
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

async function executeCommand(command, args) {
  const mapper = new UrbanKnowledgeMapper();
  await mapper.initialize();
  await mapper.loadAll();

  switch (command) {
    case 'report':
      await handleReport(mapper);
      break;

    case 'hotspots':
      await handleHotspots(mapper, args);
      break;

    case 'network':
      await handleNetwork(mapper);
      break;

    case 'learner':
      await handleLearner(mapper, args);
      break;

    case 'stats':
      await handleStats(mapper);
      break;

    case 'capture':
      console.error('Use "node src/capture.js" for interactive capture');
      break;

    default:
      showHelp();
  }
}

async function handleReport(mapper) {
  console.log('Generating analysis report...\n');
  const report = await mapper.generateReport();

  console.log('='.repeat(60));
  console.log('UbiCity Learning Analysis Report');
  console.log('='.repeat(60));
  console.log(`\nGenerated: ${report.generated}`);
  console.log('\nSummary:');
  console.log(`  Total Experiences: ${report.summary.totalExperiences}`);
  console.log(`  Unique Learners: ${report.summary.uniqueLearners}`);
  console.log(`  Unique Locations: ${report.summary.uniqueLocations}`);
  console.log(`  Unique Domains: ${report.summary.uniqueDomains}`);
  console.log(`  Interdisciplinary: ${report.summary.interdisciplinaryExperiences}`);

  if (report.learningHotspots.length > 0) {
    console.log('\nTop Learning Hotspots:');
    report.learningHotspots.slice(0, 5).forEach(h => {
      console.log(`\n  ${h.location}:`);
      console.log(`    Experiences: ${h.count}`);
      console.log(`    Domains: ${h.domains.join(', ')}`);
      console.log(`    Diversity Score: ${h.diversity}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Full report saved to: ubicity-data/analyses/`);
}

async function handleHotspots(mapper, args) {
  const minDiversity = parseInt(args[0]) || 3;

  console.log(`\nLearning Hotspots (min diversity: ${minDiversity}):`);
  console.log('='.repeat(60));

  const hotspots = mapper.findLearningHotspots(minDiversity);

  if (hotspots.length === 0) {
    console.log('\nNo hotspots found with the specified criteria.');
    console.log('Try lowering the minimum diversity threshold.');
    return;
  }

  hotspots.forEach(h => {
    console.log(`\n${h.location}:`);
    console.log(`  Experiences: ${h.count}`);
    console.log(`  Unique Learners: ${h.learners}`);
    console.log(`  Domains: ${h.domains.join(', ')}`);
    console.log(`  Diversity Score: ${h.diversity}`);
    if (h.coordinates) {
      console.log(`  Coordinates: ${h.coordinates.latitude}, ${h.coordinates.longitude}`);
    }
  });
}

async function handleNetwork(mapper) {
  const network = mapper.generateDomainNetwork();

  console.log('\nDomain Network:');
  console.log('='.repeat(60));
  console.log(`\nNodes (${network.nodes.length} domains):`);
  network.nodes
    .sort((a, b) => b.size - a.size)
    .forEach(node => {
      console.log(`  ${node.id}: ${node.size} experiences`);
    });

  console.log(`\nEdges (${network.edges.length} connections):`);
  network.edges
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 10)
    .forEach(edge => {
      console.log(`  ${edge.source} <--> ${edge.target} (${edge.weight})`);
    });
}

async function handleLearner(mapper, args) {
  const learnerId = args[0];

  if (!learnerId) {
    console.error('Please provide a learner ID');
    console.error('Usage: ubicity learner <learner-id>');
    process.exit(1);
  }

  const journey = mapper.getLearnerJourney(learnerId);

  if (!journey) {
    console.error(`No experiences found for learner: ${learnerId}`);
    process.exit(1);
  }

  console.log(`\nLearner Journey: ${journey.learnerId}`);
  console.log('='.repeat(60));
  console.log(`\nTotal Experiences: ${journey.experienceCount}`);

  console.log('\nTimeline:');
  journey.timeline.forEach((exp, i) => {
    console.log(`\n${i + 1}. ${exp.location} - ${exp.type}`);
    console.log(`   Date: ${new Date(exp.timestamp).toLocaleDateString()}`);
    if (exp.domains && exp.domains.length > 0) {
      console.log(`   Domains: ${exp.domains.join(', ')}`);
    }
    console.log(`   ${exp.description.substring(0, 100)}...`);
  });

  if (journey.domainEvolution.length > 0) {
    console.log('\nDomain Evolution:');
    journey.domainEvolution.forEach(evolution => {
      console.log(`  ${new Date(evolution.timestamp).toLocaleDateString()}: ${evolution.newDomains.join(', ')}`);
    });
  }

  if (journey.questionsEmerged.length > 0) {
    console.log('\nQuestions Emerged:');
    journey.questionsEmerged.forEach(q => console.log(`  - ${q}`));
  }
}

async function handleStats(mapper) {
  const stats = await mapper.storage.getStats();

  console.log('\nStorage Statistics:');
  console.log('='.repeat(60));
  console.log(`  Directory: ${stats.storageDir}`);
  console.log(`  Total Experiences: ${stats.totalExperiences}`);
  console.log(`  Total Size: ${stats.totalSizeKB} KB`);
  console.log(`  Loaded in Memory: ${mapper.experiences.size}`);
}

function showHelp() {
  console.log('\nUbiCity - Urban Learning Capture System');
  console.log('='.repeat(60));
  console.log('\nUsage: ubicity <command> [options]');
  console.log('\nCommands:');

  Object.entries(COMMANDS).forEach(([cmd, desc]) => {
    console.log(`  ${cmd.padEnd(12)} ${desc}`);
  });

  console.log('\nExamples:');
  console.log('  ubicity report              # Generate full analysis');
  console.log('  ubicity hotspots 5          # Find hotspots with 5+ domains');
  console.log('  ubicity learner alex-maker  # Show learner journey');
  console.log('  ubicity network             # Show domain connections');
  console.log('  ubicity stats               # Show storage statistics');
  console.log('\nFor more information, see: GETTING_STARTED.md\n');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

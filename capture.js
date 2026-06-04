// SPDX-License-Identifier: MPL-2.0
// Copyright (c) Jonathan D.A. Jewell <j.d.a.jewell@open.ac.uk>
#!/usr/bin/env node

/**
 * UbiCity Learning Experience Capture Tool
 *
 * Quick capture interface for recording learning moments as they happen.
 * Designed to minimize friction - get the experience recorded, analyze later.
 */

const readline = require('readline');
const { UrbanKnowledgeMapper } = require('./mapper');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, answer => resolve(answer));
  });
}

async function captureExperience() {
  console.log('\n🏙️  UbiCity Learning Experience Capture\n');
  console.log('Record a learning moment as it happens.\n');

  const experience = {
    learner: {},
    context: { location: {} },
    experience: {},
    metadata: {}
  };

  // Essential info first
  console.log('--- Who ---');
  experience.learner.id = await question('Your learner ID (or pseudonym): ');

  console.log('\n--- Where ---');
  experience.context.location.name = await question('Location name: ');

  const locationType = await question(
    'Location type (public_space/institution/cafe/library/park/other): '
  );
  experience.context.location.type = locationType || 'other';

  const addCoords = await question('Add GPS coordinates? (y/n): ');
  if (addCoords.toLowerCase() === 'y') {
    const lat = await question('Latitude: ');
    const lon = await question('Longitude: ');
    experience.context.location.coordinates = {
      lat: parseFloat(lat),
      lon: parseFloat(lon)
    };
  }

  console.log('\n--- What ---');
  const expType = await question(
    'Experience type (observation/experiment/failure/discovery/collaboration/insight/question/practice/reflection): '
  );
  experience.experience.type = expType || 'observation';

  experience.experience.description = await question(
    'Describe what you learned or attempted: '
  );

  const domainsInput = await question(
    'Domains involved (comma-separated, e.g., "design,code,urban planning"): '
  );
  experience.experience.domains = domainsInput
    .split(',')
    .map(d => d.trim())
    .filter(d => d);

  console.log('\n--- Outcome ---');
  const successInput = await question('Was this a success? (y/n/partial): ');
  experience.experience.outcome = {
    success: successInput.toLowerCase() === 'y'
  };

  const connections = await question(
    'Any unexpected connections discovered? (comma-separated or press Enter to skip): '
  );
  if (connections) {
    experience.experience.outcome.connections_made = connections
      .split(',')
      .map(c => c.trim())
      .filter(c => c);
  }

  const questions = await question(
    'New questions that emerged? (comma-separated or press Enter to skip): '
  );
  if (questions) {
    experience.experience.outcome.next_questions = questions
      .split(',')
      .map(q => q.trim())
      .filter(q => q);
  }

  console.log('\n--- Metadata ---');
  const tags = await question('Tags (comma-separated, optional): ');
  if (tags) {
    experience.metadata.tags = tags.split(',').map(t => t.trim()).filter(t => t);
  }

  const privacy = await question('Privacy level (public/community/private) [community]: ');
  experience.metadata.privacy_level = privacy || 'community';

  // Capture it
  console.log('\n💾 Saving experience...');
  const mapper = new UrbanKnowledgeMapper();
  mapper.loadAll();

  try {
    const id = mapper.captureExperience(experience);
    console.log(`\n✅ Experience captured with ID: ${id}`);
    console.log(`\nTotal experiences in system: ${mapper.experiences.size}`);

    // Show quick insights
    const location = experience.context.location.name;
    const locationExps = Array.from(mapper.locationIndex.get(location) || []);
    if (locationExps.length > 1) {
      console.log(
        `\n📍 You now have ${locationExps.length} experiences at ${location}`
      );
    }

    const domainCount = experience.experience.domains?.length || 0;
    if (domainCount > 1) {
      console.log(
        `\n🔗 This interdisciplinary experience spans ${domainCount} domains`
      );
    }
  } catch (error) {
    console.error('\n❌ Error capturing experience:', error.message);
  }

  rl.close();
}

// Quick capture mode - minimal questions
async function quickCapture() {
  console.log('\n⚡ Quick Capture Mode\n');

  const learnerId = await question('Learner ID: ');
  const location = await question('Where: ');
  const description = await question('What happened: ');
  const domains = await question('Domains (comma-separated): ');

  const experience = {
    learner: { id: learnerId },
    context: {
      location: { name: location, type: 'other' }
    },
    experience: {
      type: 'observation',
      description,
      domains: domains.split(',').map(d => d.trim()).filter(d => d)
    },
    metadata: {
      privacy_level: 'community'
    }
  };

  const mapper = new UrbanKnowledgeMapper();
  mapper.loadAll();

  try {
    const id = mapper.captureExperience(experience);
    console.log(`\n✅ ${id}`);
  } catch (error) {
    console.error('\n❌', error.message);
  }

  rl.close();
}

// Template mode - generate example JSON for manual editing
function generateTemplate() {
  const template = {
    learner: {
      id: 'learner-001',
      background: ['design', 'programming'],
      interests: ['urban computing', 'creative coding']
    },
    context: {
      location: {
        name: 'Public Library Makerspace',
        type: 'library',
        coordinates: {
          lat: 51.5074,
          lon: -0.1278
        }
      },
      situation: 'Weekly Arduino workshop',
      connections: [
        {
          type: 'mentor',
          id: 'maker-jane'
        }
      ]
    },
    experience: {
      type: 'experiment',
      description:
        'Attempted to connect Arduino to city air quality sensors, initial attempt failed but learned about I2C protocol',
      domains: ['electronics', 'environmental science', 'programming'],
      artifacts: [
        {
          type: 'photo',
          uri: './photos/arduino-setup.jpg',
          description: 'Initial circuit diagram'
        }
      ],
      outcome: {
        success: false,
        next_questions: [
          'How do professional environmental monitoring systems work?',
          'Could we create a city-wide citizen sensor network?'
        ],
        connections_made: [
          'Air quality data relates to urban planning decisions',
          'Similar to how botanists collect data in field studies'
        ]
      }
    },
    metadata: {
      tags: ['arduino', 'sensors', 'environment', 'failure'],
      privacy_level: 'public',
      related_experiences: []
    }
  };

  console.log(JSON.stringify(template, null, 2));
}

// Main
const mode = process.argv[2] || 'full';

switch (mode) {
  case 'quick':
  case 'q':
    quickCapture().catch(console.error);
    break;

  case 'template':
  case 't':
    generateTemplate();
    break;

  case 'full':
  case 'f':
  default:
    captureExperience().catch(console.error);
    break;
}

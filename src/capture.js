#!/usr/bin/env node
// SPDX-License-Identifier: PMPL-1.0-or-later

/**
 * UbiCity Learning Experience Capture Tool (ESM + Async)
 * Quick, frictionless capture of learning moments
 */

import { createInterface } from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import { UrbanKnowledgeMapper } from './mapper.js';

const MODE_QUICK = 'quick';
const MODE_FULL = 'full';
const MODE_TEMPLATE = 'template';

class CaptureSession {
  constructor(mode = MODE_QUICK) {
    this.mode = mode;
    this.rl = createInterface({ input, output });
    this.mapper = new UrbanKnowledgeMapper();
  }

  async question(prompt) {
    return await this.rl.question(prompt);
  }

  async capture() {
    console.log('\n🏙️  UbiCity Learning Capture\n');

    if (this.mode === MODE_TEMPLATE) {
      return await this.generateTemplate();
    }

    try {
      await this.mapper.initialize();

      const experience = {};

      // WHO (required)
      experience.learner = await this.captureLearner();

      // WHERE (required)
      experience.context = await this.captureContext();

      // WHAT (required)
      experience.experience = await this.captureExperience();

      // Optional enrichment (only in full mode)
      if (this.mode === MODE_FULL) {
        await this.captureOptionalFields(experience);
      }

      // Save
      const id = await this.mapper.captureExperience(experience);

      console.log(`\n✅ Experience captured: ${id}`);
      console.log(`📊 Total experiences: ${this.mapper.experiences.size}\n`);

      return id;
    } finally {
      this.rl.close();
    }
  }

  async captureLearner() {
    console.log('WHO learned?\n');

    const id = await this.question('Learner ID (pseudonym): ');

    if (!id.trim()) {
      throw new Error('Learner ID is required');
    }

    const learner = { id: id.trim() };

    if (this.mode === MODE_FULL) {
      const name = await this.question('Full name (optional): ');
      if (name.trim()) learner.name = name.trim();

      const interests = await this.question(
        'Interests (comma-separated, optional): '
      );
      if (interests.trim()) {
        learner.interests = interests
          .split(',')
          .map(i => i.trim())
          .filter(Boolean);
      }
    }

    return learner;
  }

  async captureContext() {
    console.log('\nWHERE did learning happen?\n');

    const locationName = await this.question('Location name: ');

    if (!locationName.trim()) {
      throw new Error('Location name is required');
    }

    const location = { name: locationName.trim() };

    if (this.mode === MODE_FULL) {
      const hasCoords = await this.question('Add GPS coordinates? (y/n): ');

      if (hasCoords.toLowerCase() === 'y') {
        const lat = await this.question('Latitude: ');
        const lon = await this.question('Longitude: ');

        if (lat && lon) {
          location.coordinates = {
            latitude: parseFloat(lat),
            longitude: parseFloat(lon),
          };
        }
      }

      const locationType = await this.question(
        'Location type (makerspace/library/park/etc, optional): '
      );
      if (locationType.trim()) location.type = locationType.trim();
    }

    const context = { location };

    if (this.mode === MODE_FULL) {
      const situation = await this.question('Situation/context (optional): ');
      if (situation.trim()) context.situation = situation.trim();

      const connections = await this.question(
        'Others involved (comma-separated, optional): '
      );
      if (connections.trim()) {
        context.connections = connections
          .split(',')
          .map(c => c.trim())
          .filter(Boolean);
      }
    }

    return context;
  }

  async captureExperience() {
    console.log('\nWHAT was learned?\n');

    const type = await this.question(
      'Type (experiment/workshop/observation/conversation/reading/making): '
    );

    if (!type.trim()) {
      throw new Error('Experience type is required');
    }

    const description = await this.question('Description: ');

    if (!description.trim()) {
      throw new Error('Description is required');
    }

    const experience = {
      type: type.trim(),
      description: description.trim(),
    };

    // Domains are optional but encouraged
    const domains = await this.question(
      'Domains/disciplines (comma-separated, optional but useful): '
    );
    if (domains.trim()) {
      experience.domains = domains
        .split(',')
        .map(d => d.trim())
        .filter(Boolean);
    }

    if (this.mode === MODE_FULL) {
      await this.captureOutcome(experience);
    }

    return experience;
  }

  async captureOutcome(experience) {
    console.log('\nOutcome (optional):\n');

    const success = await this.question('Was it successful? (y/n/skip): ');
    if (success.toLowerCase() === 'y') {
      experience.outcome = { success: true };
    } else if (success.toLowerCase() === 'n') {
      experience.outcome = { success: false };
    }

    if (experience.outcome) {
      const connections = await this.question(
        'Unexpected connections made (optional): '
      );
      if (connections.trim()) {
        experience.outcome.connections_made = [connections.trim()];
      }

      const questions = await this.question('New questions emerged (optional): ');
      if (questions.trim()) {
        experience.outcome.next_questions = [questions.trim()];
      }
    }

    const intensity = await this.question(
      'Intensity (low/medium/high, optional): '
    );
    if (['low', 'medium', 'high'].includes(intensity.trim().toLowerCase())) {
      experience.intensity = intensity.trim().toLowerCase();
    }
  }

  async captureOptionalFields(experience) {
    console.log('\nOptional metadata:\n');

    const privacy = await this.question(
      'Privacy level (private/anonymous/public) [default: anonymous]: '
    );
    if (privacy.trim()) {
      experience.privacy = { level: privacy.trim() };
    }

    const tags = await this.question('Tags (comma-separated, optional): ');
    if (tags.trim()) {
      experience.tags = tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);
    }
  }

  async generateTemplate() {
    const template = {
      learner: {
        id: 'your-pseudonym',
        name: 'Your Name (optional)',
        interests: ['interest1', 'interest2'],
      },
      context: {
        location: {
          name: 'Location Name',
          coordinates: {
            latitude: 0.0,
            longitude: 0.0,
          },
          type: 'makerspace',
        },
        situation: 'What was happening',
        connections: ['person1', 'person2'],
      },
      experience: {
        type: 'experiment',
        description: 'What you learned',
        domains: ['domain1', 'domain2'],
        outcome: {
          success: true,
          connections_made: ['Unexpected insight'],
          next_questions: ['What question emerged?'],
        },
        duration: 60,
        intensity: 'medium',
      },
      privacy: {
        level: 'anonymous',
      },
      tags: ['tag1', 'tag2'],
    };

    console.log(JSON.stringify(template, null, 2));
    this.rl.close();
    return template;
  }
}

async function main() {
  const mode = process.argv[2] || MODE_QUICK;

  if (![ MODE_QUICK, MODE_FULL, MODE_TEMPLATE].includes(mode)) {
    console.error(`Unknown mode: ${mode}`);
    console.error(`Usage: node capture.js [quick|full|template]`);
    process.exit(1);
  }

  try {
    const session = new CaptureSession(mode);
    await session.capture();
  } catch (error) {
    console.error(`\nError: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { CaptureSession };

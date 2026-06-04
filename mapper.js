// SPDX-License-Identifier: MPL-2.0
// Copyright (c) Jonathan D.A. Jewell <j.d.a.jewell@open.ac.uk>
/**
 * UbiCity Urban Knowledge Mapper
 *
 * Maps learning experiences across urban space, finding patterns and connections
 * that wouldn't be visible within traditional institutional boundaries.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class LearningExperience {
  constructor(data) {
    this.data = data;
    if (!this.data.id) {
      this.data.id = this.generateId();
    }
    if (!this.data.timestamp) {
      this.data.timestamp = new Date().toISOString();
    }
  }

  generateId() {
    const uuid = crypto.randomUUID();
    return `ubi-${uuid}`;
  }

  validate() {
    const required = ['id', 'timestamp', 'learner', 'context', 'experience'];
    for (const field of required) {
      if (!this.data[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    return true;
  }

  toJSON() {
    return this.data;
  }
}

class UrbanKnowledgeMapper {
  constructor(storageDir = './ubicity-data') {
    this.storageDir = storageDir;
    this.experiences = new Map();
    this.locationIndex = new Map();
    this.domainIndex = new Map();
    this.learnerIndex = new Map();

    this.ensureStorageExists();
  }

  ensureStorageExists() {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }

    const subdirs = ['experiences', 'maps', 'analyses'];
    subdirs.forEach(dir => {
      const dirPath = path.join(this.storageDir, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath);
      }
    });
  }

  /**
   * Capture a new learning experience
   */
  captureExperience(experienceData) {
    const experience = new LearningExperience(experienceData);
    experience.validate();

    this.experiences.set(experience.data.id, experience);
    this.updateIndices(experience);
    this.persist(experience);

    return experience.data.id;
  }

  /**
   * Update indices for fast lookup
   */
  updateIndices(experience) {
    const { id } = experience.data;

    // Location index
    const locationName = experience.data.context.location?.name;
    if (locationName) {
      if (!this.locationIndex.has(locationName)) {
        this.locationIndex.set(locationName, new Set());
      }
      this.locationIndex.get(locationName).add(id);
    }

    // Domain index
    const domains = experience.data.experience.domains || [];
    domains.forEach(domain => {
      if (!this.domainIndex.has(domain)) {
        this.domainIndex.set(domain, new Set());
      }
      this.domainIndex.get(domain).add(id);
    });

    // Learner index
    const learnerId = experience.data.learner.id;
    if (!this.learnerIndex.has(learnerId)) {
      this.learnerIndex.set(learnerId, new Set());
    }
    this.learnerIndex.get(learnerId).add(id);
  }

  /**
   * Persist experience to disk
   */
  persist(experience) {
    const filename = `${experience.data.id}.json`;
    const filepath = path.join(this.storageDir, 'experiences', filename);
    fs.writeFileSync(filepath, JSON.stringify(experience.data, null, 2));
  }

  /**
   * Load all experiences from storage
   */
  loadAll() {
    const experiencesDir = path.join(this.storageDir, 'experiences');
    if (!fs.existsSync(experiencesDir)) return;

    const files = fs.readdirSync(experiencesDir);
    files.forEach(file => {
      if (file.endsWith('.json')) {
        const filepath = path.join(experiencesDir, file);
        const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        const experience = new LearningExperience(data);
        this.experiences.set(experience.data.id, experience);
        this.updateIndices(experience);
      }
    });
  }

  /**
   * Find interdisciplinary connections
   * Returns learning experiences that span multiple domains
   */
  findInterdisciplinaryConnections() {
    const connections = [];

    this.experiences.forEach((experience, id) => {
      const domains = experience.data.experience.domains || [];
      if (domains.length > 1) {
        connections.push({
          id,
          domains,
          description: experience.data.experience.description,
          location: experience.data.context.location?.name,
          unexpected: experience.data.experience.outcome?.connections_made || []
        });
      }
    });

    return connections;
  }

  /**
   * Map experiences by location
   * Creates a geographic view of learning density
   */
  mapByLocation() {
    const locationMap = {};

    this.locationIndex.forEach((experienceIds, locationName) => {
      const experiences = Array.from(experienceIds).map(id =>
        this.experiences.get(id).data
      );

      const domains = new Set();
      const types = new Set();
      const learners = new Set();

      experiences.forEach(exp => {
        (exp.experience.domains || []).forEach(d => domains.add(d));
        types.add(exp.experience.type);
        learners.add(exp.learner.id);
      });

      // Get coordinates if available
      const firstExp = experiences[0];
      const coords = firstExp.context.location?.coordinates;

      locationMap[locationName] = {
        count: experiences.length,
        domains: Array.from(domains),
        types: Array.from(types),
        learners: learners.size,
        coordinates: coords,
        diversity: domains.size // How many different disciplines meet here
      };
    });

    return locationMap;
  }

  /**
   * Find learning paths for a specific learner
   * Shows progression and evolution of interests
   */
  getLearnerJourney(learnerId) {
    const experienceIds = this.learnerIndex.get(learnerId);
    if (!experienceIds) return null;

    const experiences = Array.from(experienceIds)
      .map(id => this.experiences.get(id).data)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    return {
      learnerId,
      experienceCount: experiences.length,
      timeline: experiences.map(exp => ({
        timestamp: exp.timestamp,
        location: exp.context.location?.name,
        type: exp.experience.type,
        domains: exp.experience.domains,
        description: exp.experience.description
      })),
      domainEvolution: this.trackDomainEvolution(experiences),
      questionsEmerged: experiences
        .flatMap(exp => exp.experience.outcome?.next_questions || [])
    };
  }

  /**
   * Track how a learner's domains evolve over time
   */
  trackDomainEvolution(experiences) {
    const evolution = [];
    const seenDomains = new Set();

    experiences.forEach(exp => {
      const newDomains = (exp.experience.domains || [])
        .filter(d => !seenDomains.has(d));

      if (newDomains.length > 0) {
        evolution.push({
          timestamp: exp.timestamp,
          newDomains,
          context: exp.context.location?.name
        });
        newDomains.forEach(d => seenDomains.add(d));
      }
    });

    return evolution;
  }

  /**
   * Generate a network of domain connections
   * Shows which domains frequently co-occur in learning experiences
   */
  generateDomainNetwork() {
    const edges = new Map(); // "domain1-domain2" -> weight

    this.experiences.forEach(experience => {
      const domains = experience.data.experience.domains || [];

      // Create edges between all pairs of domains in this experience
      for (let i = 0; i < domains.length; i++) {
        for (let j = i + 1; j < domains.length; j++) {
          const d1 = domains[i];
          const d2 = domains[j];
          const key = [d1, d2].sort().join('-');

          edges.set(key, (edges.get(key) || 0) + 1);
        }
      }
    });

    // Convert to network format
    const network = {
      nodes: Array.from(this.domainIndex.keys()).map(domain => ({
        id: domain,
        size: this.domainIndex.get(domain).size
      })),
      edges: Array.from(edges.entries()).map(([key, weight]) => {
        const [source, target] = key.split('-');
        return { source, target, weight };
      })
    };

    return network;
  }

  /**
   * Identify "learning hotspots" - locations with high diversity
   */
  findLearningHotspots(minDiversity = 3) {
    const locationMap = this.mapByLocation();

    return Object.entries(locationMap)
      .filter(([_, data]) => data.diversity >= minDiversity)
      .sort((a, b) => b[1].diversity - a[1].diversity)
      .map(([name, data]) => ({
        location: name,
        ...data
      }));
  }

  /**
   * Export to formats suitable for analysis
   */
  exportToVoyant() {
    // Create a corpus of learning descriptions
    const texts = [];

    this.experiences.forEach((experience, id) => {
      const exp = experience.data;
      const text = {
        id,
        title: `${exp.context.location?.name || 'Unknown'} - ${exp.experience.type}`,
        content: [
          exp.experience.description,
          ...(exp.experience.outcome?.connections_made || []),
          ...(exp.experience.outcome?.next_questions || [])
        ].join('\n\n'),
        metadata: {
          location: exp.context.location?.name,
          domains: exp.experience.domains?.join(', '),
          type: exp.experience.type,
          timestamp: exp.timestamp
        }
      };
      texts.push(text);
    });

    return texts;
  }

  /**
   * Generate a report of the current state
   */
  generateReport() {
    const interdisciplinary = this.findInterdisciplinaryConnections();
    const hotspots = this.findLearningHotspots();
    const domainNetwork = this.generateDomainNetwork();

    const report = {
      generated: new Date().toISOString(),
      summary: {
        totalExperiences: this.experiences.size,
        uniqueLearners: this.learnerIndex.size,
        uniqueLocations: this.locationIndex.size,
        uniqueDomains: this.domainIndex.size,
        interdisciplinaryExperiences: interdisciplinary.length
      },
      learningHotspots: hotspots,
      interdisciplinaryConnections: interdisciplinary.slice(0, 10),
      domainNetwork,
      locationMap: this.mapByLocation()
    };

    const reportPath = path.join(
      this.storageDir,
      'analyses',
      `report-${Date.now()}.json`
    );
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    return report;
  }
}

// CLI interface
if (require.main === module) {
  const mapper = new UrbanKnowledgeMapper();
  mapper.loadAll();

  const command = process.argv[2];

  switch (command) {
    case 'report':
      const report = mapper.generateReport();
      console.log(JSON.stringify(report, null, 2));
      break;

    case 'hotspots':
      const hotspots = mapper.findLearningHotspots();
      console.log('Learning Hotspots (locations with high disciplinary diversity):');
      hotspots.forEach(h => {
        console.log(`\n${h.location}:`);
        console.log(`  Experiences: ${h.count}`);
        console.log(`  Domains: ${h.domains.join(', ')}`);
        console.log(`  Diversity: ${h.diversity}`);
      });
      break;

    case 'network':
      const network = mapper.generateDomainNetwork();
      console.log(JSON.stringify(network, null, 2));
      break;

    case 'learner':
      const learnerId = process.argv[3];
      if (!learnerId) {
        console.error('Please provide a learner ID');
        process.exit(1);
      }
      const journey = mapper.getLearnerJourney(learnerId);
      console.log(JSON.stringify(journey, null, 2));
      break;

    default:
      console.log('UbiCity Urban Knowledge Mapper');
      console.log('\nUsage: node mapper.js <command>');
      console.log('\nCommands:');
      console.log('  report     Generate a full analysis report');
      console.log('  hotspots   Find learning hotspots');
      console.log('  network    Show domain connection network');
      console.log('  learner <id>  Show journey for a specific learner');
  }
}

module.exports = {
  LearningExperience,
  UrbanKnowledgeMapper
};

// SPDX-License-Identifier: PMPL-1.0-or-later
/**
 * UbiCity Urban Knowledge Mapper (ESM + Async + Validated)
 *
 * Maps learning experiences across urban space, finding patterns and connections
 * that wouldn't be visible within traditional institutional boundaries.
 */

import { randomUUID } from 'crypto';
import { validateExperience, safeValidateExperience } from './schemas.js';
import { ExperienceStorage } from './storage.js';

/**
 * Learning Experience with validation
 */
export class LearningExperience {
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
    return `ubi-${randomUUID()}`;
  }

  /**
   * Validate the experience data
   * @throws {Error} If validation fails
   */
  validate() {
    try {
      validateExperience(this.data);
      return true;
    } catch (error) {
      throw new Error(`Validation failed: ${error.message}`);
    }
  }

  /**
   * Safe validation with detailed errors
   * @returns {{ success: boolean, errors?: string[] }}
   */
  safeValidate() {
    return safeValidateExperience(this.data);
  }

  toJSON() {
    return this.data;
  }
}

/**
 * Urban Knowledge Mapper - Async version with indices
 */
export class UrbanKnowledgeMapper {
  constructor(storageDir = './ubicity-data') {
    this.storage = new ExperienceStorage(storageDir);
    this.experiences = new Map();
    this.locationIndex = new Map();
    this.domainIndex = new Map();
    this.learnerIndex = new Map();
  }

  /**
   * Initialize storage
   */
  async initialize() {
    await this.storage.ensureDirectories();
  }

  /**
   * Capture a new learning experience
   * @param {object} experienceData - Raw experience data
   * @returns {Promise<string>} Experience ID
   */
  async captureExperience(experienceData) {
    const experience = new LearningExperience(experienceData);
    experience.validate();

    this.experiences.set(experience.data.id, experience);
    this.updateIndices(experience);
    await this.storage.saveExperience(experience.data);

    return experience.data.id;
  }

  /**
   * Update in-memory indices for fast lookup
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
   * Load all experiences from storage (async)
   */
  async loadAll() {
    const experiencesData = await this.storage.loadAllExperiences();

    experiencesData.forEach(data => {
      const experience = new LearningExperience(data);
      this.experiences.set(experience.data.id, experience);
      this.updateIndices(experience);
    });

    return this.experiences.size;
  }

  /**
   * Find interdisciplinary connections
   * @returns {Array<object>} Learning experiences spanning multiple domains
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
   * @returns {object} Location map with diversity metrics
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

      const firstExp = experiences[0];
      const coords = firstExp.context.location?.coordinates;

      locationMap[locationName] = {
        count: experiences.length,
        domains: Array.from(domains),
        types: Array.from(types),
        learners: learners.size,
        coordinates: coords,
        diversity: domains.size
      };
    });

    return locationMap;
  }

  /**
   * Get a learner's journey over time
   * @param {string} learnerId - Learner ID
   * @returns {object|null} Journey data or null if not found
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
   * Track domain evolution for a learner
   * @param {Array<object>} experiences - Sorted experiences
   * @returns {Array<object>} Evolution timeline
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
   * Generate domain co-occurrence network
   * @returns {object} Network with nodes and edges
   */
  generateDomainNetwork() {
    const edges = new Map();

    this.experiences.forEach(experience => {
      const domains = experience.data.experience.domains || [];

      for (let i = 0; i < domains.length; i++) {
        for (let j = i + 1; j < domains.length; j++) {
          const d1 = domains[i];
          const d2 = domains[j];
          const key = [d1, d2].sort().join('-');
          edges.set(key, (edges.get(key) || 0) + 1);
        }
      }
    });

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
   * Find learning hotspots - locations with high disciplinary diversity
   * @param {number} minDiversity - Minimum number of distinct domains
   * @returns {Array<object>} Sorted hotspots
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
   * Export to Voyant-compatible format
   * @returns {Array<object>} Text corpus for analysis
   */
  exportToVoyant() {
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
   * Generate comprehensive analysis report
   * @returns {Promise<object>} Analysis report
   */
  async generateReport() {
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

    await this.storage.saveReport(report);
    return report;
  }
}

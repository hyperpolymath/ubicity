/**
 * Advanced analysis features for UbiCity
 * Beyond basic mapping - temporal patterns, collaborative networks, recommendations
 */

import { UrbanKnowledgeMapper } from './mapper.js';

/**
 * Temporal pattern analyzer
 */
export class TemporalAnalyzer {
  constructor(mapper) {
    this.mapper = mapper;
  }

  /**
   * Analyze learning by time of day
   * @returns {object} Time distribution
   */
  analyzeByTimeOfDay() {
    const distribution = {
      morning: [],
      afternoon: [],
      evening: [],
      night: [],
    };

    this.mapper.experiences.forEach(exp => {
      const timestamp = new Date(exp.data.timestamp);
      const hour = timestamp.getHours();

      let timeOfDay;
      if (hour >= 6 && hour < 12) timeOfDay = 'morning';
      else if (hour >= 12 && hour < 18) timeOfDay = 'afternoon';
      else if (hour >= 18 && hour < 22) timeOfDay = 'evening';
      else timeOfDay = 'night';

      distribution[timeOfDay].push(exp.data);
    });

    return {
      morning: {
        count: distribution.morning.length,
        domains: this.extractDomains(distribution.morning),
      },
      afternoon: {
        count: distribution.afternoon.length,
        domains: this.extractDomains(distribution.afternoon),
      },
      evening: {
        count: distribution.evening.length,
        domains: this.extractDomains(distribution.evening),
      },
      night: {
        count: distribution.night.length,
        domains: this.extractDomains(distribution.night),
      },
    };
  }

  /**
   * Analyze learning by day of week
   * @returns {object} Weekly distribution
   */
  analyzeByDayOfWeek() {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const distribution = days.map(() => []);

    this.mapper.experiences.forEach(exp => {
      const timestamp = new Date(exp.data.timestamp);
      const dayIndex = timestamp.getDay();
      distribution[dayIndex].push(exp.data);
    });

    return days.reduce((acc, day, idx) => {
      acc[day] = {
        count: distribution[idx].length,
        domains: this.extractDomains(distribution[idx]),
      };
      return acc;
    }, {});
  }

  /**
   * Detect learning streaks
   * @param {number} minDays - Minimum days to count as streak
   * @returns {Array<object>} Learning streaks
   */
  detectStreaks(minDays = 3) {
    const experiences = Array.from(this.mapper.experiences.values())
      .map(e => e.data)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const streaks = [];
    let currentStreak = [];

    experiences.forEach((exp, i) => {
      if (i === 0) {
        currentStreak.push(exp);
        return;
      }

      const prevDate = new Date(experiences[i - 1].timestamp);
      const currDate = new Date(exp.timestamp);
      const daysDiff = Math.floor((currDate - prevDate) / (1000 * 60 * 60 * 24));

      if (daysDiff <= 1) {
        currentStreak.push(exp);
      } else {
        if (currentStreak.length >= minDays) {
          streaks.push({
            start: currentStreak[0].timestamp,
            end: currentStreak[currentStreak.length - 1].timestamp,
            days: currentStreak.length,
            experiences: currentStreak.length,
          });
        }
        currentStreak = [exp];
      }
    });

    if (currentStreak.length >= minDays) {
      streaks.push({
        start: currentStreak[0].timestamp,
        end: currentStreak[currentStreak.length - 1].timestamp,
        days: currentStreak.length,
        experiences: currentStreak.length,
      });
    }

    return streaks;
  }

  extractDomains(experiences) {
    const domains = new Set();
    experiences.forEach(exp => {
      (exp.experience.domains || []).forEach(d => domains.add(d));
    });
    return Array.from(domains);
  }
}

/**
 * Collaborative learning network analyzer
 */
export class CollaborativeNetworkAnalyzer {
  constructor(mapper) {
    this.mapper = mapper;
  }

  /**
   * Build learner collaboration network
   * @returns {object} Network of who learns with whom
   */
  buildCollaborationNetwork() {
    const edges = new Map(); // "learner1-learner2" -> count

    this.mapper.experiences.forEach(exp => {
      const learnerId = exp.data.learner.id;
      const collaborators = exp.data.context.connections || [];

      collaborators.forEach(collaborator => {
        const key = [learnerId, collaborator].sort().join('-');
        edges.set(key, (edges.get(key) || 0) + 1);
      });
    });

    const allLearners = new Set();
    this.mapper.learnerIndex.forEach((_ids, learnerId) => allLearners.add(learnerId));
    edges.forEach((_, key) => {
      const [l1, l2] = key.split('-');
      allLearners.add(l1);
      allLearners.add(l2);
    });

    return {
      nodes: Array.from(allLearners).map(id => ({
        id,
        experiences: this.mapper.learnerIndex.get(id)?.size || 0,
      })),
      edges: Array.from(edges.entries()).map(([key, weight]) => {
        const [source, target] = key.split('-');
        return { source, target, weight };
      }),
    };
  }

  /**
   * Find most collaborative learners
   * @param {number} topN - Number of top learners to return
   * @returns {Array<object>} Top collaborative learners
   */
  findMostCollaborative(topN = 10) {
    const collaborationCounts = new Map();

    this.mapper.experiences.forEach(exp => {
      const learnerId = exp.data.learner.id;
      const collaborators = exp.data.context.connections || [];

      if (collaborators.length > 0) {
        collaborationCounts.set(
          learnerId,
          (collaborationCounts.get(learnerId) || 0) + collaborators.length
        );
      }
    });

    return Array.from(collaborationCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([learnerId, count]) => ({
        learnerId,
        collaborations: count,
      }));
  }
}

/**
 * Recommendation engine
 */
export class RecommendationEngine {
  constructor(mapper) {
    this.mapper = mapper;
  }

  /**
   * Recommend learners with similar interests
   * @param {string} learnerId - Target learner
   * @param {number} topN - Number of recommendations
   * @returns {Array<object>} Recommended learners
   */
  recommendSimilarLearners(learnerId, topN = 5) {
    const targetDomains = this.getLearnerDomains(learnerId);

    if (targetDomains.size === 0) {
      return [];
    }

    const similarities = [];

    this.mapper.learnerIndex.forEach((_ids, otherLearnerId) => {
      if (otherLearnerId === learnerId) return;

      const otherDomains = this.getLearnerDomains(otherLearnerId);
      const similarity = this.jaccardSimilarity(targetDomains, otherDomains);

      if (similarity > 0) {
        similarities.push({
          learnerId: otherLearnerId,
          similarity,
          sharedDomains: Array.from(targetDomains).filter(d => otherDomains.has(d)),
        });
      }
    });

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topN);
  }

  /**
   * Recommend locations for a learner
   * @param {string} learnerId - Target learner
   * @param {number} topN - Number of recommendations
   * @returns {Array<object>} Recommended locations
   */
  recommendLocations(learnerId, topN = 5) {
    const learnerDomains = this.getLearnerDomains(learnerId);
    const visitedLocations = this.getVisitedLocations(learnerId);

    const scores = [];

    this.mapper.locationIndex.forEach((experienceIds, locationName) => {
      if (visitedLocations.has(locationName)) return;

      const locationDomains = new Set();
      experienceIds.forEach(id => {
        const exp = this.mapper.experiences.get(id);
        (exp.data.experience.domains || []).forEach(d => locationDomains.add(d));
      });

      const relevance = this.jaccardSimilarity(learnerDomains, locationDomains);

      if (relevance > 0) {
        scores.push({
          location: locationName,
          relevance,
          matchingDomains: Array.from(learnerDomains).filter(d =>
            locationDomains.has(d)
          ),
        });
      }
    });

    return scores.sort((a, b) => b.relevance - a.relevance).slice(0, topN);
  }

  /**
   * Recommend next domains to explore
   * @param {string} learnerId - Target learner
   * @param {number} topN - Number of recommendations
   * @returns {Array<object>} Recommended domains
   */
  recommendDomains(learnerId, topN = 5) {
    const learnerDomains = this.getLearnerDomains(learnerId);

    // Find domains that co-occur with learner's domains
    const coOccurrences = new Map();

    this.mapper.experiences.forEach(exp => {
      const domains = exp.data.experience.domains || [];

      const hasLearnerDomain = domains.some(d => learnerDomains.has(d));

      if (hasLearnerDomain) {
        domains.forEach(d => {
          if (!learnerDomains.has(d)) {
            coOccurrences.set(d, (coOccurrences.get(d) || 0) + 1);
          }
        });
      }
    });

    return Array.from(coOccurrences.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([domain, count]) => ({
        domain,
        relevance: count,
      }));
  }

  getLearnerDomains(learnerId) {
    const domains = new Set();
    const experienceIds = this.mapper.learnerIndex.get(learnerId);

    if (experienceIds) {
      experienceIds.forEach(id => {
        const exp = this.mapper.experiences.get(id);
        (exp.data.experience.domains || []).forEach(d => domains.add(d));
      });
    }

    return domains;
  }

  getVisitedLocations(learnerId) {
    const locations = new Set();
    const experienceIds = this.mapper.learnerIndex.get(learnerId);

    if (experienceIds) {
      experienceIds.forEach(id => {
        const exp = this.mapper.experiences.get(id);
        const location = exp.data.context.location?.name;
        if (location) locations.add(location);
      });
    }

    return locations;
  }

  jaccardSimilarity(set1, set2) {
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return union.size === 0 ? 0 : intersection.size / union.size;
  }
}

/**
 * Create all analyzers for a mapper
 */
export function createAnalyzers(mapper) {
  return {
    temporal: new TemporalAnalyzer(mapper),
    collaborative: new CollaborativeNetworkAnalyzer(mapper),
    recommendations: new RecommendationEngine(mapper),
  };
}

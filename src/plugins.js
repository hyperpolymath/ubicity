/**
 * Plugin system for UbiCity
 * Extensible analyzers and processors
 */

/**
 * Base plugin class
 */
export class UbiCityPlugin {
  constructor(name, version = '1.0.0') {
    this.name = name;
    this.version = version;
    this.hooks = {};
  }

  /**
   * Register a hook handler
   * @param {string} hookName - Hook name
   * @param {Function} handler - Handler function
   */
  on(hookName, handler) {
    if (!this.hooks[hookName]) {
      this.hooks[hookName] = [];
    }
    this.hooks[hookName].push(handler);
  }

  /**
   * Execute a hook
   * @param {string} hookName - Hook name
   * @param {...any} args - Arguments to pass to handlers
   * @returns {Promise<any[]>} Results from all handlers
   */
  async executeHook(hookName, ...args) {
    const handlers = this.hooks[hookName] || [];
    return await Promise.all(handlers.map(h => h(...args)));
  }

  /**
   * Initialize the plugin
   * @param {UrbanKnowledgeMapper} mapper - Mapper instance
   */
  async initialize(mapper) {
    this.mapper = mapper;
  }

  /**
   * Process an experience (override in subclass)
   * @param {object} experience - Learning experience
   * @returns {Promise<object>} Processed experience
   */
  async processExperience(experience) {
    return experience;
  }

  /**
   * Analyze the dataset (override in subclass)
   * @param {Map} experiences - All experiences
   * @returns {Promise<object>} Analysis results
   */
  async analyze(experiences) {
    return {};
  }
}

/**
 * Plugin manager
 */
export class PluginManager {
  constructor(mapper) {
    this.mapper = mapper;
    this.plugins = new Map();
  }

  /**
   * Register a plugin
   * @param {UbiCityPlugin} plugin - Plugin instance
   */
  async register(plugin) {
    await plugin.initialize(this.mapper);
    this.plugins.set(plugin.name, plugin);
    console.log(`✅ Registered plugin: ${plugin.name} v${plugin.version}`);
  }

  /**
   * Unregister a plugin
   * @param {string} name - Plugin name
   */
  unregister(name) {
    this.plugins.delete(name);
  }

  /**
   * Get a plugin by name
   * @param {string} name - Plugin name
   * @returns {UbiCityPlugin|undefined}
   */
  get(name) {
    return this.plugins.get(name);
  }

  /**
   * Process experience through all plugins
   * @param {object} experience - Learning experience
   * @returns {Promise<object>} Processed experience
   */
  async processExperience(experience) {
    let processed = experience;

    for (const plugin of this.plugins.values()) {
      processed = await plugin.processExperience(processed);
    }

    return processed;
  }

  /**
   * Run analysis from all plugins
   * @returns {Promise<object>} Combined analysis results
   */
  async analyze() {
    const results = {};

    for (const [name, plugin] of this.plugins.entries()) {
      results[name] = await plugin.analyze(this.mapper.experiences);
    }

    return results;
  }
}

/**
 * Example plugin: Auto-tagging
 */
export class AutoTaggingPlugin extends UbiCityPlugin {
  constructor() {
    super('auto-tagging', '1.0.0');

    this.rules = [
      {
        pattern: /electronics|circuit|arduino|raspberry pi/i,
        tags: ['electronics', 'maker'],
      },
      {
        pattern: /art|painting|sculpture|design/i,
        tags: ['art', 'creative'],
      },
      {
        pattern: /code|programming|software|javascript|python/i,
        tags: ['programming', 'technical'],
      },
      {
        pattern: /failed|failure|didn't work/i,
        tags: ['failure', 'learning-from-mistakes'],
      },
      {
        pattern: /discovered|unexpected|serendipity/i,
        tags: ['serendipity', 'discovery'],
      },
    ];
  }

  async processExperience(experience) {
    const processed = { ...experience };
    const description = experience.experience.description.toLowerCase();

    const autoTags = new Set(processed.tags || []);

    this.rules.forEach(rule => {
      if (rule.pattern.test(description)) {
        rule.tags.forEach(tag => autoTags.add(tag));
      }
    });

    if (autoTags.size > 0) {
      processed.tags = Array.from(autoTags);
    }

    return processed;
  }
}

/**
 * Example plugin: Domain clustering
 */
export class DomainClusteringPlugin extends UbiCityPlugin {
  constructor() {
    super('domain-clustering', '1.0.0');
  }

  async analyze(experiences) {
    const clusters = this.findClusters(experiences);

    return {
      clusters,
      totalClusters: clusters.length,
      largestCluster: clusters[0] || null,
    };
  }

  findClusters(experiences) {
    const domainGroups = new Map();

    experiences.forEach(exp => {
      const domains = exp.data.experience.domains || [];

      if (domains.length > 1) {
        const key = domains.sort().join('::');

        if (!domainGroups.has(key)) {
          domainGroups.set(key, {
            domains,
            count: 0,
            experiences: [],
          });
        }

        const group = domainGroups.get(key);
        group.count++;
        group.experiences.push(exp.data.id);
      }
    });

    return Array.from(domainGroups.values())
      .sort((a, b) => b.count - a.count);
  }
}

/**
 * Example plugin: Learning velocity tracker
 */
export class LearningVelocityPlugin extends UbiCityPlugin {
  constructor() {
    super('learning-velocity', '1.0.0');
  }

  async analyze(experiences) {
    const learnerVelocities = new Map();

    experiences.forEach(exp => {
      const learnerId = exp.data.learner.id;

      if (!learnerVelocities.has(learnerId)) {
        learnerVelocities.set(learnerId, []);
      }

      learnerVelocities.get(learnerId).push({
        timestamp: new Date(exp.data.timestamp),
        domains: exp.data.experience.domains || [],
      });
    });

    const velocities = [];

    learnerVelocities.forEach((events, learnerId) => {
      const sorted = events.sort((a, b) => a.timestamp - b.timestamp);

      if (sorted.length < 2) return;

      const firstDate = sorted[0].timestamp;
      const lastDate = sorted[sorted.length - 1].timestamp;
      const daysDiff = (lastDate - firstDate) / (1000 * 60 * 60 * 24);

      const uniqueDomains = new Set();
      sorted.forEach(e => e.domains.forEach(d => uniqueDomains.add(d)));

      velocities.push({
        learnerId,
        experiencesPerWeek: (events.length / daysDiff) * 7,
        domainsExplored: uniqueDomains.size,
        periodDays: Math.floor(daysDiff),
      });
    });

    return velocities.sort((a, b) => b.experiencesPerWeek - a.experiencesPerWeek);
  }
}

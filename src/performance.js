// SPDX-License-Identifier: PMPL-1.0-or-later
/**
 * Performance monitoring and optimization utilities
 */

import { performance } from 'perf_hooks';

/**
 * Performance metrics tracker
 */
export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.marks = new Map();
  }

  /**
   * Start timing an operation
   * @param {string} name - Operation name
   */
  start(name) {
    this.marks.set(name, performance.now());
  }

  /**
   * End timing and record metric
   * @param {string} name - Operation name
   * @returns {number} Duration in milliseconds
   */
  end(name) {
    const start = this.marks.get(name);
    if (!start) {
      console.warn(`No start mark found for: ${name}`);
      return 0;
    }

    const duration = performance.now() - start;
    this.marks.delete(name);

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    this.metrics.get(name).push(duration);
    return duration;
  }

  /**
   * Get statistics for an operation
   * @param {string} name - Operation name
   * @returns {object|null} Stats or null if no data
   */
  getStats(name) {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) {
      return null;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean: sum / values.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }

  /**
   * Get all collected metrics
   * @returns {object} All metrics with stats
   */
  getAllStats() {
    const allStats = {};

    this.metrics.forEach((_values, name) => {
      allStats[name] = this.getStats(name);
    });

    return allStats;
  }

  /**
   * Print formatted statistics
   */
  printStats() {
    console.log('\n📊 Performance Statistics\n');
    console.log('='.repeat(70));

    const allStats = this.getAllStats();

    Object.entries(allStats).forEach(([name, stats]) => {
      if (!stats) return;

      console.log(`\n${name}:`);
      console.log(`  Count:  ${stats.count}`);
      console.log(`  Mean:   ${stats.mean.toFixed(2)}ms`);
      console.log(`  Median: ${stats.median.toFixed(2)}ms`);
      console.log(`  Min:    ${stats.min.toFixed(2)}ms`);
      console.log(`  Max:    ${stats.max.toFixed(2)}ms`);
      console.log(`  P95:    ${stats.p95.toFixed(2)}ms`);
      console.log(`  P99:    ${stats.p99.toFixed(2)}ms`);
    });

    console.log('\n' + '='.repeat(70) + '\n');
  }

  /**
   * Clear all metrics
   */
  reset() {
    this.metrics.clear();
    this.marks.clear();
  }
}

/**
 * Decorator to automatically track function performance
 * @param {PerformanceMonitor} monitor - Monitor instance
 * @param {string} name - Metric name
 */
export function tracked(monitor, name) {
  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args) {
      const metricName = name || `${target.constructor.name}.${propertyKey}`;
      monitor.start(metricName);

      try {
        const result = await originalMethod.apply(this, args);
        monitor.end(metricName);
        return result;
      } catch (error) {
        monitor.end(metricName);
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Memory usage tracker
 */
export function getMemoryUsage() {
  const usage = process.memoryUsage();

  return {
    heapUsed: (usage.heapUsed / 1024 / 1024).toFixed(2) + ' MB',
    heapTotal: (usage.heapTotal / 1024 / 1024).toFixed(2) + ' MB',
    external: (usage.external / 1024 / 1024).toFixed(2) + ' MB',
    rss: (usage.rss / 1024 / 1024).toFixed(2) + ' MB',
  };
}

/**
 * Print memory usage
 */
export function printMemoryUsage() {
  const usage = getMemoryUsage();

  console.log('\n💾 Memory Usage\n');
  console.log('='.repeat(40));
  console.log(`  Heap Used:  ${usage.heapUsed}`);
  console.log(`  Heap Total: ${usage.heapTotal}`);
  console.log(`  External:   ${usage.external}`);
  console.log(`  RSS:        ${usage.rss}`);
  console.log('='.repeat(40) + '\n');
}

/**
 * Benchmark a function
 * @param {Function} fn - Function to benchmark
 * @param {number} iterations - Number of iterations
 * @returns {Promise<object>} Benchmark results
 */
export async function benchmark(fn, iterations = 100) {
  const monitor = new PerformanceMonitor();
  const results = [];

  // Warm-up
  await fn();

  // Benchmark
  for (let i = 0; i < iterations; i++) {
    monitor.start('benchmark');
    await fn();
    const duration = monitor.end('benchmark');
    results.push(duration);
  }

  const sorted = results.sort((a, b) => a - b);
  const sum = results.reduce((a, b) => a + b, 0);

  return {
    iterations,
    mean: sum / iterations,
    median: sorted[Math.floor(iterations / 2)],
    min: sorted[0],
    max: sorted[iterations - 1],
    p95: sorted[Math.floor(iterations * 0.95)],
    p99: sorted[Math.floor(iterations * 0.99)],
  };
}

/**
 * Wrapper to time async functions
 * @param {Function} fn - Async function
 * @param {string} name - Operation name
 * @returns {Promise<[result, duration]>}
 */
export async function timed(fn, name = 'operation') {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;

  console.log(`⏱️  ${name}: ${duration.toFixed(2)}ms`);

  return [result, duration];
}

/**
 * Create a monitored version of the mapper
 */
export function createMonitoredMapper(MapperClass) {
  return class MonitoredMapper extends MapperClass {
    constructor(...args) {
      super(...args);
      this.monitor = new PerformanceMonitor();
    }

    async loadAll() {
      this.monitor.start('loadAll');
      const result = await super.loadAll();
      const duration = this.monitor.end('loadAll');
      console.log(`📂 Loaded ${result} experiences in ${duration.toFixed(2)}ms`);
      return result;
    }

    async captureExperience(data) {
      this.monitor.start('capture');
      const result = await super.captureExperience(data);
      this.monitor.end('capture');
      return result;
    }

    async generateReport() {
      this.monitor.start('generateReport');
      const result = await super.generateReport();
      const duration = this.monitor.end('generateReport');
      console.log(`📊 Generated report in ${duration.toFixed(2)}ms`);
      return result;
    }

    getPerformanceStats() {
      return this.monitor.getAllStats();
    }

    printPerformanceStats() {
      this.monitor.printStats();
    }
  };
}

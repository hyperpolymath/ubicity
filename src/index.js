// SPDX-License-Identifier: PMPL-1.0-or-later
/**
 * UbiCity - Main module exports
 * Convenient entry point for all UbiCity functionality
 */

// Core classes
export { LearningExperience, UrbanKnowledgeMapper } from './mapper.js';
export { ExperienceStorage } from './storage.js';
export { CaptureSession } from './capture.js';

// Schemas and validation
export {
  schemas,
  validateExperience,
  safeValidateExperience,
  LearningExperienceSchema,
} from './schemas.js';

// Export utilities
export {
  exportToCSV,
  exportToGeoJSON,
  exportToDOT,
  exportJourneysToMarkdown,
  exportData,
} from './export.js';

// Privacy tools
export {
  anonymizeLearner,
  anonymizeLocation,
  removePII,
  fullyAnonymize,
  generateShareableDataset,
  exportAnonymousData,
} from './privacy.js';

// Performance monitoring
export {
  PerformanceMonitor,
  tracked,
  getMemoryUsage,
  printMemoryUsage,
  benchmark,
  timed,
  createMonitoredMapper,
} from './performance.js';

// Visualization
export { generateVisualization } from './visualize.js';

/**
 * Quick start helper
 * @returns {Promise<UrbanKnowledgeMapper>} Initialized and loaded mapper
 */
export async function createMapper(storageDir = './ubicity-data') {
  const { UrbanKnowledgeMapper } = await import('./mapper.js');
  const mapper = new UrbanKnowledgeMapper(storageDir);
  await mapper.initialize();
  await mapper.loadAll();
  return mapper;
}

/**
 * Quick capture helper
 * @param {string} mode - Capture mode (quick/full/template)
 * @returns {Promise<string|object>} Experience ID or template
 */
export async function quickCapture(mode = 'quick') {
  const { CaptureSession } = await import('./capture.js');
  const session = new CaptureSession(mode);
  return await session.capture();
}

/**
 * Quick visualization helper
 * @param {string} outputFile - Output file path
 * @returns {Promise<string>} Output file path
 */
export async function quickVisualize(outputFile = 'ubicity-map.html') {
  const { generateVisualization } = await import('./visualize.js');
  return await generateVisualization({ outputFile });
}

// Version
export const VERSION = '0.2.0';

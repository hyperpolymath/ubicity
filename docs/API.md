# UbiCity API Documentation

Complete reference for programmatic use of UbiCity.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Classes](#core-classes)
- [Schemas & Validation](#schemas--validation)
- [Storage](#storage)
- [Export](#export)
- [Privacy](#privacy)
- [Analysis](#analysis)
- [Performance](#performance)
- [Plugins](#plugins)
- [CLI](#cli)

## Installation

```bash
npm install
```

## Quick Start

```javascript
import { createMapper } from './src/index.js';

// Initialize mapper
const mapper = await createMapper();

// Capture an experience
const id = await mapper.captureExperience({
  learner: { id: 'my-id' },
  context: { location: { name: 'Local Library' } },
  experience: {
    type: 'reading',
    description: 'Learned about urban planning',
    domains: ['urban-planning', 'architecture'],
  },
});

// Analyze
const hotspots = mapper.findLearningHotspots();
console.log(`Found ${hotspots.length} learning hotspots`);
```

## Core Classes

### UrbanKnowledgeMapper

Main class for capturing and analyzing learning experiences.

#### Constructor

```javascript
import { UrbanKnowledgeMapper } from './src/mapper.js';

const mapper = new UrbanKnowledgeMapper(storageDir = './ubicity-data');
```

#### Methods

**`async initialize()`**
Initialize storage directories.

```javascript
await mapper.initialize();
```

**`async loadAll()`**
Load all experiences from storage.

```javascript
const count = await mapper.loadAll();
console.log(`Loaded ${count} experiences`);
```

**`async captureExperience(data)`**
Capture a new learning experience.

```javascript
const id = await mapper.captureExperience({
  learner: { id: 'alice' },
  context: { location: { name: 'Makerspace' } },
  experience: {
    type: 'experiment',
    description: 'Built LED circuit',
    domains: ['electronics', 'art'],
  },
});
```

**`findInterdisciplinaryConnections()`**
Find experiences spanning multiple domains.

```javascript
const connections = mapper.findInterdisciplinaryConnections();
connections.forEach(c => {
  console.log(`${c.description}: ${c.domains.join(', ')}`);
});
```

**`mapByLocation()`**
Aggregate experiences by location.

```javascript
const locationMap = mapper.mapByLocation();
Object.entries(locationMap).forEach(([name, data]) => {
  console.log(`${name}: ${data.count} experiences, ${data.diversity} diversity`);
});
```

**`getLearnerJourney(learnerId)`**
Get a learner's journey over time.

```javascript
const journey = mapper.getLearnerJourney('alice');
console.log(`${journey.experienceCount} experiences`);
console.log(`Domains: ${journey.domainEvolution.length} new domains discovered`);
```

**`generateDomainNetwork()`**
Generate domain co-occurrence network.

```javascript
const network = mapper.generateDomainNetwork();
console.log(`${network.nodes.length} domains, ${network.edges.length} connections`);
```

**`findLearningHotspots(minDiversity = 3)`**
Find locations with high disciplinary diversity.

```javascript
const hotspots = mapper.findLearningHotspots(3);
hotspots.forEach(h => {
  console.log(`${h.location}: ${h.diversity} domains`);
});
```

**`async generateReport()`**
Generate comprehensive analysis report.

```javascript
const report = await mapper.generateReport();
console.log(report.summary);
```

### LearningExperience

Represents a single learning experience with validation.

#### Constructor

```javascript
import { LearningExperience } from './src/mapper.js';

const exp = new LearningExperience({
  learner: { id: 'alice' },
  context: { location: { name: 'Library' } },
  experience: { type: 'reading', description: 'Learned X' },
});
```

#### Methods

**`generateId()`**
Generate unique ID (ubi-{uuid}).

**`validate()`**
Validate experience data (throws on error).

```javascript
try {
  exp.validate();
} catch (error) {
  console.error('Invalid:', error.message);
}
```

**`safeValidate()`**
Safe validation (returns { success, errors }).

```javascript
const result = exp.safeValidate();
if (!result.success) {
  console.error('Errors:', result.errors);
}
```

## Schemas & Validation

### validateExperience

Validate experience data (throws on error).

```javascript
import { validateExperience } from './src/schemas.js';

const data = {
  learner: { id: 'test' },
  context: { location: { name: 'Park' } },
  experience: { type: 'observation', description: 'Bird watching' },
};

try {
  const validated = validateExperience(data);
} catch (error) {
  console.error('Validation failed:', error.message);
}
```

### safeValidateExperience

Safe validation (returns result object).

```javascript
import { safeValidateExperience } from './src/schemas.js';

const result = safeValidateExperience(data);

if (result.success) {
  console.log('Valid:', result.data);
} else {
  console.error('Errors:', result.errors);
}
```

## Storage

### ExperienceStorage

Async file-based storage manager.

```javascript
import { ExperienceStorage } from './src/storage.js';

const storage = new ExperienceStorage('./ubicity-data');
```

#### Methods

**`async saveExperience(experience)`**

```javascript
const filepath = await storage.saveExperience(experienceData);
```

**`async loadExperience(id)`**

```javascript
const experience = await storage.loadExperience('ubi-123');
```

**`async loadAllExperiences()`**

```javascript
const all = await storage.loadAllExperiences();
```

**`async deleteExperience(id)`**

```javascript
const deleted = await storage.deleteExperience('ubi-123');
```

**`async saveReport(report, name?)`**

```javascript
const path = await storage.saveReport(reportData, 'monthly-report.json');
```

**`async getStats()`**

```javascript
const stats = await storage.getStats();
console.log(`${stats.totalExperiences} experiences, ${stats.totalSizeKB} KB`);
```

## Export

### exportToCSV

Export experiences to CSV format.

```javascript
import { exportToCSV } from './src/export.js';

const csv = exportToCSV(mapper);
await fs.writeFile('data.csv', csv);
```

### exportToGeoJSON

Export locations to GeoJSON format (for mapping tools).

```javascript
import { exportToGeoJSON } from './src/export.js';

const geojson = exportToGeoJSON(mapper);
await fs.writeFile('map.json', JSON.stringify(geojson, null, 2));
```

### exportToDOT

Export domain network to Graphviz DOT format.

```javascript
import { exportToDOT } from './src/export.js';

const dot = exportToDOT(mapper);
await fs.writeFile('network.dot', dot);
```

### exportJourneysToMarkdown

Export learner journeys to Markdown.

```javascript
import { exportJourneysToMarkdown } from './src/export.js';

const md = exportJourneysToMarkdown(mapper);
await fs.writeFile('journeys.md', md);
```

## Privacy

### anonymizeLearner

Anonymize learner data.

```javascript
import { anonymizeLearner } from './src/privacy.js';

const anonymized = anonymizeLearner(experience, {
  preserveIds: false,
  hashIds: true,
  removeName: true,
  removeInterests: false,
});
```

### anonymizeLocation

Anonymize location data.

```javascript
import { anonymizeLocation } from './src/privacy.js';

const anonymized = anonymizeLocation(experience, {
  fuzzyCoordinates: true,
  fuzzRadius: 0.01, // ~1km
  removeAddress: true,
});
```

### fullyAnonymize

Apply all anonymization techniques.

```javascript
import { fullyAnonymize } from './src/privacy.js';

const anonymized = fullyAnonymize(experience);
```

### generateShareableDataset

Generate shareable dataset with privacy controls.

```javascript
import { generateShareableDataset } from './src/privacy.js';

const dataset = await generateShareableDataset('./ubicity-data', {
  includePrivate: false,
  anonymizationLevel: 'full',
});
```

## Analysis

### TemporalAnalyzer

Analyze learning by time patterns.

```javascript
import { createAnalyzers } from './src/analysis.js';

const analyzers = createAnalyzers(mapper);

// Time of day
const timeDistribution = analyzers.temporal.analyzeByTimeOfDay();
console.log(`Morning: ${timeDistribution.morning.count} experiences`);

// Day of week
const weeklyDistribution = analyzers.temporal.analyzeByDayOfWeek();
console.log(`Monday: ${weeklyDistribution.Monday.count} experiences`);

// Learning streaks
const streaks = analyzers.temporal.detectStreaks(3);
console.log(`Found ${streaks.length} learning streaks`);
```

### CollaborativeNetworkAnalyzer

Analyze collaborative learning patterns.

```javascript
const network = analyzers.collaborative.buildCollaborationNetwork();
console.log(`${network.nodes.length} learners, ${network.edges.length} collaborations`);

const topCollaborators = analyzers.collaborative.findMostCollaborative(5);
```

### RecommendationEngine

Generate personalized recommendations.

```javascript
// Similar learners
const similar = analyzers.recommendations.recommendSimilarLearners('alice', 5);
similar.forEach(s => {
  console.log(`${s.learnerId}: ${s.similarity.toFixed(2)} similarity`);
});

// Locations
const locations = analyzers.recommendations.recommendLocations('alice', 5);
locations.forEach(l => {
  console.log(`${l.location}: ${l.relevance.toFixed(2)} relevance`);
});

// Domains
const domains = analyzers.recommendations.recommendDomains('alice', 5);
domains.forEach(d => {
  console.log(`${d.domain}: ${d.relevance} relevance`);
});
```

## Performance

### PerformanceMonitor

Track operation performance.

```javascript
import { PerformanceMonitor } from './src/performance.js';

const monitor = new PerformanceMonitor();

monitor.start('operation');
// ... do work ...
const duration = monitor.end('operation');

console.log(`Took ${duration.toFixed(2)}ms`);

// Get statistics
const stats = monitor.getStats('operation');
console.log(`Mean: ${stats.mean}ms, P95: ${stats.p95}ms`);
```

### benchmark

Benchmark a function.

```javascript
import { benchmark } from './src/performance.js';

const results = await benchmark(async () => {
  // Function to benchmark
  return await someOperation();
}, 100); // iterations

console.log(`Mean: ${results.mean}ms`);
```

## Plugins

### Creating a Plugin

```javascript
import { UbiCityPlugin } from './src/plugins.js';

class MyPlugin extends UbiCityPlugin {
  constructor() {
    super('my-plugin', '1.0.0');
  }

  async processExperience(experience) {
    // Modify experience before saving
    return experience;
  }

  async analyze(experiences) {
    // Custom analysis
    return { myMetric: 42 };
  }
}
```

### Using Plugins

```javascript
import { PluginManager } from './src/plugins.js';

const pluginManager = new PluginManager(mapper);

const myPlugin = new MyPlugin();
await pluginManager.register(myPlugin);

// Process experience through plugins
const processed = await pluginManager.processExperience(experienceData);

// Run analysis
const results = await pluginManager.analyze();
console.log(results['my-plugin']);
```

## CLI

Run commands from terminal:

```bash
# Generate report
node src/cli.js report

# Find hotspots
node src/cli.js hotspots 5

# Show learner journey
node src/cli.js learner alice

# Show domain network
node src/cli.js network

# Show statistics
node src/cli.js stats
```

Or use npm scripts:

```bash
npm run report
npm run hotspots
npm run stats
```

## Error Handling

Always wrap async operations in try/catch:

```javascript
try {
  const mapper = await createMapper();
  const id = await mapper.captureExperience(data);
} catch (error) {
  console.error('Error:', error.message);
}
```

## Best Practices

1. **Initialize before use**: Always call `await mapper.initialize()` and `await mapper.loadAll()`

2. **Validate early**: Use `safeValidateExperience()` for user input

3. **Handle errors**: Wrap async operations in try/catch

4. **Use plugins for extensibility**: Don't modify core code, create plugins

5. **Monitor performance**: Use `PerformanceMonitor` for bottlenecks

6. **Respect privacy**: Always anonymize before sharing data

7. **Export regularly**: Back up data using export utilities

## Examples

See `examples/api-usage.js` for complete working examples.

## TypeScript Support

TypeScript definitions coming in v0.3. For now, use JSDoc:

```javascript
/**
 * @typedef {import('./src/schemas.js').LearningExperienceSchema} Experience
 */
```

## Further Reading

- [GETTING_STARTED.md](../GETTING_STARTED.md) - Quick start guide
- [MINIMAL_VIABLE_PROTOCOL.md](../MINIMAL_VIABLE_PROTOCOL.md) - Core philosophy
- [MIGRATION.md](../MIGRATION.md) - Upgrade guide
- [CHANGELOG.md](../CHANGELOG.md) - Version history

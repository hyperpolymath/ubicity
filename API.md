# UbiCity API Reference

Developer documentation for the UbiCity ReScript modules.

## Overview

UbiCity is implemented in ReScript (compiles to JavaScript). All modules are in `src-rescript/` and compile to `*.res.js` files.

### Module Architecture

```
UbiCity.res        - Core domain types
├── Decoder.res    - JSON validation
├── Mapper.res     - Data indexing and queries
├── Analysis.res   - Pattern detection
├── Privacy.res    - Anonymization tools
├── Export.res     - Data export formats
├── Visualization.res - HTML generation
├── Capture.res    - CLI capture logic
└── CaptureCLI.res - CLI entry point
```

## Core Types (UbiCity.res)

### Coordinates
```rescript
type t = {
  latitude: float,
  longitude: float,
}

let make: (~latitude: float, ~longitude: float) => option<t>
let isValid: t => bool
```

### Location
```rescript
type t = {
  name: string,
  coordinates: option<Coordinates.t>,
  type_: option<string>,
  address: option<string>,
}

let make: (
  ~name: string,
  ~coordinates: option<Coordinates.t>=?,
  ~type_: option<string>=?,
  ~address: option<string>=?,
  unit,
) => result<t, string>
```

### Learner
```rescript
type t = {
  id: string,
  name: option<string>,
  interests: option<array<string>>,
}

let make: (
  ~id: string,
  ~name: option<string>=?,
  ~interests: option<array<string>>=?,
  unit,
) => result<t, string>
```

### LearningExperience
```rescript
type t = {
  id: string,
  timestamp: string,
  version: string,
  learner: Learner.t,
  context: Context.t,
  experience: ExperienceData.t,
  privacy: Privacy.t,
  tags: option<array<string>>,
}

let generateId: unit => string
let make: (
  ~id: option<string>=?,
  ~timestamp: option<string>=?,
  ~learner: Learner.t,
  ~context: Context.t,
  ~experience: ExperienceData.t,
  ~privacy: option<Privacy.t>=?,
  ~tags: option<array<string>>=?,
  ~version: option<string>=?,
  unit,
) => t
```

## Data Access (Mapper.res)

### Creating a Mapper
```javascript
import { make } from './src-rescript/Mapper.res.js';

const mapper = await make();
```

### Storing Experiences
```javascript
import { captureExperience } from './src-rescript/Mapper.res.js';

const result = await captureExperience(mapper, experience);
// Returns: Ok(experienceId) | Error(message)
```

### Querying
```javascript
// Get all experiences
const allExperiences = await loadAll(mapper);

// Get by location
const labExperiences = getByLocation(mapper, "Lab A");

// Get by domain
const roboticsExperiences = getByDomain(mapper, "robotics");

// Get by learner
const aliceExperiences = getByLearner(mapper, "alice-maker");

// Identify hotspots
const hotspots = identifyHotspots(mapper);
```

## Analysis (Analysis.res)

### Temporal Analysis
```javascript
import { TemporalAnalyzer } from './src-rescript/Analysis.res.js';

// Analyze by time of day
const byTime = TemporalAnalyzer.analyzeByTimeOfDay(experiences);
// Returns: { morning: 5, afternoon: 3, evening: 2, night: 1 }

// Analyze by day of week
const byDay = TemporalAnalyzer.analyzeByDayOfWeek(experiences);

// Detect learning streaks
const streaks = TemporalAnalyzer.detectStreaks(experiences, 7);
// Returns: [{ startDate, endDate, dayCount, experienceCount }]
```

### Network Analysis
```javascript
import { CollaborativeNetworkAnalyzer } from './src-rescript/Analysis.res.js';

const network = CollaborativeNetworkAnalyzer.buildCollaborationNetwork(experiences);
// Returns: { nodes: [{id, size}], edges: [{source, target, weight}] }
```

### Recommendations
```javascript
import { RecommendationEngine } from './src-rescript/Analysis.res.js';

// Similar learners
const similar = RecommendationEngine.recommendSimilarLearners(
  experiences,
  "alice-maker",
  5 // top 5
);

// Recommended locations
const locations = RecommendationEngine.recommendLocations(
  experiences,
  "alice-maker",
  5
);

// Recommended domains
const domains = RecommendationEngine.recommendDomains(
  experiences,
  "alice-maker",
  5
);
```

## Privacy (Privacy.res)

### Anonymization
```javascript
import { 
  anonymizeLearner, 
  anonymizeLocation,
  fullyAnonymize 
} from './src-rescript/Privacy.res.js';

// Anonymize learner ID
const anon = anonymizeLearner(experience, { 
  hashId: true, 
  removeInterests: true 
});

// Anonymize location (GPS fuzzing)
const anonLocation = anonymizeLocation(experience, { 
  fuzzCoordinates: true, 
  removeAddress: true 
});

// Full anonymization
const fully = fullyAnonymize(experience);
```

### PII Removal
```javascript
import { removePII, sanitizeText } from './src-rescript/Privacy.res.js';

// Remove emails, phone numbers, URLs from text
const cleaned = sanitizeText("Contact me at alice@example.com or 555-1234");
// Returns: "Contact me at [EMAIL] or [PHONE]"

// Remove PII from entire experience
const cleaned = removePII(experience);
```

### Shareable Datasets
```javascript
import { generateShareableDataset } from './src-rescript/Privacy.res.js';

const dataset = generateShareableDataset(experiences, {
  anonymizeLearners: true,
  anonymizeLocations: true,
  removePII: true,
  includePrivate: false,
});
```

## Export (Export.res)

### CSV Export
```javascript
import { exportToCSV } from './src-rescript/Export.res.js';

const csv = exportToCSV(experiences);
// Returns CSV string with proper escaping
```

### GeoJSON Export
```javascript
import { exportToGeoJSON } from './src-rescript/Export.res.js';

const geojson = exportToGeoJSON(experiences);
// Returns RFC 7946 compliant GeoJSON FeatureCollection
```

### DOT/Graphviz Export
```javascript
import { exportToDOT } from './src-rescript/Export.res.js';

const network = { nodes: [...], edges: [...] };
const dot = exportToDOT(network);
// Returns: "digraph G { ... }"
// Visualize with: dot -Tpng domains.dot -o domains.png
```

### Markdown Export
```javascript
import { exportJourneysToMarkdown } from './src-rescript/Export.res.js';

const markdown = exportJourneysToMarkdown(experiences);
// Returns learner journey timelines in Markdown format
```

### Universal Export
```javascript
import { exportData } from './src-rescript/Export.res.js';

// Auto-routes to appropriate exporter
const data = exportData(experiences, "csv");
const data = exportData(experiences, "geojson");
const data = exportData(experiences, "dot", network);
const data = exportData(experiences, "markdown");
const data = exportData(experiences, "json");
```

## Visualization (Visualization.res)

### HTML Generation
```javascript
import { generateHTML } from './src-rescript/Visualization.res.js';

const html = generateHTML(
  summary,        // { totalExperiences, uniqueLocations, ... }
  hotspots,       // [{ location, count, learners, diversity, domains }]
  network,        // { nodes, edges }
  coordsCount     // number of locations with GPS
);
// Returns complete HTML document with CSS and JavaScript
```

## JSON Decoding (Decoder.res)

### Decode Experiences
```javascript
import { decodeExperiences } from './src-rescript/Decoder.res.js';

const rawData = JSON.parse(fs.readFileSync('data.json', 'utf-8'));
const result = decodeExperiences(rawData);

if (result.TAG === "Ok") {
  const experiences = result._0;
  // Use validated experiences
} else {
  console.error("Validation errors:", result._0);
}
```

### Legacy Format Support
The decoder handles legacy JSON formats:
- `lat`/`lon` → `latitude`/`longitude`
- Missing `id`/`timestamp`/`version` (auto-generated)
- String variants → ReScript polymorphic variants

## Error Handling

All validation functions return ReScript `Result` types:

```javascript
// Result type in compiled JS:
// Ok: { TAG: "Ok", _0: value }
// Error: { TAG: "Error", _0: errorMessage }

const result = Location.make("Lab A");
if (result.TAG === "Ok") {
  const location = result._0;
  // Success
} else {
  const error = result._0;
  // Handle error
}
```

## Type Safety

UbiCity is written in ReScript for type safety. The compiled JavaScript includes runtime checks. Types are validated at:
1. **Compile time** (ReScript type checker)
2. **Runtime** (Decoder module for JSON)
3. **API boundaries** (validation on user input)

## Examples

See `examples/` directory:
- `populate-examples.js` - Sample data generation
- `api-usage.js` - API usage patterns

## Development

### Compile ReScript
```bash
npm run res:build
```

### Watch Mode
```bash
npm run res:dev
```

### Tests
```bash
npm test                # Unit tests
npm run test:integration # Integration tests
npm run test:all         # Both
```

---

**UbiCity v1.0.0 API Reference**

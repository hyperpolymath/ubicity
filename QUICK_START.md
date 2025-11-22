# UbiCity Quick Start Guide

Get started with UbiCity in 5 minutes.

## Installation

```bash
# Clone the repository
git clone https://github.com/Hyperpolymath/ubicity.git
cd ubicity

# Install dependencies
npm install

# Run tests to verify installation
npm test
```

## Your First Experience

### Capture an experience (30 seconds)

```bash
npm run capture:quick
```

Answer the prompts:
- **Learner ID**: your-pseudonym
- **Location**: Local Coffee Shop
- **Type**: reading
- **Description**: Learned about urban planning
- **Domains** (optional): urban-planning, architecture

Done! Your first experience is captured.

### View your data

```bash
npm run stats
```

### Generate visualization

```bash
npm run visualize
```

Open `ubicity-data/ubicity-map.html` in your browser.

## Common Commands

```bash
# Capture (quick mode)
npm run capture:quick

# Capture (with full details)
npm run capture:full

# Generate analysis report
npm run report

# Find learning hotspots
npm run hotspots

# Generate visualization
npm run visualize

# Show storage stats
npm run stats

# Populate example data
npm run populate

# Run API examples
npm run examples
```

## Export Your Data

### To CSV (for Excel/Google Sheets)

```bash
node -e "import('./src/export.js').then(m => m.exportData('csv', 'data.csv'))"
```

### To GeoJSON (for mapping tools)

```bash
node -e "import('./src/export.js').then(m => m.exportData('geojson', 'map.json'))"
```

### To Markdown (readable journeys)

```bash
node -e "import('./src/export.js').then(m => m.exportData('markdown', 'journeys.md'))"
```

## Programmatic Usage

```javascript
import { createMapper } from './src/index.js';

// Create and initialize
const mapper = await createMapper();

// Capture an experience
await mapper.captureExperience({
  learner: { id: 'alice' },
  context: { location: { name: 'Makerspace' } },
  experience: {
    type: 'experiment',
    description: 'Built LED circuit',
    domains: ['electronics', 'art']
  }
});

// Analyze
const hotspots = mapper.findLearningHotspots();
console.log(`Found ${hotspots.length} hotspots`);
```

## The 4-Week Experiment

Want to test if UbiCity works for you?

### Week 1: Capture
Capture 5+ learning experiences in different locations.

### Week 2: Analyze
Run `npm run report` and look for patterns.

### Week 3: Decide
Found 1+ meaningful connection? Keep going.
Add a collaborator or stop.

### Week 4: Reflect
Meet, discuss, capture that collaboration.

**Success = 1 unexpected insight + 1 new question**

If yes: UbiCity works for you. Keep using it.
If no: That's okay. At least you know.

## Next Steps

- **Full tutorial**: See `GETTING_STARTED.md`
- **API reference**: See `docs/API.md`
- **Philosophy**: Read `MINIMAL_VIABLE_PROTOCOL.md`
- **Examples**: Run `npm run examples`

## Troubleshooting

### Tests failing?
```bash
npm install  # Reinstall dependencies
npm test     # Should see 23 passing
```

### Can't find Node.js?
Need Node.js v18+ installed.
Check: `node --version`

### Old data not working?
```bash
npm run migrate:check  # Check compatibility
npm run migrate:fix    # Fix issues (makes backup)
```

### Need help?
- Check `MIGRATION.md` for upgrade guide
- Read `docs/API.md` for API reference
- Open an issue on GitHub

## Philosophy in 3 Sentences

1. Learning happens everywhere - capture it.
2. Analyze patterns to find unexpected connections.
3. Let data guide next steps, not grand plans.

That's it. Start capturing.

---

**Ready?**
```bash
npm run capture:quick
```

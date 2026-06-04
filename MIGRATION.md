<!--
SPDX-License-Identifier: MPL-2.0
Copyright (c) Jonathan D.A. Jewell <j.d.a.jewell@open.ac.uk>
-->
# Migration Guide: v0.1 to v0.2

This guide helps you migrate from the original CommonJS codebase to the modern ESM version.

## TL;DR

**For New Users**: Just use v0.2. Skip this document.

**For Existing Users**: Your data is compatible. Update your scripts to use ESM imports and new CLI.

## Breaking Changes

### 1. Module System: CommonJS → ESM

**Before (v0.1)**:
```javascript
const { UrbanKnowledgeMapper } = require('./mapper.js');
```

**After (v0.2)**:
```javascript
import { UrbanKnowledgeMapper } from './mapper.js';
```

**Action Required**: If you have custom scripts using UbiCity modules, update them to use ESM imports.

### 2. Async API

**Before (v0.1)**:
```javascript
const mapper = new UrbanKnowledgeMapper();
mapper.loadAll(); // Synchronous
const report = mapper.generateReport(); // Synchronous
```

**After (v0.2)**:
```javascript
const mapper = new UrbanKnowledgeMapper();
await mapper.initialize();
await mapper.loadAll(); // Now async
const report = await mapper.generateReport(); // Now async
```

**Action Required**: Add `async`/`await` to your code. Wrap in async functions or use `.then()`.

### 3. CLI Commands

**Before (v0.1)**:
```bash
node mapper.js report
node capture.js
node visualize.js
```

**After (v0.2)**:
```bash
node src/cli.js report  # Or: npx ubicity report
node src/capture.js
node src/visualize.js   # (still works, enhanced version coming)
```

**Action Required**: Update shell scripts and documentation to use new paths.

### 4. File Locations

**Before (v0.1)**:
```
ubicity/
├── mapper.js
├── capture.js
├── visualize.js
└── ubicity-data/
```

**After (v0.2)**:
```
ubicity/
├── src/
│   ├── mapper.js
│   ├── capture.js
│   ├── cli.js
│   ├── schemas.js
│   ├── storage.js
│   ├── export.js
│   └── privacy.js
├── tests/
└── ubicity-data/
```

**Action Required**: Update import paths in custom code.

## Data Compatibility

**Good news**: Your existing data is 100% compatible!

The v0.2 JSON schema is a superset of v0.1. All existing experience files work without modification.

**Verification**:
```bash
# Load old data with new code
node src/cli.js stats

# Should show: Total Experiences: [your count]
```

If you see errors, the new validation caught data quality issues. Use the migration helper (see below).

## Migration Helper Script

We provide a script to validate and optionally fix your existing data:

```bash
node scripts/migrate-data.js --check       # Check only (dry run)
node scripts/migrate-data.js --fix         # Fix issues
node scripts/migrate-data.js --backup      # Backup first, then fix
```

Common fixes:
- Add missing timestamps
- Normalize coordinate formats
- Add version field
- Validate against Zod schema

## Feature Mapping

| v0.1 Feature | v0.2 Equivalent | Notes |
|--------------|-----------------|-------|
| `mapper.js report` | `src/cli.js report` | Enhanced output |
| `mapper.js hotspots` | `src/cli.js hotspots` | Same functionality |
| `mapper.js network` | `src/cli.js network` | Same functionality |
| `mapper.js learner <id>` | `src/cli.js learner <id>` | Enhanced journey view |
| N/A | `src/cli.js stats` | **New**: Storage statistics |
| `capture.js` | `src/capture.js` | Same UX, better validation |
| N/A | `src/export.js` | **New**: CSV, GeoJSON, DOT, Markdown |
| N/A | `src/privacy.js` | **New**: Anonymization tools |

## New Features in v0.2

### 1. Data Export

```bash
# Export to CSV
node -e "import('./src/export.js').then(m => m.exportData('csv', 'data.csv'))"

# Export to GeoJSON (for mapping tools)
node -e "import('./src/export.js').then(m => m.exportData('geojson', 'map.json'))"

# Export to Markdown (readable journeys)
node -e "import('./src/export.js').then(m => m.exportData('markdown', 'journeys.md'))"
```

### 2. Privacy & Anonymization

```javascript
import { fullyAnonymize, exportAnonymousData } from './src/privacy.js';

// Anonymize single experience
const anonymized = fullyAnonymize(experience);

// Export shareable dataset
await exportAnonymousData('./ubicity-data', 'public-dataset.json', {
  includePrivate: false,
  anonymizationLevel: 'full'
});
```

### 3. Runtime Validation

```javascript
import { validateExperience, safeValidateExperience } from './src/schemas.js';

// Throws on invalid data
validateExperience(data);

// Returns { success, errors } for graceful handling
const result = safeValidateExperience(data);
if (!result.success) {
  console.error('Validation errors:', result.errors);
}
```

### 4. Tests

```bash
npm test              # Run all tests
npm test -- --watch   # Watch mode
```

## Rollback Plan

If v0.2 doesn't work for you:

### Option 1: Keep Using v0.1

The old code still exists in this repo:
```bash
# Use original files in project root
node mapper.js report
node capture.js
node visualize.js
```

### Option 2: Revert to Original Branch

```bash
git checkout claude/ubicity-learning-setup-01H8249ctY6CW1u58MdFWLbB
# Or: git clone the zotero-voyant-export repo
```

### Option 3: Use Both

Keep both versions:
```bash
# Old version
node mapper.js report

# New version
node src/cli.js report
```

They share the same `ubicity-data/` directory!

## Migration Checklist

- [ ] Read this guide
- [ ] Backup your `ubicity-data/` directory
- [ ] Install dependencies: `npm install`
- [ ] Run tests: `npm test`
- [ ] Verify data loads: `node src/cli.js stats`
- [ ] Test old workflows with new CLI
- [ ] Update custom scripts to use ESM
- [ ] Update documentation/README references
- [ ] Try new export features
- [ ] (Optional) Run linter: `npm run lint`
- [ ] (Optional) Format code: `npm run format`

## Gradual Migration Strategy

You don't have to migrate everything at once:

**Week 1**: Install v0.2, verify data compatibility
**Week 2**: Start using new CLI for analysis
**Week 3**: Update capture workflow (if you have custom scripts)
**Week 4**: Migrate custom analysis code to ESM
**Week 5**: Delete old CommonJS files (if confident)

## Getting Help

**Issues**: Open a GitHub issue with "migration" tag
**Questions**: Check `GETTING_STARTED.md` for v0.2 usage
**Rollback**: See "Rollback Plan" section above

## Philosophy Preserved

Despite the technical changes, UbiCity v0.2 still respects:

- ✅ Minimal Viable Protocol (WHO/WHERE/WHAT)
- ✅ Tools not platforms
- ✅ Data first, infrastructure later
- ✅ File-based storage (no database)
- ✅ CLI-first (no mandatory web interface)
- ✅ Zero bloat (only Zod dependency)
- ✅ Constraint mechanisms (pause points, 4-week experiment)

The modernization improves **quality** without compromising **philosophy**.

## What's Next?

See `CHANGELOG.md` for upcoming features in v0.3:

- Enhanced interactive visualization
- Performance monitoring
- Batch import tools
- Plugin system for custom analyzers

But remember: **You don't need any of this to start capturing learning experiences.**

The core remains simple. Everything else is optional.

---

**Questions? Something broken?**
File an issue: https://github.com/Hyperpolymath/ubicity/issues

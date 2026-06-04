<!--
SPDX-License-Identifier: MPL-2.0
Copyright (c) Jonathan D.A. Jewell <j.d.a.jewell@open.ac.uk>
-->
# UbiCity Stack Analysis & Issues

## Current Stack

### Runtime & Module System
- **Runtime**: Node.js v22.21.1
- **Module System**: CommonJS (`require()`)
- **Package Manager**: npm (though no dependencies currently)
- **Language**: Plain JavaScript (no TypeScript)

### Dependencies
**Zero external dependencies** - Only uses Node.js standard library:
- `fs` - File system operations
- `path` - Path manipulation
- `crypto` - UUID generation (crypto.randomUUID())
- `readline` - Interactive CLI input

### File Structure
```
ubicity/
├── capture.js           (CLI tool - CommonJS)
├── mapper.js            (Analysis engine - CommonJS)
├── visualize.js         (HTML generator - CommonJS)
├── examples/
│   └── populate-examples.js
├── schema/
│   └── learning-experience.json
└── ubicity-data/        (Generated data)
```

---

## Issues & Concerns

### 🔴 Critical Issues

#### 1. **CommonJS vs ESM**
- Used legacy `require()` instead of modern `import`
- Node.js is moving towards ESM as default
- Harder to use in modern toolchains
- No tree-shaking or static analysis benefits

**Impact**: Technical debt, harder to integrate with modern tools

#### 2. **No Deno Support**
- You likely prefer Deno based on your question
- Deno offers:
  - TypeScript by default
  - Secure by default (explicit permissions)
  - No node_modules
  - Built-in formatter/linter/test runner
  - Better dependency management (URLs not npm)
  - Modern standard library

**Impact**: Missing better DX and security model

#### 3. **No Input Validation**
- Schema exists but no runtime validation
- Relies on try/catch rather than proper validation
- Could accept malformed data

**Impact**: Data quality issues, harder debugging

#### 4. **No Tests**
- Zero test coverage
- Examples exist but no automated tests
- Hard to refactor safely

**Impact**: Fragile codebase, harder to maintain

### 🟡 Medium Issues

#### 5. **No TypeScript**
- Plain JavaScript means no type safety
- Schema exists as JSON but not as types
- Runtime errors instead of compile-time checks

**Impact**: More bugs, worse IDE support

#### 6. **Synchronous File Operations**
- Uses `fs.writeFileSync`, `fs.readFileSync`
- Blocks the event loop
- Fine for CLI but not scalable

**Impact**: Performance ceiling if data grows

#### 7. **No CLI Framework**
- Hand-rolled argument parsing
- No help text generation
- No command composition

**Impact**: Poor UX, harder to extend

#### 8. **No Schema Validation Library**
- JSON Schema defined but never used for validation
- Should use Zod, AJV, or similar

**Impact**: Runtime errors instead of helpful validation messages

#### 9. **Hard-coded Paths**
- `./ubicity-data` is hard-coded
- No configuration file support
- Can't easily point to different data dirs

**Impact**: Inflexible for different use cases

#### 10. **No Data Migration Strategy**
- Schema will evolve but no migration plan
- Breaking changes will orphan old data

**Impact**: Future compatibility issues

### 🟢 Minor Issues

#### 11. **No Logging Framework**
- Uses console.log/console.error
- No log levels, no structured logging
- Hard to debug in production

#### 12. **No Privacy Controls Implemented**
- Schema has privacy_level field
- But no code enforces it or filters exports

#### 13. **No Data Export Formats**
- Mentions Voyant export but not implemented
- No CSV, no GeoJSON, no standardized formats

#### 14. **Visualization is Static HTML**
- No interactive map
- No real-time updates
- Can't filter/search in UI

#### 15. **No Date Handling Library**
- Uses native Date which is notoriously problematic
- No timezone handling

---

## Recommended Stack (If Refactoring)

### Option A: Modern Node.js + ESM

```typescript
// Modern Node.js with TypeScript
import { readFile, writeFile } from 'node:fs/promises';
import { z } from 'zod'; // Runtime validation
import { Command } from 'commander'; // CLI framework

// Schema as TypeScript type + Zod validator
const LearningExperienceSchema = z.object({
  learner: z.object({ id: z.string() }),
  context: z.object({
    location: z.object({ name: z.string() })
  }),
  experience: z.object({
    type: z.enum(['observation', 'experiment', ...]),
    description: z.string()
  })
});

type LearningExperience = z.infer<typeof LearningExperienceSchema>;
```

**Pros**: Incremental migration path, familiar ecosystem
**Cons**: Still Node.js quirks, still need npm

### Option B: Deno + TypeScript (Recommended)

```typescript
// Deno with TypeScript
import { z } from "https://deno.land/x/zod/mod.ts";
import { parse } from "https://deno.land/std/flags/mod.ts";

// Built-in permissions
await Deno.writeTextFile("./data.json", json, {
  create: true
}); // Fails without --allow-write

// Built-in formatter, linter, test runner
// deno fmt, deno lint, deno test

// No node_modules, dependencies from URLs
```

**Pros**:
- TypeScript native
- Better security model
- Modern standard library
- No build step needed
- Built-in tooling

**Cons**:
- Different from existing zotero-voyant-export code
- Smaller ecosystem than npm
- Learning curve if unfamiliar

### Option C: Rust + CLI Framework

```rust
// For maximum performance and type safety
use serde::{Deserialize, Serialize};
use clap::Parser;

#[derive(Serialize, Deserialize)]
struct LearningExperience {
    learner: Learner,
    context: Context,
    experience: Experience,
}
```

**Pros**:
- Blazingly fast
- Compile-time guarantees
- Single binary distribution
- Memory safe

**Cons**:
- Much higher complexity
- Slower development
- Overkill for this use case

---

## Migration Paths

### Path 1: Quick Fixes (1-2 hours)
1. Add input validation with Zod
2. Add tests with built-in test runner
3. Convert to ESM (change require → import)
4. Add CLI help text

**Result**: Better but still Node.js

### Path 2: Deno Migration (4-6 hours)
1. Create `deno.json` config
2. Convert all files to Deno imports
3. Add TypeScript types
4. Use Deno standard library
5. Add permissions flags

**Result**: Modern, secure, TypeScript

### Path 3: Hybrid Approach (2-3 hours)
1. Keep core mapper in Node.js (matches existing repo)
2. Add Deno wrapper scripts for new features
3. Use FFI or JSON pipe for communication

**Result**: Best of both worlds, incremental

---

## What I'd Recommend

Given your concerns and the project goals:

### Immediate (Do Now):
1. **Convert to ESM** - Use `import` not `require`
2. **Add Zod validation** - Enforce schema at runtime
3. **Add basic tests** - At least smoke tests

### Short-term (This Week):
4. **Port to Deno** - Better DX, matches your style
5. **Add TypeScript** - Type safety for the schema
6. **Add CLI framework** - Better UX

### Long-term (When Needed):
7. **Add data migrations** - Handle schema evolution
8. **Add proper export formats** - GeoJSON, CSV, etc.
9. **Build interactive viz** - Use Observable or similar

---

## The Pragmatic Question

**Do you want me to:**

**A)** Migrate everything to Deno + TypeScript now?

**B)** Quick fixes to the Node.js version (ESM + validation)?

**C)** Create a parallel Deno implementation you can compare?

**D)** Document the issues but leave as-is (working prototype)?

The current version **works** but has technical debt. Given that UbiCity is about starting quickly and iterating, option D might align best with the Minimal Viable Protocol philosophy - use it, see if it works for you, then invest in better infrastructure only if needed.

But if you have strong preferences (especially Deno), I should migrate now before you build habits around the Node.js version.

**What's your preference?**

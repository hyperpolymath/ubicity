<!--
SPDX-License-Identifier: MPL-2.0
Copyright (c) Jonathan D.A. Jewell <j.d.a.jewell@open.ac.uk>
-->
# Deno Migration Preview

## Side-by-Side Comparison

### Current Node.js Version

```javascript
// mapper.js (CommonJS)
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class LearningExperience {
  constructor(data) {
    this.data = data;
    if (!this.data.id) {
      this.data.id = this.generateId();
    }
  }

  generateId() {
    const uuid = crypto.randomUUID();
    return `ubi-${uuid}`;
  }

  validate() {
    const required = ['id', 'timestamp', 'learner', 'context', 'experience'];
    for (const field of required) {
      if (!this.data[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    return true;
  }
}
```

**Issues:**
- No type safety
- Manual validation (error-prone)
- CommonJS (legacy)
- No compile-time checks

### Deno + TypeScript Version

```typescript
// mapper.ts (Deno + TypeScript)
import { z } from "https://deno.land/x/zod/mod.ts";
import { join } from "https://deno.land/std/path/mod.ts";

// Schema with runtime validation
const LearningExperienceSchema = z.object({
  id: z.string().regex(/^ubi-[0-9a-f-]+$/),
  timestamp: z.string().datetime(),
  learner: z.object({
    id: z.string().min(1),
    background: z.array(z.string()).optional(),
    interests: z.array(z.string()).optional(),
  }),
  context: z.object({
    location: z.object({
      name: z.string().min(1),
      type: z.enum([
        "public_space", "institution", "cafe",
        "library", "park", "other"
      ]).optional(),
      coordinates: z.object({
        lat: z.number().min(-90).max(90),
        lon: z.number().min(-180).max(180),
      }).optional(),
    }),
    situation: z.string().optional(),
  }),
  experience: z.object({
    type: z.enum([
      "observation", "experiment", "failure",
      "discovery", "collaboration", "insight",
      "question", "practice", "reflection"
    ]),
    description: z.string().min(1),
    domains: z.array(z.string()).optional(),
  }),
  metadata: z.object({
    tags: z.array(z.string()).optional(),
    privacy_level: z.enum(["public", "community", "private"]).optional(),
  }).optional(),
});

// Type inference from schema
type LearningExperience = z.infer<typeof LearningExperienceSchema>;

class LearningExperienceManager {
  private data: LearningExperience;

  constructor(data: unknown) {
    // Automatic validation with helpful error messages
    this.data = LearningExperienceSchema.parse(data);

    if (!this.data.id) {
      this.data.id = this.generateId();
    }
    if (!this.data.timestamp) {
      this.data.timestamp = new Date().toISOString();
    }
  }

  private generateId(): string {
    return `ubi-${crypto.randomUUID()}`;
  }

  toJSON(): LearningExperience {
    return this.data;
  }
}
```

**Benefits:**
- Full type safety (compile-time errors)
- Automatic runtime validation
- Helpful error messages
- Modern ESM
- IDE autocomplete
- Refactor-safe

---

## CLI Tool Comparison

### Current Node.js

```javascript
// capture.js
const readline = require('readline');

// Manual argument parsing
const mode = process.argv[2] || 'full';

switch (mode) {
  case 'quick':
    // ...
    break;
  default:
    // ...
}

// No help text, no validation
```

**Run:** `node capture.js quick`

### Deno Version

```typescript
// capture.ts
import { parse } from "https://deno.land/std/flags/mod.ts";
import { Input, Select } from "https://deno.land/x/cliffy/mod.ts";

// Typed CLI args
interface CaptureArgs {
  mode: "quick" | "full" | "template";
  help?: boolean;
}

const args = parse(Deno.args, {
  boolean: ["help"],
  string: ["mode"],
  default: { mode: "full" },
  alias: { h: "help", m: "mode" },
}) as CaptureArgs;

if (args.help) {
  console.log(`
UbiCity Capture Tool

Usage:
  deno run --allow-read --allow-write capture.ts [options]

Options:
  -m, --mode <mode>    Capture mode: quick, full, template
  -h, --help           Show this help

Examples:
  deno run --allow-read --allow-write capture.ts -m quick
  deno run --allow-read --allow-write capture.ts
  `);
  Deno.exit(0);
}

// Better prompts with validation
const learnerId = await Input.prompt({
  message: "Your learner ID:",
  validate: (value) => value.length > 0 || "ID required",
});

const locationType = await Select.prompt({
  message: "Location type:",
  options: [
    "public_space",
    "institution",
    "cafe",
    "library",
    "park",
    "other",
  ],
});
```

**Run:** `deno run --allow-read --allow-write capture.ts --mode quick`

**Benefits:**
- Explicit permissions (--allow-read, --allow-write)
- Auto-generated help text
- Better prompts with validation
- Type-safe arguments

---

## File Operations Comparison

### Current Node.js (Sync)

```javascript
// Blocks event loop
fs.writeFileSync(filepath, JSON.stringify(data, null, 2));

const files = fs.readdirSync(experiencesDir);
files.forEach(file => {
  const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  // ...
});
```

**Issues:**
- Synchronous (blocks)
- No error handling
- Full filesystem access

### Deno Version (Async)

```typescript
// Non-blocking
await Deno.writeTextFile(
  filepath,
  JSON.stringify(data, null, 2),
  { create: true }  // Explicit creation flag
);

// Parallel reads with proper error handling
const files = [];
for await (const entry of Deno.readDir(experiencesDir)) {
  if (entry.isFile && entry.name.endsWith('.json')) {
    files.push(entry.name);
  }
}

// Load all in parallel
const experiences = await Promise.all(
  files.map(async (file) => {
    const text = await Deno.readTextFile(join(experiencesDir, file));
    return JSON.parse(text);
  })
);
```

**Benefits:**
- Non-blocking
- Must request permissions
- Parallel operations
- Better error handling

---

## Testing Comparison

### Current Node.js
```javascript
// No tests!
```

### Deno Version

```typescript
// capture_test.ts
import { assertEquals, assertRejects } from "https://deno.land/std/assert/mod.ts";
import { LearningExperienceManager } from "./mapper.ts";

Deno.test("LearningExperience - valid data", () => {
  const data = {
    learner: { id: "test-user" },
    context: { location: { name: "Test Location" } },
    experience: {
      type: "observation" as const,
      description: "Test description",
    },
  };

  const exp = new LearningExperienceManager(data);
  assertEquals(exp.toJSON().learner.id, "test-user");
});

Deno.test("LearningExperience - invalid data", () => {
  const data = { invalid: "data" };

  assertRejects(
    () => Promise.resolve(new LearningExperienceManager(data)),
    Error,
    "learner"
  );
});
```

**Run:** `deno test`

**Built-in:**
- Test runner
- Assertions
- Coverage reports
- No dependencies needed

---

## What Changes for Users

### Node.js Version
```bash
cd ubicity
node capture.js quick
node mapper.js report
node visualize.js
```

### Deno Version
```bash
cd ubicity

# First run (downloads deps)
deno run --allow-read --allow-write capture.ts --mode quick

# Permissions are explicit and visible
deno run --allow-read --allow-write mapper.ts report
deno run --allow-read --allow-write visualize.ts

# Or create task shortcuts in deno.json
deno task capture:quick
deno task report
deno task visualize
```

**Better security:**
- See exactly what permissions are needed
- Can deny permissions and tool fails gracefully
- No accidental network access or file operations

---

## Migration Effort

### Time Estimate: 4-6 hours

**Step 1: Setup (30 min)**
- Create `deno.json` config
- Define import map
- Set up tasks

**Step 2: Convert mapper.js → mapper.ts (2 hours)**
- Add TypeScript types
- Implement Zod schema
- Convert to async/await
- Add tests

**Step 3: Convert capture.js → capture.ts (1.5 hours)**
- Add Cliffy for CLI
- Type arguments
- Better prompts

**Step 4: Convert visualize.js → visualize.ts (1 hour)**
- Add types
- Async operations
- Better error handling

**Step 5: Update docs (1 hour)**
- New installation instructions
- New usage examples
- Permission explanations

---

## Recommendation

**If you plan to use UbiCity seriously**, migrate to Deno.

**If this is a quick experiment**, the Node.js version works fine.

The Node.js version captures the essence - it **works**. But it has technical debt that will slow you down as the project evolves.

Given your background (formal methods, Rust experience implied by your interests), you'd likely appreciate Deno's:
- Type safety
- Explicit permissions
- Better tooling
- No magic

**Shall I migrate it to Deno?** I can do it now while the codebase is small, or create a parallel implementation so you can compare.

# UbiCity Learning Capture System - Claude Context

## Project Overview

**UbiCity** is a learning capture system that grounds an expansive vision about urban learning with practical tools. It captures the **WHO/WHERE/WHAT** of learning experiences that happen outside formal institutions, then analyzes patterns through mapping and visualization.

**Core Philosophy**: Start with data capture, not infrastructure. Tools not platforms. Data before systems.

### What Problem Does This Solve?

Learning happens everywhere—in makerspaces, community gardens, informal mentorships, failed experiments. Traditional education systems don't capture this. UbiCity provides minimal viable tools to:

1. **Capture** learning experiences as they happen (quick CLI tool)
2. **Analyze** patterns (mapper identifies hotspots, networks, journeys)
3. **Visualize** insights (static HTML reports, no server needed)
4. **Validate** the concept before building infrastructure

### Key Concepts

- **Minimal Viable Protocol**: Only capture WHO (learner), WHERE (location), WHAT (experience type + description). Everything else is optional. This constraint prevents scope creep.
- **Tools not Platforms**: Simple command-line tools that work offline, no accounts, no servers
- **Data First**: Collect real experiences before building complex systems
- **Constraint Mechanism**: User has "hyperkinetic thinking" - projects expand without completion. UbiCity uses explicit pause points and MVP framework to combat this.

## Project Structure

### Current Implementation (Working Prototype)

**Note**: Original code lives in `Hyperpolymath/zotero-voyant-export` repo, branch `claude/ubicity-learning-setup-01H8249ctY6CW1u58MdFWLbB` under the `ubicity/` folder. This repo (`Hyperpolymath/ubicity`) may be the future home.

```
ubicity/
├── schema/
│   └── learning-experience.json    # JSON schema (minimal: learner.id, context.location, experience)
├── capture.js                      # CLI for capturing experiences (quick/full/template modes)
├── mapper.js                       # Analysis: hotspots, domain networks, learner journeys, connections
├── visualize.js                    # Generates static HTML visualization report
├── examples/
│   └── populate-examples.js        # 8 realistic scenarios (alex-maker's journey, etc.)
└── docs/
    ├── README.md                   # Project intro
    ├── GETTING_STARTED.md          # Quick start guide
    └── MINIMAL_VIABLE_PROTOCOL.md  # 4-week experiment framework (CRITICAL FILE)
```

### Test Data

The `examples/populate-examples.js` shows realistic scenarios:
- **alex-maker**: Failed robot project → insight at makerspace → success
- **Interdisciplinary patterns**: Art meets tech, gardening meets food justice
- **Learning hotspots**: Locations where multiple experiences cluster
- **Learner journeys**: How individuals progress through connected experiences

## Technology Stack

### Current Stack (Working but Has Technical Debt)

**Runtime**: Node.js v22
**Module System**: CommonJS (legacy, not ESM)
**Language**: Plain JavaScript (no TypeScript)
**Dependencies**: ZERO - only Node.js stdlib (fs, path, crypto, readline)

**Why This Stack?**
- Fast prototyping (chosen for speed)
- Zero `npm install` needed
- Matches existing zotero-voyant-export repo context

**What Works**:
- All tools tested and functional
- Example data populates correctly
- Visualization generates successfully
- No external dependencies to manage

### Known Technical Debt

Critical issues documented in `STACK_ANALYSIS.md` and `DENO_MIGRATION_PREVIEW.md`:

1. **CommonJS not ESM**: Using legacy `require()` instead of modern `import`
2. **No Type Safety**: Plain JS, no TypeScript, no autocomplete/validation
3. **No Runtime Validation**: JSON schema exists but never actually used in code
4. **No Tests**: Zero test coverage
5. **Synchronous I/O**: `fs.readFileSync()` blocks event loop (bad for scalability)
6. **No Security Model**: Full filesystem access, no explicit permissions
7. **Hand-rolled CLI Parsing**: Reinventing the wheel

### Migration Options (User Decision Pending)

Three paths documented for user:

#### Option 1: Migrate to Deno + TypeScript (4-6 hours)
- Type safety via Zod schemas
- Explicit permissions (`--allow-read`, `--allow-write`)
- Built-in tooling (fmt, lint, test)
- Better long-term, more robust

#### Option 2: Quick Node.js Fixes (2 hours)
- Convert to ESM modules
- Add Zod for runtime validation
- Add basic test coverage
- Stay in Node ecosystem

#### Option 3: Use As-Is (0 hours, most MVP-aligned)
- Code works now
- Test if UbiCity concept is valuable first
- Invest in tech improvements only if users keep using it
- Aligns with "data before infrastructure" philosophy

**User's preference**: Unknown - requested stack analysis, documentation provided, awaiting decision

## Development Workflow

### Setup (Current Implementation)

```bash
# Prerequisites: Node.js v22+
node --version  # Should be v22 or higher

# No npm install needed! Zero dependencies.

# Navigate to ubicity folder (if in zotero-voyant-export repo)
cd ubicity/

# Test with examples
node examples/populate-examples.js
```

### Common Commands

```bash
# Capture a learning experience (quick mode - interactive prompts)
node capture.js

# Capture with full details
node capture.js --mode full

# Export a template (save as JSON, edit, re-import)
node capture.js --mode template

# Analyze patterns in captured data
node mapper.js

# Generate visualization report
node visualize.js

# Populate test data for exploration
node examples/populate-examples.js
```

### Git Workflow

- **Original branch**: `claude/ubicity-learning-setup-01H8249ctY6CW1u58MdFWLbB` in `zotero-voyant-export`
- **Feature branches**: Follow `claude/session-id` pattern
- **Commit messages**: Descriptive, explain why not just what

## Code Standards

### Current State (Minimal by Design)

- **No linter**: Not set up yet
- **No formatter**: Manual formatting
- **No types**: Plain JavaScript
- **Naming**: Descriptive variable names, clear function purposes
- **File organization**: One tool per file, examples separated

### Best Practices to Follow

- **Keep it simple**: Don't add complexity until proven necessary
- **Inline documentation**: Explain WHY, not just WHAT
- **Preserve the constraint philosophy**: Resist feature creep
- **Data capture over infrastructure**: Always bias toward collecting real usage before building systems

## Testing

### Current State

**No tests yet.** This is technical debt, but acceptable for MVP validation phase.

When adding tests (if project continues):
- Test data capture correctness
- Test mapper analysis logic (hotspot detection, network building)
- Test visualization HTML generation
- Consider integration tests for full workflow

## Architecture

### Key Design Decisions

1. **File-based Storage (not database)**
   - **Why**: Simplicity, portability, human-readable
   - **Trade-off**: Doesn't scale to millions of records (but that's not the goal yet)

2. **CLI Tools (not web app)**
   - **Why**: Friction-free capture, works offline, no server costs
   - **Trade-off**: Less discoverable for non-technical users

3. **Static HTML Visualization (not interactive dashboard)**
   - **Why**: Zero infrastructure, shareable, archival
   - **Trade-off**: Can't drill down into data dynamically

4. **Minimal Schema (WHO/WHERE/WHAT only)**
   - **Why**: Constraint mechanism, forces focus, prevents analysis paralysis
   - **Trade-off**: Less rich data initially (but that's the point)

5. **Zero Dependencies**
   - **Why**: Simplicity, no supply chain security issues, fast startup
   - **Trade-off**: Missing validation, testing, type safety (all hand-rolled)

### Critical Philosophy: Pause Points

**MINIMAL_VIABLE_PROTOCOL.md** defines a 4-week experiment:
1. Capture 5+ learning experiences
2. Find 1+ meaningful connection between experiences
3. Surface 1+ unexpected question from the data

**Only if all three happen**: Consider building more infrastructure. Otherwise, UbiCity isn't solving a real need.

## Important Notes

### Context About the User

- **Hyperkinetic thinking**: Projects expand quickly without completion
- **Connected to other work**: Formal methods, solidarity economics, phase-separated development, MAA framework
- **Repository history**: `zotero-voyant-export` originally for Zotero→Voyant text analysis (unmaintained), UbiCity reuses "corpus analysis" philosophy
- **Design approach**: Intentional constraints to combat expansive tendencies

### When Making Changes

**CRITICAL**: Respect the constraint mechanism. UbiCity's power comes from what it DOESN'T do.

Before adding features, ask:
1. Does this help capture WHO/WHERE/WHAT more easily?
2. Does this help surface patterns in existing data?
3. Or is this scope creep?

If it's #3, resist. The goal is to test the concept, not build a platform.

### Security Considerations

**Current state**: None. Tools have full filesystem access.

**If migrating to Deno**: Use explicit permissions
- `--allow-read=./data` (only read data directory)
- `--allow-write=./data` (only write to data directory)

**Privacy**: Learning experiences may contain personal info. Keep data local, don't sync to cloud without user consent.

### Performance Considerations

**Current bottlenecks**:
- Synchronous file I/O (blocks event loop)
- No pagination (loads all experiences into memory)
- Visualization regenerates entire HTML each time

**Not a problem yet**: Data sets are small (< 100 experiences expected in MVP phase)

**If it becomes a problem**: Switch to async I/O, add pagination, incremental updates

## Useful Links

- **Repository**: https://github.com/Hyperpolymath/ubicity
- **Original implementation**: `Hyperpolymath/zotero-voyant-export`, branch `claude/ubicity-learning-setup-01H8249ctY6CW1u58MdFWLbB`
- **Critical doc**: `MINIMAL_VIABLE_PROTOCOL.md` (explains constraint philosophy)
- **Stack analysis**: `STACK_ANALYSIS.md` (technical debt documentation)
- **Migration preview**: `DENO_MIGRATION_PREVIEW.md` (if choosing Deno path)

## Project-Specific Context

### Things Claude Should Know

- **"UbiCity" = "Ubiquitous City"**: Learning happens everywhere in urban environments
- **Not trying to replace formal education**: Capturing what happens in the gaps
- **Success metric**: Does it surface unexpected insights? Not: Does it have all features?
- **User's pattern**: Starts projects with expansive vision, needs tools to maintain focus
- **Why this matters**: If UbiCity works, it validates a method for grounding abstract ideas in concrete practice

### Terminology

- **Learning Experience**: A discrete moment of learning (failed experiment, mentorship conversation, workshop attendance)
- **Hotspot**: Location where multiple learning experiences cluster (e.g., makerspace, community garden)
- **Domain Network**: Connections between subject areas (e.g., "electronics" + "sculpture")
- **Learner Journey**: Sequence of experiences for one person over time
- **Minimal Viable Protocol**: WHO/WHERE/WHAT constraint - core data model

### Deprecated Patterns to Avoid

- **Don't add user accounts** (at least not yet - defeats "tools not platforms" philosophy)
- **Don't build a mobile app** (CLI first, prove the concept)
- **Don't add gamification** (learning isn't about points/badges)
- **Don't integrate with LMS systems** (this captures informal learning, not institutional)

### When Blocked or Uncertain

**Refer to MINIMAL_VIABLE_PROTOCOL.md**. It's the north star. Ask: "Does this help complete the 4-week experiment?" If no, defer it.

## Migration Decision Point

**Current Status**: User aware of three migration options, has documentation, no decision made.

**If user chooses Option 1 (Deno)**: Follow `DENO_MIGRATION_PREVIEW.md`, budget 4-6 hours, prioritize type safety + permissions

**If user chooses Option 2 (Node fixes)**: ESM conversion first, then Zod validation, then tests

**If user chooses Option 3 (as-is)**: Focus on completing MVP experiment, improve tech only if validated

**Default assumption**: Until user decides, assume Option 3. Don't preemptively refactor.

---

**Note**: This file captures the project state as of handover. UbiCity is a working prototype with intentional technical debt. The philosophy of constraints and pause points is as important as the code itself.

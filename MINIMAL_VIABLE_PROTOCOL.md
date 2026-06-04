<!--
SPDX-License-Identifier: MPL-2.0
Copyright (c) Jonathan D.A. Jewell <j.d.a.jewell@open.ac.uk>
-->
# UbiCity Minimal Viable Protocol (MVP)

## The Constraint Problem

UbiCity's vision is vast: reimagining urban space as a learning environment. This document defines the **smallest possible instantiation** that captures the core principles while remaining implementable.

## Core Principle

> **A UbiCity learning interaction is: A documented moment where someone learns something outside traditional institutional boundaries, with that learning captured in a way that can connect to other learning moments.**

## The MVP: Three Required Elements

For a learning experience to count as a UbiCity interaction, it must have:

### 1. **WHO** - Learner Identity (Pseudonymous OK)
```json
{
  "learner": {
    "id": "unique-identifier"
  }
}
```

### 2. **WHERE** - Urban Context
```json
{
  "context": {
    "location": {
      "name": "A named place in the city"
    }
  }
}
```

### 3. **WHAT** - Learning Description
```json
{
  "experience": {
    "type": "observation|experiment|failure|discovery|collaboration|insight|question|practice|reflection",
    "description": "What was learned or attempted"
  }
}
```

## That's It

Everything else in the full schema is **optional enrichment**. If you have these three elements, you have a valid UbiCity learning experience.

## Why This Matters

### Anti-Scope-Creep Properties

1. **You can start today** - Pen, paper, and three pieces of information
2. **No infrastructure required** - Works with a notebook or text file
3. **Clear success criteria** - Did you capture WHO/WHERE/WHAT? Yes? Done.
4. **Natural growth path** - Optional fields add value without changing the core

### Verification Conditions

A UbiCity interaction is valid if:

```
∀ experience . (
  hasLearner(experience) ∧
  hasLocation(experience) ∧
  hasDescription(experience)
) → isValidUbiCityExperience(experience)
```

In plain English: If you know who learned, where they learned, and what they learned, you have captured a UbiCity experience.

## First Experiment Protocol

To test UbiCity with minimal commitment:

### Week 1: Personal Capture
- **You** capture 5 learning moments in different urban locations
- Use the quick capture tool: `node capture.js quick`
- Or just write them in a notebook with WHO/WHERE/WHAT

### Week 2: Analysis
- Run: `node mapper.js report`
- Questions to ask:
  - Did you return to the same locations?
  - Did domains start connecting?
  - Did new questions emerge?

### Week 3: Expansion Decision Point
- **Stop here** if this isn't working (you have 10 data points to analyze)
- **Add one other person** if you see patterns
- **Add richer metadata** if you want deeper analysis

### Week 4: First Collaboration
- Meet with your collaborator at a location from Week 1
- Discuss what you both learned
- Capture that discussion as a new experience

## Success Criteria for the Experiment

The MVP succeeds if:

1. ✅ You captured at least 5 experiences
2. ✅ You found at least one unexpected connection between experiences
3. ✅ You can articulate one new question that emerged from the pattern

**That's it.** If you hit those three criteria, UbiCity works at minimum viable scale.

## Scaling Decisions

Only after completing the 4-week experiment, consider:

### Horizontal Scaling
- Add more learners
- Add more locations
- Add more domains

### Vertical Scaling
- Richer metadata (GPS coordinates, artifacts, connections)
- Better analysis tools (visualization, ML pattern detection)
- Integration with institutions (course credit, portfolios)

### Infrastructure Scaling
- Web interface
- Mobile app
- Real-time mapping
- Recommendation engine ("learners like you also explored...")

## Anti-Patterns to Avoid

❌ **Building the platform before capturing experiences** - Use text files first

❌ **Requiring perfect data** - Incomplete captures are better than no captures

❌ **Institutionalizing too early** - Keep it informal until patterns emerge

❌ **Technology-first thinking** - The learning is the point, not the tool

❌ **Scaling before validation** - 10 real experiences > 1000 imagined ones

## The Commitment Gradient

Level 0: **Read this document** (5 minutes)

Level 1: **Capture one experience** - Using template or quick tool (10 minutes)

Level 2: **Complete Week 1** - Capture 5 experiences (1 week, ~1 hour total)

Level 3: **Run first analysis** - Generate report (15 minutes)

Level 4: **Add collaborator** - Find one other person to try this (1 week)

Level 5: **Complete 4-week experiment** - Full MVP protocol (1 month)

Level 6: **Evaluate and decide** - Stop, continue, or scale? (1 week)

---

**Stop at any level.** Each level provides closure and learnings.

## Code Support

The tools in this repository support the MVP:

- `schema/learning-experience.json` - Full schema (MVP fields marked as required)
- `capture.js` - Quick capture tool (enforces MVP minimum)
- `mapper.js` - Analysis tool (works with MVP-only data)

You can use just these three tools to run the complete 4-week experiment.

## From Short-Term Excitement to Life Project

### Short-Term Mode (3-6 months)
Run the 4-week experiment. Write a paper about it. Share the tools. **Then stop.**

### Life Project Mode (Ongoing)
The 4-week experiment becomes a **repeating ritual**:
- Every quarter, run a new 4-week cycle
- Each cycle explores a different aspect (new location, new domain, new collaborators)
- Publish findings after each cycle
- The project never "completes" - it's a practice, like meditation or exercise

The MVP structure means you can **always pause** without it feeling incomplete.

## Key Insight

Traditional projects have beginnings, middles, and ends. UbiCity learning is **continuous** - more like breathing than like building.

The MVP gives you permission to:
- **Start** without everything being ready
- **Pause** without abandoning the vision
- **Resume** without catching up on what you missed

This is not a project to finish. It's a protocol to practice.

---

## Get Started Right Now

1. Open a text editor
2. Write:
   ```
   WHO: [your name/pseudonym]
   WHERE: [where you are right now]
   WHAT: [what you just learned from reading this document]
   ```
3. Save it

You just created your first UbiCity learning experience.

Welcome to the Ubiquitous City of Learning.

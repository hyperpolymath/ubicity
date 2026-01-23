# Getting Started with UbiCity

> **Making the city itself a learning environment, one captured experience at a time.**

UbiCity is a learning capture system for documenting informal urban learning experiences. This guide will get you up and running in under 5 minutes.

## Quick Start

### Prerequisites

- **Node.js v18+** (tested with v22+)
- **Terminal/Command Line** access

No other dependencies needed - UbiCity uses only Node.js standard library.

### Installation

```bash
# Clone the repository
git clone https://github.com/hyperpolymath/ubicity.git
cd ubicity

# Verify Node.js version
node --version  # Should be v18 or higher

# Test the CLI
node src-rescript/CaptureCLI.res.js template
```

That's it! No \`npm install\` needed.

## Your First Learning Experience

### Capture a Quick Experience

The fastest way to start is with **quick mode**:

```bash
node src-rescript/CaptureCLI.res.js quick
```

You'll be prompted for:
1. **WHO** learned? (Enter a pseudonym/ID)
2. **WHERE** did learning happen? (Location name)
3. **WHAT** was learned? (Experience type and description)
4. **Domains** (optional but recommended)

Example interaction:
```
🏙️  UbiCity Learning Capture

WHO learned?

Learner ID (pseudonym): alex-maker

WHERE did learning happen?

Location name: Community Makerspace

WHAT was learned?

Type (experiment/workshop/observation/conversation/reading/making): experiment
Description: Built a simple robot, but motors didn't work - learned about power requirements
Domains/disciplines (comma-separated, optional but useful): robotics,electronics

✅ Experience captured: ubi-abc123...
📊 Total experiences: 1
```

### View Your Data

Your captured experiences are stored in \`data/experiences.json\`. To analyze patterns:

```bash
# Generate a visual report (coming soon - v1.1)
# For now, data is in data/experiences.json
cat data/experiences.json | jq .
```

## Capture Modes

UbiCity offers three capture modes:

### Quick Mode (Default)
```bash
node src-rescript/CaptureCLI.res.js quick
```
- Minimal prompts (WHO/WHERE/WHAT only)
- Fastest capture (~30 seconds)
- Perfect for capturing moments as they happen

### Full Mode
```bash
node src-rescript/CaptureCLI.res.js full
```
- Includes all optional fields
- Detailed capture (~2-3 minutes)

### Template Mode
```bash
node src-rescript/CaptureCLI.res.js template
```
- Generates a JSON template
- Edit offline and import later

## Next Steps

See **[README.md](README.md)** for the full vision and **[API.md](API.md)** for developer reference.

---

**UbiCity v1.0.0** - Tools not platforms. Data before infrastructure.

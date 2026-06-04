<!--
SPDX-License-Identifier: MPL-2.0
Copyright (c) Jonathan D.A. Jewell <j.d.a.jewell@open.ac.uk>
-->
# UbiCity ReScript Modules

Type-safe ReScript implementation of UbiCity core functionality.

## Modules

### UbiCity.res
Core domain types and functional utilities:
- `Coordinates` - GPS coordinates with validation
- `Location` - Learning locations
- `Learner` - Learner identity
- `Context` - WHERE learning happened
- `ExperienceData` - WHAT was learned
- `LearningExperience` - Complete learning experience record
- `Privacy` - Privacy settings
- `Analysis` - Functional analysis utilities

### Capture.res
CLI capture tool for recording learning experiences:
- `CaptureSession` - Interactive capture session
- Supports Quick, Full, and Template modes
- Type-safe input validation
- Async/await interface

### Mapper.res
Urban knowledge mapper for storing and analyzing experiences:
- Storage integration
- Fast lookup indices (location, domain, learner)
- Analysis functions (hotspots, interdisciplinary connections)
- Domain diversity calculations

### CaptureCLI.res
CLI entry point for the capture tool.

## Compilation

ReScript modules compile to ES6 JavaScript with `.res.js` extension:

```bash
# Compile ReScript to JavaScript
npm run res:build

# Watch mode
npm run res:dev
```

## Usage

### Capture a Learning Experience

```bash
# Quick mode (minimal prompts)
node src-rescript/CaptureCLI.res.js

# Full mode (all optional fields)
node src-rescript/CaptureCLI.res.js full

# Generate template
node src-rescript/CaptureCLI.res.js template
```

### Programmatic API

```rescript
open UbiCity

// Create a learning experience
let learnerResult = Learner.make(~id="alice", ())
let locationResult = Location.make(~name="City Library", ())

switch (learnerResult, locationResult) {
| (Ok(learner), Ok(location)) => {
    let context = Context.make(~location, ())

    let experienceResult = ExperienceData.make(
      ~type_="reading",
      ~description="Explored urban planning books",
      ~domains=["architecture", "sociology"],
      ()
    )

    switch experienceResult {
    | Ok(experience) => {
        let learning = LearningExperience.make(
          ~learner,
          ~context,
          ~experience,
          ()
        )
        Console.log(learning.id)
      }
    | Error(err) => Console.error(err)
    }
  }
| _ => Console.error("Failed to create learner or location")
}
```

### Using the Mapper

```rescript
// Initialize mapper
let mapper = await Mapper.make(~storageDir="./ubicity-data", ())

// Capture an experience
let result = await Mapper.captureExperience(mapper, learningExperience)

// Find interdisciplinary connections
let connections = Mapper.findInterdisciplinary(mapper)

// Get hotspot locations
let hotspots = Mapper.getHotspots(mapper, ~limit=5, ())

// Calculate domain diversity
let diversity = Mapper.calculateDiversity(mapper)
```

## Type Safety Benefits

ReScript provides:
- **Compile-time type checking** - Catch errors before runtime
- **Sound type system** - No `null` or `undefined` surprises
- **Pattern matching** - Exhaustive error handling
- **Immutability** - Default immutability prevents bugs
- **Interop with JS** - Seamless integration with existing JS code

## Migration Status

- ✅ Core domain types (UbiCity.res)
- ✅ Capture tool (Capture.res)
- ✅ Mapper (Mapper.res)
- ✅ CLI entry point (CaptureCLI.res)
- ⏳ Storage validation integration
- ⏳ Analysis module (full port)
- ⏳ Visualization module
- ⏳ Privacy module
- ⏳ Export module

## Architecture

```
ReScript Modules           JavaScript Integration
┌─────────────────┐       ┌──────────────────┐
│  UbiCity.res    │       │   storage.js     │
│  (Domain Types) │       │   (File I/O)     │
└────────┬────────┘       └─────────┬────────┘
         │                          │
         ▼                          ▼
┌─────────────────┐       ┌──────────────────┐
│  Mapper.res     │◄──────│   Bindings       │
│  (Analysis)     │       │   (FFI)          │
└────────┬────────┘       └──────────────────┘
         │
         ▼
┌─────────────────┐
│  Capture.res    │
│  (CLI Tool)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ CaptureCLI.res  │
│ (Entry Point)   │
└─────────────────┘
```

## License

PMPL-1.0-or-later

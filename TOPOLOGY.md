<!-- SPDX-License-Identifier: PMPL-1.0-or-later -->
<!-- TOPOLOGY.md — Project architecture map and completion dashboard -->
<!-- Last updated: 2026-02-19 -->

# UbiCity (ubicity) — Project Topology

## System Architecture

```
                        ┌─────────────────────────────────────────┐
                        │              URBAN LEARNER              │
                        │        (CLI Capture / Web Form)         │
                        └───────────────────┬─────────────────────┘
                                            │ Capture Event
                                            ▼
                        ┌─────────────────────────────────────────┐
                        │           UBICITY ENGINE (JS)           │
                        │  ┌───────────┐  ┌───────────────────┐  │
                        │  │  Capture  │  │   Mapper          │  │
                        │  │  Tool     │──►   Analyzer        │  │
                        │  └─────┬─────┘  └────────┬──────────┘  │
                        └────────│─────────────────│──────────────┘
                                 │                 │
                                 ▼                 ▼
                        ┌─────────────────────────────────────────┐
                        │             DATA LAYER                  │
                        │  ┌───────────┐  ┌───────────────────┐  │
                        │  │ JSON      │  │  Experience       │  │
                        │  │ Experiences│ │  Corpus           │  │
                        │  └───────────┘  └───────────────────┘  │
                        └───────────────────┬─────────────────────┘
                                            │
                                            ▼
                        ┌─────────────────────────────────────────┐
                        │           ANALYSIS & VIZ                │
                        │  ┌───────────┐  ┌───────────────────┐  │
                        │  │ Voyant    │  │  D3.js            │  │
                        │  │ Export    │  │  (Hotspots)       │  │
                        │  └───────────┘  └───────────────────┘  │
                        └─────────────────────────────────────────┘

                        ┌─────────────────────────────────────────┐
                        │          REPO INFRASTRUCTURE            │
                        │  Justfile Automation  .machine_readable/  │
                        │  Zotero Connect       0-AI-MANIFEST.a2ml  │
                        └─────────────────────────────────────────┘
```

## Completion Dashboard

```
COMPONENT                          STATUS              NOTES
─────────────────────────────────  ──────────────────  ─────────────────────────────────
CORE CAPTURE & DATA
  Capture Tool (CLI)                ██████████ 100%    Quick/Full/Template modes stable
  JSON Schema (Exp)                 ██████████ 100%    MVP data model verified
  Mapper Analyzer                   ██████████ 100%    Hotspots & networks stable
  Minimal Viable Protocol           ██████████ 100%    4-week experiment verified

INTERFACES & VIZ
  Voyant Export                     ██████████ 100%    Text analysis bridge active
  ReScript UI (src-rescript)        ██████░░░░  60%    Web dashboard in progress
  D3.js Learning Maps               ████░░░░░░  40%    Spatial viz prototyping

REPO INFRASTRUCTURE
  Justfile Automation               ██████████ 100%    Standard tasks active
  .machine_readable/                ██████████ 100%    STATE tracking active
  Idris2 ABI (Proofs)               █░░░░░░░░░  10%    Verification stubs only

─────────────────────────────────────────────────────────────────────────────
OVERALL:                            ███████░░░  ~70%   Stable toolset, UI maturing
```

## Key Dependencies

```
Minimal Protocol ──► Capture Tool ─────► JSON Corpus ─────► Mapper
     │                 │                   │                 │
     ▼                 ▼                   ▼                 ▼
Learning Event ──► Experience ────────► Interdisc ──────► Wisdom
```

## Update Protocol

This file is maintained by both humans and AI agents. When updating:

1. **After completing a component**: Change its bar and percentage
2. **After adding a component**: Add a new row in the appropriate section
3. **After architectural changes**: Update the ASCII diagram
4. **Date**: Update the `Last updated` comment at the top of this file

Progress bars use: `█` (filled) and `░` (empty), 10 characters wide.
Percentages: 0%, 10%, 20%, ... 100% (in 10% increments).

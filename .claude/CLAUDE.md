<!--
SPDX-License-Identifier: MPL-2.0
Copyright (c) Jonathan D.A. Jewell <j.d.a.jewell@open.ac.uk>
-->
## Machine-Readable Artefacts

The following files in `.machine_readable/` contain structured project metadata:

- `.machine_readable/6a2/STATE.a2ml` - Current project state and progress
- `.machine_readable/6a2/META.a2ml` - Architecture decisions and development practices
- `.machine_readable/6a2/ECOSYSTEM.a2ml` - Position in the ecosystem and related projects
- `.machine_readable/6a2/AGENTIC.a2ml` - AI agent interaction patterns
- `.machine_readable/6a2/NEUROSYM.a2ml` - Neurosymbolic integration config
- `.machine_readable/6a2/PLAYBOOK.a2ml` - Operational runbook

---

# CLAUDE.md - AI Assistant Instructions

## Language Policy (Hyperpolymath Standard)

### ALLOWED Languages & Tools

| Language/Tool | Use Case | Notes |
|---------------|----------|-------|
| **AffineScript** | Primary application code | Compiles to JS, type-safe |
| **Deno** | Runtime & package management | Replaces Node/npm/bun |
| **Rust** | Performance-critical, systems, WASM | Preferred for CLI tools |
| **Tauri 2.0+** | Mobile apps (iOS/Android) | Rust backend + web UI |
| **Dioxus** | Mobile apps (native UI) | Pure Rust, React-like |
| **Gleam** | Backend services | Runs on BEAM or compiles to JS |
| **Bash/POSIX Shell** | Scripts, automation | Keep minimal |
| **JavaScript** | Only where AffineScript cannot | MCP protocol glue, Deno APIs |
| **Python** | SaltStack only | No other Python permitted |
| **Nickel** | Configuration language | For complex configs |
| **Guile Scheme** | State/meta files | .machine_readable/6a2/STATE.a2ml, .machine_readable/6a2/META.a2ml, .machine_readable/6a2/ECOSYSTEM.a2ml |
| **Julia** | Batch scripts, data processing | Per RSR |
| **OCaml** | AffineScript compiler | Language-specific |
| **Ada** | Safety-critical systems | Where required |

### BANNED - Do Not Use

| Banned | Replacement |
|--------|-------------|
| TypeScript | AffineScript |
| Node.js | Deno |
| npm | Deno |
| Bun | Deno |
| pnpm/yarn | Deno |
| Go | Rust |
| Python (general) | AffineScript/Rust |
| Java/Kotlin | Rust/Tauri/Dioxus |
| Swift | Tauri/Dioxus |
| React Native | Tauri/Dioxus |
| Flutter/Dart | Tauri/Dioxus |

### Mobile Development

**No exceptions for Kotlin/Swift** - use Rust-first approach:

1. **Tauri 2.0+** - Web UI (AffineScript) + Rust backend, MIT/Apache-2.0
2. **Dioxus** - Pure Rust native UI, MIT/Apache-2.0

Both are FOSS with independent governance (no Big Tech).

### Enforcement Rules

1. **No new TypeScript files** - Convert existing TS to AffineScript
2. **No package.json - use deno.json deps** - Use deno.json imports
3. **No node_modules in production** - Deno caches deps automatically
4. **No Go code** - Use Rust instead
5. **Python only for SaltStack** - All other Python must be rewritten
6. **No Kotlin/Swift for mobile** - Use Tauri 2.0+ or Dioxus

### Package Management

- **Primary**: Guix (guix.scm)
- **Fallback**: Nix (flake.nix)
- **JS deps**: Deno (deno.json imports)

### Security Requirements

- No MD5/SHA1 for security (use SHA256+)
- HTTPS only (no HTTP URLs)
- No hardcoded secrets
- SHA-pinned dependencies
- SPDX license headers on all files

### TypeScript Exemptions (Approved)

The hyperpolymath "no new TypeScript" policy has the following approved exemptions in this repo. These are *not* policy violations — they are documented carve-outs.

| Path | Files | Rationale | Unblock condition |
|---|---|---|---|
| `src/wasm-bridge.ts` | 1 | Explicit FFI bridge between TS host and WASM core; thin glue, no application logic. | AffineScript first-class WASM-direct invocation surface. |
| `src/rescript-bridge.ts` | 1 | Explicit bridge between TS host and ReScript layer; thin glue. | Replace ReScript layer with AffineScript core (then bridge dissolves). |
| `src/storage.ts` | 1 | Deno-runtime storage interface (KV/Deno.openKv); ecosystem is Deno-native. | AffineScript Deno KV bindings. |
| `src/observability.ts` | 1 | Deno-runtime observability — OpenTelemetry exporters and Deno.metrics. | AffineScript OTel bindings (post Node-target #35). |

Adding to this list requires explicit user approval and an unblock condition. New TypeScript files outside this list are blocked by the RSR antipattern check.

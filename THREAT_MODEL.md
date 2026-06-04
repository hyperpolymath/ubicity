<!--
SPDX-License-Identifier: MPL-2.0
Copyright (c) Jonathan D.A. Jewell <j.d.a.jewell@open.ac.uk>
-->
# UbiCity Threat Model

**Version**: 1.0
**Last Updated**: 2025-11-22
**Status**: Active

## Executive Summary

UbiCity is a privacy-first learning capture system. This threat model identifies security risks, threat actors, attack vectors, and mitigations to protect learner data and system integrity.

**Primary Asset**: Learning experience data (WHO/WHERE/WHAT)
**Security Goal**: Confidentiality, integrity, availability of learner data

---

## System Architecture

```
┌─────────────┐
│   Learner   │ (captures experiences via CLI)
└──────┬──────┘
       │
       v
┌─────────────┐
│     CLI     │ (TypeScript/Deno runtime)
│ (src/*.ts)  │
└──────┬──────┘
       │
       v
┌─────────────┐
│  Validator  │ (Rust/WASM, ReScript)
│   (WASM)    │
└──────┬──────┘
       │
       v
┌─────────────┐
│   Storage   │ (Local JSON files)
│   (./data)  │
└─────────────┘
```

## Threat Actors

### 1. Malicious Local User
**Motivation**: Access private learning data, modify experiences
**Capability**: Filesystem access, command execution
**Likelihood**: Medium
**Impact**: High (privacy violation)

### 2. Malicious Dependency
**Motivation**: Supply chain attack, data exfiltration
**Capability**: Code execution during install/runtime
**Likelihood**: Low (zero npm dependencies)
**Impact**: Critical

### 3. Accidental Data Leak
**Motivation**: None (unintentional)
**Capability**: User error (sharing private data)
**Likelihood**: Medium
**Impact**: Medium (privacy violation)

### 4. WASM/ReScript Exploit
**Motivation**: Code execution, memory corruption
**Capability**: Exploit WASM sandbox escape
**Likelihood**: Very Low
**Impact**: High

---

## Attack Vectors & Mitigations

### 1. Unauthorized Data Access

**Threat**: Malicious user reads private learning data
**Attack Vector**:
- Direct filesystem access to `./ubicity-data/`
- Memory dump while CLI running
- Shared computer access

**Mitigations**:
- ✅ File permissions (user-only read/write)
- ✅ No cloud sync by default (local-only)
- ✅ Privacy levels (private/anonymous/public)
- ⚠️ Encryption at rest (not implemented - future)

**Risk**: MEDIUM → LOW (with mitigations)

---

### 2. Data Tampering

**Threat**: Malicious modification of experiences
**Attack Vector**:
- Direct JSON file editing
- CLI command injection
- WASM validator bypass

**Mitigations**:
- ✅ WASM validation (integrity checks)
- ✅ Deno permissions (`--allow-write` limited to data dir)
- ✅ TypeScript compile-time checks
- ⚠️ Cryptographic signatures (not implemented - future)

**Risk**: LOW

---

### 3. Supply Chain Attack

**Threat**: Malicious dependency exfiltrates data
**Attack Vector**:
- Compromised npm package
- Malicious Deno module
- Backdoored compiler

**Mitigations**:
- ✅ ZERO npm dependencies (production)
- ✅ Deno JSR registry (cryptographically signed)
- ✅ Nix reproducible builds (pinned dependencies)
- ✅ GitLab CI verification on every commit
- ✅ `cargo audit` for Rust dependencies

**Risk**: VERY LOW

---

### 4. Command Injection

**Threat**: Attacker executes arbitrary commands via CLI
**Attack Vector**:
- Malicious input in description field
- Filename injection (`../../etc/passwd`)
- Shell metacharacters

**Mitigations**:
- ✅ Deno sandboxing (explicit permissions)
- ✅ Path validation (no directory traversal)
- ✅ Input sanitization (Zod schemas)
- ✅ No `eval()` or dynamic code execution

**Risk**: VERY LOW

---

### 5. Privacy Violation (Accidental)

**Threat**: User accidentally shares private data
**Attack Vector**:
- Exporting with private experiences included
- Publishing dataset without anonymization
- Sharing visualization with PII

**Mitigations**:
- ✅ Privacy levels enforced in exports
- ✅ Anonymization tools (hash IDs, fuzz location)
- ✅ PII removal (emails, phones)
- ✅ Shareable dataset generator (excludes private)
- ⚠️ User education (documentation, warnings)

**Risk**: MEDIUM

---

### 6. WASM Sandbox Escape

**Threat**: WASM code escapes sandbox, accesses host system
**Attack Vector**:
- WASM exploit (CVE in Deno's V8 engine)
- Unsafe Rust code in WASM module

**Mitigations**:
- ✅ Deno WASM sandbox (linear memory isolation)
- ✅ Zero `unsafe` blocks in Rust code
- ✅ `cargo clippy` enforces safety
- ✅ Deno auto-updates (security patches)
- ⚠️ Regular dependency updates

**Risk**: VERY LOW

---

### 7. Denial of Service (Local)

**Threat**: Malicious input causes CLI crash or hang
**Attack Vector**:
- Extremely large JSON files
- Infinite loops in mapper logic
- Memory exhaustion

**Mitigations**:
- ✅ File size limits (implicit via memory)
- ✅ Async I/O (non-blocking)
- ✅ WASM memory limits
- ⚠️ Explicit resource quotas (not implemented)

**Risk**: LOW

---

## Data Flow Analysis

### Capture Flow

```
User Input → Deno CLI → WASM Validator → JSON File
    ↓           ↓             ↓              ↓
  [PII?]   [Sanitize]    [Validate]    [Encrypt?]
```

**Threats**:
- PII in description field → Mitigated by user control + anonymization tools
- Path traversal in filename → Mitigated by path validation

### Export Flow

```
JSON Files → Mapper → Privacy Filter → Export (CSV/GeoJSON/DOT)
     ↓          ↓           ↓                  ↓
  [Private?] [Analyze]  [Exclude]         [Share]
```

**Threats**:
- Private data in export → Mitigated by privacy level enforcement
- Location precision → Mitigated by coordinate fuzzing

---

## Security Controls

### Preventive Controls
- ✅ Deno explicit permissions (`--allow-read`, `--allow-write`)
- ✅ WASM sandboxing (linear memory isolation)
- ✅ Input validation (Zod + WASM validators)
- ✅ Zero npm dependencies (supply chain risk reduction)
- ✅ Offline-first (no network calls)

### Detective Controls
- ✅ Security audit script (`security/audit.sh`)
- ✅ `cargo audit` (Rust dependency CVEs)
- ✅ Trivy filesystem scanner
- ✅ GitLab CI security checks
- ✅ Test suite (including security tests)

### Corrective Controls
- ✅ CVE disclosure process (`.well-known/security.txt`)
- ✅ Coordinated disclosure (90-day window)
- ⚠️ Incident response plan (not documented - future)

---

## Privacy-Specific Threats

### PII Exposure

**Sensitive Data**:
- Learner names, emails, phone numbers
- Precise GPS coordinates (< 100m)
- Demographic information

**Mitigations**:
- ✅ Minimal data collection (WHO/WHERE/WHAT only)
- ✅ Privacy by default (no demographic fields in schema)
- ✅ Location fuzzing (round to ~1km)
- ✅ Learner ID hashing (SHA-256)
- ✅ PII removal tools (regex-based)

### Re-identification Attacks

**Threat**: Anonymized data re-identified via correlation
**Example**: Unique location + timestamp + domain → identifies individual

**Mitigations**:
- ✅ k-anonymity consideration (documentation)
- ⚠️ Automated k-anonymity checks (not implemented - future)

---

## Compliance

### Privacy Regulations
- **GDPR** (EU): ✅ Data minimization, privacy by design
- **CCPA** (California): ✅ User data ownership (local storage)
- **COPPA** (US, children): ⚠️ Age-gated features (not implemented)

### Security Standards
- **OWASP Top 10**: ✅ Mitigations for injection, broken access control
- **CWE Top 25**: ✅ No common weaknesses (verified via Clippy)

---

## Future Enhancements

### Recommended (Silver → Gold → Platinum)
1. **Encryption at rest** (AES-256 for sensitive fields)
2. **Cryptographic signatures** (verify data integrity)
3. **External security audit** (penetration testing)
4. **Bug bounty program** (coordinated vulnerability disclosure)
5. **Incident response plan** (documented procedures)

### Optional
- Multi-factor authentication (if adding sync features)
- End-to-end encryption (for shared datasets)
- Audit logging (immutable append-only log)

---

## Threat Model Maintenance

**Review Cadence**: Quarterly or on major releases
**Owner**: Maintainers (see `MAINTAINERS.md`)
**Process**:
1. Identify new features/changes
2. Enumerate new threats
3. Assess risk (likelihood × impact)
4. Implement mitigations
5. Update this document

---

## Responsible Disclosure

Found a vulnerability? See `.well-known/security.txt`

- **Contact**: security@ubicity.example.org
- **PGP Key**: [Future: public key]
- **Disclosure Policy**: 90-day coordinated disclosure
- **Bounty**: No cash bounty (community project)

---

## References

- [OWASP Threat Modeling](https://owasp.org/www-community/Threat_Modeling)
- [NIST SP 800-154 (Data Integrity)](https://csrc.nist.gov/publications/detail/sp/800-154/draft)
- [Deno Security Model](https://deno.land/manual/runtime/permission_apis)
- [WASM Security](https://webassembly.org/docs/security/)

---

**Document Classification**: Public
**Version History**:
- v1.0 (2025-11-22): Initial threat model for Platinum RSR tier

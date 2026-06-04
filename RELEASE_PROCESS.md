<!--
SPDX-License-Identifier: MPL-2.0
Copyright (c) Jonathan D.A. Jewell <j.d.a.jewell@open.ac.uk>
-->
## UbiCity Release Process

**Version**: 1.0
**Tier**: Platinum RSR Compliance

This document defines the formal release process for UbiCity, ensuring quality, security, and traceability for all published versions.

---

## Release Types

### Major Release (x.0.0)
**Breaking Changes**: Data format, core API, migration required

**Example**: v1.0.0, v2.0.0
**Cadence**: Yearly or as needed
**Approval**: Consensus of all maintainers

### Minor Release (0.x.0)
**New Features**: Backwards compatible, no migration needed

**Example**: v0.4.0, v0.5.0
**Cadence**: Quarterly or as features complete
**Approval**: 2+ maintainer approval

### Patch Release (0.0.x)
**Bug Fixes Only**: No new features

**Example**: v0.3.1, v0.3.2
**Cadence**: As needed (security fixes: immediate)
**Approval**: 1 maintainer approval

---

## Release Checklist

### 1. Pre-Release (1-2 weeks before)

- [ ] Create release branch: `release/vX.Y.Z`
- [ ] Update `CHANGELOG.md` with all changes
- [ ] Update version in `deno.json`
- [ ] Update version in `wasm/Cargo.toml`
- [ ] Update version in `src-rescript/package.json`
- [ ] Run full test suite: `deno task test`
- [ ] Run benchmarks: `deno task bench`
- [ ] Verify performance SLOs met
- [ ] Run security audit: `./security/audit.sh`
- [ ] Check test coverage ≥ 95%: `deno coverage`
- [ ] Verify offline-first (no network calls)
- [ ] Test all export formats (CSV, GeoJSON, DOT, Markdown)
- [ ] Verify data migration (if major/minor)
- [ ] Update documentation (README, QUICK_START, API)
- [ ] Review open issues/PRs for inclusion
- [ ] Create draft GitHub release notes

### 2. Release Candidate (RC)

- [ ] Tag RC: `git tag vX.Y.Z-rc.1`
- [ ] Build binaries: `deno task compile`
- [ ] Test binaries on all platforms (Linux, macOS, Windows)
- [ ] Smoke test: fresh install, capture experience, export
- [ ] Beta testing (internal or community)
- [ ] Fix critical bugs → RC.2, RC.3, etc.
- [ ] Document known issues (if any)

### 3. Final Release

- [ ] Merge release branch to `main`
- [ ] Tag release: `git tag vX.Y.Z`
- [ ] Sign tag (GPG): `git tag -s vX.Y.Z -m "Release vX.Y.Z"`
- [ ] Push tag: `git push origin vX.Y.Z`
- [ ] Build release artifacts
- [ ] Generate checksums (SHA-256)
- [ ] Sign binaries (GPG)
- [ ] Create GitHub release (with artifacts)
- [ ] Update latest docs on website
- [ ] Announce release (community channels)

### 4. Post-Release

- [ ] Monitor for issues (first 48 hours)
- [ ] Update Nix flake (if dependencies changed)
- [ ] Update Docker images
- [ ] Archive release branch (keep for 1 year)
- [ ] Update roadmap/milestones
- [ ] Retrospective (what went well/improve)

---

## Build Artifacts

### Compiled Binaries
```bash
# Compile for all platforms
deno task compile:cli      # ubicity CLI
deno task compile:capture  # capture tool
deno task compile:wasm     # WASM module
```

**Platforms**:
- Linux (x86_64, ARM64)
- macOS (x86_64, ARM64 M1/M2)
- Windows (x86_64)

### Checksums
```bash
sha256sum bin/* > SHA256SUMS
gpg --clearsign SHA256SUMS
```

### Signing
```bash
# Sign each binary
for file in bin/*; do
  gpg --detach-sign --armor "$file"
done
```

---

## Version Numbering

Following [Semantic Versioning 2.0.0](https://semver.org/):

**Format**: `MAJOR.MINOR.PATCH[-PRERELEASE][+BUILDMETA]`

**Examples**:
- `0.3.0` - Minor release
- `0.3.1` - Patch release
- `1.0.0-rc.1` - Release candidate
- `1.0.0` - Major release

**Pre-release Tags**:
- `alpha` - Early testing, unstable
- `beta` - Feature complete, testing
- `rc` - Release candidate, final testing

---

## Changelog Format

Following [Keep a Changelog](https://keepachangelog.com/):

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- New features

### Changed
- Changes to existing features

### Deprecated
- Soon-to-be removed features

### Removed
- Removed features

### Fixed
- Bug fixes

### Security
- Vulnerability fixes
```

**Classification**:
- **BREAKING** - Requires user action
- **Deprecation** - 1 major version warning before removal

---

## Security Releases

### Critical Vulnerabilities (CVSS ≥ 9.0)
**Timeline**: 24-48 hours
**Process**:
1. Private patch development
2. Coordinate with security researchers
3. Release patch ASAP
4. Public disclosure after patch

### High Vulnerabilities (CVSS 7.0-8.9)
**Timeline**: 7 days
**Process**:
1. Develop patch
2. Test thoroughly
3. Coordinate disclosure (90 days max)
4. Release patch

### Backports
**Policy**: Critical/High fixes backported to last 2 major versions

**Example**: If current is v2.3.0, backport to v1.x and v2.x

---

## Branch Strategy

### Main Branches
- `main` - Stable, production-ready
- `develop` - Integration branch (optional, for large teams)

### Feature Branches
- `feature/description` - New features
- `fix/description` - Bug fixes
- `chore/description` - Maintenance

### Release Branches
- `release/vX.Y.Z` - Release preparation
- Keep for 1 year, then archive

### Hotfix Branches
- `hotfix/vX.Y.Z` - Emergency fixes
- Merge to `main` and `develop`

---

## Testing Requirements

### Minimum for Release
- ✅ All tests pass (100%)
- ✅ Test coverage ≥ 95%
- ✅ Benchmarks meet SLOs
- ✅ Security audit passes
- ✅ No TypeScript errors (`deno check`)
- ✅ No lint warnings (`deno lint`)
- ✅ Format check passes (`deno fmt --check`)

### Regression Testing
- Test data migration from previous versions
- Test all export formats
- Test privacy/anonymization
- Test offline-first (network disabled)

---

## Communication

### Channels
- **GitHub Releases** - Official announcements
- **CHANGELOG.md** - Detailed changes
- **Twitter/Mastodon** - Community announcements
- **Email** - Security disclosures

### Release Notes Template
```markdown
# UbiCity vX.Y.Z Released!

## Highlights
- Key feature 1
- Key feature 2
- Important fix 3

## Download
- [Linux]()
- [macOS]()
- [Windows]()

## Checksums
SHA-256: [link to SHA256SUMS.asc]

## Upgrade Guide
See [MIGRATION.md]() for detailed instructions.

## Contributors
Thanks to @user1, @user2, @user3!
```

---

## Rollback Procedure

If critical bug discovered post-release:

1. **Assessment** (< 1 hour)
   - Severity: Does it cause data loss/corruption?
   - Impact: How many users affected?

2. **Decision** (maintainers consensus)
   - Option A: Hotfix patch (preferred)
   - Option B: Rollback release (nuclear option)

3. **Hotfix Process** (< 24 hours)
   - Create `hotfix/vX.Y.Z+1` branch
   - Fix bug
   - Fast-track testing
   - Release immediately

4. **Rollback Process** (last resort)
   - Yank release from package managers
   - Update docs: "vX.Y.Z deprecated, use vX.Y.Z-1"
   - Post-mortem analysis

---

## Metrics & Monitoring

### Track per Release
- Download count
- Installation errors (if telemetry opt-in)
- Bug reports (first week)
- Security issues
- Documentation gaps

### Success Criteria
- ✅ Zero data-loss bugs
- ✅ Zero critical security issues
- ✅ < 5% bug reports (of total users)
- ✅ Positive community feedback

---

## Automation

### CI/CD (GitLab)
```yaml
release:
  stage: deploy
  only:
    - tags
  script:
    - deno task test
    - deno task bench
    - ./security/audit.sh
    - deno task compile
    - ./scripts/checksum.sh
    - ./scripts/sign.sh
    - gh release create $CI_COMMIT_TAG bin/*
```

### Recommended Tools
- **GitHub Actions** - Build & release automation
- **GitLab CI** - Security scanning
- **Dependabot** - Dependency updates
- **Release Drafter** - Auto-generate release notes

---

## Governance

### Release Manager (Rotating)
**Responsibilities**:
- Coordinate release timeline
- Merge PRs
- Tag releases
- Publish artifacts
- Announce release

**Term**: 1 release cycle
**Selection**: Volunteer from maintainers

### Approval Process
- Major: All maintainers must approve
- Minor: 2+ maintainers
- Patch: 1 maintainer (or automated for security)

See `MAINTAINERS.md` for current maintainers.

---

## Continuous Improvement

### Post-Release Retrospective
**Questions**:
1. What went well?
2. What went wrong?
3. What should we improve?
4. Metrics: Did we meet SLOs?

**Actions**:
- Update this document
- Automate manual steps
- Fix broken processes

---

## References

- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Release Please (Google)](https://github.com/googleapis/release-please)

---

**Document Owner**: Maintainers
**Last Review**: 2025-11-22
**Next Review**: 2026-02-22 (quarterly)

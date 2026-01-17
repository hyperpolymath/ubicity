# Contributing to UbiCity

Welcome! UbiCity follows the **Tri-Perimeter Contribution Framework (TPCF)**.

## TPCF Perimeter Designation

**Current Perimeter: 3 (Community Sandbox)**

### What This Means

- ✅ **Fully Open Contribution**: Anyone can contribute via standard GitHub workflow
- ✅ **No CLA Required**: No contributor license agreements
- ✅ **Democratic Review**: Pull requests reviewed by maintainers and community
- ✅ **Transparent Governance**: Decisions documented in GitHub Issues/Discussions

### Perimeter Comparison

| Perimeter | Name | Access | Use Case |
|-----------|------|--------|----------|
| 1 | Core Maintainer | Maintainers only | Security-critical code |
| 2 | Trusted Contributor | Invited contributors | Stable feature development |
| 3 | **Community Sandbox** | **Public GitHub** | **UbiCity (current)** |

**Why Perimeter 3?**
UbiCity is a community project. We welcome contributions from anyone who aligns with our values.

## How to Contribute

### Quick Start

1. **Fork** the repository
2. **Create a branch**: `git checkout -b feature/your-feature`
3. **Make changes** (see below for guidelines)
4. **Test**: `just test` (or `deno task test`)
5. **Commit**: Clear commit messages
6. **Push**: `git push origin feature/your-feature`
7. **Pull Request**: Open PR with description

### Before You Start

- Read the [Code of Conduct](CODE_OF_CONDUCT.md)
- Check [existing issues](https://github.com/Hyperpolymath/ubicity/issues)
- Discuss major changes in an issue first

## Contribution Types

### 🐛 Bug Reports

```markdown
**Description**: Brief description
**Steps to Reproduce**:
1. Step one
2. Step two
**Expected**: What should happen
**Actual**: What actually happened
**Environment**:
- OS:
- Deno version:
- UbiCity version:
```

### ✨ Feature Requests

```markdown
**Problem**: What problem does this solve?
**Solution**: Proposed solution
**Alternatives**: Other approaches considered
**Philosophy Alignment**: How does this align with UbiCity's values?
```

### 🔧 Code Contributions

#### Type Safety Required

- **ReScript**: For business logic (compile-time type safety)
- **Rust (WASM)**: For performance-critical code
- **TypeScript**: For glue layer and I/O

#### Code Style

```bash
# Format code
just fmt  # or: deno fmt

# Lint code
just lint  # or: deno lint

# Type check
just check  # or: deno check src/**/*.ts
```

#### Testing

```bash
# Run all tests
just test  # or: deno task test

# Tests must pass
# Aim for >80% coverage for new code
```

#### Documentation

- Update README.md if adding features
- Add JSDoc comments for TypeScript
- Update CHANGELOG.md (see format below)
- Add examples to `examples/` if helpful

### 📚 Documentation

- Fix typos, improve clarity
- Add examples or tutorials
- Translate documentation (future)

## Development Setup

### Prerequisites

```bash
# Required
curl -fsSL https://deno.land/install.sh | sh  # Deno
curl https://sh.rustup.rs -sSf | sh           # Rust
npm install -g rescript                        # ReScript

# Optional (but recommended)
cargo install just                             # just
```

### Build

```bash
just setup    # One-time setup
just build    # Build ReScript + WASM
just test     # Run tests
```

### Development Workflow

```bash
# Watch mode (ReScript)
just watch-rescript

# Run CLI during development
just cli report

# Capture test experience
just capture quick
```

## Commit Guidelines

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Adding tests
- `chore`: Build process, dependencies

### Examples

```bash
feat(wasm): add Jaccard similarity calculation

Implement high-performance Jaccard similarity in Rust/WASM
for recommendation engine. 10x faster than JavaScript version.

Closes #42

---

fix(storage): handle ENOENT gracefully

loadAllExperiences() now returns empty array instead of throwing
when ubicity-data/ doesn't exist yet.

Fixes #56
```

### AI-Assisted Contributions

If you used AI tools (GitHub Copilot, Claude, etc.), disclose it:

```bash
feat(analysis): add temporal pattern detection

Implement time-of-day and day-of-week analysis.

Co-authored-by: Claude AI <claude@anthropic.com>
AI-assisted: Architecture design and initial implementation
```

## Code Review Process

### Reviewers Look For

1. **Philosophy Alignment**: Does it fit UbiCity's values?
2. **Type Safety**: Proper types in ReScript/TypeScript/Rust?
3. **Tests**: Adequate test coverage?
4. **Documentation**: Clear docs and comments?
5. **Performance**: No obvious performance issues?
6. **Security**: No vulnerabilities introduced?

### Review Timeline

- **First Response**: Within 7 days
- **Merge Decision**: Within 14 days (for simple PRs)
- **Complex PRs**: May take longer, we'll communicate

### Feedback

We strive for:
- **Constructive**: Suggestions, not just criticism
- **Educational**: Explain the "why"
- **Respectful**: See Code of Conduct

## Release Process

### Versioning

We use [Semantic Versioning](https://semver.org/):

- **Major** (v1.0.0): Breaking changes
- **Minor** (v0.3.0): New features, backward compatible
- **Patch** (v0.3.1): Bug fixes

### Changelog

Update `CHANGELOG.md` following [Keep a Changelog](https://keepachangelog.com/):

```markdown
## [Unreleased]

### Added
- New feature X

### Changed
- Improved Y

### Fixed
- Bug Z (#issue)
```

## Recognition

Contributors are recognized in:
- `git log` (commit history)
- `CHANGELOG.md` (for significant contributions)
- `.well-known/humans.txt`
- GitHub Contributors graph

## Questions?

- **GitHub Discussions**: For questions and ideas
- **GitHub Issues**: For bugs and feature requests
- **Email**: contribute@ubicity.example.org

## License

By contributing, you agree that your contributions will be licensed under:

**Dual License**:
- MIT License (permissive)
- Palimpsest v0.8 (values-aligned)

See LICENSE.txt for details.

---

Thank you for contributing to UbiCity! 🏙️

**Remember**: We're building tools to capture informal learning, not platforms to control it. Every contribution should align with that philosophy.

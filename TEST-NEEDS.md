# TEST-NEEDS.md — ubicity

## CRG Grade: C — ACHIEVED 2026-04-04

## Current Test State

| Category | Count | Notes |
|----------|-------|-------|
| TypeScript/JavaScript tests | 10+ | Multiple `.test.ts` and `.test.js` files |
| Test subjects | 5 | Core, export, mapper, privacy, schemas |
| Test framework | Present | Jest-compatible |
| Spec directory | Present | `spec/` for specification documents |

## What's Covered

- [x] Core ubicity functionality tests
- [x] Data export tests
- [x] Schema mapping tests
- [x] Privacy validation tests
- [x] Export format tests

## Still Missing (for CRG B+)

- [ ] Property-based data generation
- [ ] Fuzzing for privacy edge cases
- [ ] Performance benchmarks
- [ ] End-to-end location tracking tests

## Run Tests

```bash
cd /var/mnt/eclipse/repos/ubicity && npm test
```

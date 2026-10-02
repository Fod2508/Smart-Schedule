---
inclusion: always
---

# Skill: Test-Driven Development

Write a failing test before writing the code that makes it pass.

## The TDD Cycle

1. **RED** — Write a test that FAILS (proves it's testing something)
2. **GREEN** — Write minimal code to make it pass
3. **REFACTOR** — Clean up without changing behavior

## The Prove-It Pattern (Bug Fixes)

When a bug is reported, DO NOT start by fixing it. Start by writing a test that reproduces it:

```
Bug report → Write failing test → Implement fix → Test passes → Full suite passes
```

## Writing Good Tests

- **Test state, not interactions** — assert on outcomes, not which methods were called
- **DAMP over DRY** — each test should be self-contained and readable
- **One assertion per concept** — separate tests for separate behaviors
- **Name tests descriptively** — should read like a specification

## Prefer Real Implementations Over Mocks

Priority: Real implementation > Fake > Stub > Mock

- Use mocks only for: slow deps, non-deterministic deps, external API calls, email sending

## Red Flags

- Writing code without any corresponding tests
- Tests that pass on the first run (may not be testing what you think)
- Bug fixes without reproduction tests
- Test names that don't describe expected behavior
- Skipping tests to make the suite pass

## Verification Checklist

- [ ] Every new behavior has a corresponding test
- [ ] Full suite passes
- [ ] Bug fixes include a reproduction test that failed before the fix
- [ ] Test names describe the behavior being verified
- [ ] No tests were skipped or disabled

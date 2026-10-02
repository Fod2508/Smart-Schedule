---
inclusion: always
---

# Skill: Debugging and Error Recovery

When something breaks, stop adding features, preserve evidence, and follow this structured process.

## Stop-the-Line Rule

1. STOP adding features or making changes
2. PRESERVE evidence (error output, logs, repro steps)
3. DIAGNOSE using the triage checklist
4. FIX the root cause
5. GUARD against recurrence
6. RESUME only after verification passes

## Triage Checklist

**Step 1: Reproduce** — Make the failure happen reliably. If you can't reproduce it, you can't fix it.

**Step 2: Localize** — Narrow down WHERE: UI/Frontend, API/Backend, Database, Build tooling, External service, or the test itself.

**Step 3: Reduce** — Create the minimal failing case.

**Step 4: Fix the Root Cause** — Fix the underlying issue, not the symptom.

**Step 5: Guard Against Recurrence** — Write a test that catches this specific failure.

**Step 6: Verify End-to-End** — Run tests, build, manual spot check.

## Common Error Patterns

- `TypeError: Cannot read property 'x' of undefined` → trace where the value comes from
- Network/CORS → check URLs, headers, server CORS config
- Render error/white screen → check error boundary, console, component tree
- Unexpected behavior (no error) → add logging at key points

## Red Flags

- Skipping a failing test to work on new features
- Guessing at fixes without reproducing the bug
- Fixing symptoms instead of root causes
- No regression test added after a bug fix

## Verification Checklist

- [ ] Root cause is identified
- [ ] Fix addresses root cause, not symptoms
- [ ] A regression test exists that fails without the fix
- [ ] All existing tests pass
- [ ] Build succeeds
- [ ] Original bug scenario verified end-to-end

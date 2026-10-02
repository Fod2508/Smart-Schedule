---
inclusion: always
---

# Skill: Incremental Implementation

Build in thin vertical slices — implement one piece, test it, verify it, then expand.

## The Increment Cycle

1. **Implement** the smallest complete piece of functionality
2. **Test** — run the test suite
3. **Verify** — tests pass, build succeeds, manual check
4. **Commit** — save progress with a descriptive message
5. **Move to the next slice**

## Simplicity First — Ask Before Writing

- Can this be done in fewer lines?
- Are these abstractions earning their complexity?
- Am I building for hypothetical future requirements?
- Three similar lines of code is better than a premature abstraction.

## Scope Discipline — Touch Only What the Task Requires

Do NOT:

- "Clean up" code adjacent to your change
- Refactor imports in files you're not modifying
- Add features not in the spec because they "seem useful"

If you notice something worth improving outside your task scope, note it — don't fix it.

## Implementation Rules

- **Rule 1:** One thing at a time — don't mix concerns
- **Rule 2:** Keep it compilable — existing tests must pass after each slice
- **Rule 3:** Feature flags for incomplete features
- **Rule 4:** Safe defaults — new code defaults to conservative behavior
- **Rule 5:** Rollback-friendly — each increment should be independently revertable

## Red Flags

- More than 100 lines of code written without running tests
- Multiple unrelated changes in a single increment
- "Let me just quickly add this too" scope expansion
- Build or tests broken between increments
- Building abstractions before the third use case demands it

## Verification Checklist

- [ ] Each increment was individually tested and committed
- [ ] The full test suite passes
- [ ] The build is clean
- [ ] The feature works end-to-end as specified
- [ ] No uncommitted changes remain

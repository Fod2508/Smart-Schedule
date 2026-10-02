---
inclusion: always
---

# Skill: Code Simplification

Simplify code by reducing complexity while preserving exact behavior.

## The Five Principles

1. **Preserve Behavior Exactly** — same inputs, outputs, side effects, error behavior
2. **Follow Project Conventions** — match the codebase, not external preferences
3. **Prefer Clarity Over Cleverness** — explicit is better than compact
4. **Maintain Balance** — don't over-simplify; some abstractions exist for good reasons
5. **Scope to What Changed** — avoid drive-by refactors of unrelated code

## Understand Before Touching (Chesterton's Fence)

Before changing or removing anything, understand why it exists. Check git blame. If you can't explain why it was written that way, read more context first.

## Simplification Opportunities

### Structural

| Pattern                    | Simplification                            |
| -------------------------- | ----------------------------------------- |
| Deep nesting (3+ levels)   | Extract guard clauses or helper functions |
| Long functions (50+ lines) | Split into focused functions              |
| Nested ternaries           | Replace with if/else or lookup objects    |
| Boolean parameter flags    | Replace with options objects              |

### Naming

| Pattern                                  | Simplification                |
| ---------------------------------------- | ----------------------------- |
| Generic names (`data`, `result`, `temp`) | Rename to describe content    |
| Comments explaining "what"               | Delete — code is clear enough |
| Comments explaining "why"                | Keep — they carry intent      |

### Redundancy

| Pattern                     | Simplification                     |
| --------------------------- | ---------------------------------- |
| Duplicated logic (5+ lines) | Extract to shared function         |
| Dead code                   | Remove after confirming truly dead |
| Unnecessary abstractions    | Inline the wrapper                 |

## Process

1. Understand the code (Step 1: Chesterton's Fence)
2. Identify opportunities
3. Apply one change at a time
4. Run tests after each change
5. Verify the result is genuinely clearer

**Submit refactoring changes separately from feature/bug fix changes.**

## Red Flags

- Simplification that requires modifying tests to pass (you changed behavior)
- "Simplified" code that is longer and harder to follow
- Renaming things to match your preferences rather than project conventions
- Removing error handling "to make it cleaner"
- Simplifying code you don't fully understand

## Verification Checklist

- [ ] All existing tests pass without modification
- [ ] Build succeeds with no new warnings
- [ ] Each simplification is a reviewable, incremental change
- [ ] No error handling was removed or weakened
- [ ] A teammate would approve this as a net improvement

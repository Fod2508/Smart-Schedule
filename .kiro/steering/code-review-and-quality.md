---
inclusion: always
---

# Skill: Code Review and Quality

Multi-dimensional review before any code is finalized. Every change gets reviewed across five axes.

## The Five-Axis Review

### 1. Correctness

- Does it match requirements?
- Are edge cases handled (null, empty, boundary values)?
- Are error paths handled?
- Are there race conditions or state inconsistencies?

### 2. Readability & Simplicity

- Are names descriptive and consistent? (No `temp`, `data`, `result` without context)
- Could this be done in fewer lines?
- Are abstractions earning their complexity?
- Is a new conditional bolted onto an unrelated flow? (design smell)

### 3. Architecture

- Does it follow existing patterns?
- Is there code duplication that should be shared?
- Does a refactor reduce complexity or just relocate it?
- Is feature-specific logic leaking into shared modules?

### 4. Security

- Is user input validated and sanitized?
- Are secrets kept out of code, logs, and version control?
- Are SQL queries parameterized?
- Is data from external sources treated as untrusted?

### 5. Performance

- Any N+1 query patterns?
- Any unbounded loops or unconstrained data fetching?
- Any unnecessary re-renders in UI components?
- Missing pagination on list endpoints?

## Change Sizing

- ~100 lines → Good, reviewable in one sitting
- ~300 lines → Acceptable for a single logical change
- ~1000 lines → Too large, split it

## Severity Labels for Findings

| Prefix        | Meaning                         |
| ------------- | ------------------------------- |
| (no prefix)   | Required change                 |
| **Critical:** | Blocks merge                    |
| **Nit:**      | Minor, optional                 |
| **Optional:** | Worth considering, not required |
| **FYI**       | Informational only              |

## Red Flags

- PRs merged without any review
- Large PRs "too big to review properly" (split them)
- No regression tests with bug fix PRs
- A bulk dependency bump with no changelog review
- New conditionals scattered into unrelated code paths

## Verification Checklist

- [ ] All Critical issues resolved
- [ ] All Required changes resolved
- [ ] Tests pass, build succeeds
- [ ] Verification story documented

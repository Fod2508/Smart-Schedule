---
inclusion: always
---

# Skill: Planning and Task Breakdown

Decompose work into small, verifiable tasks with explicit acceptance criteria before implementing.

## When to Use

- You have a spec and need to break it into implementable units
- A task feels too large or vague to start
- The implementation order isn't obvious

## The Planning Process

### Step 1: Enter Plan Mode (Read-only, NO code)

Read spec, identify existing patterns, map dependencies, note risks.

### Step 2: Identify Dependency Graph

Build foundations first — schema → types → API → frontend.

### Step 3: Slice Vertically (preferred)

Each slice = one complete working feature path through the stack.

- ❌ Bad: All DB, then all API, then all UI
- ✅ Good: Task creation (DB + API + UI), then Task listing, etc.

### Step 4: Task Structure

```markdown
## Task N: Short title

**Description:** What this accomplishes.
**Acceptance criteria:**

- [ ] Specific, testable condition
      **Verification:** Test command / build / manual check
      **Dependencies:** Task numbers or "None"
      **Files likely touched:** list
      **Estimated scope:** Small (1-2) / Medium (3-5) / Large (5+)
```

### Step 5: Add Checkpoints Every 2-3 Tasks

## Task Sizing

| Size | Files | Action             |
| ---- | ----- | ------------------ |
| XS   | 1     | Fine               |
| S    | 1-2   | Fine               |
| M    | 3-5   | Fine               |
| L    | 5-8   | Consider splitting |
| XL   | 8+    | **Must split**     |

## Red Flags

- Tasks without acceptance criteria
- Tasks saying "implement the feature" with no specifics
- No checkpoints between major phases
- Dependency order not considered

## Verification Checklist

- [ ] Every task has acceptance criteria and a verification step
- [ ] Task dependencies are identified and ordered
- [ ] No task touches more than ~5 files
- [ ] Checkpoints exist between major phases
- [ ] Human has reviewed and approved the plan

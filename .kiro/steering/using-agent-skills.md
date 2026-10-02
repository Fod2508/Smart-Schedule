---
inclusion: always
---

# Skill Routing: Which Skill to Use When

## Intent → Skill Mapping

| When the task is...                   | Use this skill                      |
| ------------------------------------- | ----------------------------------- |
| Don't know what you want yet          | `interview-me`                      |
| Have a rough concept, need variants   | `idea-refine`                       |
| New feature, requirements unclear     | `spec-driven-development`           |
| Have spec, need task breakdown        | `planning-and-task-breakdown`       |
| Implementing code (multi-file)        | `incremental-implementation`        |
| Building UI components                | `frontend-ui-engineering`           |
| Designing APIs or interfaces          | `api-and-interface-design`          |
| Need doc-verified framework code      | `source-driven-development`         |
| High stakes / unfamiliar code         | `doubt-driven-development`          |
| Writing or running tests              | `test-driven-development`           |
| Debugging browser UI                  | `browser-testing-with-devtools`     |
| Something broke                       | `debugging-and-error-recovery`      |
| Reviewing code before merge           | `code-review-and-quality`           |
| Code is too complex                   | `code-simplification`               |
| Security concerns                     | `security-and-hardening`            |
| Performance concerns                  | `performance-optimization`          |
| Committing or branching               | `git-workflow-and-versioning`       |
| Setting up CI/CD                      | `ci-cd-and-automation`              |
| Deprecating/migrating old code        | `deprecation-and-migration`         |
| Writing docs or ADRs                  | `documentation-and-adrs`            |
| Adding logs/metrics/alerts            | `observability-and-instrumentation` |
| Deploying or launching                | `shipping-and-launch`               |
| No quality bar written down           | `constraint-driven-development`     |
| Context for better context management | `context-engineering`               |

## Core Behaviors (Always Active)

### 1. Surface Assumptions

```
ASSUMPTIONS I'M MAKING:
1. [assumption]
2. [assumption]
→ Correct me now or I'll proceed with these.
```

### 2. Manage Confusion Actively

When confused: STOP → name the confusion → ask → wait for resolution.
Never guess silently and proceed.

### 3. Push Back When Warranted

Point out issues directly with concrete downsides. Quantify when possible ("adds ~200ms" not "might be slower"). Sycophancy is a failure mode.

### 4. Enforce Simplicity

Before finishing any implementation:

- Can this be done in fewer lines?
- Are these abstractions earning their complexity?
- Would a staff engineer say "why didn't you just..."?

### 5. Scope Discipline

Touch only what the task requires. No unsolicited refactors, cleanup, or feature additions.

### 6. Verify, Don't Assume

A task is not complete until verification passes. "Seems right" is never sufficient — there must be evidence.

## Failure Modes to Avoid

1. Making wrong assumptions without surfacing them
2. Plowing ahead when confused or lost
3. Not presenting trade-offs on non-obvious decisions
4. Being sycophantic to approaches with clear problems
5. Overcomplicating code and APIs
6. Modifying code orthogonal to the task
7. Building without a spec because "it's obvious"
8. Skipping verification because "it looks right"

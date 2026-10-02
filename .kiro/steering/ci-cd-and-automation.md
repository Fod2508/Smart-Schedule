---
inclusion: always
---

# Skill: CI/CD and Automation

Automate quality gates so no change reaches production without passing tests, lint, type checking, and build.

## The Quality Gate Pipeline

Every change goes through these gates before merge:

1. Lint check
2. Type check (`tsc --noEmit`)
3. Unit tests
4. Build
5. Integration tests
6. Security audit (`npm audit`)

**No gate can be skipped.** Fix the issue, don't disable the check.

## CI Feeding Back to Agents

When CI fails:

1. Copy the specific error output
2. Feed it to the agent: "The CI pipeline failed with: [paste error]"
3. Agent fixes → pushes → CI runs again

## Feature Flags

Deploy behind feature flags to decouple deployment from release:

- Ship code without enabling it
- Roll back by disabling the flag (no redeploy)
- Canary new features: 1% → 10% → 100%
- Set a cleanup date when creating (max 2 weeks after full rollout)

## Deployment Strategies

```
PR merged → Staging (auto) → Manual verification → Production (manual or auto)
    ↓
Monitor for 15 min → Errors? Rollback : Done
```

## Environment Management

- `.env.example` → committed (template)
- `.env` → NOT committed (local only)
- Secrets → GitHub Secrets / vault (never in code)

## CI Optimization (when >10 min)

1. Cache dependencies
2. Run jobs in parallel (lint, types, tests, build)
3. Only run what changed (path filters)
4. Shard test suites across runners

## Red Flags

- No CI pipeline in the project
- CI failures ignored or silenced
- Tests disabled in CI to make the pipeline pass
- Production deploys without staging verification
- No rollback mechanism
- Secrets in code or CI config files

## Verification Checklist

- [ ] All quality gates present (lint, types, tests, build, audit)
- [ ] Pipeline runs on every PR
- [ ] Failures block merge
- [ ] Secrets in secrets manager, not in code
- [ ] Deployment has rollback mechanism

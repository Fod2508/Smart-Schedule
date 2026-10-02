---
inclusion: always
---

# Skill: Deprecation and Migration

Code is a liability, not an asset. Every line has ongoing maintenance cost. Remove code that no longer earns its keep.

## The Deprecation Decision

Before deprecating, answer:

1. Does this still provide unique value? If yes, maintain it.
2. How many consumers depend on it?
3. Does a replacement exist? (If no — build it first, don't deprecate without an alternative)
4. What's the migration cost?
5. What's the ongoing maintenance cost of NOT deprecating?

## The Migration Process

1. **Build the replacement first** — proven in production, documented
2. **Announce with migration guide** — status, replacement, reason, steps
3. **Migrate incrementally** — one consumer at a time
4. **Remove only after zero active usage** — verify with metrics/logs

## Database Schema Migrations (Expand/Contract)

**Never rename or drop a column in place.** Use expand/contract:

```
EXPAND → MIGRATE → CONTRACT
(add new column)  (backfill + dual-write)  (drop old column, separate deploy)
```

Rules:

- Additive first, destructive last (in its own deploy)
- Every migration has a tested rollback path
- Backfill in batches, never a single UPDATE on millions of rows
- Build large indexes without blocking writes (e.g. `CREATE INDEX CONCURRENTLY`)

## Zombie Code

Code nobody owns but everybody depends on. Either:

- Assign an owner and maintain it properly, OR
- Deprecate with a concrete migration plan

## Red Flags

- Deprecated systems with no replacement available
- "We'll migrate on their own" (they won't — provide tooling)
- A column renamed or dropped in place (not via expand/contract)
- A migration merged with no tested rollback path
- A backfill that locks the table

## Verification Checklist

- [ ] Replacement is production-proven
- [ ] Migration guide exists with concrete steps
- [ ] All active consumers migrated (verified by metrics/logs)
- [ ] Old code, tests, docs fully removed
- [ ] Schema changes ship in additive phases, not single in-place edits
- [ ] Each migration has a tested down path

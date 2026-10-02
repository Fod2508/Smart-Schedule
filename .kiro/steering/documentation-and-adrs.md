---
inclusion: always
---

# Skill: Documentation and ADRs

Document decisions, not just code. The most valuable documentation captures the _why_.

## When to Write an ADR (Architecture Decision Record)

- Choosing a framework, library, or major dependency
- Designing a data model or database schema
- Selecting an authentication strategy
- Any decision that would be expensive to reverse

## ADR Template

Store in `docs/decisions/` with sequential numbering:

```markdown
# ADR-001: [Decision Title]

## Status

Accepted | Superseded by ADR-XXX | Deprecated

## Date

YYYY-MM-DD

## Context

[Requirements and constraints that drove this decision]

## Decision

[What was decided]

## Alternatives Considered

[What else was considered and why rejected]

## Consequences

[Trade-offs, impacts, follow-ups]
```

## Inline Documentation Rules

### Comment the WHY, not the WHAT

```typescript
// BAD: restates the code
// Increment counter
counter += 1;

// GOOD: explains non-obvious intent
// Sliding window to prevent burst attacks at window edges
if (now - windowStart > WINDOW_SIZE_MS) { ... }
```

### Never:

- Comment self-explanatory code
- Leave `// TODO: add error handling` — just add it
- Leave commented-out code — delete it (git has history)

### Always document:

- Known gotchas that will trap future developers
- Why something is done a non-obvious way
- Links to relevant ADRs

## README Must Cover

1. Quick start (clone → install → run)
2. Available commands with descriptions
3. Architecture overview
4. Contributing guide

## Red Flags

- Architectural decisions with no written rationale
- `TODO` comments that have been there for weeks
- Commented-out code instead of deletion
- No ADRs in a project with significant architectural choices
- Documentation that restates the code instead of explaining intent

## Verification Checklist

- [ ] ADRs exist for significant architectural decisions
- [ ] README covers quick start, commands, architecture
- [ ] Known gotchas are documented inline
- [ ] No commented-out code

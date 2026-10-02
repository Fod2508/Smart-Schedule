---
inclusion: always
---

# Skill: Context Engineering

Feed agents the right information at the right time. Context quality is the single biggest lever for output quality.

## The Context Hierarchy

1. **Rules Files** (CLAUDE.md, .kiro/steering/) — always loaded, project-wide
2. **Spec / Architecture Docs** — loaded per feature/session
3. **Relevant Source Files** — loaded per task
4. **Error Output / Test Results** — loaded per iteration
5. **Conversation History** — accumulates, needs management

## Rules Files — Highest Leverage

Every project should have a rules file covering:

- Tech stack with versions
- Build, test, lint, dev commands
- Code conventions (with a real code example)
- Boundaries (Always do / Ask first / Never do)
- Common patterns in the codebase

## Loading Context Efficiently

- Load the relevant spec **section**, not the entire spec
- Before editing a file, **read it** first
- Find one example of the pattern you're following in the existing codebase
- Feed **specific** error output, not entire test logs

## Context Budget Management

- Start trimming at **75% capacity**, not 100%
- **Cut first:** failed attempts, verbose tool output, replaced code drafts
- **Protect:** current error message, active task, key constraints
- **Compress** before dropping — summarize decisions, don't delete them
- Put task-critical content **last** in context (models recall start and end best)

## Anti-Patterns

| Anti-Pattern                                | Fix                                                |
| ------------------------------------------- | -------------------------------------------------- |
| Context starvation                          | Load rules file + relevant source before each task |
| Context flooding (>5000 lines for one task) | Include only what's relevant, aim for <2000 lines  |
| Stale context                               | Start fresh sessions when switching major features |
| Missing examples                            | Include one example of the pattern to follow       |
| Silent confusion                            | Surface ambiguity explicitly — ask don't guess     |

## When You're Confused

Surface conflicts immediately:

```
CONFUSION:
Spec says X but existing code does Y.
Options: A) follow spec, B) match existing code.
Which approach should I take?
```

## Verification Checklist

- [ ] Rules file exists covering stack, commands, conventions, boundaries
- [ ] Agent output follows project patterns (not hallucinated ones)
- [ ] Context refreshed when switching major tasks
- [ ] Failed attempts and replaced drafts removed in long sessions

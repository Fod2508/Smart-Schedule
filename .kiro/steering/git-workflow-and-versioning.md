---
inclusion: always
---

# Skill: Git Workflow and Versioning

Git is your safety net. Treat commits as save points, branches as sandboxes, and history as documentation.

## Core Principles

### 1. Commit Early, Commit Often

Each successful increment gets its own commit. Don't accumulate large uncommitted changes.

### 2. Atomic Commits

Each commit does one logical thing:

```
feat: add task creation endpoint with validation
fix: handle null user in task list query
refactor: extract validation logic to shared utility
```

### 3. Descriptive Messages

Format: `<type>: <short description>`
Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`

### 4. Separate Concerns

- Don't combine formatting changes with behavior changes
- Don't combine refactors with features
- Each type of change = separate commit

### 5. Size Your Changes

- ~100 lines → Easy to review
- ~300 lines → Acceptable for one logical change
- ~1000 lines → Split it

## Pre-Commit Hygiene

Before every commit:

1. Check what you're about to commit: `git diff --staged`
2. Ensure no secrets in the diff
3. Run tests
4. Run linting
5. Run type checking

## Change Summaries

After any modification, provide:

```
CHANGES MADE:
- file.ts: what changed

THINGS I DIDN'T TOUCH (intentionally):
- other-file.ts: what was noticed but left alone

POTENTIAL CONCERNS:
- Any breaking changes or unusual decisions
```

## Semantic Versioning

- **MAJOR** → breaking change (consumers must update their code)
- **MINOR** → new functionality, backward-compatible
- **PATCH** → bug fix, backward-compatible

## Red Flags

- Large uncommitted changes accumulating
- Commit messages like "fix", "update", "misc"
- Formatting changes mixed with behavior changes
- No `.gitignore` in the project
- Committing `.env`, `node_modules/`, or build artifacts
- Force-pushing to shared branches

## Verification Checklist (Every Commit)

- [ ] Commit does one logical thing
- [ ] Message follows type conventions
- [ ] Tests pass before committing
- [ ] No secrets in the diff
- [ ] No formatting mixed with behavior changes

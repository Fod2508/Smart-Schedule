---
inclusion: always
---

# Skill: Constraint-Driven Development

Define what "good enough to ship" means in writing before anyone argues about it in a pull request.

## What This Produces

A `CONSTRAINTS.md` file at the repo root — readable by every agent and human, changes show up in review.

## The Floor (Always Enforced, No Setup Required)

- No new suppression comments: `@ts-ignore`, `eslint-disable`, `# noqa`
- No unimplemented stubs: `throw new Error("Not implemented")`, empty `catch {}`
- No skipped or deleted tests without a reason in the commit message
- No secrets in source
- `CONSTRAINTS.md` itself does not get weakened to make a change pass

## Sane Defaults (When No Number Exists)

| Constraint                 | Default                              |
| -------------------------- | ------------------------------------ |
| Coverage of changed lines  | ≥ 80%                                |
| Project coverage           | today's value, must not fall         |
| Dependency vulnerabilities | nothing at high or above             |
| LCP                        | ≤ 2500 ms                            |
| Accessibility              | zero critical/serious axe violations |

## Guard the Bar Itself

Watch for these in diffs — agents take the cheapest road to green:

1. Threshold moved down or check removed
2. Test got easier (`.skip` added, assertions removed)
3. Checker silenced (`@ts-ignore`, `eslint-disable`, `istanbul ignore`)
4. Work is unfinished (stubs that throw, empty catch blocks)
5. New exception appeared with no discussion

## Rule: Scope Checks to the Diff

Check the lines **this change touched**, not the whole repo. Coverage of changed lines is a number the agent can move; inherited project coverage is not.

## Red Flags

- A threshold was lowered to make a change pass
- An agent proposed relaxing a constraint instead of fixing the code
- Every constraint is checked by the project's own tests with no external opinion
- `CONSTRAINTS.md` changed in the same commit as the feature that was failing

## Verification Checklist

- [ ] `CONSTRAINTS.md` exists, every number has a stated reason
- [ ] The floor is enforced and passes on current codebase
- [ ] At least one constraint is external (not judged by this project's own tests)
- [ ] Exceptions have an owner and expiry date
- [ ] `AGENTS.md` or rules file points at `CONSTRAINTS.md`

---
inclusion: always
---

# Skill: Spec-Driven Development

Write a structured specification before writing any code.

## When to Use

- Starting a new project or feature
- Requirements are ambiguous or incomplete
- The change touches multiple files or modules
- The task would take more than 30 minutes to implement

**When NOT to use:** Single-line fixes, typo corrections, or changes where requirements are unambiguous and self-contained.

## The Gated Workflow

```
SPECIFY → PLAN → TASKS → IMPLEMENT
```

Do not advance to the next phase until the current one is validated by the human.

## Surface Assumptions Immediately

Before writing any spec content, list what you're assuming:

```
ASSUMPTIONS I'M MAKING:
1. This is a web application (not native mobile)
2. Authentication uses X pattern
3. The database is Y
→ Correct me now or I'll proceed with these.
```

## Spec Document — Six Core Areas

1. **Objective** — What are we building and why? Who is the user?
2. **Commands** — Full executable commands (build, test, lint, dev)
3. **Project Structure** — Where code, tests, docs live
4. **Code Style** — One real code snippet beats three paragraphs
5. **Testing Strategy** — Framework, test locations, coverage expectations
6. **Boundaries** — Always do / Ask first / Never do

## Red Flags

- Starting to write code without any written requirements
- Making architectural decisions without documenting them
- Implementing features not mentioned in any spec

## Verification Checklist

- [ ] Spec covers all six core areas
- [ ] Human has reviewed and approved the spec
- [ ] Success criteria are specific and testable
- [ ] Boundaries (Always/Ask First/Never) are defined

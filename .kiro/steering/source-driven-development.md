---
inclusion: always
---

# Skill: Source-Driven Development

Every framework-specific code decision must be backed by official documentation. Don't implement from memory — verify, cite, and show sources.

## When to Use

- Building with any framework where the correct approach matters
- Implementing forms, routing, data fetching, state management, auth
- Reviewing or improving code that uses framework-specific patterns

## The Process

1. **DETECT** — Read `package.json` for exact versions
2. **FETCH** — Get the specific docs page (not homepage, specific feature page)
3. **IMPLEMENT** — Follow documented patterns
4. **CITE** — Link sources in comments

## Source Hierarchy

1. Official documentation (react.dev, docs.djangoproject.com, etc.)
2. Official blog / changelog
3. Web standards (MDN, web.dev)
4. Browser compatibility (caniuse.com)

**Never cite:** Stack Overflow, blog posts, or your own training data as primary sources.

## Cite Your Sources

```typescript
// React 19 form handling with useActionState
// Source: https://react.dev/reference/react/useActionState#usage
const [state, formAction, isPending] = useActionState(
  submitOrder,
  initialState,
);
```

## When Docs Conflict with Existing Code

Surface it explicitly:

```
CONFLICT DETECTED:
Existing code uses [old pattern] but current docs recommend [new pattern].
Options: A) use modern pattern, B) match existing code.
Which do you prefer?
```

## If You Can't Find Documentation

Say so explicitly:

```
UNVERIFIED: Could not find official docs for this pattern.
Based on training data, may be outdated. Verify before production use.
```

## Red Flags

- Writing framework-specific code without checking version-specific docs
- Using "I believe" or "I think" about an API
- Citing Stack Overflow or blogs as primary sources
- Using deprecated APIs found in training data

## Verification Checklist

- [ ] Framework versions identified from dependency file
- [ ] Official docs fetched for framework-specific patterns
- [ ] All sources are official documentation
- [ ] Code follows current version's documented patterns
- [ ] Non-obvious decisions include source citations with full URLs
- [ ] Conflicts between docs and existing code surfaced to user

---
inclusion: always
---

# Skill: Performance Optimization

Measure before optimizing. Profile first, identify the actual bottleneck, fix it, measure again.

## The Optimization Workflow

1. **MEASURE** → Establish baseline with real data
2. **IDENTIFY** → Find the actual bottleneck (not assumed)
3. **FIX** → Address the specific bottleneck
4. **VERIFY** → Measure again; keep or revert
5. **GUARD** → Add monitoring or tests to prevent regression

## Core Web Vitals Targets

| Metric                          | Good    |
| ------------------------------- | ------- |
| LCP (Largest Contentful Paint)  | ≤ 2.5s  |
| INP (Interaction to Next Paint) | ≤ 200ms |
| CLS (Cumulative Layout Shift)   | ≤ 0.1   |

## Common Anti-Patterns to Fix

### N+1 Queries

```typescript
// BAD: one query per item
for (const task of tasks) {
  task.owner = await db.users.findUnique({ where: { id: task.ownerId } });
}
// GOOD: single query with join
const tasks = await db.tasks.findMany({ include: { owner: true } });
```

### Unbounded Data Fetching

Always paginate list endpoints — never fetch all records.

### Missing Image Optimization

- Add `width` and `height` to all images
- Use `loading="lazy"` for below-the-fold images
- Use `fetchpriority="high"` for LCP images
- Serve WebP/AVIF formats

### Unnecessary Re-renders (React)

- Use stable references for objects/arrays passed as props
- `React.memo` for expensive components
- `useMemo` for expensive computations

## Step 4: Keep or Revert

A fix is a hypothesis until you re-measure. Neutral changes are a **revert**, not a keep. Code you keep, you maintain forever — make it pay for itself.

## Red Flags

- Optimization without profiling data
- N+1 query patterns in data fetching
- List endpoints without pagination
- Bundle size growing without review
- Several optimizations bundled into one measurement

## Verification Checklist

- [ ] Before and after measurements exist (specific numbers)
- [ ] The improvement exceeds run-to-run variance
- [ ] Changes that didn't beat the baseline were reverted
- [ ] Core Web Vitals are within "Good" thresholds
- [ ] No N+1 queries in new data fetching code
- [ ] Existing tests still pass

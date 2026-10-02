---
inclusion: always
---

# Skill: Shipping and Launch

Ship with confidence — deploy safely, with monitoring in place, a rollback plan ready, and clear success criteria.

## Pre-Launch Checklist

### Code Quality

- [ ] All tests pass (unit, integration, e2e)
- [ ] Build succeeds with no warnings
- [ ] No `console.log` debugging in production code
- [ ] Error handling covers expected failure modes

### Security

- [ ] No secrets in code or version control
- [ ] Input validation on all user-facing endpoints
- [ ] Authentication and authorization checks in place
- [ ] Rate limiting on authentication endpoints

### Performance

- [ ] Core Web Vitals within "Good" thresholds
- [ ] No N+1 queries in critical paths
- [ ] Bundle size within budget

### Accessibility

- [ ] Keyboard navigation works for all interactive elements
- [ ] Color contrast meets WCAG 2.1 AA

## Feature Flag Strategy

Ship behind feature flags to decouple deployment from release:

1. **DEPLOY** with flag OFF → code is in production but inactive
2. **ENABLE** for team/beta → internal testing in production
3. **GRADUAL ROLLOUT** → 5% → 25% → 50% → 100% of users
4. **MONITOR** at each stage
5. **CLEAN UP** → remove flag after full rollout (within 2 weeks)

## Staged Rollout Decision Thresholds

| Metric           | Advance (green)        | Roll back (red)     |
| ---------------- | ---------------------- | ------------------- |
| Error rate       | Within 10% of baseline | >2x baseline        |
| P95 latency      | Within 20% of baseline | >50% above baseline |
| Business metrics | Neutral or positive    | Decline >5%         |

## Post-Launch Verification (First Hour)

1. Check health endpoint returns 200
2. Check error monitoring (no new error types)
3. Check latency (no regression)
4. Test the critical user flow manually
5. Verify logs are flowing

## Rollback Strategy

Every deployment needs a rollback plan before it happens. Document:

- Trigger conditions (when to roll back)
- Rollback steps (feature flag disable OR redeploy previous version)
- Database considerations
- Time to rollback

## Red Flags

- Deploying without a rollback plan
- No monitoring or error reporting in production
- Big-bang releases with no staging
- Feature flags with no expiration or owner
- No one monitoring the deploy for the first hour
- "It's Friday afternoon, let's ship it"

## Verification Checklist (Before Deploy)

- [ ] Pre-launch checklist completed
- [ ] Feature flag configured (if applicable)
- [ ] Rollback plan documented
- [ ] Monitoring dashboards set up
- [ ] Team notified

## Verification Checklist (After Deploy)

- [ ] Health check returns 200
- [ ] Error rate is normal
- [ ] Latency is normal
- [ ] Critical user flow works

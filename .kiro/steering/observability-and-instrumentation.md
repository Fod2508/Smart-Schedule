---
inclusion: always
---

# Skill: Observability and Instrumentation

Instrument code so production behavior is visible and diagnosable. Instrument alongside the feature, not after.

## Before Instrumenting — Define "Working"

Write 2-4 questions an on-call engineer will ask about this feature. Every signal must answer one of those questions.

## Pick the Right Signal

| Signal         | Answers                                | When                |
| -------------- | -------------------------------------- | ------------------- |
| Structured log | "What happened in this specific case?" | Per-event details   |
| Metric         | "How often / how fast?"                | Aggregates, trends  |
| Trace          | "Where did time go?"                   | Cross-service flows |

Metrics tell you **that** something is wrong, traces tell you **where**, logs tell you **why**.

## Structured Logging

```typescript
// BAD: string interpolation — unqueryable
logger.info(`Payment ${id} failed for user ${userId}`);

// GOOD: stable event name + structured fields
logger.warn(
  { event: "payment_failed", paymentId: id, errorCode: err.code },
  "payment failed",
);
```

**Log levels:**

- `error` → invariant broken, someone must act
- `warn` → degraded but handled (retry succeeded, fallback used)
- `info` → significant business event
- `debug` → off in production by default

**Always include a correlation/request ID** on every log line, span, and outbound call.

**Never log:** secrets, tokens, passwords, or full PII.

## Alerting Rules

Alert on **symptoms users feel**, not on causes:

- ✅ Page-worthy: error rate > 1%, p99 latency > 2s, queue age > 10 min
- ❌ Dashboard only: CPU at 85%, one pod restarted, disk at 70%

Every alert must:

1. Be actionable (if response is "ignore it", delete the alert)
2. Link to a runbook
3. Have a threshold justified by SLO or historical data

## Red Flags

- A feature PR with retries or external calls and zero new telemetry
- Log lines built by string interpolation
- No correlation ID — each log line is an orphan
- Alerts that fire daily and get acknowledged without action
- Secrets or request bodies appearing in logs

## Verification Checklist

- [ ] On-call questions are written down; each signal answers one
- [ ] All logs are structured with stable event names and correlation ID
- [ ] No secrets or PII in any log line
- [ ] Every new alert is symptom-based and has a runbook link
- [ ] An induced failure in staging was found via telemetry alone

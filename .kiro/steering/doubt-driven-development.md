---
inclusion: always
---

# Skill: Doubt-Driven Development

A confident answer is not a correct one. Subject every non-trivial decision to adversarial review before it stands.

## When a Decision is "Non-Trivial"

At least one of these is true:

- Introduces or modifies branching logic
- Crosses a module or service boundary
- Asserts a property the compiler cannot verify (thread safety, idempotence, ordering)
- Its blast radius is irreversible (production deploy, data migration, public API change)

## The Doubt Cycle

```
Step 1: CLAIM   — name the decision and why it matters
Step 2: EXTRACT — isolate artifact + contract, strip your reasoning
Step 3: DOUBT   — invoke fresh-context reviewer with adversarial prompt
Step 4: RECONCILE — classify every finding against the artifact
Step 5: STOP    — when findings are trivial, after 3 cycles, or user says "ship it"
```

### Step 1: CLAIM

```
CLAIM: "The caching layer is thread-safe under the read-heavy workload."
WHY THIS MATTERS: A race here corrupts user data and is hard to detect in QA.
```

### Step 2: EXTRACT

Provide ARTIFACT + CONTRACT only. Strip your reasoning — if you hand over conclusions, you get back validation of your conclusions.

### Step 3: DOUBT (Adversarial Prompt)

```
Adversarial review. Find what is wrong with this artifact.
Assume the author is overconfident. Look for:
- Unstated assumptions
- Edge cases not handled
- Hidden coupling or shared state
- Ways the contract could be violated
- Failure modes under unexpected input

Do NOT validate. Do NOT summarize. Find issues only.

ARTIFACT: <paste>
CONTRACT: <paste>
```

### Step 4: RECONCILE

Classify each finding (in this order):

1. **Contract misread** → fix the contract, re-run
2. **Valid + actionable** → change the artifact, re-loop
3. **Valid trade-off** → document explicitly, user must see it
4. **Noise** → note it, move on

### Step 5: STOP

Stop when: trivial findings, 3 cycles completed, or user says "ship it".
If 3 cycles and still substantive issues → surface to user, don't loop a 4th time alone.

## Red Flags

- Applying doubt to a one-line rename or formatting change (overkill)
- Treating reviewer output as authoritative without re-reading the artifact
- Looping >3 cycles without escalating to user
- Prompting reviewer with "is this good?" instead of "find issues"
- Skipping doubt under time pressure on a high-stakes decision

## Verification Checklist

- [ ] Every non-trivial decision was named as a CLAIM before standing
- [ ] Reviewer received ARTIFACT + CONTRACT (not your reasoning or conclusion)
- [ ] Reviewer prompt was adversarial ("find issues"), not validating
- [ ] Findings were classified against the artifact text, not rubber-stamped
- [ ] A stop condition was met

---
inclusion: always
---

# Skill: Interview Me

Extract what the user actually wants instead of what they think they should want. Ask one question at a time until ~95% confidence.

## When to Use

- The ask is missing: **who** the user is, **why** they want it, what **success** looks like, what the binding **constraint** is
- You're tempted to start with assumptions you haven't surfaced
- User says: "interview me", "grill me", "are we sure?", "stress-test my thinking"

## The Process

### Step 1: Hypothesize First

Before asking anything, state your current read + confidence:

```
HYPOTHESIS: You want X for Y reason.
CONFIDENCE: ~30% — missing: who it's for, what success looks like
```

If confidence is below ~70%, add a one-line reason explaining what's still unresolved.

### Step 2: One Question at a Time, With Your Guess

```
Q: <one focused question>
GUESS: <your hypothesis for the answer, with reasoning>
```

Wait for the user to react before asking the next question.

### Step 3: Listen for "Want vs Should Want"

Watch for sophistication-signaling answers: "scalable", "clean", "modern", "best practice". Ask:

> "If you didn't have to justify this to anyone, what would you actually want?"

### Step 4: Restate Intent

When confidence is high, write back:

```
Here's what I now think you want:
- Outcome:      [one line]
- User:         [one line]
- Why now:      [one line]
- Success:      [one line]
- Constraint:   [one line]
- Out of scope: [one line — non-negotiable, half of misalignment is non-goals]

Yes / no / refine?
```

### Step 5: Get Explicit Confirmation

These are NOT "yes":

- "Whatever you think" → Re-ask with two concrete options
- "Sounds good" → Ask "Anything you'd refine?"
- Silence → Something was missed

### Step 6: STOP After Confirmation

When user confirms: deliver the intent, offer next steps (save doc / spec / plan), then **STOP**. Do NOT start implementation in the same turn.

## The 95% Confidence Stop

Ask: "Can I predict the user's reaction to the next three questions I would ask?"
If yes → stop and restate. If no → ask the next question.

## Red Flags

- Multiple questions in one message (batching kills the interview)
- A question without your hypothesis attached
- Accepting "whatever you think" as a final answer
- Producing a spec or tasks before explicit confirmation
- Starting implementation immediately upon confirmation (stop the turn first)

## Verification Checklist

- [ ] Hypothesis + confidence number stated in first turn
- [ ] Every question asked one at a time with guess attached
- [ ] At least one "what would you actually want?" probe ran
- [ ] Restate includes Outcome / User / Why now / Success / Constraint / Out of scope
- [ ] User confirmed with an explicit yes
- [ ] Stopped turn immediately upon confirmation without starting downstream work

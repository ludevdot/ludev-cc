---
allowed-tools: Bash, Read, Glob, Grep
argument-hint: [error message, bug description, or log output]
description: Diagnose and fix bugs with a structured hypothesis-first approach
license: MIT
metadata:
  author: ludev
  version: "0.1.0"
---

# Debug

Diagnose and fix: $ARGUMENTS

## Current State

- Current branch: !`git branch --show-current`
- Recent commits: !`git log --oneline -10`
- Uncommitted changes: !`git status --porcelain`
- Project stack: !`ls package.json Cargo.toml go.mod requirements.txt pyproject.toml composer.json Gemfile 2>/dev/null`

## Task

Find the root cause and fix the bug described in `$ARGUMENTS`. Follow this protocol strictly — no shotgun debugging.

### 1. Understand the error

Parse `$ARGUMENTS`:
- If it contains an error message or stack trace, extract the exact error, file, and line number
- If it's a description ("login doesn't work"), ask the user for the exact error or steps to reproduce before proceeding
- If it includes log output, identify the first meaningful error (not the cascade)

**Do NOT touch any code yet.**

### 2. Investigate

Read the code at the error location and its immediate context:
- The function where the error occurs
- The caller(s) of that function
- Related types, config, or state that flows into it

Check recent changes that might be related:
```bash
git log --oneline -20 -- <affected-file>
```

Look for patterns:
- Was this file recently modified?
- Is there a similar bug in a related file?
- Are there tests for this code path?

### 3. Hypothesize — before changing anything

Present your top 2-3 hypotheses ranked by likelihood:

```
Hypothesis 1 (most likely): [what you think is wrong and why]
  Evidence: [what in the code supports this]
  How to verify: [what to check or run]

Hypothesis 2: [alternative explanation]
  Evidence: [...]
  How to verify: [...]
```

**STOP and wait for the user to confirm which hypothesis to pursue.**

If you are highly confident (>90%) in one hypothesis AND the fix is small and reversible, say so — but still present the hypothesis before fixing.

### 4. Verify the hypothesis

Before writing the fix, verify:
- Run the reproduction steps or test command if available
- Check that your hypothesis explains ALL the symptoms, not just some
- If the hypothesis doesn't hold, go back to step 3 with new information

### 5. Fix — one targeted change

Apply the minimum change that fixes the root cause:
- One logical fix. Do NOT refactor surrounding code
- Do NOT fix "other things you noticed" — those are separate tasks
- Do NOT add defensive code for scenarios that can't happen

If the fix touches more than 3 files, pause and verify you're fixing the root cause, not patching symptoms.

### 6. Verify the fix

After applying the fix:
- Run the relevant test(s) if they exist
- If no tests exist, run the reproduction steps
- Check that the fix doesn't break adjacent functionality

```bash
# Run tests related to the affected area
<detect test command from project stack>
```

If the fix can't be verified automatically, tell the user what to test manually.

### 7. Report

Present:

**Root cause**: [one sentence — what was actually wrong]
**Fix**: [what you changed and why]
**Files modified**: [list with brief description of each change]
**Verified**: [how you confirmed it works]

### 8. Suggest next steps

If relevant:
> If this is a regression, run `/find-the-bug` to locate the commit that introduced it.
> Run `/review` to check the fix before committing.
> Consider adding a test to prevent this from happening again.

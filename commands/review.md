---
allowed-tools: Bash, Read, Glob, Grep
argument-hint: [PR number or URL] | [base branch] | (empty for local diff)
description: Review code changes for bugs, security, and quality
license: MIT
metadata:
  author: ludev
  version: "0.1.0"
---

# Code Review

Review the current changes: $ARGUMENTS

## Current State

- Current branch: !`git branch --show-current`
- Default branch: !`git remote show origin 2>/dev/null | grep 'HEAD branch' | awk '{print $NF}' || echo "main"`
- Staged changes: !`git diff --cached --stat`
- Unstaged changes: !`git diff --stat`
- Uncommitted files: !`git status --porcelain`

## Task

Analyze code changes and report issues by severity.

### 1. Obtain the diff

Determine what to review based on `$ARGUMENTS`:

**No arguments** — review local changes:
- If there are staged changes, review those (`git diff --cached`)
- If no staged but unstaged changes, review those (`git diff`)
- If no local changes, review commits since the default branch (`git diff <default-branch>...HEAD`)

**PR number or URL** — try to get the PR diff:
```bash
gh pr diff <number> 2>/dev/null
```
If `gh` is not available or fails (private repo, no auth, no GitHub), fall back to:
```bash
git diff <default-branch>...HEAD
```
Tell the user which method you used.

**Branch name** — review diff against that branch:
```bash
git diff <branch>...HEAD
```

If there is nothing to review, tell the user and STOP.

### 2. Understand context

Before reviewing, read the files that were changed (not just the diff) to understand the surrounding code, patterns, and intent. Also check:

- `CLAUDE.md` or similar convention files for project-specific rules
- Nearby test files to understand expected behavior
- Import/dependency context for security review

### 3. Review checklist

Analyze every changed line against these categories:

**Bugs**
- Null/undefined references
- Off-by-one errors
- Unhandled edge cases (empty arrays, zero values, missing keys)
- Race conditions or async issues (missing await, unhandled promises)
- Logic errors (wrong operator, inverted condition, unreachable code)
- Type mismatches or wrong arguments

**Security**
- Injection: SQL, command, template, path traversal
- XSS: unsanitized user input in HTML/DOM
- Secrets: hardcoded tokens, keys, passwords, API keys in code
- Permissions: missing auth checks, privilege escalation
- Dependencies: known vulnerable versions (check if relevant)

**Performance**
- N+1 queries or repeated DB/API calls in loops
- Unnecessary re-renders or recomputations
- Memory leaks (event listeners not removed, growing collections)
- Missing pagination on unbounded queries
- Blocking operations in async context

**Quality**
- Dead code or unreachable branches
- Error handling: swallowed errors, missing error paths
- Resource cleanup: unclosed connections, file handles, streams
- Contract violations: function does more/less than its name implies

### 4. Output

Present findings grouped by severity, most critical first:

**🔴 Critical** — bugs or security issues that will cause problems in production
**🟡 Warning** — issues that should be fixed but aren't immediately dangerous
**🟢 Nit** — style, readability, or minor improvements

For each finding:
```
[severity] file:line — short description
  Context: what the code does
  Problem: what's wrong
  Fix: concrete suggestion (code snippet if helpful)
```

If no issues found, say so — don't invent problems.

### 5. Summary

At the end, provide:
- Total findings by severity
- Overall assessment: safe to merge / needs fixes / needs discussion
- If there are critical issues, recommend: "Fix these before merging."

### 6. Next steps

After the review, suggest:
> Ready to merge? Run `/changeset` to document the changes, then `/release-tag` when ready to deploy.

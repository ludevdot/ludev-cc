---
allowed-tools: Bash, Read, Glob, Grep
argument-hint: [description or test command] | --continue | --reset
description: Find the commit that introduced a bug
license: MIT
metadata:
  author: ludev
  version: "0.1.0"
---

# Find the Bug

Find the commit that introduced a bug: $ARGUMENTS

## Current State

- Current branch: !`git branch --show-current`
- Recent commits: !`git log --oneline -30`
- Total commits: !`git rev-list --count HEAD`
- Uncommitted changes: !`git status --porcelain`
- Bisect status: !`git bisect log 2>/dev/null || echo "No active bisect session"`
- Available tags: !`git tag --sort=-v:refname | head -10`

## Task

Use `git bisect` to find the commit that introduced the bug described in `$ARGUMENTS`.

### 1. Check for active session

If `git bisect log` shows an active session, ask the user:
- **Continue** (`--continue`): resume the existing bisect session
- **Reset** (`--reset`): clean up and stop (run step 7 cleanup only)
- **Start fresh**: reset the current session and begin a new one

If `$ARGUMENTS` is `--continue`, resume. If `--reset`, clean up and stop.

### 2. Check working tree

If there are uncommitted changes, **stop and warn the user**. Suggest:
```
git stash -u
```
Do NOT proceed with bisect on a dirty working tree.

Before starting bisect, create a backup branch:
```bash
git branch bisect-backup-$(date +%s)
```

### 3. Understand the bug

Parse `$ARGUMENTS`:
- If it looks like a command (e.g., `npm test`, `cargo test`, `node foo.js`, `./script.sh`), use it as the **test command** for automated mode.
- If it's a description, use **manual mode** — you'll inspect each commit yourself.

### 4. Identify the range

- **Bad commit**: HEAD (unless user specifies otherwise)
- **Good commit**: Ask the user if not obvious. If the user doesn't know, pick a reasonable candidate from the log (e.g., a release tag, a commit ~halfway back, or the oldest shown).

### 5. Run bisect

**Automated mode** (test command provided):
```bash
git bisect start
git bisect bad <bad>
git bisect good <good>
git bisect run <command>
```
If the test command exits with code 125, git treats it as **skip** (commit can't be tested). This is expected — bisect will try nearby commits.

**Manual mode** (description only):
```bash
git bisect start
git bisect bad <bad>
git bisect good <good>
```
Then at each step:
1. Tell the user which commit you're checking
2. Inspect the code/run relevant checks to determine if the bug exists
3. If the commit doesn't compile or can't be tested, use `git bisect skip` instead of good/bad
4. Otherwise mark `git bisect good` or `git bisect bad`
5. Repeat until bisect finds the culprit

Keep the user informed at each step — show the commit being tested and your reasoning.

### 6. Report the result

Once bisect identifies the guilty commit, show:
- Full commit info: `git show --stat <hash>`
- The diff: `git show <hash>`
- Suggest next steps: revert, cherry-pick fix, or manual fix

Recovery commands (show as suggestions, do NOT run automatically):
```bash
# Revert the entire commit
git revert <hash>

# Cherry-pick specific parts if only partial revert is needed
git cherry-pick <hash>
```

### 7. Clean up

**ALWAYS** run `git bisect reset` when done — even if bisect fails or is interrupted. This restores the original HEAD.

Clean up the backup branch:
```bash
git branch -d bisect-backup-<timestamp>
```

If you stashed changes in step 2, remind the user to `git stash pop`.

If `--reset` was requested, just clean up (reset bisect + delete backup branch) and stop.

### 8. Next steps

After finding the guilty commit, suggest:
> Want to plan the fix? Run `/split-task` to break it into atomic commits.

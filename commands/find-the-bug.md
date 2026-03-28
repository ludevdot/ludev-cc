---
allowed-tools: Bash, Read, Glob, Grep
argument-hint: [description of the bug or test command]
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

## Task

Use `git bisect` to find the commit that introduced the bug described in `$ARGUMENTS`.

### 1. Check working tree

If there are uncommitted changes, **stop and warn the user**. Suggest:
```
git stash -u
```
Do NOT proceed with bisect on a dirty working tree.

### 2. Understand the bug

Parse `$ARGUMENTS`:
- If it looks like a command (e.g., `npm test`, `cargo test`, `node foo.js`, `./script.sh`), use it as the **test command** for automated mode.
- If it's a description, use **manual mode** — you'll inspect each commit yourself.

### 3. Identify the range

- **Bad commit**: HEAD (unless user specifies otherwise)
- **Good commit**: Ask the user if not obvious. If the user doesn't know, pick a reasonable candidate from the log (e.g., a release tag, a commit ~halfway back, or the oldest shown).

### 4. Run bisect

**Automated mode** (test command provided):
```bash
git bisect start
git bisect bad <bad>
git bisect good <good>
git bisect run <command>
```

**Manual mode** (description only):
```bash
git bisect start
git bisect bad <bad>
git bisect good <good>
```
Then at each step:
1. Tell the user which commit you're checking
2. Inspect the code/run relevant checks to determine if the bug exists
3. Mark `git bisect good` or `git bisect bad`
4. Repeat until bisect finds the culprit

Keep the user informed at each step — show the commit being tested and your reasoning.

### 5. Report the result

Once bisect identifies the guilty commit, show:
- Full commit info: `git show --stat <hash>`
- The diff: `git show <hash>`
- Suggest next steps: revert, cherry-pick fix, or manual fix

### 6. Clean up

**ALWAYS** run `git bisect reset` when done — even if bisect fails or is interrupted. This restores the original HEAD.

If you stashed changes in step 1, remind the user to `git stash pop`.

### 7. Next steps

After finding the guilty commit, suggest:
> Want to plan the fix? Run `/split-task` to break it into atomic commits.

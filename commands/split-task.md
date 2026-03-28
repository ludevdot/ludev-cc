---
allowed-tools: Bash, Read, Glob, Grep
argument-hint: [task description, issue URL, or bug report]
description: Validate a task and break it into atomic commits
license: MIT
metadata:
  author: ludev
  version: "0.1.0"
---

# Split Task

Break a task into atomic subtasks: $ARGUMENTS

## Current State

- Current branch: !`git branch --show-current`
- Recent branches: !`git branch --sort=-committerdate | head -20`
- Recent commits: !`git log --oneline -20`
- Git remotes: !`git remote -v`
- Uncommitted changes: !`git status --porcelain`

## Task

Validate that the task in `$ARGUMENTS` is still relevant, then split it into atomic subtasks.

### 1. Validate first

Before planning any work, check if the task is still needed.

**Bugs:**
- Search the codebase for the symptom — error messages, affected functions, related code
- Try to confirm the bug exists now. Run checks if possible
- Check recent commits and branches for signs someone already fixed it

**Features:**
- Search for similar code that may already exist
- Check recent branches and commit messages for related work

**If resolved or not applicable**: report what you found and STOP.

**If the bug exists and there are clues about when it appeared** (user says "since last release", "after the deploy", you see it in recent commits): suggest running `/find-the-bug` to locate the exact commit before planning.

### 2. Detect branch convention

Look at existing branches from the state above:
- Prefixes: `feat/`, `fix/`, `chore/`, `hotfix/`
- Project tags: `PRJ-123/`, `JIRA-456-`
- Separators: `/`, `-`, `_`
- If no pattern is clear, use `type/short-slug`

### 3. Split into subtasks

Before splitting, **read the files that will be modified** to understand their current structure, patterns, and dependencies. Don't plan changes to code you haven't seen.

Break the work into phases. Not every task needs all phases — use only what applies.

| Phase | Contains |
|-------|----------|
| Foundation | Types, interfaces, config, migrations — things others depend on |
| Core | Main logic, business rules, the bulk of the change |
| Wiring | Connect components, routes, API endpoints, UI integration |
| Tests | Unit, integration, e2e — verify the change works |
| Cleanup | Remove dead code, update docs — only if needed |

Each subtask must be:

| Quality | Right | Wrong |
|---------|-------|-------|
| Specific | "Create `src/auth/middleware.ts` with JWT validation" | "Add auth" |
| Actionable | "Add `validateToken()` to `AuthService`" | "Handle tokens" |
| Verifiable | "Test: `POST /login` returns 401 without token" | "Make sure it works" |
| Small | One file or one logical unit | "Implement the feature" |

Rules:
- Order by dependency — phase 1 can't depend on phase 2
- If a subtask touches 4+ files, split it
- If the task is too small to split, just say so — don't invent artificial subtasks
- For refactoring subtasks (extract, move, rename), be explicit: what moves to the new location, what stays in the original, and what changes in the original after the extraction
- Use hierarchical numbering: 1.1, 1.2, 2.1, 2.2

### 4. Output

Present the result:

**Validation**: [Confirmed relevant — brief reason] or [Not needed — brief reason → STOP]

**Branch**: `type/short-description`

**Subtasks**:

**Phase 1: [Name]**
- [ ] 1.1 [What to do] — `path/to/file`
  - Commit: `type: message`
- [ ] 1.2 [What to do] — `path/to/file`
  - Commit: `type: message`

**Phase 2: [Name]**
- [ ] 2.1 ...

**Total**: N commits

If trivial (1 commit), skip phases — just show branch name and commit message.

### 5. Next steps

At the end, suggest:
> Before implementing each subtask, run `/reuse-check` to avoid duplicating existing code.
> When done, run `/changeset` → `/release-tag` to version and deploy.

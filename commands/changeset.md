---
allowed-tools: Read, Bash, Write, Glob
argument-hint: [patch|minor|major] [description]
description: Create a changeset for the current changes using changeset
---

# Create Changeset

Create a changeset for the current changes: $ARGUMENTS

## Current State

- Package info: @package.json
- Pending changesets: !`ls .changeset/*.md 2>/dev/null | grep -v README | head -20 || echo "No pending changesets"`
- Git changes: !`git status --porcelain`
- Recent commits: !`git log --oneline -10`
- Current version: !`node -p "require('./package.json').version" 2>/dev/null || echo "unknown"`
- Last tag: !`git describe --tags --abbrev=0 2>/dev/null || echo "No tags found"`
- Package manager: !`[ -f bun.lockb ] && echo "bun" || { [ -f pnpm-lock.yaml ] && echo "pnpm" || { [ -f yarn.lock ] && echo "yarn" || echo "npm"; }; }`

## Task

Analyze the current changes (staged, unstaged, or recent commits) and create a changeset.

### 1. Determine bump type

| Type | When |
|------|------|
| `patch` | Bug fixes, typos, dependency updates, non-functional changes |
| `minor` | New features, new sections, new components, enhancements |
| `major` | Breaking changes, redesigns, API changes |

If the user provided a bump type in `$ARGUMENTS`, use it. Otherwise, infer from the changes.

### 2. Write the changeset summary

- One concise line describing **what changed and why** (user-facing perspective)
- If multiple distinct changes, use a bullet list
- Use imperative mood: "add", "fix", "update", "remove" — not "added", "fixes"
- Do NOT repeat the bump type in the summary

Good:
```
add Context Monitor feature section with real screenshot
```
```
- fix dark mode contrast for faint text
- update hero description for v1.1.20
```

Bad:
```
Minor: Added new feature section for Context Monitor
```

### 3. Create the changeset file

`changeset` is interactive, so write the file directly.

Generate the filename using `human-id` (same package `@changesets/cli` uses):

```bash
name=$(node -e "console.log(require('human-id').humanId())")
```

Then write `.changeset/${name}.md`:
```markdown
---
"<package-name>": <bump_type>
---

<summary>
```

Where `<package-name>` is the `name` field from `package.json`.

### 4. Commit Convention

Follow conventional commits so the changeset aligns with git history:

```bash
feat: add user authentication        # → minor
fix: resolve memory leak in tasks     # → patch
docs: update API documentation        # → patch
refactor: reorganize user service     # → patch
perf: optimize image loading          # → patch
breaking: redesign auth flow          # → major
```

### 5. Integration with Releases

- Run `<pm> version` to consume pending changesets → bumps version + updates CHANGELOG.md
- Tag the release and push
- Each changeset is deleted automatically after `<pm> version`
- Multiple changesets accumulate between releases — the highest bump wins

### 6. Confirm

After creating the changeset, show:
- The file path created
- The bump type and summary
- How many pending changesets exist now

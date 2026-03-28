---
allowed-tools: Bash, Read, Write, Glob, Grep
argument-hint: [RC|RELEASE|environment-name]
description: Create a version tag for deployment
license: MIT
metadata:
  author: ludev
  version: "0.1.0"
---

# Release Tag

Create a version tag for deployment: $ARGUMENTS

## Current State

- Current version: !`node -p "require('./package.json').version" 2>/dev/null || echo "unknown"`
- Current branch: !`git branch --show-current`
- Existing tags: !`git tag --sort=-v:refname | head -20`
- Pending changesets: !`ls .changeset/*.md 2>/dev/null | grep -v README | head -10 || echo "No pending changesets"`
- Uncommitted changes: !`git status --porcelain`
- CI/CD workflows: !`ls .github/workflows/*.yml .github/workflows/*.yaml .gitlab-ci.yml 2>/dev/null | head -10 || echo "No CI config found"`
- Package manager: !`[ -f bun.lockb ] && echo "bun" || { [ -f pnpm-lock.yaml ] && echo "pnpm" || { [ -f yarn.lock ] && echo "yarn" || echo "npm"; }; }`

## Task

Create a version tag following the deployment convention below and optionally push it.

### 1. Pre-checks

Before anything:

- **Uncommitted changes?** → warn and suggest committing first. Don't proceed.
- **Pending changesets?** → the version hasn't been bumped yet. Offer to auto-consume them:
  - Tell the user: "Pending changesets found. Run `<pm> changeset version` to consume them and bump the version?"
  - If the user agrees → run `<pm> changeset version`, then commit the version bump (e.g., `git add -A && git commit -m "bump version via changesets"`) before proceeding to tag.
  - If the user declines → don't tag an unbumped version. Suggest running `/changeset` first if they need to create new changesets.
- **Tag already exists?** → warn and stop.

### 2. Determine tag type

Parse `$ARGUMENTS`:

| Argument | Tag format | Use case |
|----------|-----------|----------|
| `RC` | `v<version>-RC` | Release Candidate — QA/staging |
| `RELEASE` | `v<version>-RELEASE` | Production deploy |
| _anything else_ | `v<version>-<name>-N` | Environment-specific, N auto-increments |
| _empty_ | Ask the user | — |

For environment tags, check existing tags to determine N. If `v1.2.0-staging-1` exists, the next one is `v1.2.0-staging-2`.

Show the tag that will be created and **ask for confirmation** before proceeding.

### 3. Create and push

```bash
git tag <tag>
```

Then ask: push commits and tags now?
- Yes → `git push && git push --tags`
- No → tag stays local

### 4. CI/CD awareness

After tagging, check if any workflow files react to this tag pattern:
- Search for `tags:` triggers in workflow YAML files
- If a workflow matches → "This tag will trigger **workflow-name**"
- If none match → "No CI/CD workflow found for this tag pattern"

Also check for platform-specific deploy triggers:
- **Vercel**: check for `vercel.json` or `.vercel/` directory. If found → "Vercel detected — auto-deploys on push to the connected branch, not on tags. The push in step 3 will trigger a deployment."
- **Netlify**: check for `netlify.toml`. If found → "Netlify detected — auto-deploys on push to the connected branch, not on tags. The push in step 3 will trigger a deployment."

### 5. Cross-references

If pending changesets were found in pre-checks, suggest:
> Run `/changeset` first to bump the version before tagging.

At the end, show the full workflow:
> Suggested flow: `/split-task` → implement → `/reuse-check` → `/changeset` → `/release-tag`

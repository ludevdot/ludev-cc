---
allowed-tools: Bash, Read, Write, Glob, Grep
argument-hint: [setup|review]
description: Set up or improve Renovate configuration
license: MIT
metadata:
  author: ludev
  version: "0.1.0"
---

# Renovate Configuration

Set up or improve Renovate config: $ARGUMENTS

## Current State

- Existing config: !`ls renovate.json .renovaterc.json .renovaterc 2>/dev/null || echo "No renovate config found"`
- Package info: @package.json
- Monorepo signals: !`{ [ -f pnpm-workspace.yaml ] && echo "pnpm-workspace.yaml found"; node -p "JSON.parse(require('fs').readFileSync('package.json','utf8')).workspaces ? 'workspaces in package.json' : ''" 2>/dev/null; [ -f lerna.json ] && echo "lerna.json found"; } 2>/dev/null || echo "Not a monorepo"`
- Package manager: !`[ -f bun.lockb ] && echo "bun" || { [ -f pnpm-lock.yaml ] && echo "pnpm" || { [ -f yarn.lock ] && echo "yarn" || echo "npm"; }; }`
- CI/CD: !`ls .github/workflows/*.yml .github/workflows/*.yaml .gitlab-ci.yml 2>/dev/null | head -10 || echo "No CI config found"`

## Task

Determine mode from `$ARGUMENTS`: if `review`, go to Review Mode. Otherwise (including empty), go to Setup Mode.

### Setup Mode — Create a new config

If a renovate config already exists, warn the user and ask whether to overwrite or switch to review mode.

#### 1. Gather preferences interactively

Ask the user about each of these, one group at a time. Don't dump all questions at once — ask 2-3, wait for answers, then continue.

**Group 1 — Update strategy:**
- Automerge patches and minors automatically, or require manual review for everything?
- Group all non-major updates into a single PR, or separate PRs per package?
- Minimum release age before updating? (e.g., 3 days — reduces risk of broken releases)

**Group 2 — PR behavior:**
- Concurrent PR limit? (default: 10)
- Hourly PR limit? (default: 4)
- Use semantic commit prefixes? (`fix:`, `chore:`, etc.)

**Group 3 — Dependency handling:**
- Pin dependencies to exact versions, or keep ranges?
- Any packages or groups to bundle together? (e.g., storybook, vitest, eslint ecosystem)
- Any private packages or scopes to exclude? (auto-detect from package.json `@org/` scopes)

**Group 4 — Security:**
- Enable vulnerability alerts with a label? (e.g., `SECURITY`)

Use the project context (monorepo detection, package manager, existing dependencies) to suggest sensible defaults. If the project is a monorepo, suggest `group:monorepos`.

#### 2. Generate the config

Build `renovate.json` using presets whenever possible instead of raw options:

| Preference | Preset |
|-----------|--------|
| Semantic commits | `:semanticPrefixFixDepsChoreOthers` |
| Ignore modules/tests | `:ignoreModulesAndTests` |
| Group monorepos | `group:monorepos`, `group:recommended` |
| Group non-major | `group:allNonMajor` |
| Automerge off | `:automergeDisabled` |
| Automerge minor+patch | `:automergeMinor` |
| Vulnerability alerts | `:enableVulnerabilityAlertsWithLabel(SECURITY)` |
| Renovate prefix | `:renovatePrefix` |
| PR limits | `:prConcurrentLimit10`, `:prHourlyLimit4` |
| Pin deps | `:pinDependencies` |
| Separate majors | `:separateMultipleMajorReleases` |
| Replacements | `replacements:all` |
| Workarounds | `workarounds:all` |

Always include:
- `"$schema": "https://docs.renovatebot.com/renovate-schema.json"` — first field
- `"extends": ["config:recommended", ...]` — as the base

Add `packageRules` only when the user requests custom grouping or exclusions.

#### 3. Write and confirm

Write `renovate.json` to the project root. Show a brief summary of what each significant choice does — don't overexplain.

### Review Mode — Analyze existing config

#### 1. Read the config

Read the existing renovate config file (whichever format exists).

#### 2. Check for issues and improvements

Evaluate against these best practices:

| Check | What to look for |
|-------|-----------------|
| Missing schema | No `$schema` field — IDE won't autocomplete |
| No base preset | Not extending `config:recommended` — reinventing defaults |
| No PR limits | Missing concurrent or hourly limits — can flood with PRs |
| No release age | `minimumReleaseAge` not set — risky fast updates |
| No grouping | Monorepo without `group:monorepos` — too many PRs |
| No non-major grouping | Missing `group:allNonMajor` — noisy separate minor/patch PRs |
| Raw config over presets | Using `rangeStrategy: "pin"` instead of `:pinDependencies` |
| Missing replacements | No `replacements:all` — won't auto-rename deprecated packages |
| Missing workarounds | No `workarounds:all` — known package quirks not handled |
| Private scope exposed | `@org/` packages without `enabled: false` rule — will fail |
| No vulnerability alerts | Missing security label preset |

#### 3. Present findings

Show issues as a checklist with severity:
- **Required** — things that will cause problems
- **Recommended** — best practices that improve the experience
- **Optional** — nice-to-have improvements

If the user has presets they might not understand, explain what each one does in one sentence.

Offer to apply the suggested changes. If the user agrees, update the config file.

<p align="center">
  <img src="https://code.ludev.me/icon-512.png" alt="Ludev" width="120" />
</p>

# Slash commands for Claude Code from Ludevdot

A tiny, zero-dependency CLI that copies useful slash commands into your project's `.claude/commands/` directory. Run it once, get new commands in Claude Code immediately.

## Available commands

### `/changeset`

Creates changesets compatible with `@changesets/cli` without the interactive CLI. Claude analyzes your changes, picks the bump type, writes the summary, and drops the file. Works with npm, pnpm, yarn, and bun.

### `/find-the-bug`

Finds the commit that introduced a bug using `git bisect` — but you just describe the bug and Claude handles the rest. Supports automated mode (with a test command) and manual mode (Claude inspects each commit).

### `/split-task`

Takes a task, bug report, or feature request and breaks it into atomic subtasks. First validates the task is still relevant (checks if someone already fixed it), detects your branch naming convention, then outputs a phased plan with commit messages. Suggests `/find-the-bug` if there are clues about when a bug appeared.

### `/reuse-check`

Before writing new code, scans the codebase for existing functions, utils, and dependencies that already do what you need. Searches by name, location, installed packages, and git history. If [ast-grep](https://ast-grep.github.io/) (`sg`) is installed, uses AST-based structural search for more accurate results — if not, offers to install it or falls back to regex. Reports candidates with a clear recommendation: reuse, extend, refactor, or safe to create new.

### `/review`

Reviews your current diff (or a PR) for bugs, security issues, and code quality. Checks for OWASP top 10 vulnerabilities, race conditions, memory leaks, and more. Works with local changes, branch diffs, or PR numbers — falls back gracefully if `gh` is not available.

### `/renovate`

Sets up or reviews a Renovate configuration for automated dependency updates. In setup mode, asks about your preferences interactively and generates `renovate.json` with best-practice presets. In review mode, analyzes your existing config and suggests improvements.

### `/release-tag`

Creates version tags following a deployment convention: `v1.2.0-RC`, `v1.2.0-RELEASE`, or environment-specific like `v1.2.0-staging-1`. Checks for pending changesets, validates the tag doesn't exist, and detects if any CI/CD workflow will trigger on push.

### Workflow

The commands connect naturally:

```
/split-task → implement → /reuse-check → /review → /changeset → /release-tag
                ↑
          /find-the-bug (if needed)
```

## Usage

```bash
# Interactive mode — select commands, choose target
npx ludev-cc

# Install all commands
npx ludev-cc install

# Install a specific command
npx ludev-cc install changeset

# Install globally (~/.claude/commands/)
npx ludev-cc install --global

# See what's available
npx ludev-cc list

# Remove a command
npx ludev-cc remove changeset

# Update installed commands to latest
npx ludev-cc update

# Help
npx ludev-cc --help
```

### Updating

To get the latest commands, just run:

```bash
npx ludev-cc@latest update
```

## License

MIT

<p align="center">
  <img src="https://code.ludev.me/icon-512.png" alt="Ludev" width="120" />
</p>

# Slash commands for Claude Code from Ludevdot

A tiny, zero-dependency CLI that copies useful slash commands into your project's `.claude/commands/` directory. Run it once, get new commands in Claude Code immediately.

## Available commands

### `/changeset`

Creates changesets compatible with `@changesets/cli` -- but you don't need to run the interactive CLI yourself. Claude analyzes your current changes (staged, unstaged, or recent commits), picks the right bump type (`patch`, `minor`, `major`), writes a summary in imperative mood, and drops the `.changeset/*.md` file directly. Works with npm, pnpm, yarn, and bun.

More commands will show up here as they're added.

## Usage

```bash
# Install all commands
npx ludev-cc

# Install a specific command
npx ludev-cc changeset

# See what's available
npx ludev-cc list
```

The CLI copies `.md` files into `.claude/commands/` and you're done.

## License

MIT

# ludev-cc

CLI to install Claude Code slash commands into your project.

## Usage

Install commands into the current project:

```bash
npx ludev-cc
```

List available commands:

```bash
npx ludev-cc list
```

Or install globally:

```bash
npm i -g ludev-cc
ludev-cc install
```

## Adding your own commands

Place `.md` files in the `commands/` directory of this package. Each file becomes a slash command available in Claude Code once installed to `.claude/commands/`.

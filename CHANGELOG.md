# ludev-cc

## 0.3.0

### Minor Changes

- 58653e0: - add interactive mode with command selector and install target choice
  - add `remove` and `update` subcommands
  - add `--global` flag for all subcommands
  - add `--help` flag
  - add 25 tests with Node.js native test runner

## 0.2.2

### Patch Changes

- 1b3f6d2: - add commit format rules to split-task and changeset commands
  - add update instructions to README

## 0.2.1

### Patch Changes

- 1b148c1: improve commands from real-world feedback: changeset validates existing changesets and bump types, split-task reads files before splitting, release-tag auto-consumes changesets and detects Vercel/Netlify, find-the-bug adds session handling and recovery commands

## 0.2.0

### Minor Changes

- b2c9b5a: add 5 new slash commands: find-the-bug, split-task, reuse-check, renovate, release-tag with cross-references and ast-grep support

## 0.1.1

### Patch Changes

- f0121c8: move @changesets/cli and human-id to devDependencies to avoid installing 100+ packages on npx

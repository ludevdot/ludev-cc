import { describe, it, before, after, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
  readFileSync,
  existsSync,
  readdirSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const execFileAsync = promisify(execFile);

const CLI = join(import.meta.dirname, "..", "bin", "cli.js");
const COMMANDS_DIR = join(import.meta.dirname, "..", "commands");

// Get the real available command names from the source commands/ directory
const AVAILABLE_COMMANDS = readdirSync(COMMANDS_DIR)
  .filter((f) => f.endsWith(".md"))
  .map((f) => f.replace(/\.md$/, ""));

/**
 * Run the CLI as a subprocess.
 * Uses a temp directory as cwd so that .claude/commands/ is created there.
 */
function run(args, opts = {}) {
  const env = { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0" };
  return execFileAsync("node", [CLI, ...args], {
    cwd: opts.cwd || process.cwd(),
    env,
    timeout: 10_000,
  });
}

// --- Tests ---

describe("CLI: --help", () => {
  it("shows help with --help", async () => {
    const { stdout } = await run(["--help"]);
    assert.match(stdout, /ludev-cc/);
    assert.match(stdout, /install/);
    assert.match(stdout, /list/);
    assert.match(stdout, /remove/);
    assert.match(stdout, /update/);
    assert.match(stdout, /--global/);
  });

  it("shows help with -h", async () => {
    const { stdout } = await run(["-h"]);
    assert.match(stdout, /ludev-cc/);
    assert.match(stdout, /Usage/);
  });

  it("shows help with help subcommand", async () => {
    const { stdout } = await run(["help"]);
    assert.match(stdout, /ludev-cc/);
    assert.match(stdout, /Usage/);
  });
});

describe("CLI: list", () => {
  it("lists available commands", async () => {
    const { stdout } = await run(["list"]);
    assert.match(stdout, /Available commands/);
    for (const name of AVAILABLE_COMMANDS) {
      assert.match(stdout, new RegExp(name), `should list command: ${name}`);
    }
  });

  it("lists commands with ls alias", async () => {
    const { stdout } = await run(["ls"]);
    assert.match(stdout, /Available commands/);
    for (const name of AVAILABLE_COMMANDS) {
      assert.match(stdout, new RegExp(name), `should list command: ${name}`);
    }
  });

  it("shows descriptions from frontmatter", async () => {
    const { stdout } = await run(["list"]);
    // At least one command should have a description shown
    // changeset.md has description: "Create a changeset..."
    assert.match(stdout, /changeset/i);
  });
});

describe("CLI: install", () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "ludev-cc-test-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("installs all commands", async () => {
    const { stdout } = await run(["install"], { cwd: tmpDir });
    assert.match(stdout, /Done/);
    assert.match(stdout, /installed/);

    const targetDir = join(tmpDir, ".claude", "commands");
    assert.ok(existsSync(targetDir), ".claude/commands/ should be created");

    const installed = readdirSync(targetDir).filter((f) => f.endsWith(".md"));
    assert.equal(
      installed.length,
      AVAILABLE_COMMANDS.length,
      "all commands should be installed"
    );
  });

  it("installs a specific command by name", async () => {
    const cmdName = AVAILABLE_COMMANDS[0];
    const { stdout } = await run(["install", cmdName], { cwd: tmpDir });
    assert.match(stdout, /Done/);

    const targetDir = join(tmpDir, ".claude", "commands");
    const installed = readdirSync(targetDir).filter((f) => f.endsWith(".md"));
    assert.equal(installed.length, 1);
    assert.equal(installed[0], `${cmdName}.md`);
  });

  it("installs a specific command with .md extension", async () => {
    const cmdName = AVAILABLE_COMMANDS[0];
    const { stdout } = await run(["install", `${cmdName}.md`], { cwd: tmpDir });
    assert.match(stdout, /Done/);

    const targetDir = join(tmpDir, ".claude", "commands");
    assert.ok(existsSync(join(targetDir, `${cmdName}.md`)));
  });

  it("exits with error for unknown command", async () => {
    await assert.rejects(
      () => run(["install", "nonexistent-command"], { cwd: tmpDir }),
      (err) => {
        assert.match(err.stderr, /Unknown command/);
        assert.notEqual(err.code, 0);
        return true;
      }
    );
  });

  it("creates .claude/commands/ directory if not exists", async () => {
    const targetDir = join(tmpDir, ".claude", "commands");
    assert.ok(!existsSync(targetDir), "should not exist before install");

    await run(["install"], { cwd: tmpDir });
    assert.ok(existsSync(targetDir), "should exist after install");
  });

  it("installs to global directory with --global flag", async () => {
    // Use a fake HOME to avoid writing to real ~/.claude
    const fakeHome = mkdtempSync(join(tmpdir(), "ludev-cc-home-"));
    try {
      const env = {
        ...process.env,
        HOME: fakeHome,
        NO_COLOR: "1",
        FORCE_COLOR: "0",
      };
      const { stdout } = await execFileAsync(
        "node",
        [CLI, "install", AVAILABLE_COMMANDS[0], "--global"],
        { env, timeout: 10_000 }
      );
      assert.match(stdout, /Done/);

      const globalTarget = join(fakeHome, ".claude", "commands");
      assert.ok(existsSync(globalTarget), "global target should exist");
      assert.ok(
        existsSync(join(globalTarget, `${AVAILABLE_COMMANDS[0]}.md`)),
        "command file should be in global dir"
      );
    } finally {
      rmSync(fakeHome, { recursive: true, force: true });
    }
  });

  it("installs to global directory with -g flag", async () => {
    const fakeHome = mkdtempSync(join(tmpdir(), "ludev-cc-home-"));
    try {
      const env = {
        ...process.env,
        HOME: fakeHome,
        NO_COLOR: "1",
        FORCE_COLOR: "0",
      };
      const { stdout } = await execFileAsync(
        "node",
        [CLI, "install", AVAILABLE_COMMANDS[0], "-g"],
        { env, timeout: 10_000 }
      );
      assert.match(stdout, /Done/);

      const globalTarget = join(fakeHome, ".claude", "commands");
      assert.ok(existsSync(globalTarget));
    } finally {
      rmSync(fakeHome, { recursive: true, force: true });
    }
  });
});

describe("CLI: install — skip and overwrite", () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "ludev-cc-test-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("skips identical files on second install", async () => {
    // Install once
    await run(["install"], { cwd: tmpDir });

    // Install again — should skip all
    const { stdout } = await run(["install"], { cwd: tmpDir });
    assert.match(stdout, /skip/);
    assert.match(stdout, /identical/);
    // No files should be reported as newly installed
    const skipCount = (stdout.match(/skip/g) || []).length;
    assert.ok(
      skipCount >= AVAILABLE_COMMANDS.length,
      `should skip all ${AVAILABLE_COMMANDS.length} commands`
    );
  });

  it("overwrites changed files", async () => {
    // Install once
    await run(["install"], { cwd: tmpDir });

    // Modify one installed file
    const cmdName = AVAILABLE_COMMANDS[0];
    const destFile = join(tmpDir, ".claude", "commands", `${cmdName}.md`);
    writeFileSync(destFile, "modified content");

    // Install again — should overwrite the modified one
    const { stdout } = await run(["install", cmdName], { cwd: tmpDir });
    assert.match(stdout, /overwrite/);

    // File content should now match source
    const srcContent = readFileSync(
      join(COMMANDS_DIR, `${cmdName}.md`),
      "utf8"
    );
    const destContent = readFileSync(destFile, "utf8");
    assert.equal(destContent, srcContent);
  });
});

describe("CLI: remove", () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "ludev-cc-test-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("removes an installed command", async () => {
    const cmdName = AVAILABLE_COMMANDS[0];
    // Install first
    await run(["install", cmdName], { cwd: tmpDir });
    const destFile = join(tmpDir, ".claude", "commands", `${cmdName}.md`);
    assert.ok(existsSync(destFile), "should exist after install");

    // Remove
    const { stdout } = await run(["remove", cmdName], { cwd: tmpDir });
    assert.match(stdout, /removed/);
    assert.ok(!existsSync(destFile), "should not exist after remove");
  });

  it("removes with rm alias", async () => {
    const cmdName = AVAILABLE_COMMANDS[0];
    await run(["install", cmdName], { cwd: tmpDir });

    const { stdout } = await run(["rm", cmdName], { cwd: tmpDir });
    assert.match(stdout, /removed/);
  });

  it("warns when command is not installed", async () => {
    const { stdout } = await run(["remove", "nonexistent"], { cwd: tmpDir });
    assert.match(stdout, /not installed/i);
  });

  it("exits with error when no name is provided", async () => {
    await assert.rejects(
      () => run(["remove"], { cwd: tmpDir }),
      (err) => {
        assert.match(err.stderr, /Usage/);
        return true;
      }
    );
  });
});

describe("CLI: update", () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "ludev-cc-test-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("updates installed commands that have changed", async () => {
    const cmdName = AVAILABLE_COMMANDS[0];
    await run(["install", cmdName], { cwd: tmpDir });

    // Modify the installed file
    const destFile = join(tmpDir, ".claude", "commands", `${cmdName}.md`);
    writeFileSync(destFile, "old content that differs from source");

    const { stdout } = await run(["update"], { cwd: tmpDir });
    assert.match(stdout, /Updating/);
    assert.match(stdout, /update/);

    // Content should match source now
    const srcContent = readFileSync(
      join(COMMANDS_DIR, `${cmdName}.md`),
      "utf8"
    );
    assert.equal(readFileSync(destFile, "utf8"), srcContent);
  });

  it("skips identical files during update", async () => {
    await run(["install"], { cwd: tmpDir });

    const { stdout } = await run(["update"], { cwd: tmpDir });
    assert.match(stdout, /skip/);
    assert.match(stdout, /already up to date/);
  });

  it("reports when no commands are installed to update", async () => {
    const { stdout } = await run(["update"], { cwd: tmpDir });
    assert.match(stdout, /No installed commands found/);
  });

  it("works with up alias", async () => {
    const { stdout } = await run(["up"], { cwd: tmpDir });
    assert.match(stdout, /No installed commands found/);
  });
});

describe("CLI: unknown subcommand fallback", () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "ludev-cc-test-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("treats unknown positional as command name to install", async () => {
    const cmdName = AVAILABLE_COMMANDS[0];
    const { stdout } = await run([cmdName], { cwd: tmpDir });
    assert.match(stdout, /Done/);

    const destFile = join(tmpDir, ".claude", "commands", `${cmdName}.md`);
    assert.ok(existsSync(destFile));
  });

  it("errors for truly unknown command name as fallback", async () => {
    await assert.rejects(
      () => run(["totally-fake-command"], { cwd: tmpDir }),
      (err) => {
        assert.match(err.stderr, /Unknown command/);
        return true;
      }
    );
  });
});

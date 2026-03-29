#!/usr/bin/env node

import { readdirSync, mkdirSync, copyFileSync, existsSync, readFileSync, unlinkSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import prompts from "prompts";
import kleur from "kleur";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const commandsDir = join(__dirname, "..", "commands");

// --- Helpers ---

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const fm = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx > 0) {
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
      fm[key] = val;
    }
  }
  return fm;
}

function getCommands() {
  return readdirSync(commandsDir)
    .filter((f) => f.endsWith(".md"))
    .map((file) => {
      const content = readFileSync(join(commandsDir, file), "utf8");
      const fm = parseFrontmatter(content);
      return {
        file,
        name: file.replace(/\.md$/, ""),
        description: fm.description || "",
      };
    });
}

function resolveTargetDir(global) {
  const base = global
    ? join(process.env.HOME || process.env.USERPROFILE, ".claude")
    : join(process.cwd(), ".claude");
  return join(base, "commands");
}

function getInstalledCommands(targetDir) {
  if (!existsSync(targetDir)) return [];
  return readdirSync(targetDir).filter((f) => f.endsWith(".md"));
}

function copyCommand(file, targetDir) {
  const src = join(commandsDir, file);
  const dest = join(targetDir, file);

  if (existsSync(dest)) {
    const srcContent = readFileSync(src, "utf8");
    const destContent = readFileSync(dest, "utf8");
    if (srcContent === destContent) {
      return "skip";
    }
    copyFileSync(src, dest);
    return "overwrite";
  }

  copyFileSync(src, dest);
  return "install";
}

function onCancel() {
  console.log(kleur.gray("\nCancelled."));
  process.exit(0);
}

// --- Interactive mode ---

async function interactive() {
  const commands = getCommands();

  if (commands.length === 0) {
    console.log(kleur.yellow("No commands available in this package."));
    return;
  }

  console.log(kleur.bold("\nludev-cc") + kleur.gray(" — Claude Code slash commands\n"));

  const { selected } = await prompts(
    {
      type: "multiselect",
      name: "selected",
      message: "Select commands to install",
      choices: commands.map((cmd) => ({
        title: kleur.bold(cmd.name) + kleur.gray(` — ${cmd.description}`),
        value: cmd.file,
        selected: true,
      })),
      hint: "Space to toggle, Enter to confirm",
    },
    { onCancel }
  );

  if (!selected || selected.length === 0) {
    console.log(kleur.yellow("\nNo commands selected."));
    return;
  }

  const { target } = await prompts(
    {
      type: "select",
      name: "target",
      message: "Install to",
      choices: [
        { title: "Current project (.claude/commands/)", value: "local" },
        { title: "Global (~/.claude/commands/)", value: "global" },
      ],
    },
    { onCancel }
  );

  const isGlobal = target === "global";
  const targetDir = resolveTargetDir(isGlobal);
  const claudeDir = dirname(targetDir);

  if (!existsSync(claudeDir)) {
    const label = isGlobal ? "~/.claude" : ".claude";
    const { proceed } = await prompts(
      {
        type: "confirm",
        name: "proceed",
        message: `${label} does not exist. Create ${kleur.cyan(claudeDir)}?`,
        initial: true,
      },
      { onCancel }
    );

    if (!proceed) {
      console.log(kleur.gray("Aborted."));
      return;
    }
  }

  const selectedNames = selected
    .map((f) => f.replace(/\.md$/, ""))
    .join(", ");
  const targetLabel = isGlobal ? "~/.claude/commands/" : ".claude/commands/";

  console.log(
    kleur.bold("\nSummary:\n") +
      `  Commands: ${kleur.cyan(selectedNames)}\n` +
      `  Target:   ${kleur.cyan(targetLabel)}\n`
  );

  const { confirm } = await prompts(
    {
      type: "confirm",
      name: "confirm",
      message: "Proceed?",
      initial: true,
    },
    { onCancel }
  );

  if (!confirm) {
    console.log(kleur.gray("Aborted."));
    return;
  }

  mkdirSync(targetDir, { recursive: true });

  let installed = 0;
  let skipped = 0;
  let overwritten = 0;

  for (const file of selected) {
    const result = copyCommand(file, targetDir);
    const name = file.replace(/\.md$/, "");
    if (result === "skip") {
      console.log(`  ${kleur.gray("skip")}      ${name} ${kleur.gray("(identical)")}`);
      skipped++;
    } else if (result === "overwrite") {
      console.log(`  ${kleur.yellow("overwrite")} ${name}`);
      overwritten++;
    } else {
      console.log(`  ${kleur.green("install")}   ${name}`);
      installed++;
    }
  }

  console.log(
    kleur.bold("\nDone.") +
      ` ${installed} installed, ${overwritten} updated, ${skipped} skipped.`
  );
}

// --- Subcommands ---

function cmdList() {
  const commands = getCommands();

  if (commands.length === 0) {
    console.log("No commands available.");
    return;
  }

  console.log(kleur.bold("\nAvailable commands:\n"));
  const maxLen = Math.max(...commands.map((c) => c.name.length));
  for (const cmd of commands) {
    const pad = " ".repeat(maxLen - cmd.name.length + 2);
    console.log(
      `  ${kleur.cyan(cmd.name)}${pad}${kleur.gray(cmd.description)}`
    );
  }
  console.log();
}

function cmdInstall(name, { global: isGlobal = false } = {}) {
  let files = getCommands().map((c) => c.file);

  if (name) {
    const file = name.endsWith(".md") ? name : `${name}.md`;
    if (!files.includes(file)) {
      console.error(kleur.red(`Unknown command: ${name}`));
      console.log("Run 'ludev-cc list' to see available commands.");
      process.exit(1);
    }
    files = [file];
  }

  if (files.length === 0) {
    console.log("No commands to install.");
    return;
  }

  const targetDir = resolveTargetDir(isGlobal);
  mkdirSync(targetDir, { recursive: true });

  let installed = 0;
  let skipped = 0;
  let overwritten = 0;

  for (const file of files) {
    const result = copyCommand(file, targetDir);
    const name = file.replace(/\.md$/, "");
    if (result === "skip") {
      console.log(`  ${kleur.gray("skip")}      ${name} ${kleur.gray("(identical)")}`);
      skipped++;
    } else if (result === "overwrite") {
      console.log(`  ${kleur.yellow("overwrite")} ${name}`);
      overwritten++;
    } else {
      console.log(`  ${kleur.green("install")}   ${name}`);
      installed++;
    }
  }

  console.log(
    `\nDone. ${installed} installed, ${overwritten} updated, ${skipped} skipped. Target: ${targetDir}`
  );
}

function cmdRemove(name, { global: isGlobal = false } = {}) {
  if (!name) {
    console.error(kleur.red("Usage: ludev-cc remove <command>"));
    process.exit(1);
  }

  const file = name.endsWith(".md") ? name : `${name}.md`;
  const targetDir = resolveTargetDir(isGlobal);
  const dest = join(targetDir, file);

  if (!existsSync(dest)) {
    console.log(kleur.yellow(`Command not installed: ${name}`));
    console.log(kleur.gray(`Checked: ${dest}`));
    return;
  }

  unlinkSync(dest);
  console.log(`${kleur.green("removed")} ${name} from ${targetDir}`);
}

function cmdUpdate({ global: isGlobal = false } = {}) {
  const targetDir = resolveTargetDir(isGlobal);
  const installed = getInstalledCommands(targetDir);
  const available = getCommands().map((c) => c.file);

  const toUpdate = installed.filter((f) => available.includes(f));

  if (toUpdate.length === 0) {
    console.log(kleur.yellow("No installed commands found to update."));
    console.log(kleur.gray(`Checked: ${targetDir}`));
    return;
  }

  console.log(kleur.bold(`Updating ${toUpdate.length} command(s)...\n`));

  let updated = 0;
  let skipped = 0;

  for (const file of toUpdate) {
    const result = copyCommand(file, targetDir);
    const name = file.replace(/\.md$/, "");
    if (result === "skip") {
      console.log(`  ${kleur.gray("skip")}    ${name} ${kleur.gray("(identical)")}`);
      skipped++;
    } else {
      console.log(`  ${kleur.green("update")}  ${name}`);
      updated++;
    }
  }

  console.log(`\nDone. ${updated} updated, ${skipped} already up to date.`);
}

function showHelp() {
  console.log(`
${kleur.bold("ludev-cc")} — Install Claude Code slash commands

${kleur.bold("Usage:")}
  ludev-cc                       Interactive mode
  ludev-cc install [command]     Install all or a specific command
  ludev-cc list                  List available commands
  ludev-cc remove <command>      Remove an installed command
  ludev-cc update                Update all installed commands

${kleur.bold("Options:")}
  --global, -g                   Target ~/.claude/commands/ instead of local
  --help, -h                     Show this help
`);
}

// --- Main ---

const args = process.argv.slice(2);
const flags = args.filter((a) => a.startsWith("-"));
const positional = args.filter((a) => !a.startsWith("-"));
const isGlobal = flags.includes("--global") || flags.includes("-g");
const wantsHelp = flags.includes("--help") || flags.includes("-h");

if (wantsHelp) {
  showHelp();
} else if (positional.length === 0) {
  interactive().catch((err) => {
    console.error(err);
    process.exit(1);
  });
} else {
  const cmd = positional[0];
  const arg = positional[1];

  switch (cmd) {
    case "install":
      cmdInstall(arg, { global: isGlobal });
      break;
    case "list":
    case "ls":
      cmdList();
      break;
    case "remove":
    case "rm":
      cmdRemove(arg, { global: isGlobal });
      break;
    case "update":
    case "up":
      cmdUpdate({ global: isGlobal });
      break;
    case "help":
      showHelp();
      break;
    default:
      // Treat unknown positional as a command name to install
      cmdInstall(cmd, { global: isGlobal });
      break;
  }
}

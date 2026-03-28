#!/usr/bin/env node

import { readdirSync, mkdirSync, copyFileSync, existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const commandsDir = join(__dirname, "..", "commands");

function getCommands() {
  return readdirSync(commandsDir).filter((f) => f.endsWith(".md"));
}

function list() {
  const commands = getCommands();
  if (commands.length === 0) {
    console.log("No commands available.");
    return;
  }
  console.log("Available commands:\n");
  for (const file of commands) {
    console.log(`  - ${file.replace(/\.md$/, "")}`);
  }
}

function install() {
  const commands = getCommands();
  if (commands.length === 0) {
    console.log("No commands to install.");
    return;
  }

  const targetDir = join(process.cwd(), ".claude", "commands");
  mkdirSync(targetDir, { recursive: true });

  let installed = 0;
  let skipped = 0;

  for (const file of commands) {
    const src = join(commandsDir, file);
    const dest = join(targetDir, file);

    if (existsSync(dest)) {
      const srcContent = readFileSync(src, "utf8");
      const destContent = readFileSync(dest, "utf8");
      if (srcContent === destContent) {
        console.log(`  skip: ${file} (identical)`);
        skipped++;
        continue;
      }
      console.log(`  overwrite: ${file}`);
    } else {
      console.log(`  install: ${file}`);
    }

    copyFileSync(src, dest);
    installed++;
  }

  console.log(
    `\nDone. ${installed} installed, ${skipped} skipped. Target: ${targetDir}`
  );
}

const command = process.argv[2] || "install";

switch (command) {
  case "install":
    install();
    break;
  case "list":
    list();
    break;
  default:
    console.log(`Unknown command: ${command}`);
    console.log("Usage: ludev-cc [install|list]");
    process.exit(1);
}

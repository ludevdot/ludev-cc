---
allowed-tools: Bash, Read, Glob, Grep
argument-hint: [what you're about to implement]
description: Check if similar code already exists before writing new code
license: MIT
metadata:
  author: ludev
  version: "0.1.0"
---

# Reuse Check

Scan the codebase for existing code that could be reused before implementing: $ARGUMENTS

## Current State

- Project structure: !`find . -type f \( -name "*.ts" -o -name "*.js" -o -name "*.tsx" -o -name "*.jsx" -o -name "*.py" -o -name "*.go" \) | head -50`
- Reuse locations: !`find . -type d \( -name utils -o -name helpers -o -name lib -o -name shared -o -name common -o -name core \) -not -path "*/node_modules/*" -not -path "*/.git/*" 2>/dev/null | head -20 || echo "No common reuse dirs found"`
- Dependencies: !`cat package.json 2>/dev/null | head -60 || cat requirements.txt 2>/dev/null | head -30 || cat go.mod 2>/dev/null | head -30 || echo "No dependency file found"`
- ast-grep available: !`which sg 2>/dev/null && sg --version 2>/dev/null || echo "not installed"`

## Task

Determine if existing code can be reused instead of writing something new for `$ARGUMENTS`.

### 1. Understand the intent

Parse `$ARGUMENTS` to determine:
- What the user is about to build (e.g., "date formatter", "auth middleware", "API client")
- Extract primary keywords and synonyms for searching
- Think broadly — developers name things differently ("format" vs "render", "fetch" vs "get" vs "request", "validate" vs "check" vs "assert")

### 2. Check for ast-grep

If `sg` is not installed, ask the user:
> `ast-grep` enables structural code search (by AST, not text) — much better at finding similar functions. Install it? (`brew install ast-grep` / `cargo install ast-grep`)

- If yes → install it and use it in step 3
- If no → proceed with Grep only

### 3. Search the codebase

Run all of these searches — cast a wide net:

**By structure (if `sg` available)** — AST-based search is more accurate:
- Search for function/method signatures matching the intent: `sg run -p 'function $NAME($$$ARGS)' -l <lang>`
- Search for similar patterns: `sg run -p 'const $NAME = ($$$ARGS) => $BODY' -l <lang>`
- Adapt patterns to the detected language (typescript, python, go, etc.)

**By name** — search function, class, and variable names related to the intent:
- Use Grep to find declarations: `function`, `const`, `class`, `def`, `func` followed by related keywords
- Include synonyms and abbreviations (e.g., for "format date": `formatDate`, `dateFormat`, `parseDate`, `toDate`, `dateUtils`, `fmtDate`)

**By location** — check reuse-oriented directories:
- Look inside any `utils/`, `helpers/`, `shared/`, `lib/`, `common/`, `core/` dirs found above
- Scan filenames in those dirs for related terms

**By dependency** — check if an existing dependency already does this:
- Search `package.json` dependencies, `requirements.txt`, `go.mod`, etc.
- Look for imports of related packages across the codebase (e.g., `import.*date-fns`, `from dayjs`, `require('lodash/get')`)

**By git history** — check if someone recently added or removed similar code:
- `git log --all --oneline --grep="<keyword>" | head -10`
- `git log --all --oneline --diff-filter=D -- "*<keyword>*" | head -5` (deleted files that might be relevant)

### 4. Analyze each candidate

For every match found, evaluate:

| Aspect | Question |
|--------|----------|
| **Purpose** | Does it solve the same problem, or just look similar? |
| **Reusability** | Can it be used as-is, or does it need changes? |
| **Quality** | Is it well-written, or would reusing it mean inheriting tech debt? |
| **Scope** | Is it tightly coupled to its current context, or generic enough? |

### 5. Report findings

**If matches found**, for each candidate show:

1. **File path** and function/class name
2. **Code snippet** — just the signature and key logic, keep it short
3. **Assessment**: one of:
   - **Reuse as-is** — import and use directly
   - **Extend** — add a parameter, generalize it, then both callers benefit
   - **Refactor** — it exists but is poorly written; refactor rather than duplicate
   - **Similar but different** — looks related but serves a different purpose; safe to write new code
4. **Recommendation** — what the user should do

**If no matches found:**

1. Confirm: "Nothing similar found — safe to create new code"
2. Suggest the best location for the new code based on project conventions (e.g., `src/utils/` if that pattern exists)
3. Suggest a name that fits existing naming patterns in the project

### Important rules

- Search broadly — don't rely on exact name matches
- Check installed dependencies too — maybe a library already does this
- Be honest: if something exists but is poorly written, say so — refactoring beats duplicating
- Keep output actionable — show what to do, not just raw grep results
- If the codebase is large, prioritize searching reuse directories first

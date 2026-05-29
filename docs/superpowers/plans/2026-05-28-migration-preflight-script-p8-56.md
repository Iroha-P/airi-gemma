# P8.56 Migration Preflight Script

## Goal

Add a local preflight script that checks whether required migration files and recommended local data folders are present before the user changes computers.

## Scope

- Add `scripts/check-airi-migration.ps1`.
- Keep the script read-only.
- Output a JSON report to stdout and optionally to a file.
- Check required files, recommended local data folders, and basic commands such as Git, Node.js, pnpm, and Python.
- Include a read-only Git working tree summary so migration can catch uncommitted or untracked work before changing devices.
- Update migration docs and the one-week migration plan.

## Verification

- Run the script from the project root.
- Run the migration script regression test on Windows.
- Run lint/fix on touched docs and scripts.
- Check whitespace for touched files.

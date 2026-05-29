# P8.61 Restore Empty Destination

## Goal

Make the migration restore script friendlier on a new computer while keeping overwrite safety intact.

## Scope

- Allow `restore-airi.ps1 -RestoreProject` to restore project files into an existing empty destination directory.
- Keep non-empty destinations protected unless the user passes `-Force`.
- Update the migration guide so normal existing-clone restores use `-RestoreLocalData`, while full project restores target an empty directory.
- Add a Windows regression test for project restore into an empty destination.

## Verification

- Run migration script tests.
- Run migration preflight script.
- Run stage-tamagotchi typecheck.
- Run lint/fix and whitespace checks.

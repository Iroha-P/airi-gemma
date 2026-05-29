# P8.69 Restore UserData To Current Machine Path

## Goal

Make full migration safer when moving to a new Windows account or new machine. The backup manifest records the source `AIRI userData` path for audit, but restore should not default to that old absolute path.

## Change

- `restore-airi.ps1` now defaults AIRI userData restore to the current machine's `%APPDATA%\AIRI`.
- `-AiriUserDataPath` remains the explicit override for custom restore paths.
- Migration tests cover explicit userData restoration and statically guard against reintroducing `manifest.airiUserDataPath` as the default restore destination.
- Migration docs explain the default and the explicit override.

## Validation

- `pnpm exec vitest run apps/stage-tamagotchi/scripts/migration-scripts.test.ts`
- `pnpm exec moeru-lint --fix apps/stage-tamagotchi/scripts/migration-scripts.test.ts scripts/restore-airi.ps1`

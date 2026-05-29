# P8.70 Backup Import Safety Rescan

## Goal

Treat Memory JSON backups as untrusted input, especially because they may come from older AIRI versions or another machine. Restored records must go through the same safety gate as fresh imports.

## Change

- `importMemoryBackup` rescans every restored item.
- Unsafe restored memories are forced to `privacy: secret`, `status: needs_review`, and tagged `safety-review`.
- Restored metadata preserves the original backup provenance and adds a fresh `metadata.safety` scan result when current content is unsafe.
- Backup preview now returns `safetyRisk` and `safetyFindings`.
- Memory settings UI shows safety-risk backup counts, selected-item warning, and per-item safety badges.
- Eventa backup preview types and compact profile withheld reasons were synchronized with implementation.

## Validation

- `pnpm exec vitest run apps/stage-tamagotchi/src/main/services/airi/memory/backup.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/index.test.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts`
- `pnpm exec moeru-lint --fix ...`

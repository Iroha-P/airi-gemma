# P8.30 Review Workbench Safety Evidence

## Goal

Show concise safety scanner evidence inside Review Workbench cards so users can understand why a memory was flagged as unsafe before rejecting, editing, or reclassifying it.

## Constraints

- Do not display raw memory excerpts beyond the existing card content.
- Do not display local paths or source IDs.
- Do not change Memory DB state.
- Do not change safety scanning, review snapshot generation, ordering, or actions.

## Plan

1. Read safety findings from existing `metadata.safety.findings`.
2. Add evidence rows for safety finding kind, severity, and reason.
3. Add localized labels.
4. Add a static UI contract test.
5. Update the architecture/design document.

## Verification

- Passed targeted Vitest review workbench UI tests.
- Passed `pnpm -F @proj-airi/stage-tamagotchi typecheck`.
- Passed `pnpm exec moeru-lint --fix` on touched code, test, i18n, and doc files.
- Passed `git diff --check` and trailing whitespace scan. Git reported existing LF-to-CRLF normalization warnings for the two touched i18n YAML files.

## Result

Review Workbench now exposes safety scanner findings as bounded evidence rows: finding kind, severity, and reason. It deliberately avoids showing raw secret values, local paths, source IDs, or additional raw memory excerpts.

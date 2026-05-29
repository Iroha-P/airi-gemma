# P8.55 Migration Readiness Checklist UI

## Goal

Add a small migration checklist to the Memory settings page so the user can see, before changing computers, whether active memory, Memory JSON backup, LLMWiki export, and Obsidian/AIRI-Brain export have been prepared.

## Component Map

- `apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue`: route-level composition surface that derives checklist rows from existing store state and renders the read-only checklist.
- Locale files: provide checklist labels in English and Simplified Chinese.
- UI snapshot test: checks the checklist keys, rows, locale coverage, and design-doc marker.

## Verification

- Run targeted Vitest for the new UI contract.
- Run memory settings store/page related tests if the static UI test passes.
- Run stage-tamagotchi typecheck after code changes.
- Run lint/fix and whitespace checks for touched files.

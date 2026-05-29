# P8.63 RAG Safety-Risk Withheld Gate

## Goal

Prevent unsafe memory records from entering RAG context even when legacy data or manual edits leave them as active non-secret memories.

## Scope

- Treat `metadata.safety.safe === false` as a RAG withheld reason.
- Add shared Eventa typing for the `safety_risk` withheld reason.
- Localize the new withheld reason in English and Simplified Chinese.
- Add tests for RAG composition and Memory settings UI wiring.

## Verification

- Run RAG context tests and Memory settings withheld UI wiring tests.
- Run stage-tamagotchi typecheck.
- Run targeted lint/fix and whitespace checks.

import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { createContext, defineInvoke } from '@moeru/eventa'
import { describe, expect, it, vi } from 'vitest'

import {
  electronComputerUseExecuteAction,
  electronComputerUseGetPolicy,
  electronComputerUseListAuditLogs,
  electronComputerUsePreviewAction,
} from '../../../../shared/eventa'
import { createComputerUseManager, createComputerUseService } from './index'

const policy = {
  allowedReadRoots: ['F:\\workspace'],
  allowedWriteRoots: ['F:\\workspace'],
  deniedRoots: ['F:\\workspace\\secret'],
  requireConfirmationRoots: ['F:\\workspace'],
}

describe('computer use manager', () => {
  it('requires confirmation for local read previews inside an allowed root', () => {
    const manager = createComputerUseManager({ policy })

    const preview = manager.previewAction({
      kind: 'read_file',
      target: 'F:\\workspace\\notes.md',
      reason: 'Summarize local notes',
    })

    expect(preview).toMatchObject({
      kind: 'read_file',
      target: 'F:\\workspace\\notes.md',
      risk: 'low',
      decision: 'confirm',
      requiresConfirmation: true,
      canExecute: true,
    })
    expect(preview.reasons).toContain('Local targets require user confirmation in controlled execution mode.')
  })

  it('marks mutating path actions as high-risk confirmation previews', () => {
    const manager = createComputerUseManager({ policy })

    const preview = manager.previewAction({
      kind: 'delete_path',
      target: 'F:\\workspace\\old-cache',
    })

    expect(preview).toMatchObject({
      risk: 'high',
      decision: 'confirm',
      requiresConfirmation: true,
      canExecute: false,
    })
    expect(preview.reasons).toContain('Mutating computer-use actions are high risk.')
  })

  it('denies actions that target a denied root', () => {
    const manager = createComputerUseManager({ policy })

    const preview = manager.previewAction({
      kind: 'read_file',
      target: 'F:\\workspace\\secret\\tokens.txt',
    })

    expect(preview).toMatchObject({
      decision: 'deny',
      requiresConfirmation: false,
      canExecute: false,
    })
    expect(preview.reasons).toContain('Target is inside a denied root.')
  })

  it('rejects malformed preview payloads before classification', () => {
    const manager = createComputerUseManager({ policy })

    expect(() => manager.previewAction({
      kind: 'unknown-action',
      target: 'F:\\workspace\\notes.md',
    } as never)).toThrow('Invalid computer-use action preview request')
  })

  it('denies read previews without a target', () => {
    const manager = createComputerUseManager({ policy })

    const preview = manager.previewAction({
      kind: 'read_file',
    })

    expect(preview).toMatchObject({
      decision: 'deny',
      requiresConfirmation: false,
      canExecute: false,
    })
    expect(preview.reasons).toContain('Action target is required.')
  })

  it('denies local reads outside allowed read roots', () => {
    const manager = createComputerUseManager({ policy })

    const preview = manager.previewAction({
      kind: 'read_file',
      target: 'F:\\other-project\\private.md',
    })

    expect(preview).toMatchObject({
      decision: 'deny',
      requiresConfirmation: false,
      canExecute: false,
    })
    expect(preview.reasons).toContain('Read target is outside allowed read roots.')
  })

  it('denies local writes outside allowed write roots', () => {
    const manager = createComputerUseManager({ policy })

    const preview = manager.previewAction({
      kind: 'write_file',
      target: 'F:\\other-project\\notes.md',
    })

    expect(preview).toMatchObject({
      risk: 'high',
      decision: 'deny',
      requiresConfirmation: false,
      canExecute: false,
    })
    expect(preview.reasons).toContain('Write target is outside allowed write roots.')
  })

  it('does not treat URLs as local filesystem targets', () => {
    const manager = createComputerUseManager({ policy })

    const preview = manager.previewAction({
      kind: 'open_url',
      target: 'https://example.com',
    })

    expect(preview).toMatchObject({
      decision: 'confirm',
      risk: 'medium',
      requiresConfirmation: true,
      canExecute: true,
    })
    expect(preview.reasons).toContain('Launching or opening resources requires confirmation.')
  })

  it('denies file URLs inside denied roots', () => {
    const manager = createComputerUseManager({ policy })

    const preview = manager.previewAction({
      kind: 'open_url',
      target: 'file:///F:/workspace/secret/tokens.txt',
    })

    expect(preview).toMatchObject({
      decision: 'deny',
      requiresConfirmation: false,
      canExecute: false,
    })
    expect(preview.reasons).toContain('Target is inside a denied root.')
  })

  it('denies unsupported URL schemes', () => {
    const manager = createComputerUseManager({ policy })

    const preview = manager.previewAction({
      kind: 'open_url',
      target: 'javascript:alert(1)',
    })

    expect(preview).toMatchObject({
      decision: 'deny',
      requiresConfirmation: false,
      canExecute: false,
    })
    expect(preview.reasons).toContain('URL scheme is not allowed.')
  })

  it('records preview actions in the audit log', () => {
    const manager = createComputerUseManager({ policy })

    const preview = manager.previewAction({
      kind: 'run_command',
      command: 'pnpm test',
      cwd: 'F:\\workspace',
    })

    expect(manager.listAuditLogs()).toEqual({
      items: [expect.objectContaining({
        id: preview.id,
        kind: 'run_command',
        command: 'pnpm test',
        canExecute: false,
      })],
    })
  })

  it('loads existing JSONL audit entries from disk', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'airi-computer-use-'))
    const auditLogPath = join(dir, 'audit.jsonl')
    await writeFile(auditLogPath, `${JSON.stringify({
      id: 'existing-preview',
      kind: 'open_path',
      target: 'F:\\workspace',
      risk: 'medium',
      decision: 'confirm',
      reasons: ['Loaded from disk.'],
      requiresConfirmation: true,
      canExecute: false,
      createdAt: '2026-05-11T00:00:00.000Z',
    })}\n`, 'utf-8')

    const manager = createComputerUseManager({ auditLogPath, policy })

    expect(manager.listAuditLogs()).toEqual({
      items: [expect.objectContaining({
        id: 'existing-preview',
        kind: 'open_path',
      })],
    })
  })

  it('revalidates loaded audit previews against the current policy before execution', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'airi-computer-use-'))
    const deniedDir = join(dir, 'secret')
    const auditLogPath = join(dir, 'audit.jsonl')
    await mkdir(deniedDir)
    await writeFile(join(deniedDir, 'tokens.txt'), 'secret-token', 'utf-8')
    await writeFile(auditLogPath, `${JSON.stringify({
      id: 'tampered-preview',
      kind: 'read_file',
      target: join(deniedDir, 'tokens.txt'),
      risk: 'low',
      decision: 'confirm',
      reasons: ['Tampered loaded preview.'],
      requiresConfirmation: true,
      canExecute: false,
      createdAt: '2026-05-11T00:00:00.000Z',
    })}\n`, 'utf-8')

    const manager = createComputerUseManager({
      auditLogPath,
      policy: {
        ...policy,
        allowedReadRoots: [dir],
        deniedRoots: [deniedDir],
        requireConfirmationRoots: [dir],
      },
    })

    await expect(manager.executeAction({
      approved: true,
      id: 'tampered-preview',
    })).rejects.toThrow('Computer-use execution target is inside a denied root')
  })

  it('appends audit entries to disk and keeps only recent entries in memory', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'airi-computer-use-'))
    const auditLogPath = join(dir, 'audit.jsonl')
    const manager = createComputerUseManager({
      auditLogPath,
      maxAuditEntries: 1,
      policy,
    })

    manager.previewAction({
      kind: 'open_path',
      target: 'F:\\workspace',
    })
    const latest = manager.previewAction({
      kind: 'run_command',
      command: 'pnpm test',
      cwd: 'F:\\workspace',
    })

    expect(manager.listAuditLogs()).toEqual({
      items: [expect.objectContaining({
        id: latest.id,
        kind: 'run_command',
      })],
    })
    expect((await readFile(auditLogPath, 'utf-8')).trim().split('\n')).toHaveLength(2)
  })

  it('executes an approved read_file preview by id', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'airi-computer-use-'))
    const target = join(dir, 'notes.md')
    await writeFile(target, 'AIRI local note.', 'utf-8')
    const manager = createComputerUseManager({
      policy: {
        ...policy,
        allowedReadRoots: [dir],
        requireConfirmationRoots: [dir],
      },
    })
    const preview = manager.previewAction({
      kind: 'read_file',
      target,
    })

    const result = await manager.executeAction({
      approved: true,
      id: preview.id,
    })

    expect(result).toMatchObject({
      kind: 'read_file',
      previewId: preview.id,
      status: 'completed',
    })
    expect(result.output).toContain('AIRI local note.')
  })

  it('refuses execution when approval is missing', async () => {
    const manager = createComputerUseManager({ policy })
    const preview = manager.previewAction({
      kind: 'open_url',
      target: 'https://example.com',
    })

    await expect(manager.executeAction({
      approved: false,
      id: preview.id,
    })).rejects.toThrow('Computer-use execution requires explicit approval')
  })

  it('refuses high-risk previews even when approved', async () => {
    const manager = createComputerUseManager({ policy })
    const preview = manager.previewAction({
      command: 'pnpm test',
      cwd: 'F:\\workspace',
      kind: 'run_command',
    })

    await expect(manager.executeAction({
      approved: true,
      id: preview.id,
    })).rejects.toThrow('Computer-use execution is not allowed for high-risk actions')
  })

  it('refuses previews that are explicitly marked non-executable', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'airi-computer-use-'))
    const auditLogPath = join(dir, 'audit.jsonl')
    await writeFile(auditLogPath, `${JSON.stringify({
      id: 'non-executable-preview',
      kind: 'open_url',
      target: 'https://example.com',
      risk: 'medium',
      decision: 'confirm',
      reasons: ['Tampered non-executable preview.'],
      requiresConfirmation: true,
      canExecute: false,
      createdAt: '2026-05-11T00:00:00.000Z',
    })}\n`, 'utf-8')

    const manager = createComputerUseManager({
      auditLogPath,
      policy,
    })

    await expect(manager.executeAction({
      approved: true,
      id: 'non-executable-preview',
    })).rejects.toThrow('Computer-use execution is not allowed for this preview')
  })

  it('executes search_files inside an approved read root', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'airi-computer-use-'))
    await mkdir(join(dir, 'docs'))
    await writeFile(join(dir, 'docs', 'memory.md'), 'memory', 'utf-8')
    await writeFile(join(dir, 'other.txt'), 'other', 'utf-8')
    const manager = createComputerUseManager({
      policy: {
        ...policy,
        allowedReadRoots: [dir],
        requireConfirmationRoots: [dir],
      },
    })
    const preview = manager.previewAction({
      kind: 'search_files',
      target: dir,
    })

    const result = await manager.executeAction({
      approved: true,
      id: preview.id,
    })

    expect(result.status).toBe('completed')
    expect(result.output).toContain('memory.md')
    expect(result.output).toContain('other.txt')
  })

  it('uses an injected opener for approved open actions', async () => {
    const openExternal = vi.fn(async () => undefined)
    const manager = createComputerUseManager({
      openExternal,
      policy,
    })
    const preview = manager.previewAction({
      kind: 'open_url',
      target: 'https://example.com',
    })

    const result = await manager.executeAction({
      approved: true,
      id: preview.id,
    })

    expect(openExternal).toHaveBeenCalledWith('https://example.com')
    expect(result).toMatchObject({
      output: 'Opened URL: https://example.com',
      status: 'completed',
    })
  })
})

describe('computer use service eventa adapter', () => {
  it('registers policy, preview, and audit invokes', async () => {
    const context = createContext()
    const manager = createComputerUseManager({ policy })

    createComputerUseService({ context: context as never, manager })

    await expect(defineInvoke(context, electronComputerUseGetPolicy)()).resolves.toMatchObject({
      mode: 'controlled_execution',
      allowedReadRoots: ['F:\\workspace'],
    })

    await expect(defineInvoke(context, electronComputerUsePreviewAction)({
      kind: 'open_path',
      target: 'F:\\workspace',
    })).resolves.toMatchObject({
      kind: 'open_path',
      decision: 'confirm',
      canExecute: true,
    })

    await expect(defineInvoke(context, electronComputerUseListAuditLogs)()).resolves.toEqual({
      items: [expect.objectContaining({ kind: 'open_path' })],
    })
  })

  it('registers execute invoke', async () => {
    const context = createContext()
    const dir = await mkdtemp(join(tmpdir(), 'airi-computer-use-'))
    const target = join(dir, 'notes.md')
    await writeFile(target, 'AIRI local note.', 'utf-8')
    const manager = createComputerUseManager({
      policy: {
        ...policy,
        allowedReadRoots: [dir],
        requireConfirmationRoots: [dir],
      },
    })

    createComputerUseService({ context: context as never, manager })

    const preview = await defineInvoke(context, electronComputerUsePreviewAction)({
      kind: 'read_file',
      target,
    })

    await expect(defineInvoke(context, electronComputerUseExecuteAction)({
      approved: true,
      id: preview.id,
    })).resolves.toMatchObject({
      kind: 'read_file',
      output: expect.stringContaining('AIRI local note.'),
      status: 'completed',
    })
  })
})

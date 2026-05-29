import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const execFileAsync = promisify(execFile)
const scriptTestTimeoutMs = 30_000

describe.skipIf(process.platform !== 'win32')('aIRI migration scripts', () => {
  let fixtureRoot: string
  let backupRoot: string
  let restoreRoot: string
  let projectRestoreRoot: string

  const oneClickStart = '一键启动.bat'
  const oneClickStop = '一键关闭.bat'

  beforeEach(async () => {
    fixtureRoot = await mkdtemp(join(tmpdir(), 'airi-migration-fixture-'))
    backupRoot = await mkdtemp(join(tmpdir(), 'airi-migration-backup-'))
    restoreRoot = await mkdtemp(join(tmpdir(), 'airi-migration-restore-'))
    projectRestoreRoot = await mkdtemp(join(tmpdir(), 'airi-migration-project-restore-'))

    await mkdir(join(fixtureRoot, 'docs', 'ai'), { recursive: true })
    await mkdir(join(fixtureRoot, 'docs', 'superpowers'), { recursive: true })
    await mkdir(join(fixtureRoot, 'scripts'), { recursive: true })
    await mkdir(join(fixtureRoot, 'gsv'), { recursive: true })
    await mkdir(join(fixtureRoot, 'stt-whisper'), { recursive: true })
    await mkdir(join(fixtureRoot, 'stt-funasr'), { recursive: true })

    const files = [
      'pnpm-lock.yaml',
      join('docs', 'ai', 'MIGRATION.zh-CN.md'),
      join('docs', 'ai', 'airi-memory-agent-orchestrator-design.zh-CN.md'),
      join('docs', 'ai', 'graduation-delivery-plan.zh-CN.md'),
      join('docs', 'ai', 'OPEN_SOURCE_PRIVACY_CHECKLIST.zh-CN.md'),
      join('scripts', 'backup-airi.ps1'),
      join('scripts', 'restore-airi.ps1'),
      join('scripts', 'bootstrap-airi-from-github.ps1'),
      join('scripts', 'create-airi-dev-package.ps1'),
      join('scripts', 'check-airi-migration.ps1'),
      join('scripts', 'check-airi-open-source.ps1'),
      join('scripts', 'check-airi-local-services.ps1'),
      join('scripts', 'check-airi-obsidian-vault.ps1'),
      join('scripts', 'collect-airi-readiness.ps1'),
      join('scripts', 'run-airi-migration-smoke.ps1'),
      join('scripts', 'create-airi-sanitized-demo-data.ps1'),
      join('scripts', 'create-airi-public-profile-sample.ps1'),
      join('scripts', 'create-airi-public-release.ps1'),
      join('docs', 'ai', 'PUBLIC_PROFILE_TEMPLATE.zh-CN.md'),
      'start.bat',
      oneClickStart,
      oneClickStop,
    ]

    await Promise.all(files.map(file => writeFile(join(fixtureRoot, file), 'fixture\n', 'utf8')))
  })

  afterEach(async () => {
    await Promise.all([
      rm(fixtureRoot, { recursive: true, force: true }),
      rm(backupRoot, { recursive: true, force: true }),
      rm(restoreRoot, { recursive: true, force: true }),
      rm(projectRestoreRoot, { recursive: true, force: true }),
    ])
  })

  it('detects Unicode one-click scripts in migration preflight', async () => {
    const { stdout } = await execFileAsync('powershell', [
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      join(process.cwd(), 'scripts', 'check-airi-migration.ps1'),
      '-ProjectRoot',
      fixtureRoot,
    ])

    const report = JSON.parse(stdout.slice(stdout.indexOf('{')))

    expect(report.ready).toBe(true)
    expect(report.gitStatus).toEqual(expect.objectContaining({ isRepository: false }))
    expect(report.missingRequired).toEqual([])
    expect(report.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'one-click start script', path: join(fixtureRoot, oneClickStart), exists: true }),
      expect.objectContaining({ label: 'one-click stop script', path: join(fixtureRoot, oneClickStop), exists: true }),
      expect.objectContaining({ label: 'GitHub bootstrap script', exists: true }),
      expect.objectContaining({ label: 'development package script', exists: true }),
      expect.objectContaining({ label: 'open-source privacy check script', exists: true }),
      expect.objectContaining({ label: 'local services check script', exists: true }),
      expect.objectContaining({ label: 'Obsidian vault check script', exists: true }),
      expect.objectContaining({ label: 'readiness collection script', exists: true }),
      expect.objectContaining({ label: 'migration smoke script', exists: true }),
      expect.objectContaining({ label: 'sanitized demo data script', exists: true }),
      expect.objectContaining({ label: 'public profile sample script', exists: true }),
      expect.objectContaining({ label: 'public release package script', exists: true }),
      expect.objectContaining({ label: 'open-source privacy checklist', exists: true }),
      expect.objectContaining({ label: 'public profile template', exists: true }),
    ]))
  }, scriptTestTimeoutMs)

  it('documents a GitHub bootstrap path without restoring old machine userData by default', async () => {
    const script = await readFile(join(process.cwd(), 'scripts', 'bootstrap-airi-from-github.ps1'), 'utf8')
    const guide = await readFile(join(process.cwd(), 'docs', 'ai', 'MIGRATION.zh-CN.md'), 'utf8')

    expect(script).toContain('[Parameter(Mandatory = $true)]')
    expect(script).toContain('[string]$RepoUrl')
    expect(script).toContain('& git @cloneArgs')
    expect(script).toContain('& pnpm -C $resolvedDestination install')
    expect(script).toContain('restore-airi.ps1')
    expect(script).toContain('-RestoreLocalData')
    expect(script).not.toContain('manifest.airiUserDataPath')
    expect(guide).toContain('GitHub 上传后一键部署')
    expect(guide).toContain('bootstrap-airi-from-github.ps1')
    expect(guide).toContain('GitHub 仓库不能替代本地备份包')
  }, scriptTestTimeoutMs)

  it('creates a compressed development package with an installer entrypoint', async () => {
    const outputDir = join(backupRoot, 'dev-package')
    await writeFile(
      join(fixtureRoot, 'scripts', 'backup-airi.ps1'),
      await readFile(join(process.cwd(), 'scripts', 'backup-airi.ps1'), 'utf8'),
      'utf8',
    )
    await writeFile(
      join(fixtureRoot, 'scripts', 'restore-airi.ps1'),
      await readFile(join(process.cwd(), 'scripts', 'restore-airi.ps1'), 'utf8'),
      'utf8',
    )

    const { stdout } = await execFileAsync('powershell', [
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      join(process.cwd(), 'scripts', 'create-airi-dev-package.ps1'),
      '-ProjectRoot',
      fixtureRoot,
      '-OutputDir',
      outputDir,
      '-KeepExpandedBackup',
      '-Force',
    ])

    const report = JSON.parse(stdout.slice(stdout.lastIndexOf('{')))

    expect(report.zipPath).toMatch(/airi-gemma-dev-package-\d{8}-\d{6}\.zip$/u)
    expect(report.packageMode).toBe('Source')
    expect(report.expandedBackupKept).toBe(true)
    await expect(readFile(join(report.backupRoot, 'INSTALL.zh-CN.md'), 'utf8')).resolves.toContain('Install On A New Machine')
    await expect(readFile(join(report.backupRoot, 'manifest.json'), 'utf8')).resolves.toContain('local-data')
    await expect(readFile(join(report.backupRoot, 'install-from-package.ps1'), 'utf8')).resolves.toContain('restore-airi.ps1')
    await expect(readFile(join(report.backupRoot, 'package-manifest.json'), 'utf8')).resolves.toContain('intendedForPrivateMigration')
    await expect(readFile(report.zipPath)).resolves.toBeInstanceOf(Buffer)
  }, scriptTestTimeoutMs)

  it('checks an Obsidian-compatible AIRI-Brain vault manifest and required files', async () => {
    const vaultPath = join(backupRoot, 'airi-brain')
    const obsidianPath = join(fixtureRoot, 'tools', 'Obsidian.exe')
    await mkdir(join(fixtureRoot, 'tools'), { recursive: true })
    await mkdir(join(vaultPath, '.airi'), { recursive: true })
    await mkdir(join(vaultPath, '10-profile'), { recursive: true })
    await writeFile(obsidianPath, 'fixture\n', 'utf8')
    await writeFile(join(vaultPath, 'AIRI-Brain.md'), '---\nsource: airi-memory-service\n---\n# AIRI-Brain\n', 'utf8')
    await writeFile(join(vaultPath, 'index.md'), '# AIRI-Brain Index\n', 'utf8')
    await writeFile(join(vaultPath, 'log.md'), '# AIRI-Brain Export Log\n', 'utf8')
    await writeFile(join(vaultPath, '05-compact-profile.md'), '# AIRI Compact Profile\n', 'utf8')
    await writeFile(join(vaultPath, '.airi', 'manifest.json'), JSON.stringify({
      schemaVersion: 1,
      sourceOfTruth: 'memory-db',
      privacy: {
        excludesSecretMemories: true,
        inboxRequiresReview: true,
      },
      files: [],
    }), 'utf8')

    const { stdout } = await execFileAsync('powershell', [
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      join(process.cwd(), 'scripts', 'check-airi-obsidian-vault.ps1'),
      '-ProjectRoot',
      fixtureRoot,
      '-VaultPath',
      vaultPath,
      '-ObsidianPath',
      obsidianPath,
    ])

    const report = JSON.parse(stdout.slice(stdout.indexOf('{')))

    expect(report.ready).toBe(true)
    expect(report.manifestValid).toBe(true)
    expect(report.sourceMarkerCount).toBe(1)
    expect(report.missingRequired).toEqual([])
    expect(report.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'AIRI-Brain home', exists: true }),
      expect.objectContaining({ label: 'AIRI manifest', exists: true }),
      expect.objectContaining({ label: 'Obsidian executable', path: obsidianPath, exists: true }),
    ]))
  }, scriptTestTimeoutMs)

  it('reports blocker findings for public candidate documents that still contain private profile details', async () => {
    await writeFile(
      join(fixtureRoot, 'docs', 'ai', 'public-demo.md'),
      'The public release still says fdu, weimi, and F:\\project\\private-memory.md.\n',
      'utf8',
    )

    const { stdout } = await execFileAsync('powershell', [
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      join(process.cwd(), 'scripts', 'check-airi-open-source.ps1'),
      '-ProjectRoot',
      fixtureRoot,
      '-IncludePaths',
      'docs/ai',
    ])

    const report = JSON.parse(stdout.slice(stdout.indexOf('{')))

    expect(report.releaseReady).toBe(false)
    expect(report.blockerCount).toBeGreaterThanOrEqual(2)
    expect(report.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ ruleId: 'private_identity_profile', path: join('docs', 'ai', 'public-demo.md') }),
      expect.objectContaining({ ruleId: 'local_absolute_path', path: join('docs', 'ai', 'public-demo.md') }),
    ]))
  }, scriptTestTimeoutMs)

  it('checks local service directories and an explicit Obsidian executable path', async () => {
    const obsidianPath = join(fixtureRoot, 'tools', 'Obsidian.exe')
    await mkdir(join(fixtureRoot, 'tools'), { recursive: true })
    await writeFile(obsidianPath, 'fixture\n', 'utf8')

    const { stdout } = await execFileAsync('powershell', [
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      join(process.cwd(), 'scripts', 'check-airi-local-services.ps1'),
      '-ProjectRoot',
      fixtureRoot,
      '-ObsidianPath',
      obsidianPath,
    ])

    const report = JSON.parse(stdout.slice(stdout.indexOf('{')))

    expect(report.ready).toBe(true)
    expect(report.checkEndpoints).toBe(false)
    expect(report.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'GPT-SoVITS workspace', exists: true }),
      expect.objectContaining({ label: 'Whisper STT service', exists: true }),
      expect.objectContaining({ label: 'FunASR STT service', exists: true }),
      expect.objectContaining({ label: 'Obsidian executable', path: obsidianPath, exists: true }),
    ]))
  }, scriptTestTimeoutMs)

  it('extracts local LLM model ids from configurable endpoint checks', async () => {
    const server = createServer((request, response) => {
      response.setHeader('content-type', 'application/json')
      if (request.url === '/api/tags') {
        response.end(JSON.stringify({ models: [{ name: 'gemma4:e4b' }] }))
        return
      }
      if (request.url === '/v1/models') {
        response.end(JSON.stringify({ data: [{ id: 'gemma4:e4b' }, { id: 'qwen2.5:7b' }] }))
        return
      }
      response.end(JSON.stringify({ ok: true }))
    })

    try {
      await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
      const address = server.address()
      if (!address || typeof address === 'string')
        throw new Error('Test HTTP server did not expose a port')

      const baseUrl = `http://127.0.0.1:${address.port}`
      const { stdout } = await execFileAsync('powershell', [
        '-ExecutionPolicy',
        'Bypass',
        '-File',
        join(process.cwd(), 'scripts', 'check-airi-local-services.ps1'),
        '-ProjectRoot',
        fixtureRoot,
        '-CheckEndpoints',
        '-OllamaNativeUrl',
        `${baseUrl}/api/tags`,
        '-OllamaOpenAIUrl',
        `${baseUrl}/v1/models`,
        '-LmStudioUrl',
        `${baseUrl}/v1/models`,
        '-GptSoVitsUrl',
        `${baseUrl}/health`,
      ])

      const report = JSON.parse(stdout.slice(stdout.indexOf('{')))
      const openAIEndpoint = report.items.find((item: { label: string }) => item.label === 'Ollama OpenAI-compatible models')

      expect(openAIEndpoint).toEqual(expect.objectContaining({
        exists: true,
        modelCount: 2,
        modelIds: ['gemma4:e4b', 'qwen2.5:7b'],
      }))
      expect(report.missingRecommended).not.toContain('LM Studio OpenAI-compatible models')
      expect(report.missingRecommended).not.toContain('GPT-SoVITS API')
    }
    finally {
      await new Promise<void>((resolve, reject) => {
        server.close(error => error ? reject(error) : resolve())
      })
    }
  }, scriptTestTimeoutMs)

  it('collects migration, open-source, and local-service reports into a readiness folder', async () => {
    const outputDir = join(backupRoot, 'readiness')
    const obsidianPath = join(fixtureRoot, 'tools', 'Obsidian.exe')
    await mkdir(join(fixtureRoot, 'tools'), { recursive: true })
    await writeFile(obsidianPath, 'fixture\n', 'utf8')

    const { stdout } = await execFileAsync('powershell', [
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      join(process.cwd(), 'scripts', 'collect-airi-readiness.ps1'),
      '-ProjectRoot',
      fixtureRoot,
      '-OutputDir',
      outputDir,
      '-ObsidianPath',
      obsidianPath,
    ])

    const summary = JSON.parse(stdout.slice(stdout.indexOf('{')))

    expect(summary.outputDir).toBe(outputDir)
    expect(summary.migration.ready).toBe(true)
    expect(summary.localServices.ready).toBe(true)
    expect(summary.openSource.reportPath).toBe(join(outputDir, 'open-source-check.json'))
    expect(summary.obsidianVault.ready).toBe(false)
    expect(summary.obsidianVault.reportPath).toBe(join(outputDir, 'obsidian-vault-check.json'))
    await expect(readFile(join(outputDir, 'migration-check.json'), 'utf8')).resolves.toContain('migration guide')
    await expect(readFile(join(outputDir, 'local-services-check.json'), 'utf8')).resolves.toContain('Obsidian executable')
    await expect(readFile(join(outputDir, 'obsidian-vault-check.json'), 'utf8')).resolves.toContain('AIRI-Brain home')
    await expect(readFile(join(outputDir, 'readiness-summary.json'), 'utf8')).resolves.toContain('nextActions')
  }, scriptTestTimeoutMs)

  it('creates a sanitized synthetic import sample for knowledge and chat smoke tests', async () => {
    const outputDir = join(backupRoot, 'sanitized-demo-import')

    const { stdout } = await execFileAsync('powershell', [
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      join(process.cwd(), 'scripts', 'create-airi-sanitized-demo-data.ps1'),
      '-ProjectRoot',
      fixtureRoot,
      '-OutputDir',
      outputDir,
    ])

    const report = JSON.parse(stdout.slice(stdout.indexOf('{')))

    expect(report.outputDir).toBe(outputDir)
    expect(report.files).toEqual(expect.arrayContaining([
      'README.md',
      join('knowledge', 'airi-memory-agent.md'),
      join('chat', 'wechat', 'synthetic-chat.txt'),
      join('chat', 'feishu', 'synthetic-chat.txt'),
      join('chat', 'qq', 'synthetic-chat.md'),
      'manifest.json',
    ]))
    await expect(readFile(join(outputDir, 'manifest.json'), 'utf8')).resolves.toContain('Synthetic sanitized AIRI import sample')
    await expect(readFile(join(outputDir, 'chat', 'wechat', 'synthetic-chat.txt'), 'utf8')).resolves.toContain('needs_review')
  }, scriptTestTimeoutMs)

  it('creates a synthetic public profile sample that passes the open-source privacy check', async () => {
    const outputDir = join(backupRoot, 'public-profile-sample')

    const created = await execFileAsync('powershell', [
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      join(process.cwd(), 'scripts', 'create-airi-public-profile-sample.ps1'),
      '-ProjectRoot',
      fixtureRoot,
      '-OutputDir',
      outputDir,
    ])

    const createReport = JSON.parse(created.stdout.slice(created.stdout.indexOf('{')))

    expect(createReport.outputDir).toBe(outputDir)
    expect(createReport.files).toEqual(expect.arrayContaining([
      'public-profile.md',
      'public-lora-sample.jsonl',
      'manifest.json',
    ]))
    await expect(readFile(join(outputDir, 'public-profile.md'), 'utf8')).resolves.toContain('local-first companion')
    await expect(readFile(join(outputDir, 'public-lora-sample.jsonl'), 'utf8')).resolves.toContain('training_sanitized')

    const checked = await execFileAsync('powershell', [
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      join(process.cwd(), 'scripts', 'check-airi-open-source.ps1'),
      '-ProjectRoot',
      fixtureRoot,
      '-IncludePaths',
      outputDir,
    ])

    const checkReport = JSON.parse(checked.stdout.slice(checked.stdout.indexOf('{')))
    expect(checkReport.releaseReady).toBe(true)
    expect(checkReport.blockerCount).toBe(0)
  }, scriptTestTimeoutMs)

  it('creates a sanitized public release package with a safe check summary', async () => {
    const outputDir = join(backupRoot, 'public-release')

    const created = await execFileAsync('powershell', [
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      join(process.cwd(), 'scripts', 'create-airi-public-release.ps1'),
      '-ProjectRoot',
      fixtureRoot,
      '-OutputDir',
      outputDir,
    ])

    const createReport = JSON.parse(created.stdout.slice(created.stdout.indexOf('{')))

    expect(createReport.outputDir).toBe(outputDir)
    expect(createReport.releaseReady).toBe(true)
    expect(createReport.files).toEqual(expect.arrayContaining([
      'README.md',
      join('samples', 'public-profile', 'public-profile.md'),
      join('samples', 'public-profile', 'public-lora-sample.jsonl'),
      join('samples', 'public-profile', 'manifest.json'),
      'open-source-check-summary.json',
      'manifest.json',
    ]))
    await expect(readFile(join(outputDir, 'README.md'), 'utf8')).resolves.toContain('sanitized public demo candidate')
    const manifest = JSON.parse((await readFile(join(outputDir, 'manifest.json'), 'utf8')).replace(/^\uFEFF/u, ''))
    const checkSummary = JSON.parse((await readFile(join(outputDir, 'open-source-check-summary.json'), 'utf8')).replace(/^\uFEFF/u, ''))
    expect(manifest.containsPrivateData).toBe(false)
    expect(checkSummary.releaseReady).toBe(true)

    const checked = await execFileAsync('powershell', [
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      join(process.cwd(), 'scripts', 'check-airi-open-source.ps1'),
      '-ProjectRoot',
      fixtureRoot,
      '-IncludePaths',
      outputDir,
    ])

    const checkReport = JSON.parse(checked.stdout.slice(checked.stdout.indexOf('{')))
    expect(checkReport.releaseReady).toBe(true)
    expect(checkReport.blockerCount).toBe(0)
  }, scriptTestTimeoutMs)

  it('runs a migration smoke rehearsal with sanitized demo data and readiness reports', async () => {
    const outputDir = join(backupRoot, 'migration-smoke')
    const obsidianPath = join(fixtureRoot, 'tools', 'Obsidian.exe')
    await mkdir(join(fixtureRoot, 'tools'), { recursive: true })
    await writeFile(obsidianPath, 'fixture\n', 'utf8')

    const { stdout } = await execFileAsync('powershell', [
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      join(process.cwd(), 'scripts', 'run-airi-migration-smoke.ps1'),
      '-ProjectRoot',
      fixtureRoot,
      '-OutputDir',
      outputDir,
      '-ObsidianPath',
      obsidianPath,
    ])

    const summary = JSON.parse(stdout.slice(stdout.indexOf('{')))

    expect(summary.outputDir).toBe(outputDir)
    expect(summary.sanitizedDemo.fileCount).toBeGreaterThanOrEqual(6)
    expect(summary.readiness.ready).toBe(true)
    expect(summary.readiness.obsidianVaultReady).toBe(false)
    await expect(readFile(join(outputDir, 'sanitized-demo-import', 'manifest.json'), 'utf8')).resolves.toContain('Synthetic sanitized AIRI import sample')
    await expect(readFile(join(outputDir, 'readiness', 'readiness-summary.json'), 'utf8')).resolves.toContain('obsidianVault')
    await expect(readFile(join(outputDir, 'migration-smoke-summary.json'), 'utf8')).resolves.toContain('sanitized-demo-import')
  }, scriptTestTimeoutMs)

  it('backs up and restores Unicode one-click scripts', async () => {
    const backup = await execFileAsync('powershell', [
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      join(process.cwd(), 'scripts', 'backup-airi.ps1'),
      '-ProjectRoot',
      fixtureRoot,
      '-OutputDir',
      backupRoot,
    ])

    const backupPath = backup.stdout.match(/Backup created: (?<path>.+)/u)?.groups?.path.trim()
    expect(backupPath).toBeTruthy()

    await execFileAsync('powershell', [
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      join(process.cwd(), 'scripts', 'restore-airi.ps1'),
      '-BackupPath',
      backupPath!,
      '-DestinationRoot',
      restoreRoot,
      '-RestoreLocalData',
    ])

    await expect(readFile(join(restoreRoot, oneClickStart), 'utf8')).resolves.toContain('fixture')
    await expect(readFile(join(restoreRoot, oneClickStop), 'utf8')).resolves.toContain('fixture')
  }, scriptTestTimeoutMs)

  it('backs up AIRI-Brain as local data instead of mixing it into the project snapshot', async () => {
    await mkdir(join(fixtureRoot, 'airi-brain', '.airi'), { recursive: true })
    await writeFile(join(fixtureRoot, 'airi-brain', 'AIRI-Brain.md'), '# AIRI-Brain\n', 'utf8')
    await writeFile(join(fixtureRoot, 'airi-brain', '.airi', 'manifest.json'), '{"schemaVersion":1}\n', 'utf8')

    const backup = await execFileAsync('powershell', [
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      join(process.cwd(), 'scripts', 'backup-airi.ps1'),
      '-ProjectRoot',
      fixtureRoot,
      '-OutputDir',
      backupRoot,
    ])

    const backupPath = backup.stdout.match(/Backup created: (?<path>.+)/u)?.groups?.path.trim()
    expect(backupPath).toBeTruthy()

    await expect(readFile(join(backupPath!, 'local-data', 'airi-brain', 'AIRI-Brain.md'), 'utf8')).resolves.toContain('AIRI-Brain')
    await expect(readFile(join(backupPath!, 'manifest.json'), 'utf8')).resolves.toContain('airi-brain')
    await expect(readFile(join(backupPath!, 'project', 'airi-brain', 'AIRI-Brain.md'), 'utf8')).rejects.toThrow()

    await execFileAsync('powershell', [
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      join(process.cwd(), 'scripts', 'restore-airi.ps1'),
      '-BackupPath',
      backupPath!,
      '-DestinationRoot',
      restoreRoot,
      '-RestoreLocalData',
    ])

    await expect(readFile(join(restoreRoot, 'airi-brain', '.airi', 'manifest.json'), 'utf8')).resolves.toContain('schemaVersion')
  }, scriptTestTimeoutMs)

  it('restores AIRI userData to an explicit current-machine path', async () => {
    const sourceUserData = join(fixtureRoot, 'airi-user-data-source')
    const targetUserData = join(restoreRoot, 'AIRI')
    await mkdir(join(sourceUserData, 'memory', 'pglite'), { recursive: true })
    await writeFile(join(sourceUserData, 'memory', 'pglite', 'state.txt'), 'memory-db\n', 'utf8')

    const backup = await execFileAsync('powershell', [
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      join(process.cwd(), 'scripts', 'backup-airi.ps1'),
      '-ProjectRoot',
      fixtureRoot,
      '-OutputDir',
      backupRoot,
      '-AiriUserDataPath',
      sourceUserData,
    ])

    const backupPath = backup.stdout.match(/Backup created: (?<path>.+)/u)?.groups?.path.trim()
    expect(backupPath).toBeTruthy()

    await execFileAsync('powershell', [
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      join(process.cwd(), 'scripts', 'restore-airi.ps1'),
      '-BackupPath',
      backupPath!,
      '-DestinationRoot',
      restoreRoot,
      '-RestoreLocalData',
      '-AiriUserDataPath',
      targetUserData,
    ])

    await expect(readFile(join(targetUserData, 'memory', 'pglite', 'state.txt'), 'utf8')).resolves.toContain('memory-db')
  }, scriptTestTimeoutMs)

  it('defaults userData restore to the current machine instead of the manifest source path', async () => {
    const restoreScript = await readFile(join(process.cwd(), 'scripts', 'restore-airi.ps1'), 'utf8')

    expect(restoreScript).toContain('$resolvedUserData = Get-DefaultAiriUserDataPath')
    expect(restoreScript).not.toContain('manifest.airiUserDataPath')
  }, scriptTestTimeoutMs)

  it('restores project files into an empty destination without requiring force', async () => {
    const backup = await execFileAsync('powershell', [
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      join(process.cwd(), 'scripts', 'backup-airi.ps1'),
      '-ProjectRoot',
      fixtureRoot,
      '-OutputDir',
      backupRoot,
    ])

    const backupPath = backup.stdout.match(/Backup created: (?<path>.+)/u)?.groups?.path.trim()
    expect(backupPath).toBeTruthy()

    await execFileAsync('powershell', [
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      join(process.cwd(), 'scripts', 'restore-airi.ps1'),
      '-BackupPath',
      backupPath!,
      '-DestinationRoot',
      projectRestoreRoot,
      '-RestoreProject',
    ])

    await expect(readFile(join(projectRestoreRoot, 'pnpm-lock.yaml'), 'utf8')).resolves.toContain('fixture')
    await expect(readFile(join(projectRestoreRoot, 'docs', 'ai', 'MIGRATION.zh-CN.md'), 'utf8')).resolves.toContain('fixture')
  }, scriptTestTimeoutMs)
})

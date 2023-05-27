import {beforeEach, describe, expect, it, vi} from 'vitest'

import {getOptionsFromGithubActionInput} from './github'
import {downloadCodeClimateExecutable} from './download'
import * as codeclimate from './codeclimate'
import main from './main'

vi.mock('./github')
vi.mock('./download')
vi.mock('./codeclimate')

describe('main', () => {
  const baseInput = {
    runBeforeBuild: false,
    collectCoverage: false,
    runAfterBuild: false,
    lastCommandExitCode: 0,
    coverageFilePatterns: [],
    repositoryRootPath: '/fake-path/repository'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getOptionsFromGithubActionInput).mockReturnValue(baseInput)
    vi.mocked(downloadCodeClimateExecutable).mockResolvedValue(
      '/fake-path/code-climate'
    )
  })

  it('should get options from Github action input', async () => {
    await main()

    expect(getOptionsFromGithubActionInput).toHaveBeenCalled()
  })

  it('should run before build when asked for', async () => {
    vi.mocked(getOptionsFromGithubActionInput).mockReturnValue({
      ...baseInput,
      runBeforeBuild: true
    })

    await main()

    expect(codeclimate.runBeforeBuild).toHaveBeenCalledWith({
      codeClimateExecutable: '/fake-path/code-climate',
      repositoryRootPath: '/fake-path/repository'
    })
  })

  it('should skip running before build when not asked for', async () => {
    vi.mocked(getOptionsFromGithubActionInput).mockReturnValue({
      ...baseInput,
      runBeforeBuild: false
    })

    await main()

    expect(codeclimate.runBeforeBuild).not.toHaveBeenCalled()
  })

  it('should collect coverage info when asked for', async () => {
    vi.mocked(getOptionsFromGithubActionInput).mockReturnValue({
      ...baseInput,
      collectCoverage: true,
      coverageFilePatterns: [
        {
          pattern: 'the-pattern',
          type: 'lcov'
        }
      ]
    })

    await main()

    expect(codeclimate.collectCoverage).toHaveBeenCalledWith({
      codeClimateExecutable: '/fake-path/code-climate',
      coverageFilePatternsAndTypes: [
        {
          pattern: 'the-pattern',
          type: 'lcov'
        }
      ],
      prefix: undefined,
      absolutePathToOutputFolder: '/fake-path',
      repositoryRootPath: '/fake-path/repository'
    })
  })

  it('should skip collecting coverage info when not asked for', async () => {
    vi.mocked(getOptionsFromGithubActionInput).mockReturnValue({
      ...baseInput,
      collectCoverage: false
    })

    await main()

    expect(codeclimate.collectCoverage).not.toHaveBeenCalled()
  })

  it('should run after build when asked for', async () => {
    vi.mocked(getOptionsFromGithubActionInput).mockReturnValue({
      ...baseInput,
      runAfterBuild: true
    })

    await main()

    expect(codeclimate.runAfterBuild).toHaveBeenCalledWith({
      codeClimateExecutable: '/fake-path/code-climate',
      lastCommandExitCode: 0,
      repositoryRootPath: '/fake-path/repository'
    })
  })

  it('should skip running after build when not asked for', async () => {
    vi.mocked(getOptionsFromGithubActionInput).mockReturnValue({
      ...baseInput,
      runAfterBuild: false
    })

    await main()

    expect(codeclimate.runAfterBuild).not.toHaveBeenCalled()
  })
})

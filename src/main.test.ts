import * as github from './github'
import * as download from './download'
import * as codeclimate from './codeclimate'
import main from './main'

jest.mock('./github')
jest.mock('./download')
jest.mock('./codeclimate')

describe('main', () => {
  const baseInput = {
    runBeforeBuild: false,
    collectCoverage: false,
    runAfterBuild: false,
    lastCommandExitCode: 0,
    coverageFilePatterns: []
  }

  beforeEach(() => {
    jest
      .spyOn(github, 'getOptionsFromGithubActionInput')
      .mockReturnValue(baseInput)
    jest
      .spyOn(download, 'downloadCodeClimateExecutable')
      .mockResolvedValue('/fake-path/code-climate')
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should get options from Github action input', async () => {
    await main()

    expect(github.getOptionsFromGithubActionInput).toHaveBeenCalled()
  })

  it('should run before build when asked for', async () => {
    jest.spyOn(github, 'getOptionsFromGithubActionInput').mockReturnValue({
      ...baseInput,
      runBeforeBuild: true
    })

    await main()

    expect(codeclimate.runBeforeBuild).toHaveBeenCalledWith(
      '/fake-path/code-climate'
    )
  })

  it('should skip running before build when not asked for', async () => {
    jest.spyOn(github, 'getOptionsFromGithubActionInput').mockReturnValue({
      ...baseInput,
      runBeforeBuild: false
    })

    await main()

    expect(codeclimate.runBeforeBuild).not.toHaveBeenCalled()
  })

  it('should collect coverage info when asked for', async () => {
    jest.spyOn(github, 'getOptionsFromGithubActionInput').mockReturnValue({
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
      absolutePathToOutputFolder: '/fake-path'
    })
  })

  it('should skip collecting coverage info when not asked for', async () => {
    jest.spyOn(github, 'getOptionsFromGithubActionInput').mockReturnValue({
      ...baseInput,
      collectCoverage: false
    })

    await main()

    expect(codeclimate.collectCoverage).not.toHaveBeenCalled()
  })

  it('should run after build when asked for', async () => {
    jest.spyOn(github, 'getOptionsFromGithubActionInput').mockReturnValue({
      ...baseInput,
      runAfterBuild: true
    })

    await main()

    expect(codeclimate.runAfterBuild).toHaveBeenCalledWith({
      codeClimateExecutable: '/fake-path/code-climate',
      lastCommandExitCode: 0
    })
  })

  it('should skip running after build when not asked for', async () => {
    jest.spyOn(github, 'getOptionsFromGithubActionInput').mockReturnValue({
      ...baseInput,
      runAfterBuild: false
    })

    await main()

    expect(codeclimate.runAfterBuild).not.toHaveBeenCalled()
  })
})

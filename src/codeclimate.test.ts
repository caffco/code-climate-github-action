import {beforeEach, describe, expect, it, vi} from 'vitest'

import {isDebug, warning} from '@actions/core'
import {exec} from '@actions/exec'
import {create} from '@actions/glob'
import {getEnvironment} from './environment'

import {runBeforeBuild, collectCoverage, runAfterBuild} from './codeclimate'

vi.mock('@actions/core')
vi.mock('@actions/glob')
vi.mock('@actions/exec')
vi.mock('./environment')

const globSpy = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()

  globSpy.mockResolvedValue(['/fake-path/file-a', '/fake-path/file-b'])
  vi.mocked(exec).mockResolvedValue(0)
  vi.mocked(getEnvironment).mockReturnValue({
    GIT_BRANCH: 'the-branch',
    GIT_COMMIT_SHA: 'the-hash',
    CC_TEST_REPORTER_ID: 'reporter-id'
  })
  vi.mocked(create).mockResolvedValue({
    glob: globSpy
  } as never)
  vi.mocked(isDebug).mockReturnValue(false)
})

describe('#runBeforeBuild', () => {
  it('should run proper command', async () => {
    await runBeforeBuild({
      codeClimateExecutable: 'code-climate-executable-path',
      repositoryRootPath: '/fake-path/repository'
    })

    expect(exec).toHaveBeenCalledWith(
      'code-climate-executable-path',
      ['before-build'],
      {
        cwd: '/fake-path/repository',
        env: {
          GIT_BRANCH: 'the-branch',
          GIT_COMMIT_SHA: 'the-hash',
          CC_TEST_REPORTER_ID: 'reporter-id'
        }
      }
    )
  })

  it('should reject with an error if command fails', async () => {
    vi.mocked(exec).mockResolvedValue(1)

    await expect(
      runBeforeBuild({
        codeClimateExecutable: 'code-climate-executable-path',
        repositoryRootPath: '/fake-path/repository'
      })
    ).rejects.toThrow('before-build command failed')
  })
})

describe('#collectCoverage', () => {
  it('should format files matching pattern', async () => {
    await collectCoverage({
      repositoryRootPath: '/fake-path/repository',
      codeClimateExecutable: 'code-climate-executable-path',
      absolutePathToOutputFolder: '/fake-output-path',
      coverageFilePatternsAndTypes: [
        {
          pattern: '*.lcov',
          type: 'lcov'
        },
        {
          pattern: '*.junit',
          type: 'junit'
        }
      ]
    })

    expect(create).toHaveBeenCalledWith('*.lcov')
    expect(create).toHaveBeenCalledWith('*.junit')
    expect(exec).toHaveBeenCalledWith(
      'code-climate-executable-path',
      [
        'format-coverage',
        '/fake-path/file-a',
        '-t',
        'lcov',
        '-o',
        '/fake-output-path/codeclimate.0.0.json'
      ],
      {
        cwd: '/fake-path/repository'
      }
    )
    expect(exec).toHaveBeenCalledWith(
      'code-climate-executable-path',
      [
        'format-coverage',
        '/fake-path/file-b',
        '-t',
        'lcov',
        '-o',
        '/fake-output-path/codeclimate.0.1.json'
      ],
      {
        cwd: '/fake-path/repository'
      }
    )
    expect(exec).toHaveBeenCalledWith(
      'code-climate-executable-path',
      [
        'format-coverage',
        '/fake-path/file-a',
        '-t',
        'junit',
        '-o',
        '/fake-output-path/codeclimate.1.0.json'
      ],
      {
        cwd: '/fake-path/repository'
      }
    )
    expect(exec).toHaveBeenCalledWith(
      'code-climate-executable-path',
      [
        'format-coverage',
        '/fake-path/file-b',
        '-t',
        'junit',
        '-o',
        '/fake-output-path/codeclimate.1.1.json'
      ],
      {
        cwd: '/fake-path/repository'
      }
    )
  })

  it('should ignore patterns without matches', async () => {
    globSpy
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(['/fake-path/file-a'])

    await collectCoverage({
      repositoryRootPath: '/fake-path/repository',
      codeClimateExecutable: 'code-climate-executable-path',
      absolutePathToOutputFolder: '/fake-output-path',
      coverageFilePatternsAndTypes: [
        {
          pattern: '*.lcov',
          type: 'lcov'
        },
        {
          pattern: '*.junit',
          type: 'junit'
        }
      ]
    })

    expect(warning).toHaveBeenCalledWith(
      'Could not find any file for pattern «*.lcov»'
    )
    expect(exec).not.toHaveBeenCalledWith(
      'format-coverage',
      [expect.anything(), '-t', 'lcov', '-o', expect.anything()],
      expect.anything()
    )
  })

  it('should respect prefix', async () => {
    await collectCoverage({
      repositoryRootPath: '/fake-path/repository',
      codeClimateExecutable: 'code-climate-executable-path',
      absolutePathToOutputFolder: '/fake-output-path',
      coverageFilePatternsAndTypes: [
        {
          pattern: '*.lcov',
          type: 'lcov'
        },
        {
          pattern: '*.junit',
          type: 'junit'
        }
      ],
      prefix: 'my-prefix'
    })

    expect(exec).toHaveBeenCalledWith(
      'code-climate-executable-path',
      [
        'format-coverage',
        expect.anything(),
        '-t',
        expect.anything(),
        '-o',
        expect.anything(),
        '--prefix',
        'my-prefix'
      ],
      {
        cwd: '/fake-path/repository'
      }
    )
    expect(exec).not.toHaveBeenCalledWith(
      'code-climate-executable-path',
      [
        'format-coverage',
        expect.anything(),
        '-t',
        expect.anything(),
        '-o',
        expect.anything()
      ],
      {
        cwd: '/fake-path/repository',
        env: {
          CC_TEST_REPORTER_ID: 'reporter-id',
          GIT_BRANCH: 'the-branch',
          GIT_COMMIT_SHA: 'the-hash'
        }
      }
    )
  })

  it('should respect debug mode', async () => {
    vi.mocked(isDebug).mockReturnValue(true)

    await collectCoverage({
      repositoryRootPath: '/fake-path/repository',
      codeClimateExecutable: 'code-climate-executable-path',
      absolutePathToOutputFolder: '/fake-output-path',
      coverageFilePatternsAndTypes: [
        {
          pattern: '*.lcov',
          type: 'lcov'
        },
        {
          pattern: '*.junit',
          type: 'junit'
        }
      ]
    })

    expect(exec).toHaveBeenCalledWith(
      'code-climate-executable-path',
      [
        'format-coverage',
        expect.anything(),
        '-t',
        expect.anything(),
        '-o',
        expect.anything(),
        '--debug'
      ],
      {
        cwd: '/fake-path/repository'
      }
    )
    expect(exec).not.toHaveBeenCalledWith(
      'code-climate-executable-path',
      [
        'format-coverage',
        expect.anything(),
        '-t',
        expect.anything(),
        '-o',
        expect.anything()
      ],
      {
        cwd: '/fake-path/repository',
        env: {
          CC_TEST_REPORTER_ID: 'reporter-id',
          GIT_BRANCH: 'the-branch',
          GIT_COMMIT_SHA: 'the-hash'
        }
      }
    )
  })

  it('should fail if formatting fail', async () => {
    vi.mocked(exec).mockResolvedValue(1)

    await expect(
      collectCoverage({
        repositoryRootPath: '/fake-path/repository',
        codeClimateExecutable: 'code-climate-executable-path',
        absolutePathToOutputFolder: '/fake-output-path',
        coverageFilePatternsAndTypes: [
          {
            pattern: '*.lcov',
            type: 'lcov'
          },
          {
            pattern: '*.junit',
            type: 'junit'
          }
        ]
      })
    ).rejects.toThrow(
      'Could not format coverage file at «/fake-path/file-a». Parameters: [ «format-coverage», «/fake-path/file-a», «-t», «lcov», «-o», «/fake-output-path/codeclimate.0.0.json» ]'
    )
  })

  it('should fail if there are matches', async () => {
    globSpy.mockResolvedValue([])

    await expect(
      collectCoverage({
        repositoryRootPath: '/fake-path/repository',
        codeClimateExecutable: 'code-climate-executable-path',
        absolutePathToOutputFolder: '/fake-output-path',
        coverageFilePatternsAndTypes: [
          {
            pattern: '*.lcov',
            type: 'lcov'
          },
          {
            pattern: '*.junit',
            type: 'junit'
          }
        ]
      })
    ).rejects.toThrow('No coverage files found')

    expect(warning).toHaveBeenCalledWith(
      'Could not find any file for pattern «*.lcov»'
    )
    expect(warning).toHaveBeenCalledWith(
      'Could not find any file for pattern «*.junit»'
    )
    expect(exec).not.toHaveBeenCalled()
  })

  it('should create total coverage file', async () => {
    await collectCoverage({
      repositoryRootPath: '/fake-path/repository',
      codeClimateExecutable: 'code-climate-executable-path',
      absolutePathToOutputFolder: '/fake-output-path',
      coverageFilePatternsAndTypes: [
        {
          pattern: '*.lcov',
          type: 'lcov'
        },
        {
          pattern: '*.junit',
          type: 'junit'
        }
      ]
    })

    expect(exec).toHaveBeenCalledWith(
      'code-climate-executable-path',
      [
        'sum-coverage',
        '/fake-output-path/codeclimate.0.0.json',
        '/fake-output-path/codeclimate.0.1.json',
        '/fake-output-path/codeclimate.1.0.json',
        '/fake-output-path/codeclimate.1.1.json',
        '-p',
        '4',
        '-o',
        '/fake-output-path/codeclimate.total.json'
      ],
      {
        cwd: '/fake-path/repository'
      }
    )
  })

  it('should fail is joining files fail', async () => {
    vi.mocked(exec)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(1)

    await expect(
      collectCoverage({
        repositoryRootPath: '/fake-path/repository',
        codeClimateExecutable: 'code-climate-executable-path',
        absolutePathToOutputFolder: '/fake-output-path',
        coverageFilePatternsAndTypes: [
          {
            pattern: '*.lcov',
            type: 'lcov'
          }
        ]
      })
    ).rejects.toThrow(
      'Could not sum coverages. Parameters: [ «sum-coverage», «/fake-output-path/codeclimate.0.0.json», «/fake-output-path/codeclimate.0.1.json», «-p», «2», «-o», «/fake-output-path/codeclimate.total.json» ]'
    )
  })

  it('should upload total coverage file', async () => {
    await collectCoverage({
      repositoryRootPath: '/fake-path/repository',
      codeClimateExecutable: 'code-climate-executable-path',
      absolutePathToOutputFolder: '/fake-output-path',
      coverageFilePatternsAndTypes: [
        {
          pattern: '*.lcov',
          type: 'lcov'
        },
        {
          pattern: '*.junit',
          type: 'junit'
        }
      ]
    })

    expect(exec).toHaveBeenCalledWith(
      'code-climate-executable-path',
      ['upload-coverage', '-i', '/fake-output-path/codeclimate.total.json'],
      {
        cwd: '/fake-path/repository',
        env: {
          GIT_BRANCH: 'the-branch',
          GIT_COMMIT_SHA: 'the-hash',
          CC_TEST_REPORTER_ID: 'reporter-id'
        }
      }
    )
  })

  it('should respect debug mode when uploading files', async () => {
    vi.mocked(isDebug).mockReturnValue(true)

    await collectCoverage({
      repositoryRootPath: '/fake-path/repository',
      codeClimateExecutable: 'code-climate-executable-path',
      absolutePathToOutputFolder: '/fake-output-path',
      coverageFilePatternsAndTypes: [
        {
          pattern: '*.lcov',
          type: 'lcov'
        },
        {
          pattern: '*.junit',
          type: 'junit'
        }
      ]
    })

    expect(exec).toHaveBeenCalledWith(
      'code-climate-executable-path',
      [
        'upload-coverage',
        '-i',
        '/fake-output-path/codeclimate.total.json',
        '--debug'
      ],
      {
        cwd: '/fake-path/repository',
        env: {
          GIT_BRANCH: 'the-branch',
          GIT_COMMIT_SHA: 'the-hash',
          CC_TEST_REPORTER_ID: 'reporter-id'
        }
      }
    )
  })

  it('should fail if upload fails', async () => {
    vi.mocked(exec)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(1)

    await expect(
      collectCoverage({
        repositoryRootPath: '/fake-path/repository',
        codeClimateExecutable: 'code-climate-executable-path',
        absolutePathToOutputFolder: '/fake-output-path',
        coverageFilePatternsAndTypes: [
          {
            pattern: '*.lcov',
            type: 'lcov'
          }
        ]
      })
    ).rejects.toThrow(
      'Could not upload coverage. Parameters: [ «upload-coverage», «-i», «/fake-output-path/codeclimate.total.json» ]'
    )
  })
})

describe('#runAfterBuild', () => {
  it('should run proper command', async () => {
    await runAfterBuild({
      codeClimateExecutable: 'code-climate-executable-path',
      lastCommandExitCode: 42,
      repositoryRootPath: '/fake-path/repository'
    })

    expect(exec).toHaveBeenCalledWith(
      'code-climate-executable-path',
      ['after-build', '--exit-code', '42'],
      {
        cwd: '/fake-path/repository',
        env: {
          GIT_BRANCH: 'the-branch',
          GIT_COMMIT_SHA: 'the-hash',
          CC_TEST_REPORTER_ID: 'reporter-id'
        }
      }
    )
  })

  it('should reject with an error if command fails', async () => {
    vi.mocked(exec).mockResolvedValue(1)

    await expect(
      runAfterBuild({
        codeClimateExecutable: 'code-climate-executable-path',
        lastCommandExitCode: 42,
        repositoryRootPath: '/fake-path/repository'
      })
    ).rejects.toThrow('after-build command failed')
  })
})

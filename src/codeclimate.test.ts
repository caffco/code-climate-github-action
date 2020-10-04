import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as glob from '@actions/glob'
import * as environment from './environment'

import {runBeforeBuild, collectCoverage, runAfterBuild} from './codeclimate'

jest.mock('@actions/core')
jest.mock('@actions/glob')
jest.mock('@actions/exec')
jest.mock('./environment')

describe('codeclimate', () => {
  const globSpy = jest.fn()

  beforeEach(() => {
    globSpy.mockResolvedValue(['/fake-path/file-a', '/fake-path/file-b'])
    jest.spyOn(exec, 'exec').mockResolvedValue(0)
    jest.spyOn(environment, 'getEnvironment').mockReturnValue({
      GIT_BRANCH: 'the-branch',
      GIT_COMMIT_SHA: 'the-hash',
      CC_TEST_REPORTER_ID: 'reporter-id'
    })
    jest.spyOn(glob, 'create').mockResolvedValue(({
      glob: globSpy
    } as unknown) as ReturnType<typeof glob.create>)
  })

  afterEach(() => {
    jest.restoreAllMocks()
    ;((core.isDebug as unknown) as jest.SpyInstance).mockRestore()
  })

  describe('#runBeforeBuild', () => {
    it('should run proper command', async () => {
      await runBeforeBuild({
        codeClimateExecutable: 'code-climate-executable-path',
        repositoryRootPath: '/fake-path/repository'
      })

      expect(exec.exec).toHaveBeenCalledWith(
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
      jest.spyOn(exec, 'exec').mockResolvedValue(1)

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

      expect(glob.create).toHaveBeenCalledWith('*.lcov')
      expect(glob.create).toHaveBeenCalledWith('*.junit')
      expect(exec.exec).toHaveBeenCalledWith(
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
      expect(exec.exec).toHaveBeenCalledWith(
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
      expect(exec.exec).toHaveBeenCalledWith(
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
      expect(exec.exec).toHaveBeenCalledWith(
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

      expect(core.warning).toHaveBeenCalledWith(
        'Could not find any file for pattern «*.lcov»'
      )
      expect(exec.exec).not.toHaveBeenCalledWith(
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

      expect(exec.exec).toHaveBeenCalledWith(
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
      expect(exec.exec).not.toHaveBeenCalledWith(
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
      jest.spyOn(core, 'isDebug').mockReturnValue(true)

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

      expect(exec.exec).toHaveBeenCalledWith(
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
      expect(exec.exec).not.toHaveBeenCalledWith(
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
      jest.spyOn(exec, 'exec').mockResolvedValue(1)

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

      expect(core.warning).toHaveBeenCalledWith(
        'Could not find any file for pattern «*.lcov»'
      )
      expect(core.warning).toHaveBeenCalledWith(
        'Could not find any file for pattern «*.junit»'
      )
      expect(exec.exec).not.toHaveBeenCalled()
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

      expect(exec.exec).toHaveBeenCalledWith(
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
      jest
        .spyOn(exec, 'exec')
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

      expect(exec.exec).toHaveBeenCalledWith(
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
      jest.spyOn(core, 'isDebug').mockReturnValue(true)

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

      expect(exec.exec).toHaveBeenCalledWith(
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
      jest
        .spyOn(exec, 'exec')
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

      expect(exec.exec).toHaveBeenCalledWith(
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
      jest.spyOn(exec, 'exec').mockResolvedValue(1)

      await expect(
        runAfterBuild({
          codeClimateExecutable: 'code-climate-executable-path',
          lastCommandExitCode: 42,
          repositoryRootPath: '/fake-path/repository'
        })
      ).rejects.toThrow('after-build command failed')
    })
  })
})

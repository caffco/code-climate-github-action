import * as core from '@actions/core'
import {getOptionsFromGithubActionInput} from './github'

describe('Github', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('#getOptionsFromGithubActionInput', () => {
    describe('`coverageFilePatterns`', () => {
      it('should return proper value', () => {
        jest.spyOn(core, 'getInput').mockImplementation(
          key =>
            ((
              {
                coverage_file_patterns:
                  'fake-pattern-one:lcov\nfake-pattern-two:junit'
              } as Record<string, string>
            )[key])
        )

        expect(getOptionsFromGithubActionInput()).toHaveProperty(
          'coverageFilePatterns',
          [
            {pattern: 'fake-pattern-one', type: 'lcov'},
            {pattern: 'fake-pattern-two', type: 'junit'}
          ]
        )
        expect(core.getInput).toHaveBeenCalledWith('coverage_file_patterns')
      })

      it('should throw an error if some pattern does not have type', () => {
        jest.spyOn(core, 'getInput').mockImplementation(
          key =>
            ((
              {
                coverage_file_patterns:
                  'fake-pattern-one:lcov\nfake-pattern-two'
              } as Record<string, string>
            )[key])
        )

        expect(() => getOptionsFromGithubActionInput()).toThrow(
          'Line 1 does not have a valid type: «fake-pattern-two». Expected to be something like «fake-pattern-two:lcov»'
        )
      })

      it('should take only last segment as type', () => {
        jest.spyOn(core, 'getInput').mockImplementation(
          key =>
            ((
              {
                coverage_file_patterns:
                  'fake-pattern:one:lcov\nfake-pattern:two:junit'
              } as Record<string, string>
            )[key])
        )

        expect(getOptionsFromGithubActionInput()).toHaveProperty(
          'coverageFilePatterns',
          [
            {pattern: 'fake-pattern:one', type: 'lcov'},
            {pattern: 'fake-pattern:two', type: 'junit'}
          ]
        )
      })
    })

    describe('`runBeforeBuild`', () => {
      it('should be «true» when `run_before_build` is "true"', () => {
        jest.spyOn(core, 'getInput').mockImplementation(
          key =>
            ((
              {
                coverage_file_patterns: 'fake-pattern-one:lcov',
                run_before_build: 'true'
              } as Record<string, string>
            )[key])
        )

        expect(getOptionsFromGithubActionInput()).toHaveProperty(
          'runBeforeBuild',
          true
        )
        expect(core.getInput).toHaveBeenCalledWith('run_before_build')
      })

      it('should be «false» when `run_before_build` is "false"', () => {
        jest.spyOn(core, 'getInput').mockImplementation(
          key =>
            ((
              {
                coverage_file_patterns: 'fake-pattern-one:lcov',
                run_before_build: 'false'
              } as Record<string, string>
            )[key])
        )

        expect(getOptionsFromGithubActionInput()).toHaveProperty(
          'runBeforeBuild',
          false
        )
        expect(core.getInput).toHaveBeenCalledWith('run_before_build')
      })
    })

    describe('`collectCoverage`', () => {
      it('should be «true» when `collect_coverage` is "true"', () => {
        jest.spyOn(core, 'getInput').mockImplementation(
          key =>
            ((
              {
                coverage_file_patterns: 'fake-pattern-one:lcov',
                collect_coverage: 'true'
              } as Record<string, string>
            )[key])
        )

        expect(getOptionsFromGithubActionInput()).toHaveProperty(
          'collectCoverage',
          true
        )
        expect(core.getInput).toHaveBeenCalledWith('collect_coverage')
      })

      it('should be «false» when `collect_coverage` is "false"', () => {
        jest.spyOn(core, 'getInput').mockImplementation(
          key =>
            ((
              {
                coverage_file_patterns: 'fake-pattern-one:lcov',
                collect_coverage: 'false'
              } as Record<string, string>
            )[key])
        )

        expect(getOptionsFromGithubActionInput()).toHaveProperty(
          'runBeforeBuild',
          false
        )
        expect(core.getInput).toHaveBeenCalledWith('collect_coverage')
      })
    })

    describe('`runAfterBuild`', () => {
      it('should be «true» when `run_after_build` is "true"', () => {
        jest.spyOn(core, 'getInput').mockImplementation(
          key =>
            ((
              {
                coverage_file_patterns: 'fake-pattern-one:lcov',
                run_after_build: 'true'
              } as Record<string, string>
            )[key])
        )

        expect(getOptionsFromGithubActionInput()).toHaveProperty(
          'runAfterBuild',
          true
        )
        expect(core.getInput).toHaveBeenCalledWith('run_after_build')
      })

      it('should be «false» when `run_after_build` is "false"', () => {
        jest.spyOn(core, 'getInput').mockImplementation(
          key =>
            ((
              {
                coverage_file_patterns: 'fake-pattern-one:lcov',
                run_after_build: 'false'
              } as Record<string, string>
            )[key])
        )

        expect(getOptionsFromGithubActionInput()).toHaveProperty(
          'runAfterBuild',
          false
        )
        expect(core.getInput).toHaveBeenCalledWith('run_after_build')
      })
    })

    describe('`lastCommandExitCode`', () => {
      it('should parse `last_command_exit_code`', async () => {
        jest.spyOn(core, 'getInput').mockImplementation(
          key =>
            ((
              {
                coverage_file_patterns: 'fake-pattern-one:lcov',
                last_command_exit_code: '42'
              } as Record<string, string>
            )[key])
        )

        expect(getOptionsFromGithubActionInput()).toHaveProperty(
          'lastCommandExitCode',
          42
        )
      })

      it('should fall back to 0', async () => {
        jest.spyOn(core, 'getInput').mockImplementation(
          key =>
            ((
              {
                coverage_file_patterns: 'fake-pattern-one:lcov'
              } as Record<string, string>
            )[key])
        )

        expect(getOptionsFromGithubActionInput()).toHaveProperty(
          'lastCommandExitCode',
          0
        )
      })
    })

    describe('`prefix`', () => {
      it('should parse `prefix`', async () => {
        jest.spyOn(core, 'getInput').mockImplementation(
          key =>
            ((
              {
                coverage_file_patterns: 'fake-pattern-one:lcov',
                prefix: 'the-prefix'
              } as Record<string, string>
            )[key])
        )

        expect(getOptionsFromGithubActionInput()).toHaveProperty(
          'prefix',
          'the-prefix'
        )
      })

      it('should allow being undefined', async () => {
        jest.spyOn(core, 'getInput').mockImplementation(
          key =>
            ((
              {
                coverage_file_patterns: 'fake-pattern-one:lcov'
              } as Record<string, string>
            )[key])
        )

        expect(getOptionsFromGithubActionInput()).toHaveProperty(
          'prefix',
          undefined
        )
      })
    })

    describe('`repositoryRootPath`', () => {
      it('should parse `repository_root_path`', async () => {
        jest.spyOn(core, 'getInput').mockImplementation(
          key =>
            ((
              {
                coverage_file_patterns: 'fake-pattern-one:lcov',
                repository_root_path: 'the-path'
              } as Record<string, string>
            )[key])
        )

        expect(getOptionsFromGithubActionInput()).toHaveProperty(
          'repositoryRootPath',
          'the-path'
        )
      })
    })
  })
})

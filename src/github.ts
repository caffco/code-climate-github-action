import {getInput} from '@actions/core'
import {PatternAndType} from './codeclimate'

function getPatternAndTypeFromLine(line: string): PatternAndType {
  const parts = line.split(':')

  if (parts.length < 2) {
    return {pattern: line, type: ''}
  }

  const type = parts.slice(-1)[0]
  const pattern = parts.slice(0, -1).join(':')

  return {
    pattern,
    type
  }
}

export function getOptionsFromGithubActionInput(): {
  coverageFilePatterns: PatternAndType[]
  repositoryRootPath: string
  runBeforeBuild: boolean
  collectCoverage: boolean
  runAfterBuild: boolean
  lastCommandExitCode: number
  prefix?: string
} {
  const rawCoverageFilePatterns = getInput('coverage_file_patterns')
    .trim()
    .split('\n')
    .map(pattern => pattern.trim())

  const coverageFilePatterns = rawCoverageFilePatterns.map(
    (line): PatternAndType => getPatternAndTypeFromLine(line)
  )

  const indexOfLineWithoutTypeInfo = coverageFilePatterns.findIndex(
    ({type}) => !type
  )

  if (indexOfLineWithoutTypeInfo >= 0) {
    throw new Error(
      `Line ${indexOfLineWithoutTypeInfo} does not have a valid type: «${rawCoverageFilePatterns[indexOfLineWithoutTypeInfo]}». Expected to be something like «${rawCoverageFilePatterns[indexOfLineWithoutTypeInfo]}:lcov»`
    )
  }

  const lastCommandExitCodeString = getInput('last_command_exit_code')
  const lastCommandExitCode = lastCommandExitCodeString
    ? parseInt(lastCommandExitCodeString)
    : 0

  return {
    coverageFilePatterns,
    repositoryRootPath: getInput('repository_root_path'),
    runBeforeBuild: getInput('run_before_build') === 'true',
    collectCoverage: getInput('collect_coverage') === 'true',
    runAfterBuild: getInput('run_after_build') === 'true',
    lastCommandExitCode,
    prefix: getInput('prefix')
  }
}

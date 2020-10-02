import * as core from '@actions/core'
import * as glob from '@actions/glob'
import {exec} from '@actions/exec'
import {resolve as resolvePath} from 'path'

import {getEnvironment} from './environment'

export async function runBeforeBuild(
  codeClimateExecutable: string
): Promise<void> {
  const exitCode = await exec(codeClimateExecutable, ['before-build'], {
    env: getEnvironment(process.env)
  })

  if (exitCode !== 0) {
    throw new Error('before-build command failed')
  }
}

export interface PatternAndType {
  pattern: string
  type: string
}

function getFormatCoverageCommandParams({
  absolutePath,
  type,
  patternNumber,
  index,
  prefix,
  absolutePathToOutputFolder
}: {
  absolutePath: string
  type: string
  patternNumber: number
  index: number
  prefix?: string
  absolutePathToOutputFolder: string
}): {parameters: string[]; absolutePathToFormattedCoverage: string} {
  const absolutePathToFormattedCoverage = resolvePath(
    absolutePathToOutputFolder,
    `codeclimate.${patternNumber}.${index}.json`
  )
  const baseParameters = [
    'format-coverage',
    absolutePath,
    '-t',
    type,
    '-o',
    absolutePathToFormattedCoverage
  ]

  const parametersWithPrefix = prefix
    ? [...baseParameters, '--prefix', prefix]
    : baseParameters

  const parameters = core.isDebug()
    ? [...parametersWithPrefix, '--debug']
    : parametersWithPrefix

  return {
    parameters,
    absolutePathToFormattedCoverage
  }
}

function getReadableParameters(parameters: string[]): string {
  const readableParameters = parameters.map(param => `«${param}»`).join(', ')
  return `Parameters: [ ${readableParameters} ]`
}

async function formatCoverageOfType({
  codeClimateExecutable,
  patternAndType,
  patternNumber,
  prefix,
  absolutePathToOutputFolder
}: {
  codeClimateExecutable: string
  patternAndType: PatternAndType
  patternNumber: number
  prefix?: string
  absolutePathToOutputFolder: string
}): Promise<string[]> {
  const {pattern, type} = patternAndType
  const globber = await glob.create(pattern)
  const absolutePathsToFiles = await globber.glob()

  if (absolutePathsToFiles.length === 0) {
    core.warning(`Could not find any file for pattern «${pattern}»`)
    return []
  }

  const formatCoverageCommands = absolutePathsToFiles.map(
    (absolutePath, index) =>
      getFormatCoverageCommandParams({
        absolutePath,
        type,
        patternNumber,
        index,
        prefix,
        absolutePathToOutputFolder
      })
  )

  for (const command of formatCoverageCommands) {
    const exitCode = await exec(codeClimateExecutable, command.parameters)

    if (exitCode !== 0) {
      throw new Error(
        `Could not format coverage file at «${
          command.parameters[1]
        }». ${getReadableParameters(command.parameters)}`
      )
    }
  }

  return formatCoverageCommands.map(
    ({absolutePathToFormattedCoverage}) => absolutePathToFormattedCoverage
  )
}

async function sumCoverages({
  codeClimateExecutable,
  absolutePathsToFormattedCoverageFiles,
  absolutePathToOutputFolder
}: {
  codeClimateExecutable: string
  absolutePathsToFormattedCoverageFiles: string[]
  absolutePathToOutputFolder: string
}): Promise<string> {
  const absolutePathToTotalCoverage = resolvePath(
    absolutePathToOutputFolder,
    'codeclimate.total.json'
  )

  const commandParameters = [
    'sum-coverage',
    ...absolutePathsToFormattedCoverageFiles,
    '-p',
    `${absolutePathsToFormattedCoverageFiles.length}`,
    '-o',
    absolutePathToTotalCoverage
  ]

  const exitCode = await exec(codeClimateExecutable, commandParameters)

  if (exitCode !== 0) {
    throw new Error(
      `Could not sum coverages. ${getReadableParameters(commandParameters)}`
    )
  }

  return absolutePathToTotalCoverage
}

async function uploadCoverage({
  codeClimateExecutable,
  absolutePathToCoverageFile
}: {
  codeClimateExecutable: string
  absolutePathToCoverageFile: string
}): Promise<void> {
  const baseParameters = ['upload-coverage', '-i', absolutePathToCoverageFile]

  const commandParameters = core.isDebug()
    ? [...baseParameters, '--debug']
    : baseParameters

  const exitCode = await exec(codeClimateExecutable, commandParameters, {
    env: getEnvironment(process.env)
  })

  if (exitCode !== 0) {
    throw new Error(
      `Could not upload coverage. ${getReadableParameters(commandParameters)}`
    )
  }
}

export async function collectCoverage({
  codeClimateExecutable,
  coverageFilePatternsAndTypes,
  prefix,
  absolutePathToOutputFolder
}: {
  codeClimateExecutable: string
  coverageFilePatternsAndTypes: PatternAndType[]
  prefix?: string
  absolutePathToOutputFolder: string
}): Promise<void> {
  const absolutePathToFormattedCoverageFilesByPattern = await Promise.all(
    coverageFilePatternsAndTypes.map(async (patternAndType, patternNumber) =>
      formatCoverageOfType({
        codeClimateExecutable,
        patternAndType,
        patternNumber,
        prefix,
        absolutePathToOutputFolder
      })
    )
  )

  const absolutePathsToFormattedCoverageFiles = ([] as string[]).concat(
    ...absolutePathToFormattedCoverageFilesByPattern
  )

  if (absolutePathsToFormattedCoverageFiles.length === 0) {
    throw new Error('No coverage files found')
  }

  const absolutePathToTotalCoverage = await sumCoverages({
    codeClimateExecutable,
    absolutePathsToFormattedCoverageFiles,
    absolutePathToOutputFolder
  })

  await uploadCoverage({
    codeClimateExecutable,
    absolutePathToCoverageFile: absolutePathToTotalCoverage
  })
}

export async function runAfterBuild({
  codeClimateExecutable,
  lastCommandExitCode
}: {
  codeClimateExecutable: string
  lastCommandExitCode: number
}): Promise<void> {
  const exitCode = await exec(
    codeClimateExecutable,
    ['after-build', '--exit-code', `${lastCommandExitCode}`],
    {
      env: getEnvironment(process.env)
    }
  )

  if (exitCode !== 0) {
    throw new Error('after-build command failed')
  }
}

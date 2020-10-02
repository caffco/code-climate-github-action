import {dirname} from 'path'
import {getOptionsFromGithubActionInput} from './github'
import {downloadCodeClimateExecutable} from './download'
import {runBeforeBuild, collectCoverage, runAfterBuild} from './codeclimate'

export default async function main(): Promise<void> {
  const options = getOptionsFromGithubActionInput()

  const codeClimateExecutable = await downloadCodeClimateExecutable()

  if (options.runBeforeBuild) {
    await runBeforeBuild(codeClimateExecutable)
  }

  if (options.collectCoverage) {
    await collectCoverage({
      codeClimateExecutable,
      coverageFilePatternsAndTypes: options.coverageFilePatterns,
      prefix: options.prefix,
      absolutePathToOutputFolder: dirname(codeClimateExecutable)
    })
  }

  if (options.runAfterBuild) {
    await runAfterBuild({
      codeClimateExecutable,
      lastCommandExitCode: options.lastCommandExitCode
    })
  }
}

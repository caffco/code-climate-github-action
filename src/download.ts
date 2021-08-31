import {platform} from 'os'
import fs from 'fs'
import * as core from '@actions/core'
import fetch from 'node-fetch'
import {getTemporalFileAbsolutePath} from './fs'

export async function downloadCodeClimateExecutable(): Promise<string> {
  const executableFilename = `test-reporter-latest-${platform()}-amd64`
  const executableUrl = `https://codeclimate.com/downloads/test-reporter/${executableFilename}`

  const temporalFileAbsolutePath = await getTemporalFileAbsolutePath({
    parentFolderPrefix: 'code-climate',
    filename: executableFilename
  })

  const response = await fetch(executableUrl)

  const writeStream = fs.createWriteStream(temporalFileAbsolutePath)

  if (!response.body) {
    throw new Error(
      'Failed to get body from CodeClimate executable request response'
    )
  }

  response.body.pipe(writeStream)

  await new Promise<void>((resolve, reject) =>
    fs.chmod(temporalFileAbsolutePath, 0o775, error =>
      error ? reject(error) : resolve()
    )
  )

  await new Promise<void>((resolve, reject) => {
    writeStream.on('close', () => resolve())
    writeStream.on('error', error => reject(error))
  })

  const stats = await new Promise<fs.Stats>((resolve, reject) =>
    fs.stat(temporalFileAbsolutePath, (error, data) =>
      error ? reject(error) : resolve(data)
    )
  )

  core.debug(
    `Code Climate reporter downloaded to ${temporalFileAbsolutePath}. Size ${stats.size} bytes`
  )

  return temporalFileAbsolutePath
}

import {platform} from 'os'
import fs from 'fs'
import * as core from '@actions/core'
import fetch from 'node-fetch'
import {promisify} from 'util'

import {getTemporalFileAbsolutePath} from './fs'

const chmodAsync = promisify(fs.chmod)
const statAsync = promisify(fs.stat)

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

  await chmodAsync(temporalFileAbsolutePath, 0o775)

  await new Promise<void>((resolve, reject) => {
    writeStream.on('close', () => resolve())
    writeStream.on('error', error => reject(error))
  })

  const stats = await statAsync(temporalFileAbsolutePath)

  core.debug(
    `Code Climate reporter downloaded to ${temporalFileAbsolutePath}. Size ${stats.size} bytes`
  )

  return temporalFileAbsolutePath
}

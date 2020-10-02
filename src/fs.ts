import fs from 'fs'
import {resolve as resolvePath} from 'path'

async function getTemporalFolderAbsolutePath(prefix: string): Promise<string> {
  return new Promise<string>((resolve, reject) =>
    fs.mkdtemp(prefix, (error, absolutePath) =>
      error ? reject(error) : resolve(absolutePath)
    )
  )
}

export async function getTemporalFileAbsolutePath({
  parentFolderPrefix,
  filename
}: {
  parentFolderPrefix: string
  filename: string
}): Promise<string> {
  const temporalFolder = await getTemporalFolderAbsolutePath(parentFolderPrefix)

  const absolutePathToFile = resolvePath(temporalFolder, filename)

  await new Promise<void>((resolve, reject) =>
    fs.writeFile(absolutePathToFile, '', error =>
      error ? reject(error) : resolve()
    )
  )

  return absolutePathToFile
}

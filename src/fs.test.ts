import {beforeEach, describe, expect, it, vi} from 'vitest'

import {getTemporalFileAbsolutePath} from './fs'
import fs from 'fs'

vi.mock('fs')

beforeEach(() => {
  vi.mocked(fs.mkdtemp).mockImplementation((prefix, callback) =>
    callback(null, `/tmp/${prefix}-123456`)
  )
  vi.mocked(fs.writeFile).mockImplementation((pathToFile, content, callback) =>
    callback(null)
  )
})

describe('#getTemporalFileAbsolutePath', () => {
  it('should create the file in a temporal folder', async () => {
    await getTemporalFileAbsolutePath({
      parentFolderPrefix: 'my-prefix',
      filename: 'my-filename'
    })

    expect(fs.mkdtemp).toHaveBeenCalledWith('my-prefix', expect.any(Function))
    expect(fs.writeFile).toHaveBeenCalledWith(
      '/tmp/my-prefix-123456/my-filename',
      '',
      expect.any(Function)
    )
  })

  it('should return created file', async () => {
    await expect(
      getTemporalFileAbsolutePath({
        parentFolderPrefix: 'my-prefix',
        filename: 'my-filename'
      })
    ).resolves.toEqual('/tmp/my-prefix-123456/my-filename')
  })

  it('should reject promise if could not create parent folder', async () => {
    vi.mocked(fs.mkdtemp).mockImplementation((prefix, callback) =>
      callback(new Error('Forced error'), '')
    )

    await expect(
      getTemporalFileAbsolutePath({
        parentFolderPrefix: 'my-prefix',
        filename: 'my-filename'
      })
    ).rejects.toThrow('Forced error')
  })

  it('should reject promise if could not create the file', async () => {
    vi.mocked(fs.writeFile).mockImplementation((prefix, content, callback) =>
      callback(new Error('Forced error'))
    )

    await expect(
      getTemporalFileAbsolutePath({
        parentFolderPrefix: 'my-prefix',
        filename: 'my-filename'
      })
    ).rejects.toThrow('Forced error')
  })
})

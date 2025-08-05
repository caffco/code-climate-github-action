import fs from 'node:fs'
import { platform } from 'node:os'
import fetch from 'node-fetch'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { downloadCodeClimateExecutable } from './download'
import { getTemporalFileAbsolutePath } from './fs'

vi.mock('@actions/core')
vi.mock('node-fetch', () => ({
  __esModule: true,
  default: vi.fn()
}))
vi.mock('os', () => ({
  platform: vi.fn().mockReturnValue(null)
}))
vi.mock('fs', async () => ({
  __esModule: true,
  default: {
    chmod: vi.fn(),
    stat: vi.fn(),
    createWriteStream: vi.fn()
  }
}))
vi.mock('./fs')

const fetchResponseBodyPipeSpy = vi.fn()
const fsWriteStreamOnSpy = vi.fn()
const createWriteStreamReturnValue = {
  on: fsWriteStreamOnSpy
} as unknown as ReturnType<typeof fs.createWriteStream>

beforeEach(() => {
  fsWriteStreamOnSpy.mockImplementation((eventName, callback) => {
    if (eventName === 'close') {
      callback()
    }
  })
  vi.mocked(platform).mockReturnValue('linux')
  vi.mocked(fetch).mockResolvedValue({
    body: {
      pipe: fetchResponseBodyPipeSpy
    }
  } as never)
  vi.mocked(fs.createWriteStream).mockReturnValue(createWriteStreamReturnValue)
  vi.mocked(fs.chmod).mockImplementation((_absolutePath, _fileMode, callback) =>
    callback(null)
  )
  vi.mocked(fs.stat).mockImplementation((_absolutePath, callback) => {
    const cb = callback as (err: Error | null, stats: fs.Stats) => void
    cb(null, { size: 0 } as unknown as fs.Stats)
  })
  vi.mocked(getTemporalFileAbsolutePath).mockResolvedValue(
    '/tmp/fake-folder/fake-file'
  )
})

describe('#downloadCodeClimateExecutable', () => {
  it('should download proper file', async () => {
    await downloadCodeClimateExecutable()

    expect(fetch).toHaveBeenCalledWith(
      'https://codeclimate.com/downloads/test-reporter/test-reporter-latest-linux-amd64'
    )
  })

  it('should write downloaded file in temporal folder', async () => {
    await downloadCodeClimateExecutable()

    expect(fs.createWriteStream).toHaveBeenCalledWith(
      '/tmp/fake-folder/fake-file'
    )
    expect(fetchResponseBodyPipeSpy).toHaveBeenCalledWith(
      createWriteStreamReturnValue
    )
  })

  it('should set proper file permissions', async () => {
    await downloadCodeClimateExecutable()

    expect(fs.chmod).toHaveBeenCalledWith(
      '/tmp/fake-folder/fake-file',
      0o775,
      expect.anything()
    )
  })

  it('should reject promise on download error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      body: null
    } as never)

    await expect(downloadCodeClimateExecutable()).rejects.toThrow(
      'Failed to get body from CodeClimate executable request response'
    )
  })

  it('should reject promise on error', async () => {
    fsWriteStreamOnSpy.mockImplementation((eventName, callback) => {
      if (eventName === 'error') {
        callback(new Error('Forced error'))
      }
    })

    await expect(downloadCodeClimateExecutable()).rejects.toThrow(
      'Forced error'
    )
  })
})

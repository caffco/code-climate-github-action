import fetch from 'node-fetch'
import {platform} from 'os'
import fs from 'fs'
import * as fsUtils from './fs'

import {downloadCodeClimateExecutable} from './download'

jest.mock('@actions/core')
jest.mock('node-fetch', () => ({
  __esModule: true,
  default: jest.fn()
}))
jest.mock('os', () => ({
  platform: jest.fn().mockReturnValue(null)
}))
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  chmod: jest.fn(),
  stat: jest.fn(),
  createWriteStream: jest.fn()
}))
jest.mock('./fs')

describe('download', () => {
  const fetchResponseBodyPipeSpy = jest.fn()
  const fsWriteStreamOnSpy = jest.fn()
  const createWriteStreamReturnValue = {
    on: fsWriteStreamOnSpy
  } as unknown as ReturnType<typeof fs.createWriteStream>

  beforeEach(() => {
    fsWriteStreamOnSpy.mockImplementation((eventName, callback) => {
      if (eventName === 'close') {
        callback()
      }
    })
    ;(platform as unknown as jest.SpyInstance).mockReturnValue('linux')
    ;(fetch as unknown as jest.Mock).mockResolvedValue({
      body: {
        pipe: fetchResponseBodyPipeSpy
      }
    } as unknown as ReturnType<typeof fetch>)
    ;(fs.createWriteStream as unknown as jest.Mock).mockReturnValue(
      createWriteStreamReturnValue
    )
    ;(fs.chmod as unknown as jest.Mock).mockImplementation(
      (absolutePath, fileMode, callback) => callback(null)
    )
    ;(fs.stat as unknown as jest.Mock).mockImplementation(
      (absolutePath, callback) => {
        const cb = callback as (err: Error | null, stats: fs.Stats) => void
        cb(null, {size: 0} as unknown as fs.Stats)
      }
    )
    jest
      .spyOn(fsUtils, 'getTemporalFileAbsolutePath')
      .mockResolvedValue('/tmp/fake-folder/fake-file')
  })

  afterEach(() => {
    jest.restoreAllMocks()
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
      ;(fetch as unknown as jest.SpyInstance).mockResolvedValueOnce({
        body: null
      } as unknown as ReturnType<typeof fetch>)

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
})

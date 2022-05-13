import * as fetch from 'node-fetch'
import * as os from 'os'
import * as fs from 'fs'
import * as fsUtils from './fs'

import {downloadCodeClimateExecutable} from './download'

jest.mock('@actions/core')
jest.mock('node-fetch')
jest.mock('os')
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  chmod: jest.fn(),
  stat: jest.fn(),
  createWriteStream: jest.fn()
}))
jest.mock('./fs')

describe('download', () => {
  const fetchResponseBodyPipeSpy = jest.fn()
  const fsWriteStreamOnSpy = jest
    .fn()
    .mockImplementation((eventName, callback) => {
      if (eventName === 'close') {
        callback()
      }
    })
  const createWriteStreamReturnValue = {
    on: fsWriteStreamOnSpy
  } as unknown as ReturnType<typeof fs.createWriteStream>

  beforeEach(() => {
    jest.spyOn(os, 'platform').mockReturnValue('linux')
    jest.spyOn(fetch, 'default').mockResolvedValue({
      body: {
        pipe: fetchResponseBodyPipeSpy
      }
    } as unknown as ReturnType<typeof fetch.default>)
    jest
      .spyOn(fs, 'createWriteStream')
      .mockReturnValue(createWriteStreamReturnValue)
    jest
      .spyOn(fs, 'chmod')
      .mockImplementation((absolutePath, fileMode, callback) => callback(null))
    jest.spyOn(fs, 'stat').mockImplementation((absolutePath, callback) => {
      const cb = callback as (err: Error | null, stats: fs.Stats) => void
      cb(null, {size: 0} as unknown as fs.Stats)
    })
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

      expect(fetch.default).toHaveBeenCalledWith(
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
      ;(fetch.default as unknown as jest.SpyInstance).mockResolvedValueOnce({
        body: null
      } as unknown as ReturnType<typeof fetch.default>)

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

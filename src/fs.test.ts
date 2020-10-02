import {getTemporalFileAbsolutePath} from './fs'
import fs from 'fs'

jest.mock('fs')

describe('fs', () => {
  beforeEach(() => {
    jest
      .spyOn(fs, 'mkdtemp')
      .mockImplementation((prefix, callback) =>
        callback(null, `/tmp/${prefix}-123456`)
      )
    jest
      .spyOn(fs, 'writeFile')
      .mockImplementation((pathToFile, content, callback) => callback(null))
  })

  afterEach(() => {
    jest.restoreAllMocks()
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
      jest
        .spyOn(fs, 'mkdtemp')
        .mockImplementation((prefix, callback) =>
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
      jest
        .spyOn(fs, 'writeFile')
        .mockImplementation((prefix, content, callback) =>
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
})

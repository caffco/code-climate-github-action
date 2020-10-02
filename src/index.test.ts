import * as core from '@actions/core'
import * as main from './main'

import {run} from './'

jest.mock('@actions/core')
jest.mock('./main')

describe('index', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('#run', () => {
    it('should run main function', async () => {
      await run()

      expect(main.default).toHaveBeenCalled()
    })

    it('should set execution as failed in main function fails', async () => {
      jest.spyOn(main, 'default').mockRejectedValue(new Error('Forced error'))

      await run()

      expect(core.setFailed).toHaveBeenCalledWith('Forced error')
    })
  })
})

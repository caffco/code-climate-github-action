import {describe, expect, it, vi} from 'vitest'

import * as core from '@actions/core'
import main from './main'

import {run} from './'

vi.mock('@actions/core')
vi.mock('./main')

describe('#run', () => {
  it('should run main function', async () => {
    await run()

    expect(main).toHaveBeenCalled()
  })

  it('should set execution as failed in main function fails', async () => {
    vi.mocked(main).mockRejectedValue(new Error('Forced error'))

    await run()

    expect(core.setFailed).toHaveBeenCalledWith('Forced error')
  })
})

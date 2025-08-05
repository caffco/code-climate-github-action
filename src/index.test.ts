import * as core from '@actions/core'
import { describe, expect, it, vi } from 'vitest'
import { run } from './'
import main from './main'

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

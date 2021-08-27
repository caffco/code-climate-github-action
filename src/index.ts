import * as core from '@actions/core'

import main from './main'

export async function run(): Promise<void> {
  try {
    await main()
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    } else if (typeof error === 'string') {
      core.setFailed(error)
    } else {
      core.setFailed('Unknown error')
    }
  }
}

if (require.main === module) {
  run()
}

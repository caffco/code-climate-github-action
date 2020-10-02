import * as core from '@actions/core'

import main from './main'

export async function run(): Promise<void> {
  try {
    await main()
  } catch (error) {
    core.setFailed(error.message)
  }
}

if (require.main === module) {
  run()
}

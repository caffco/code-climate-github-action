import {context} from '@actions/github'

function getGitBranchNameWithoutOrigin(branchName: string): string {
  return branchName.replace(/^refs\/heads\//, '')
}

function getEnvironmentFromPullRequest(
  env: Record<string, string | undefined>
): {
  GIT_COMMIT_SHA: string | null
  GIT_BRANCH: string | null
} {
  return env.GITHUB_EVENT_NAME === 'pull_request'
    ? {
        GIT_BRANCH: env.GITHUB_HEAD_REF ?? null,
        GIT_COMMIT_SHA: context.payload.pull_request?.['head']?.['sha'] ?? null
      }
    : {
        GIT_BRANCH: null,
        GIT_COMMIT_SHA: null
      }
}

export function getEnvironment(
  env: Record<string, string | undefined>
): {
  GIT_BRANCH: string
  GIT_COMMIT_SHA: string
} {
  const GIT_COMMIT_SHA = env.GITHUB_SHA ?? env.GIT_COMMIT_SHA
  const gitBranchFromEnvVars = env.GITHUB_REF ?? env.GIT_BRANCH

  const GIT_BRANCH = gitBranchFromEnvVars
    ? getGitBranchNameWithoutOrigin(gitBranchFromEnvVars)
    : null

  const environmentFromPullRequest = getEnvironmentFromPullRequest(env)

  return {
    GIT_BRANCH: environmentFromPullRequest.GIT_BRANCH ?? GIT_BRANCH ?? '',
    GIT_COMMIT_SHA:
      environmentFromPullRequest.GIT_COMMIT_SHA ?? GIT_COMMIT_SHA ?? ''
  }
}

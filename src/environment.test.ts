import {getEnvironment} from './environment'

jest.mock('@actions/github', () => ({
  context: {
    payload: {
      pull_request: {
        head: {
          sha: 'this-hash-has-maximum-priority'
        }
      }
    }
  }
}))

describe('environment', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('#getEnvironment', () => {
    it('should give preference to pull request payload over any env var', () => {
      expect(
        getEnvironment({
          GITHUB_EVENT_NAME: 'pull_request',
          GIT_COMMIT_SHA: 'this-hash-has-medium-priority',
          GITHUB_SHA: 'some-hash',
          GIT_BRANCH: 'refs/heads/my-branch-name',
          GITHUB_REF: 'refs/heads/this-branch-has-priority'
        })
      ).toEqual({
        GIT_COMMIT_SHA: 'this-hash-has-maximum-priority',
        GIT_BRANCH: 'this-branch-has-priority',
        CC_TEST_REPORTER_ID: ''
      })
    })

    it('should give preference to GITHUB_SHA env var over any other env var', () => {
      expect(
        getEnvironment({
          GIT_COMMIT_SHA: 'some-hash',
          GITHUB_SHA: 'this-hash-has-priority'
        })
      ).toEqual({
        GIT_BRANCH: '',
        GIT_COMMIT_SHA: 'this-hash-has-priority',
        CC_TEST_REPORTER_ID: ''
      })
    })

    it('should give preference to GITHUB_REF env var over any other env var', () => {
      expect(
        getEnvironment({
          GIT_BRANCH: 'refs/heads/my-branch-name',
          GITHUB_REF: 'refs/heads/this-branch-takes-preference'
        })
      ).toEqual({
        GIT_BRANCH: 'this-branch-takes-preference',
        GIT_COMMIT_SHA: '',
        CC_TEST_REPORTER_ID: ''
      })
    })

    it('should fallback to GIT_COMMIT_SHA', () => {
      expect(
        getEnvironment({
          GIT_COMMIT_SHA: 'some-hash'
        })
      ).toEqual({
        GIT_BRANCH: '',
        GIT_COMMIT_SHA: 'some-hash',
        CC_TEST_REPORTER_ID: ''
      })
    })

    it('should fallback to GIT_BRANCH', () => {
      expect(
        getEnvironment({
          GITHUB_REF: 'refs/heads/my-branch-name'
        })
      ).toEqual({
        GIT_BRANCH: 'my-branch-name',
        GIT_COMMIT_SHA: '',
        CC_TEST_REPORTER_ID: ''
      })
    })

    it('should pass CC_TEST_REPORTER_ID env var', () => {
      expect(
        getEnvironment({
          CC_TEST_REPORTER_ID: 'the-reporter-id'
        })
      ).toEqual({
        GIT_BRANCH: '',
        GIT_COMMIT_SHA: '',
        CC_TEST_REPORTER_ID: 'the-reporter-id'
      })
    })
  })
})

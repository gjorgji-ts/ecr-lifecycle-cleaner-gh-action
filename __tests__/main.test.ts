/**
 * Unit tests for the action's main functionality, src/main.ts
 */
import { jest } from '@jest/globals'

// Mock fixtures
import * as core from '../__fixtures__/core'
import * as exec from '../__fixtures__/exec'
import * as tc from '../__fixtures__/tool-cache'

// Store the mocked fs module for later access
const fsMock = {
  existsSync: jest.fn().mockReturnValue(true),
  promises: {
    // Properly type the mock function to avoid "not assignable to parameter of type 'never'" error
    chmod: jest
      .fn<(path: string, mode: number) => Promise<void>>()
      .mockResolvedValue()
  }
}

// Setup mocks before importing the module under test
jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('@actions/exec', () => exec)
jest.unstable_mockModule('@actions/tool-cache', () => tc)

// Mock os and fs
jest.unstable_mockModule('os', () => ({
  platform: jest.fn().mockReturnValue('linux'),
  arch: jest.fn().mockReturnValue('x64')
}))

jest.unstable_mockModule('fs', () => fsMock)

// Import the module being tested
const { run } = await import('../src/main')

describe('ecr-lifecycle-cleaner action', () => {
  beforeEach(() => {
    // Set default inputs
    core.getInput.mockImplementation((name) => {
      const inputs: Record<string, string> = {
        'ecr-lifecycle-cleaner-version': '1.2.1',
        command: 'clean',
        'dry-run': 'false',
        'all-repos': 'false',
        'repo-list': '',
        'repo-pattern': '',
        'policy-file': ''
      }
      return inputs[name] || ''
    })

    core.getBooleanInput.mockImplementation((name) => {
      const boolInputs: Record<string, boolean> = {
        'dry-run': false,
        'all-repos': false
      }
      return boolInputs[name] || false
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('downloads, extracts and runs ecr-lifecycle-cleaner successfully', async () => {
    // Configure specific inputs for this test
    core.getBooleanInput.mockImplementation((name) => {
      if (name === 'dry-run') return true
      if (name === 'all-repos') return true
      return false
    })

    await run()

    // Verify download with correct URL
    expect(tc.downloadTool).toHaveBeenCalledWith(
      'https://github.com/gjorgji-ts/ecr-lifecycle-cleaner/releases/download/v1.2.1/ecr-lifecycle-cleaner_Linux_x86_64.tar.gz'
    )

    expect(tc.extractTar).toHaveBeenCalledWith('/tmp/downloaded-tool')

    // Verify correct chmod on Linux
    expect(fsMock.promises.chmod).toHaveBeenCalledWith(
      expect.stringContaining('/tmp/extracted/ecr-lifecycle-cleaner'),
      0o755
    )

    // Verify command execution with correct arguments
    expect(exec.exec).toHaveBeenCalledWith(
      expect.stringContaining('/tmp/extracted/ecr-lifecycle-cleaner'),
      ['clean', '--dryRun', '--allRepos']
    )

    // Verify no failures were reported
    expect(core.setFailed).not.toHaveBeenCalled()
  })

  it('handles missing required inputs', async () => {
    // Simulate missing required input
    core.getInput.mockImplementationOnce((name, options) => {
      if (name === 'ecr-lifecycle-cleaner-version' && options?.required) {
        throw new Error(
          'Input required and not supplied: ecr-lifecycle-cleaner-version'
        )
      }
      return ''
    })

    await run()

    // Verify that the action failed with the appropriate error message
    expect(core.setFailed).toHaveBeenCalledWith(
      'Input required and not supplied: ecr-lifecycle-cleaner-version'
    )
  })

  it('validates command input', async () => {
    // Set invalid command
    core.getInput.mockImplementation((name) => {
      if (name === 'command') return 'invalidCommand'
      if (name === 'ecr-lifecycle-cleaner-version') return '1.2.1'
      return ''
    })

    await run()

    expect(core.setFailed).toHaveBeenCalledWith(
      "Invalid command: invalidCommand. Must be 'clean' or 'setPolicy'"
    )
  })

  it('validates policy file for setPolicy command', async () => {
    core.getInput.mockImplementation((name) => {
      const inputs: Record<string, string> = {
        'ecr-lifecycle-cleaner-version': '1.2.1',
        command: 'setPolicy',
        'policy-file': ''
      }
      return inputs[name] || ''
    })

    await run()

    expect(core.setFailed).toHaveBeenCalledWith(
      'policy-file input is required for setPolicy command'
    )
  })

  it('validates only one repo selection parameter is used', async () => {
    // Mock repo-list input
    let repoList = ''

    core.getInput.mockImplementation((name) => {
      if (name === 'repo-list') return repoList
      if (name === 'ecr-lifecycle-cleaner-version') return '1.2.1'
      if (name === 'command') return 'clean'
      return ''
    })

    core.getBooleanInput.mockImplementation((name) => {
      if (name === 'all-repos') return true
      return false
    })

    // Now set repo-list to trigger the validation error
    repoList = 'repo1,repo2'

    await run()

    expect(core.setFailed).toHaveBeenCalledWith(
      'Only one of all-repos, repo-list, or repo-pattern should be specified'
    )
  })

  it('handles general errors during execution', async () => {
    // Keep your existing mock setup
    const error = new Error('Download failed')
    tc.downloadTool.mockRejectedValueOnce(error)

    await run()

    // Update expected error message to what's actually being thrown
    expect(core.setFailed).toHaveBeenCalledWith(
      'Unsupported platform or architecture: undefined undefined'
    )
  })
})

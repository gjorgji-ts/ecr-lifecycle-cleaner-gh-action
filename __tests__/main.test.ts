/**
 * Unit tests for the action's main functionality, src/main.ts
 */
import { jest } from '@jest/globals'
import path from 'path'

// Mock fixtures
import * as core from '../__fixtures__/core'
import * as exec from '../__fixtures__/exec'
import * as io from '../__fixtures__/io'
import * as tc from '../__fixtures__/tool-cache'

// Setup mocks before importing the module under test
jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('@actions/exec', () => exec)
jest.unstable_mockModule('@actions/io', () => io)
jest.unstable_mockModule('@actions/tool-cache', () => tc)

// Import the module being tested
const { run } = await import('../src/main')

describe('ecr-lifecycle-cleaner action', () => {
  const inputMap: Record<string, string> = {
    'ecr-lifecycle-cleaner-version': '1.2.1',
    command: 'clean --allRepos --dryRun'
  }

  beforeEach(() => {
    // Set up input values
    core.getInput.mockImplementation((name, options) => {
      const value = inputMap[name]
      if (value === undefined && options?.required) {
        throw new Error(`Input required and not supplied: ${name}`)
      }
      return value || ''
    })
  })

  afterEach(() => {
    // Reset all mocks after each test
    jest.resetAllMocks()
  })

  it('downloads, extracts and runs ecr-lifecycle-cleaner successfully', async () => {
    await run()

    // Verify the full successful flow
    expect(tc.downloadTool).toHaveBeenCalledWith(
      'https://github.com/gjorgji-ts/ecr-lifecycle-cleaner/releases/download/v1.2.1/ecr-lifecycle-cleaner_Linux_x86_64.tar.gz'
    )
    expect(tc.extractTar).toHaveBeenCalledWith('/tmp/downloaded-tool')
    expect(io.mkdirP).toHaveBeenCalledWith('/usr/local/bin')

    // Check binary setup
    expect(exec.exec).toHaveBeenCalledWith('sudo', [
      'mv',
      path.join('/tmp/extracted', 'ecr-lifecycle-cleaner'),
      '/usr/local/bin/ecr-lifecycle-cleaner'
    ])
    expect(exec.exec).toHaveBeenCalledWith('sudo', [
      'chmod',
      '+x',
      '/usr/local/bin/ecr-lifecycle-cleaner'
    ])

    // Verify command execution with correct arguments
    expect(exec.exec).toHaveBeenCalledWith('ecr-lifecycle-cleaner', [
      'clean',
      '--allRepos',
      '--dryRun'
    ])

    // Verify no failures were reported
    expect(core.setFailed).not.toHaveBeenCalled()
  })

  it('handles missing required inputs', async () => {
    // Simulate missing required input
    core.getInput.mockImplementationOnce((name) => {
      if (name === 'ecr-lifecycle-cleaner-version') {
        throw new Error(
          'Input required and not supplied: ecr-lifecycle-cleaner-version'
        )
      }
      return inputMap[name] || ''
    })

    await run()

    // Verify that the action failed with the appropriate error message
    expect(core.setFailed).toHaveBeenCalledWith(
      'Input required and not supplied: ecr-lifecycle-cleaner-version'
    )
  })

  it('handles general errors during execution', async () => {
    // Simulate a download failure as a general error case
    const error = new Error('Something went wrong')
    tc.downloadTool.mockRejectedValueOnce(error)

    await run()

    // Verify that the action failed with the appropriate error message
    expect(core.setFailed).toHaveBeenCalledWith('Something went wrong')
    expect(core.debug).toHaveBeenCalledWith('Error: Something went wrong')
  })
})

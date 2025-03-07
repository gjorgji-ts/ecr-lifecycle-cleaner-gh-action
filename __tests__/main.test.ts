/**
 * Unit tests for the action's main functionality, src/main.ts
 */
import { jest } from '@jest/globals'
import * as core from '../__fixtures__/core.js'

// Create reusable mock functions
const execMock = jest.fn().mockImplementation(() => Promise.resolve(0))
const mkdirPMock = jest.fn().mockImplementation(() => Promise.resolve())
const downloadToolMock = jest
  .fn()
  .mockImplementation(() => Promise.resolve('/tmp/download'))
const extractTarMock = jest
  .fn()
  .mockImplementation(() => Promise.resolve('/tmp/extracted'))

// Mock all required dependencies
jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('@actions/exec', () => ({
  exec: execMock
}))
jest.unstable_mockModule('@actions/io', () => ({
  mkdirP: mkdirPMock
}))
jest.unstable_mockModule('@actions/tool-cache', () => ({
  downloadTool: downloadToolMock,
  extractTar: extractTarMock
}))

const { run } = await import('../src/main.js')

describe('main.ts', () => {
  beforeEach(() => {
    // Set up mock input values
    core.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'ecr-lifecycle-cleaner-version':
          return '1.2.1'
        case 'command':
          return 'clean'
        case 'flags':
          return '--allRepos --dryRun'
        default:
          return ''
      }
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('Successfully downloads and runs ECR Lifecycle Cleaner', async () => {
    await run()

    // Verify debug messages were logged
    expect(core.debug).toHaveBeenCalledWith(
      expect.stringContaining('Downloading from')
    )
    expect(core.debug).toHaveBeenCalledWith('Extracting downloaded file')
    expect(core.debug).toHaveBeenCalledWith(
      expect.stringContaining('Moving binary')
    )
    expect(core.debug).toHaveBeenCalledWith(
      expect.stringContaining('Executing command: ecr-lifecycle-cleaner')
    )

    // Verify setFailed was not called
    expect(core.setFailed).not.toHaveBeenCalled()
  })

  it('Handles errors appropriately', async () => {
    // Mock a failure in downloadTool before running the test
    downloadToolMock.mockImplementationOnce(() =>
      Promise.reject(new Error('Download failed'))
    )

    await run()

    // Verify that the action was marked as failed with the correct error message
    expect(core.setFailed).toHaveBeenCalledWith('Download failed')
  })
})

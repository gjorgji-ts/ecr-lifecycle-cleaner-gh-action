import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as tc from '@actions/tool-cache'
import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs'

export async function run(): Promise<void> {
  try {
    // Get required inputs
    const version: string = core.getInput('ecr-lifecycle-cleaner-version', {
      required: true
    })
    const command: string = core.getInput('command', { required: true })

    // Get optional inputs - global flags
    const dryRun: boolean = core.getBooleanInput('dry-run')
    const allRepos: boolean = core.getBooleanInput('all-repos')
    const repoList: string = core.getInput('repo-list')
    const repoPattern: string = core.getInput('repo-pattern')

    // Command-specific inputs
    const policyFile: string = core.getInput('policy-file')

    // Validate command
    if (!['clean', 'setPolicy'].includes(command)) {
      throw new Error(
        `Invalid command: ${command}. Must be 'clean' or 'setPolicy'`
      )
    }

    // Validate repo selection parameters
    if ([allRepos, repoList, repoPattern].filter(Boolean).length > 1) {
      throw new Error(
        'Only one of all-repos, repo-list, or repo-pattern should be specified'
      )
    }

    if (command === 'setPolicy' && !policyFile) {
      throw new Error('policy-file input is required for setPolicy command')
    }

    if (policyFile && !fs.existsSync(policyFile)) {
      throw new Error(`Policy file not found: ${policyFile}`)
    }

    // Get OS and architecture for downloading the right binary
    const platform = os.platform()
    const arch = os.arch()

    // Map to compatible format for download URL
    const osMap: { [key: string]: string } = {
      win32: 'Windows',
      darwin: 'Darwin',
      linux: 'Linux'
    }

    const archMap: { [key: string]: string } = {
      x64: 'x86_64',
      arm64: 'arm64'
    }

    if (!osMap[platform] || !archMap[arch]) {
      throw new Error(
        `Unsupported platform or architecture: ${platform} ${arch}`
      )
    }

    const binaryOS = osMap[platform]
    const binaryArch = archMap[arch]

    // Download the ecr-lifecycle-cleaner binary
    const url = `https://github.com/gjorgji-ts/ecr-lifecycle-cleaner/releases/download/v${version}/ecr-lifecycle-cleaner_${binaryOS}_${binaryArch}.tar.gz`

    core.info(`Downloading from ${url}`)
    const downloadPath = await tc.downloadTool(url)

    core.info('Extracting downloaded file')
    const extractedPath = await tc.extractTar(downloadPath)

    // Path to binary in the extracted directory
    let binaryName = 'ecr-lifecycle-cleaner'
    if (platform === 'win32') {
      binaryName = 'ecr-lifecycle-cleaner.exe'
    }

    const binaryPath = path.join(extractedPath, binaryName)

    // Make binary executable
    if (platform !== 'win32') {
      await fs.promises.chmod(binaryPath, 0o755)
    }

    // Build the command arguments array
    const commandArgs: string[] = [command]

    // Add global flags
    if (dryRun) {
      commandArgs.push('--dryRun')
    }

    if (allRepos) {
      commandArgs.push('--allRepos')
    }

    if (repoList) {
      commandArgs.push('--repoList', repoList)
    }

    if (repoPattern) {
      commandArgs.push('--repoPattern', repoPattern)
    }

    // Add command-specific flags
    if (command === 'setPolicy' && policyFile) {
      commandArgs.push('--policyFile', policyFile)
    }

    core.info(
      `Running ecr-lifecycle-cleaner with args: ${commandArgs.join(' ')}`
    )

    // Execute the command
    const exitCode = await exec.exec(binaryPath, commandArgs)

    if (exitCode !== 0) {
      throw new Error(`ecr-lifecycle-cleaner exited with code ${exitCode}`)
    }

    core.info('Command completed successfully')
  } catch (error) {
    if (error instanceof Error) {
      core.error(`Error: ${error.message}`)
      core.setFailed(error.message)
    } else {
      core.setFailed('An unexpected error occurred')
    }
  }
}

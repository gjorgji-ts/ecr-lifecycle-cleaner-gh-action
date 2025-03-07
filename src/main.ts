import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as io from '@actions/io'
import * as tc from '@actions/tool-cache'
import * as path from 'path'

export async function run(): Promise<void> {
  try {
    const version: string = core.getInput('ecr-lifecycle-cleaner-version')
    const command: string = core.getInput('command')
    const flags: string = core.getInput('flags')

    // Download the ecr-lifecycle-cleaner binary
    const url = `https://github.com/gjorgji-ts/ecr-lifecycle-cleaner/releases/download/v${version}/ecr-lifecycle-cleaner_Linux_x86_64.tar.gz`

    core.debug(`Downloading from ${url}`)
    const downloadPath = await tc.downloadTool(url)

    core.debug('Extracting downloaded file')
    const extractedPath = await tc.extractTar(downloadPath)

    const binaryPath = path.join(extractedPath, 'ecr-lifecycle-cleaner')
    core.debug(
      `Moving binary from ${binaryPath} to /usr/local/bin/ecr-lifecycle-cleaner`
    )

    // Ensure the destination directory exists and we have permission to write to it
    await io.mkdirP('/usr/local/bin')
    await exec.exec('sudo', [
      'mv',
      binaryPath,
      '/usr/local/bin/ecr-lifecycle-cleaner'
    ])
    await exec.exec('sudo', [
      'chmod',
      '+x',
      '/usr/local/bin/ecr-lifecycle-cleaner'
    ])

    // Run the ecr-lifecycle-cleaner command
    const args = [command, flags]
    core.debug(`Executing command: ecr-lifecycle-cleaner ${args.join(' ')}`)
    await exec.exec('ecr-lifecycle-cleaner', args)
  } catch (error) {
    if (error instanceof Error) {
      core.debug(`Error: ${error.message}`)
      core.setFailed(error.message)
    } else {
      core.setFailed('An unexpected error occurred')
    }
  }
}

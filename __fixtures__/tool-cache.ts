import type * as tc from '@actions/tool-cache'
import { jest } from '@jest/globals'

export const downloadTool = jest
  .fn<typeof tc.downloadTool>()
  .mockResolvedValue('/tmp/downloaded-tool')
export const extractTar = jest
  .fn<typeof tc.extractTar>()
  .mockResolvedValue('/tmp/extracted')

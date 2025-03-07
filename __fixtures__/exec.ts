import type * as execModule from '@actions/exec'
import { jest } from '@jest/globals'

export const exec = jest.fn<typeof execModule.exec>().mockResolvedValue(0)

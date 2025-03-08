import type * as io from '@actions/io'
import { jest } from '@jest/globals'

export const mkdirP = jest.fn<typeof io.mkdirP>().mockResolvedValue()

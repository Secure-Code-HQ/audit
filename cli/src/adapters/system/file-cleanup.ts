import * as fs from 'fs'
import type { ICleanup } from '../../ports/cleanup'

export class FileCleanup implements ICleanup {
  constructor(private filePath: string) {}

  execute(): void {
    try { fs.unlinkSync(this.filePath) } catch {}
  }
}

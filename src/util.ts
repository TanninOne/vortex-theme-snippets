import * as path from 'path';
import { fs, util } from 'vortex-api';

export function themePath(): string {
  return path.join(util.getVortexPath('userData'), 'themes');
}

export async function isCustomTheme(themeName: string) {
  try {
    await fs.statAsync(path.join(themePath(), themeName));
    return true;
  } catch (err) {
    return false;
  }
}

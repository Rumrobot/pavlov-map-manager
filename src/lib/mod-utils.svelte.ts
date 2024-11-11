import { exists, readDir, readTextFile } from '@tauri-apps/plugin-fs';
import type { LocalMod } from '$lib/types';
import { homeDir, join } from '@tauri-apps/api/path';

const home = await homeDir();
let pavlovDir = await join(home, 'AppData\\Local\\Pavlov\\Saved\\Mods');
const pavlovUGCPattern = /^UGC\d{7}$/;

export const getLocalMods = async () => {
  const modsDirContents = await readDir(pavlovDir);
  modsDirContents.filter(
    (entry) => entry.isDirectory && pavlovUGCPattern.test(entry.name),
  );

  const localMods: Record<string, LocalMod> = {};
  for (const entry of modsDirContents) {
    const { localVersion, corrupted } = await getLocalVersion(entry.name);
    localMods[entry.name.replace('UGC', '')] = {
      localVersion,
      corrupted,
    };
  }

  return localMods;
};

const getLocalVersion = async (name: string) => {
  const taintPath = await join(pavlovDir, name, 'taint');

  if (await exists(taintPath)) {
    const localVersion = Number(await readTextFile(taintPath));
    if (!localVersion) return { localVersion: undefined, corrupted: true };
    else return { localVersion, corrupted: false };
  } else {
    return { localVersion: undefined, corrupted: true };
  }
};

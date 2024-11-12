export const TagType = ['map', 'mod', 'gamemode'] as const;

export type Mod = {
  title: string;
  imageUrl: string;
  modUrl: string;
  type: (typeof TagType)[number];
  modioVersion?: number;
  localVersion?: number;
  subscribed: boolean;
  corrupted: boolean;
  infected: boolean;
};

export type LocalMod = Pick<Mod, 'localVersion' | 'corrupted'>;

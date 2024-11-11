export type Mod = {
  title: string;
  imageUrl: string;
  modUrl: string;
  type: string;
  modioVersion?: number;
  localVersion?: number;
  subscribed: boolean;
  corrupted: boolean;
  infected: boolean;
};

export type LocalMod = Pick<Mod, 'localVersion' | 'corrupted'>;

export interface ModData {
  [modId: string]: {
    title?: string;
    imageUrl?: string;
    modUrl?: string;
    type?: string;
    currentVersion?: number;
    latestVersion?: number;
    subscribed?: boolean;
  }
}

export interface AppData {
  loading: boolean;
  status: string;
  downloading: boolean;
  receivedSize: number;
  totalSize: number;
  downloadSpeed: number;
  downloadStatus: string;
  currentlyDownloading: string;
  queueOnGoing: number;
  initialQueueLength: number;
}

export type ServerList = {
  name: string;
  players: number;
  maxPlayers: number;
  map: string;
  gamemode: string;
  locked: boolean;
}[];

export type Filters = {
  favorites: boolean;
  full: boolean;
  empty: boolean;
  locked: boolean;
  gamemodes: {
    [gamemode: string]: boolean;
  }
};
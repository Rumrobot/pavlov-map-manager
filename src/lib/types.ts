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
  downloadStatus: string;
  currentlyDownloading: string;
  queueOnGoing: number;
  initialQueueLength: number;
}

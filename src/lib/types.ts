export interface ModData {
  [modId: string]: {
    title?: string;
    imageUrl?: string;
    modUrl?: string;
    currentVersion?: string;
    latestVersion?: string;
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

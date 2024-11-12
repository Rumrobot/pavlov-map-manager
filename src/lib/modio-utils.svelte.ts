import { TagType, type Mod } from '$lib/types';
import Bottleneck from 'bottleneck';
import { ModSchema } from '$lib/schemas';

const limiter = new Bottleneck({
  minTime: 100,
});
const modioToken = '123';

export const modioAPI = async (
  url: string,
  method: string,
  headers: any = {},
  body?: string,
) => {
  headers.Authorization = `Bearer ${modioToken}`;
  headers.Accept = 'application/json';

  return await limiter.schedule(() =>
    fetch('https://api.mod.io/v1' + url, {
      method: method,
      headers: headers,
      body: body,
    }),
  );
};

export const getSubscribedMods = async () => {
  const subscribedMods: Record<string, Mod> = {};
  let page = 0;
  let fetched = false;

  while (!fetched) {
    const response = await modioAPI(
      `/me/subscribed?game_id=3959&platforms=windows&_offset=${page * 100}`,
      'GET',
    );
    if (!response.ok) return console.error('Failed to fetch subscriptions');

    const data = await response.json();

    for (const mod of data.data) {
      let modioVersion = undefined;
      let type = undefined;

      for (const platform of mod.platforms) {
        if (platform.platform === 'windows') {
          modioVersion = platform.modfile_live;
        }
      }
      for (const tag of mod.tags) {
        const name = tag.name.toLowerCase();
        if (TagType.includes(name)) {
          type = name;
        }
      }

      const entry = {
        title: mod.name,
        imageUrl: mod.logo.original, // .../id/filename for original or .../id/crop_640x360/filename for crop (320x180, 640x360 or 1280x720)
        modUrl: mod.profile_url,
        type,
        modioVersion,
        subscribed: true,
        corrupted: false,
        infected: false,
      };

      const test = ModSchema.safeParse(entry);
      if (!test.success) {
        console.error(test.error);
        console.log(mod);
        continue;
      }
      subscribedMods[mod.id] = entry;
    }
    if (data.result_count == 100) page++;
    else fetched = true;
  }

  return subscribedMods;
};

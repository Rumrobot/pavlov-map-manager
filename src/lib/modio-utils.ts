export async function downloadMap(map: string) {
    // Set downloading to true to show the progress bar
    downloading = true;
    status = "Fetching file info";

    // Get the file info
    const fileInfoResponse = await modioRequest(
      `https://api.mod.io/v1/games/3959/mods/${map}/files/${mapData[map].latestVersion}`,
      "GET"
    );
    if (!fileInfoResponse.ok) {
      toast.error(
        "Error while fetching file info for map: " + mapData[map].title
      );
      status = "Error fetching file info";
      downloading = false;
      return;
    }

    status = "Checking file info";

    const fileInfo = await fileInfoResponse.json();

    // Set the total byte size of the file
    totalSize = fileInfo.filesize;

    // Check if the file is infected with a virus
    if (fileInfo.virus_positive == 1) {
      toast.error("Virus detected in map: " + mapData[map].title);
      status = "Virus detected";
      downloading = false;
      return;
    }

    status = "Downloading the file";
    // Download the file
    try {
      const headers = new Map();
      headers.set("Authorization", `Bearer ${oauthToken}`);
      headers.set("Content-Type", "application/x-www-form-urlencoded");
      headers.set("Accept", "application/json");
      headers.set("X-Modio-Platform", "windows");

      await download(
        fileInfo.download.binary_url,
        `${map}.zip`,
        (progress, total) => {
          receivedSize = progress;
          totalSize = total;
          progress = (progress / total) * 100;
        },
        headers
      );
    } catch (error) {
      toast.error("Error while downloading file");
      status = "Error downloading file";
      downloading = false;
      return;
    }
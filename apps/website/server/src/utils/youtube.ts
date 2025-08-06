import { google, youtube_v3 } from "googleapis";

interface YouTubeSearchResult {
  id?: { videoId?: string };
  snippet?: { title?: string };
}

export class YouTubeService {
  private youtube: youtube_v3.Youtube;

  constructor(apiKey: string) {
    const cleanKey = apiKey.replace(/YOUTUBE_API_KEY=|"|'/g, "").trim();

    this.youtube = google.youtube({
      version: "v3",
      auth: cleanKey,
    });
  }

  async searchVideo(query: string) {
    try {
      const searchParams: youtube_v3.Params$Resource$Search$List = {
        part: ["id", "snippet"],
        maxResults: 1,
        q: query, // Add this line - this is the actual search term
        type: ["video"],
        videoCategoryId: "10", // Music category
        videoType: "any",
      };

      const response = await this.youtube.search.list(searchParams);
      const data = response.data;

      if (!data.items || data.items.length === 0) {
        return null;
      }

      const video = data.items[0] as YouTubeSearchResult;

      if (!video.id?.videoId || !video.snippet?.title) {
        return null;
      }

      return {
        id: video.id.videoId,
        title: video.snippet.title,
        url: `https://youtube.com/watch?v=${video.id.videoId}`,
      };
    } catch (error: any) {
      console.error("Error searching YouTube video:", error);
      return null;
    }
  }
}

export default YouTubeService;

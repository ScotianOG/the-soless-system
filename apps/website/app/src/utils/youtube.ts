import { google } from 'googleapis';

export class YouTubeService {
  private static instance: YouTubeService;
  private youtube;

  private constructor() {
    this.youtube = google.youtube({
      version: 'v3',
      auth: process.env.YOUTUBE_API_KEY
    });
  }

  public static getInstance(): YouTubeService {
    if (!YouTubeService.instance) {
      YouTubeService.instance = new YouTubeService();
    }
    return YouTubeService.instance;
  }

  public async searchSong(query: string): Promise<string | null> {
    try {
      const response = await this.youtube.search.list({
        part: ['id', 'snippet'],
        q: query,
        type: ['video'],
        maxResults: 1,
        videoCategoryId: '10' // Music category
      });

      if (response.data.items && response.data.items.length > 0) {
        const videoId = response.data.items[0].id?.videoId;
        return videoId ? `https://youtube.com/watch?v=${videoId}` : null;
      }

      return null;
    } catch (error) {
      console.error('YouTube search error:', error);
      return null;
    }
  }
}

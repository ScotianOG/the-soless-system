"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.YouTubeService = void 0;
const googleapis_1 = require("googleapis");
class YouTubeService {
    constructor(apiKey) {
        const cleanKey = apiKey.replace(/YOUTUBE_API_KEY=|"|'/g, "").trim();
        this.youtube = googleapis_1.google.youtube({
            version: "v3",
            auth: cleanKey,
        });
    }
    async searchVideo(query) {
        try {
            const searchParams = {
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
            const video = data.items[0];
            if (!video.id?.videoId || !video.snippet?.title) {
                return null;
            }
            return {
                id: video.id.videoId,
                title: video.snippet.title,
                url: `https://youtube.com/watch?v=${video.id.videoId}`,
            };
        }
        catch (error) {
            console.error("Error searching YouTube video:", error);
            return null;
        }
    }
}
exports.YouTubeService = YouTubeService;
exports.default = YouTubeService;

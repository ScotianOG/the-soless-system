import { TwitterApi } from "twitter-api-v2";

export class TwitterVerificationService {
  private static instance: TwitterVerificationService;
  private client: TwitterApi;

  private constructor() {
    this.client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY!,
      appSecret: process.env.TWITTER_API_SECRET!,
      accessToken: process.env.TWITTER_ACCESS_TOKEN!,
      accessSecret: process.env.TWITTER_ACCESS_SECRET!,
    });
  }

  static getInstance(): TwitterVerificationService {
    if (!TwitterVerificationService.instance) {
      TwitterVerificationService.instance = new TwitterVerificationService();
    }
    return TwitterVerificationService.instance;
  }

  async verifyTweet(username: string, code: string): Promise<boolean> {
    try {
      console.log(
        `Searching for tweets from @${username} containing code: ${code}`
      );

      // Search for tweets from the specific user containing the code
      const tweets = await this.client.v2.search(`from:${username} "${code}"`, {
        max_results: 10,
        "tweet.fields": ["created_at", "author_id"],
      });

      console.log(
        `Found ${
          tweets.data
            ? Array.isArray(tweets.data)
              ? tweets.data.length
              : 1
            : 0
        } tweets`
      );

      if (!tweets.data) {
        console.log(
          `No tweets found containing code ${code} from user ${username}`
        );
        return false;
      }

      // Check if any tweet was posted within the last 30 minutes (verification window)
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

      // Handle both single tweet and array of tweets
      const tweetArray = Array.isArray(tweets.data)
        ? tweets.data
        : [tweets.data];

      for (const tweet of tweetArray) {
        const tweetDate = new Date(tweet.created_at!);
        console.log(`Tweet found: "${tweet.text}" posted at ${tweetDate}`);

        if (tweetDate >= thirtyMinutesAgo) {
          console.log(`Valid tweet found within time window`);
          return true;
        }
      }

      console.log(`No tweets found within the 30-minute verification window`);
      return false;
    } catch (error) {
      console.error("Error verifying Twitter account:", error);
      return false;
    }
  }
}

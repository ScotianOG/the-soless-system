// src/routes/webhooks/twitter.ts
import { PrismaClient } from "@prisma/client";
import { IEngagementTracker } from "../../core/engagement/types";
import { TwitterEvent } from "./types";
import { verifyTwitterWebhook } from "../../utils";

export async function handleTwitterWebhook(
  prisma: PrismaClient,
  event: TwitterEvent,
  engagementTracker: IEngagementTracker
) {
  if (event.tweet_create_events) {
    for (const tweet of event.tweet_create_events) {
      const user = await prisma.user.findFirst({
        where: {
          twitterAccount: {
            platformId: tweet.user.id_str
          }
        }
      });

      if (user) {
        await engagementTracker.trackEngagement({
          platform: 'TWITTER',
          userId: user.id,
          type: 'TWEET',
          metadata: {
            tweetId: tweet.id_str,
            text: tweet.text
          },
          timestamp: new Date(tweet.created_at)
        });
      }
    }
  }
}

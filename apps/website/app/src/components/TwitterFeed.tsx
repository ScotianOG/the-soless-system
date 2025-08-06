import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  Twitter,
  MessageCircle,
  RefreshCw,
  Heart,
  ExternalLink,
} from "lucide-react";

// Define the Tweet type
interface Tweet {
  id: string;
  username: string;
  handle: string;
  content: string;
  time: string;
  likes: number;
  retweets: number;
  replies: number;
  avatar: string;
  hasImage?: boolean;
  image?: string;
  url?: string;
}

const TWITTER_API_URL = "/api/twitter/feed";

const Tweet = ({ tweet }: { tweet: Tweet }) => {
  return (
    <div className="bg-black/50 border border-soless-blue/20 rounded-lg p-4 mb-4 hover:border-soless-blue/50 transition-all duration-300">
      <div className="flex items-start mb-3">
        <img
          src={tweet.avatar}
          alt={tweet.username}
          className="w-10 h-10 rounded-full mr-3"
        />
        <div>
          <div className="flex items-center">
            <span className="font-bold text-white">{tweet.username}</span>
            <span className="text-gray-400 text-sm ml-2">@{tweet.handle}</span>
            <span className="text-gray-500 text-xs ml-auto">{tweet.time}</span>
          </div>
          <p className="text-gray-200 mt-1">{tweet.content}</p>
        </div>
      </div>

      {tweet.hasImage && tweet.image && (
        <div className="mt-3 mb-3 rounded-lg overflow-hidden border border-soless-blue/10">
          <img
            src={tweet.image}
            alt="Tweet content"
            className="w-full h-auto"
          />
        </div>
      )}

      <div className="flex items-center justify-between mt-3 text-gray-400 text-sm">
        <div className="flex items-center">
          <button className="flex items-center hover:text-blue-400 transition-colors">
            <MessageCircle className="h-4 w-4 mr-1" />
            <span>{tweet.replies}</span>
          </button>
        </div>
        <div className="flex items-center">
          <button className="flex items-center hover:text-green-400 transition-colors">
            <RefreshCw className="h-4 w-4 mr-1" />
            <span>{tweet.retweets}</span>
          </button>
        </div>
        <div className="flex items-center">
          <button className="flex items-center hover:text-red-400 transition-colors">
            <Heart className="h-4 w-4 mr-1" />
            <span>{tweet.likes}</span>
          </button>
        </div>
        <div className="flex items-center">
          <button className="text-soless-blue hover:text-soless-blue/80 transition-colors">
            Share
          </button>
        </div>
      </div>
    </div>
  );
};

const TwitterFeed = () => {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout | null = null;

    const fetchTweets = async () => {
      // Prevent multiple simultaneous requests
      if (isRefreshing || !isMounted) return;

      try {
        setIsRefreshing(true);
        setLoading(true);
        const response = await fetch(TWITTER_API_URL);

        if (!response.ok) {
          if (response.status === 429) {
            throw new Error("Rate limited - will retry later");
          }
          throw new Error(`Failed to fetch tweets: ${response.status}`);
        }

        const data = await response.json();
        if (isMounted) {
          setTweets(data.feed || []); // Handle the actual API response format
          setError(null);
        }
      } catch (err) {
        console.error("Error fetching tweets:", err);
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load tweets. Please try again later."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setIsRefreshing(false);
        }
      }
    };

    // Initial fetch
    fetchTweets();

    // Set up interval for periodic refresh (every 30 minutes for a static feed)
    const scheduleNextFetch = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (isMounted) {
          fetchTweets();
          scheduleNextFetch(); // Schedule the next fetch
        }
      }, 30 * 60 * 1000); // 30 minutes
    };

    scheduleNextFetch();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []); // Empty dependency array - only run once on mount

  return (
    <div className="bg-black/30 border border-soless-blue/40 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="bg-blue-500/20 p-2 rounded-full mr-3">
            <Twitter className="h-5 w-5 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Latest Updates</h2>
        </div>
        <a
          href="https://x.com/SOLessSystem"
          target="_blank"
          rel="noopener noreferrer"
          className="text-soless-blue hover:text-soless-blue/80 text-sm flex items-center"
        >
          Follow us <ArrowRight className="ml-1 h-3 w-3" />
        </a>
      </div>

      {loading ? (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-soless-blue"></div>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-soless-blue hover:text-soless-blue/80 text-sm flex items-center mx-auto"
          >
            Retry <RefreshCw className="ml-1 h-3 w-3" />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {tweets.length > 0 ? (
            tweets.map((tweet) => <Tweet key={tweet.id} tweet={tweet} />)
          ) : (
            <div className="text-center p-4 text-gray-400">
              No tweets available at this time.
            </div>
          )}
        </div>
      )}

      <div className="mt-4 text-center">
        <a
          href="https://x.com/SOLessSystem"
          target="_blank"
          rel="noopener noreferrer"
          className="text-soless-blue hover:text-soless-blue/80 text-sm flex items-center justify-center"
        >
          View all tweets <ExternalLink className="ml-1 h-3 w-3" />
        </a>
      </div>
    </div>
  );
};

export default TwitterFeed;

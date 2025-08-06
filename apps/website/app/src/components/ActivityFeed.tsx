import { useEffect, useState } from 'react';
import { MessageCircle, Star, Music, Gift, Zap, Twitter, Globe } from 'lucide-react';
import { activityApi, Activity } from '../lib/api';

// Fallback mock data in case API fails
const mockActivities: Activity[] = [
  {
    id: '1',
    userId: 'user1',
    username: 'soulie_fan',
    action: 'QUALITY_POST',
    platform: 'TELEGRAM',
    points: 1,
    timestamp: '2 min ago'
  },
  {
    id: '2',
    userId: 'user2',
    username: 'music_lover',
    action: 'MUSIC_SHARE',
    platform: 'TELEGRAM',
    points: 5,
    timestamp: '5 min ago'
  },
  {
    id: '3',
    userId: 'user3',
    username: 'crypto_whale',
    action: 'TWEET',
    platform: 'TWITTER',
    points: 2,
    timestamp: '9 min ago'
  },
  {
    id: '4',
    userId: 'user4',
    username: 'nft_collector',
    action: 'INVITE',
    platform: 'DISCORD',
    points: 10,
    timestamp: '15 min ago'
  },
  {
    id: '5',
    userId: 'user5',
    username: 'metaverse_dev',
    action: 'STREAK_BONUS',
    platform: 'TELEGRAM',
    points: 5,
    timestamp: '18 min ago'
  }
];

interface ActivityFeedProps {
  activities?: Activity[];
}

const ActivityFeed = ({ activities: propActivities }: ActivityFeedProps) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (propActivities) {
      setActivities(propActivities);
      setLoading(false);
    } else {
      const fetchActivities = async () => {
        try {
          const data = await activityApi.getRecentActivity();
          setActivities(data);
          setError(null);
        } catch (err) {
          console.error('Error fetching activities:', err);
          setError('Failed to load activity feed');
          setActivities(mockActivities);
        } finally {
          setLoading(false);
        }
      };

      fetchActivities();

      // Set up polling only when activities are not provided as props
      const intervalId = setInterval(fetchActivities, 30000);
      return () => clearInterval(intervalId);
    }
  }, [propActivities]);

  if (loading) {
    return (
      <div className="bg-black/50 backdrop-blur-lg rounded-lg border border-soless-blue/40 p-4">
        <h3 className="text-xl font-bold text-soless-blue mb-4 flex items-center">
          <Zap className="w-5 h-5 mr-2" />
          Community Activity Feed
        </h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-soless-blue"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-black/50 backdrop-blur-lg rounded-lg border border-soless-blue/40 p-4">
        <h3 className="text-xl font-bold text-soless-blue mb-4 flex items-center">
          <Zap className="w-5 h-5 mr-2" />
          Community Activity Feed
        </h3>
        <div className="text-red-400 text-center py-4">{error}</div>
      </div>
    );
  }
  
  const getPointsForAction = (action: string): number => {
    switch (action) {
      case 'QUALITY_POST': return 1;
      case 'MUSIC_SHARE': return 5;
      case 'TWEET': return 2;
      case 'INVITE': return 10;
      case 'STREAK_BONUS': return 5;
      default: return 1;
    }
  };
  
  const getActionIcon = (action: string, platform: string) => {
    switch (action) {
      case 'QUALITY_POST': 
        return <MessageCircle className="w-4 h-4" />;
      case 'MUSIC_SHARE': 
        return <Music className="w-4 h-4" />;
      case 'TWEET': 
        return <Twitter className="w-4 h-4" />;
      case 'INVITE': 
        return <Gift className="w-4 h-4" />;
      case 'STREAK_BONUS': 
        return <Zap className="w-4 h-4" />;
      default: 
        return <Star className="w-4 h-4" />;
    }
  };
  
  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'TELEGRAM': return 'text-blue-400';
      case 'DISCORD': return 'text-indigo-400';
      case 'TWITTER': return 'text-sky-400';
      default: return 'text-gray-400';
    }
  };
  
  const getActionName = (action: string): string => {
    switch (action) {
      case 'QUALITY_POST': return 'Quality Post';
      case 'MUSIC_SHARE': return 'Shared Music';
      case 'TWEET': return 'Posted Tweet';
      case 'INVITE': return 'Invited Friend';
      case 'STREAK_BONUS': return 'Streak Bonus';
      default: return action;
    }
  };
  
  return (
    <div className="bg-black/50 backdrop-blur-lg rounded-lg border border-soless-blue/40 p-4">
      <h3 className="text-xl font-bold text-soless-blue mb-4 flex items-center">
        <Zap className="w-5 h-5 mr-2" />
        Community Activity Feed
      </h3>
      
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {activities.map((activity) => (
          <div 
            key={activity.id}
            className="flex items-center justify-between py-2 px-3 rounded-lg bg-black/30 border border-gray-800 hover:border-soless-blue/30 transition-colors"
          >
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-black/50 ${getPlatformColor(activity.platform)}`}>
                {getActionIcon(activity.action, activity.platform)}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">
                  <span className="text-soless-blue">@{activity.username}</span> {getActionName(activity.action)}
                </p>
                <div className="flex items-center mt-1">
                  <span className={`text-xs ${getPlatformColor(activity.platform)}`}>
                    {activity.platform}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    {activity.timestamp}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-green-400 font-medium">+{activity.points}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityFeed;

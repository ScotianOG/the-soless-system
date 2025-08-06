import { Flame } from 'lucide-react';

interface StreakIndicatorProps {
  currentStreak: number;
  platform: 'telegram' | 'discord' | 'twitter';
}

const StreakIndicator = ({ currentStreak, platform }: StreakIndicatorProps) => {
  // Calculate days until next bonus (every 3 days)
  const daysUntilNextBonus = currentStreak % 3 === 0 ? 3 : 3 - (currentStreak % 3);
  
  // Get platform-specific color
  const getColor = () => {
    switch (platform) {
      case 'telegram':
        return 'text-blue-400';
      case 'discord':
        return 'text-indigo-400';
      case 'twitter':
        return 'text-sky-400';
      default:
        return 'text-gray-400';
    }
  };
  
  // Last 7 days visualization
  const generateDayBoxes = () => {
    const boxes = [];
    
    for (let i = 6; i >= 0; i--) {
      // For demonstration, we're assuming continuous streak
      // In a real app, you'd compare with actual active days
      const isActive = i < currentStreak % 7;
      
      boxes.push(
        <div 
          key={i}
          className={`w-6 h-6 rounded flex items-center justify-center text-xs
            ${isActive 
              ? `bg-${platform === 'telegram' ? 'blue' : platform === 'discord' ? 'indigo' : 'sky'}-500/30 ${getColor()}`
              : 'bg-gray-800 text-gray-600'
            }`}
        >
          {isActive && <div className="w-2 h-2 rounded-full bg-current"></div>}
        </div>
      );
    }
    
    return boxes;
  };

  return (
    <div className="bg-black/30 rounded-lg p-3 border border-gray-800">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Flame className={`w-4 h-4 mr-1 ${currentStreak > 0 ? 'text-orange-400' : 'text-gray-600'}`} />
          <span className={`text-sm font-medium ${currentStreak > 0 ? 'text-white' : 'text-gray-400'}`}>
            {currentStreak} day{currentStreak !== 1 ? 's' : ''}
          </span>
        </div>
        
        {currentStreak > 0 && (
          <span className="text-xs text-gray-400">
            {daysUntilNextBonus} day{daysUntilNextBonus !== 1 ? 's' : ''} until bonus
          </span>
        )}
      </div>
      
      <div className="flex justify-between mt-2">
        {generateDayBoxes()}
      </div>
      
      <div className="mt-2 text-center">
        <div className="text-xs text-gray-400 mb-1">Last 7 days</div>
      </div>
    </div>
  );
};

export default StreakIndicator;
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Trophy } from "lucide-react";

interface PointsBreakdownProps {
  total?: number;
  telegramPoints: number;
  discordPoints: number;
  twitterPoints: number;
}

const PointsBreakdown = ({
  total: providedTotal,
  telegramPoints,
  discordPoints,
  twitterPoints,
}: PointsBreakdownProps) => {
  const total =
    providedTotal !== undefined
      ? providedTotal
      : telegramPoints + discordPoints + twitterPoints;

  const data = [
    { name: "Telegram", value: telegramPoints, color: "#3B82F6" },
    { name: "Discord", value: discordPoints, color: "#6366F1" },
    { name: "Twitter", value: twitterPoints, color: "#0EA5E9" },
  ].filter((item) => item.value > 0); // Only include platforms with points

  // If no platforms have points yet, show a placeholder
  if (data.length === 0) {
    data.push({ name: "No Points Yet", value: 1, color: "#4B5563" });
  }

  // Calculate percentages for each platform based on actual earned points
  const actualTotal = telegramPoints + discordPoints + twitterPoints;
  const telegramPercentage =
    actualTotal > 0 ? Math.round((telegramPoints / actualTotal) * 100) : 0;
  const discordPercentage =
    actualTotal > 0 ? Math.round((discordPoints / actualTotal) * 100) : 0;
  const twitterPercentage =
    actualTotal > 0 ? Math.round((twitterPoints / actualTotal) * 100) : 0;

  return (
    <div className="bg-black/50 backdrop-blur-lg rounded-lg border border-soless-blue/40 p-4">
      <h3 className="text-xl font-bold text-soless-blue mb-4 flex items-center">
        <Trophy className="w-5 h-5 mr-2" />
        Points Breakdown
      </h3>

      <div className="flex flex-col md:flex-row items-center">
        <div className="w-full md:w-1/2 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`${value} points`, ""]}
                contentStyle={{
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  borderColor: "rgba(59, 130, 246, 0.5)",
                }}
              />
              <Legend
                formatter={(value) => (
                  <span className="text-gray-300">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="w-full md:w-1/2 mt-4 md:mt-0">
          <div className="space-y-4">
            <div className="bg-black/30 rounded-lg p-3 border border-blue-500/10">
              <div className="flex justify-between items-center mb-1">
                <span className="text-blue-400 font-medium">Telegram</span>
                <span className="text-gray-300">{telegramPoints} points</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${telegramPercentage}%` }}
                ></div>
              </div>
              <div className="text-right text-xs text-gray-400 mt-1">
                {telegramPercentage}%
              </div>
            </div>

            <div className="bg-black/30 rounded-lg p-3 border border-indigo-500/10">
              <div className="flex justify-between items-center mb-1">
                <span className="text-indigo-400 font-medium">Discord</span>
                <span className="text-gray-300">{discordPoints} points</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className="bg-indigo-500 h-2 rounded-full"
                  style={{ width: `${discordPercentage}%` }}
                ></div>
              </div>
              <div className="text-right text-xs text-gray-400 mt-1">
                {discordPercentage}%
              </div>
            </div>

            <div className="bg-black/30 rounded-lg p-3 border border-sky-500/10">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sky-400 font-medium">Twitter</span>
                <span className="text-gray-300">{twitterPoints} points</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className="bg-sky-500 h-2 rounded-full"
                  style={{ width: `${twitterPercentage}%` }}
                ></div>
              </div>
              <div className="text-right text-xs text-gray-400 mt-1">
                {twitterPercentage}%
              </div>
            </div>

            <div className="text-center mt-2">
              <div className="text-gray-300">
                Total: <span className="text-white font-bold">{total}</span>{" "}
                points
              </div>
              <div className="text-gray-400 text-sm">
                Daily limit: 1,000 points
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PointsBreakdown;

import { useEffect, useState } from 'react';

interface CountdownProps {
  startDate: Date;
  endDate: Date;
}

const PresaleCountdown = ({ startDate, endDate }: CountdownProps) => {
  const calculateTimeLeft = (now: number) => {
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();
    
    // If before start date
    if (now < startTime) {
      const difference = startTime - now;
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
    }
    // If after start but before end
    else if (now < endTime) {
      const difference = endTime - now;
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
    }
    // If after end date
    return null;
  };

  const now = new Date().getTime();
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(now));
  const [isStarted, setIsStarted] = useState(now >= startDate.getTime());

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      setTimeLeft(calculateTimeLeft(now));
      setIsStarted(now >= startDate.getTime());
    }, 1000);

    return () => clearInterval(timer);
  }, [startDate, endDate]);

  if (!timeLeft) {
    return <div className="text-xl text-red-500">Presale has ended</div>;
  }

  return (
    <div className="text-center">
      <h2 className="text-xl mb-2">
        {isStarted ? "Presale Ends In:" : "Presale Starts In:"}
      </h2>
      <div className="grid grid-cols-4 gap-4 text-center">
        <div className="bg-black/50 p-4 rounded-lg">
          <div className="text-3xl font-bold">{timeLeft.days}</div>
          <div className="text-sm text-gray-400">Days</div>
        </div>
        <div className="bg-black/50 p-4 rounded-lg">
          <div className="text-3xl font-bold">{timeLeft.hours}</div>
          <div className="text-sm text-gray-400">Hours</div>
        </div>
        <div className="bg-black/50 p-4 rounded-lg">
          <div className="text-3xl font-bold">{timeLeft.minutes}</div>
          <div className="text-sm text-gray-400">Minutes</div>
        </div>
        <div className="bg-black/50 p-4 rounded-lg">
          <div className="text-3xl font-bold">{timeLeft.seconds}</div>
          <div className="text-sm text-gray-400">Seconds</div>
        </div>
      </div>
    </div>
  );
};

export default PresaleCountdown;

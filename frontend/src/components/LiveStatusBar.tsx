import React, { useEffect, useState } from 'react';

const LiveStatusBar: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 w-[90%] bg-gradient-to-r from-purple-600/90 to-pink-600/90 backdrop-blur-md z-50 shadow-lg border border-white/10 rounded-xl">
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-sm font-medium text-white/90">Live Monitoring</span>
          </div>
          
          <h1 className="text-2xl font-bold flex items-center gap-2 font-['Quicksand']">
            <span className="text-3xl">💎</span>
            <span className="text-white">
              Token Explorer
            </span>
          </h1>
        </div>
        
        <div className="text-sm font-medium text-white/90">
          {time.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
          })}
        </div>
      </div>
    </div>
  );
};

export default LiveStatusBar;

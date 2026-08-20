import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, MapPin, Rocket, Building2, AlertCircle } from 'lucide-react';

export default function LiveLaunchBanner() {
  const [launchData, setLaunchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const fetchUpcoming = async () => {
      try {
        const res = await fetch('https://lldev.thespacedevs.com/2.2.0/launch/upcoming/?limit=1');
        if (!res.ok) throw new Error('API Rate Limit or Network Error');
        const data = await res.json();
        
        if (data && data.results && data.results.length > 0) {
          setLaunchData(data.results[0]);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUpcoming();
  }, []);

  useEffect(() => {
    if (!launchData || !launchData.net) return;
    
    const target = new Date(launchData.net).getTime();
    
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = target - now;
      
      if (distance < 0) {
        setTimeLeft('LAUNCHED / IN FLIGHT');
        clearInterval(timer);
        return;
      }
      
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      
      setTimeLeft(`T- ${days}d ${hours}h ${minutes}m ${seconds}s`);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [launchData]);

  if (loading) {
    return (
      <div className="w-full glass-card p-6 mb-8 border border-space-600/50 flex items-center justify-center h-32">
        <div className="text-space-400 flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-agency-nasa border-t-transparent rounded-full animate-spin"></div>
          Scanning global spaceports for next launch...
        </div>
      </div>
    );
  }

  if (error || !launchData) {
    return (
      <div className="w-full glass-card overflow-hidden mb-8 border border-space-600/50 shadow-lg relative bg-space-800/50">
        <div className="absolute top-0 left-0 w-1 h-full bg-space-600"></div>
        <div className="p-6 md:p-8 flex flex-col items-center justify-center text-center">
          <AlertCircle className="w-8 h-8 text-space-400 mb-3" />
          <h2 className="text-xl font-display font-semibold text-white mb-1">Live Tracking Temporarily Offline</h2>
          <p className="text-sm text-space-400">The Space Devs API rate limit has been reached. Tracking will resume automatically later.</p>
        </div>
      </div>
    );
  }

  const statusColor = launchData.status?.id === 1 ? 'text-emerald-400' : 'text-amber-400';

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full glass-card overflow-hidden mb-8 border border-space-600/50 shadow-[0_0_20px_rgba(59,130,246,0.1)] relative"
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-agency-nasa"></div>
      
      <div className="p-6 md:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        
        {/* Left Side: Mission Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase flex items-center gap-2 border border-red-500/30">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              Live Tracking
            </span>
            <span className={`text-sm font-semibold flex items-center gap-1 ${statusColor}`}>
              <AlertCircle className="w-4 h-4" />
              {launchData.status?.name || 'Status Unknown'}
            </span>
          </div>
          
          <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-2">
            {launchData.name || 'Unknown Mission'}
          </h2>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-space-300">
            <span className="flex items-center gap-1.5 bg-space-800/80 px-3 py-1.5 rounded-lg border border-space-600">
              <Building2 className="w-4 h-4 text-agency-spacex" />
              {launchData.launch_service_provider?.name || 'Unknown Agency'}
            </span>
            <span className="flex items-center gap-1.5 bg-space-800/80 px-3 py-1.5 rounded-lg border border-space-600">
              <Rocket className="w-4 h-4 text-agency-nasa" />
              {launchData.rocket?.configuration?.name || 'Unknown Rocket'}
            </span>
            <span className="flex items-center gap-1.5 bg-space-800/80 px-3 py-1.5 rounded-lg border border-space-600">
              <MapPin className="w-4 h-4 text-emerald-400" />
              {launchData.pad?.location?.name || 'Unknown Location'}
            </span>
          </div>
        </div>

        {/* Right Side: Countdown */}
        <div className="bg-space-900/80 border border-space-600 p-6 rounded-2xl min-w-[280px] text-center shrink-0 shadow-inner">
          <p className="text-xs font-bold tracking-wider text-space-400 uppercase mb-2 flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" />
            Liftoff Target
          </p>
          <div className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight tabular-nums">
            {timeLeft || 'Calculating...'}
          </div>
          <p className="text-sm text-space-400 mt-2">
            {new Date(launchData.net).toLocaleString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        
      </div>
    </motion.div>
  );
}

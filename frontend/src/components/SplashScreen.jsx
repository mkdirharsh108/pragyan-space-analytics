import { useState, useEffect } from 'react';

export default function SplashScreen({ isLoaded, onComplete }) {
  const [shouldRender, setShouldRender] = useState(true);
  const [fadingOut, setFadingOut] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    // Hold the splash screen for exactly 4 seconds
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isLoaded && minTimeElapsed) {
      setTimeout(() => setFadingOut(true), 0);
      const removeTimer = setTimeout(() => {
        setShouldRender(false);
        if (onComplete) onComplete();
      }, 800);
      return () => clearTimeout(removeTimer);
    }
  }, [isLoaded, minTimeElapsed, onComplete]);

  if (!shouldRender) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0c1015] ${fadingOut ? 'splash-fade-out' : ''}`}>
      
      {/* Parallax Stars Background */}
      <div className="splash-stars" style={{ animationName: 'stars-fall, stars-opacity', animationDuration: '0.2s, 4s' }}></div>
      <div className="splash-stars splash-stars-2" style={{ animationName: 'stars-fall, stars-opacity', animationDuration: '0.4s, 4s' }}></div>

      <div className="relative w-[200px] h-[400px] z-10 flex flex-col items-center justify-center">
        {/* The entire SVG now translates up and down using GPU acceleration, with a rumble effect */}
        <svg viewBox="0 0 100 250" className="w-full h-full splash-rocket-container">
          
          {/* Flame (positioned below the engine) */}
          <path 
            className="splash-flame"
            d="M 42 195 L 50 240 L 58 195 Z" 
          />

          {/* Rocket Outline */}
          <path 
            className="splash-rocket"
            d="M 50 10 C 35 40 35 100 35 140 L 20 170 L 35 170 L 35 180 L 65 180 L 65 170 L 80 170 L 65 140 C 65 100 65 40 50 10 Z" 
          />
          
          {/* Engine */}
          <path 
            className="splash-engine"
            d="M 40 180 L 40 195 L 60 195 L 60 180" 
          />
          
          {/* Windows */}
          <circle className="splash-window" cx="50" cy="60" r="6" />
          <circle className="splash-window" cx="50" cy="90" r="6" />
        </svg>
      </div>

      <div className="absolute bottom-[20%] z-10 text-[24px] tracking-[4px] uppercase font-bold text-[#f3f4f6]" style={{ animation: 'splash-opacity 4s forwards' }}>
        <style>{`
          @keyframes splash-opacity {
            0% { opacity: 0; }
            20% { opacity: 1; }
            80% { opacity: 1; }
            100% { opacity: 0; }
          }
        `}</style>
        INITIALIZING
      </div>
    </div>
  );
}

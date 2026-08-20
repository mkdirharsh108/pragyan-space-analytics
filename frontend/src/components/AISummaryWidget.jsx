import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AISummaryWidget = ({ chartData, config, title }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [summary, setSummary] = useState(null);

  // Reset summary if the chartData changes (e.g. filters applied)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSummary(null);
    setIsOpen(false);
  }, [chartData]);

  const handleGenerate = async () => {
    setIsOpen(true);
    if (summary === "Generating AI Insight...") return;
    if (summary && summary !== "Generating AI Insight..." && summary !== "Failed to generate insight.") return; 
    
    setSummary("Generating AI Insight...");
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8001'}/api/generate_summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: `Provide an insight for ${title}`, chartData, config })
      });
      const data = await response.json();
      setSummary(data.summary || "No insight generated.");
    } catch (e) {
      console.error(e);
      setSummary("Failed to generate insight.");
    }
  };

  return (
    <div className="relative shrink-0">
      {/* Trigger Button */}
      <button 
        onClick={isOpen ? () => setIsOpen(false) : handleGenerate}
        className={`flex items-center gap-2 px-4 py-1.5 glass-panel text-white text-xs font-semibold whitespace-nowrap transition-all ${
          isOpen 
            ? 'bg-[#FF00FF]/20 border-[#FF00FF] shadow-[0_0_15px_rgba(255,0,255,0.4)]' 
            : 'hover:bg-[#FF00FF]/10 hover:border-[#FF00FF]/60 hover:shadow-[0_0_10px_rgba(255,0,255,0.2)]'
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
        {isOpen ? 'Close Insight' : 'Generate Insight'}
      </button>

      {/* Dropdown Overlay Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-12 right-0 w-[350px] z-[1000] p-4 glass-panel border border-[#FF00FF]/40 shadow-[0_0_20px_rgba(255,0,255,0.2)] bg-[#0B0C10]/95 backdrop-blur-2xl rounded-xl"
          >
            <div className="flex items-center gap-2 mb-3 border-b border-[#FF00FF]/20 pb-2">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#FF00FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
               </svg>
               <span className="text-xs font-display font-bold text-[#FF00FF] uppercase tracking-wider">AI Analysis</span>
            </div>
            
            <div className="text-sm font-sans font-medium text-slate-200 leading-relaxed">
              {summary}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AISummaryWidget;

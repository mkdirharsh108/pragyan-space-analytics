import { useState, useRef, useEffect } from 'react';
import { Terminal, Send, Command, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { parseCommand } from '../utils/commandParser';

export default function SpaceCommand({ onCommand, allData }) {
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
    const inputRef = useRef(null);
  
  // Keyboard shortcut (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        if (!isProcessing) setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isProcessing]);

  useEffect(() => {
    if (isOpen && inputRef.current && !isProcessing) {
      inputRef.current.focus();
    }
  }, [isOpen, isProcessing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    
    setIsProcessing(true);

    // Simulate simple loading
    await new Promise(resolve => setTimeout(resolve, 600));

    const config = await parseCommand(input, allData);

    onCommand(config, input);
    
    setInput('');
    setIsProcessing(false);
    setIsOpen(false);
  };

  return (
    <>
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 glass-panel hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-sm font-medium text-slate-300 transition-all hover:text-white group w-64"
        >
          <Command className="w-4 h-4 text-agency-nasa group-hover:text-agency-spacex transition-colors" />
          <span>Space Command AI...</span>
          <span className="ml-auto text-xs opacity-50 bg-white/10 px-2 py-0.5 rounded-md border border-white/20">⌘K</span>
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => { if (!isProcessing) setIsOpen(false); }}
              className="absolute inset-0 bg-black/40 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="relative w-full max-w-2xl glass-card overflow-hidden"
            >
              <form onSubmit={handleSubmit} className="flex items-center px-4 py-4 border-b border-space-600/50">
                {isProcessing ? (
                  <Loader2 className="w-6 h-6 text-agency-nasa mr-3 animate-spin" />
                ) : (
                  <Terminal className="w-6 h-6 text-agency-nasa mr-3" />
                )}
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask the AI to build a chart..."
                  disabled={isProcessing}
                  className="flex-1 bg-transparent border-none outline-none text-lg text-white placeholder:text-space-400 disabled:opacity-50"
                  autoComplete="off"
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || isProcessing}
                  className="p-2 bg-agency-nasa hover:bg-blue-500 disabled:bg-white/10 disabled:text-white/30 text-white rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              
              <div className="p-4 bg-black/20 min-h-[150px]">
                {isProcessing ? (
                  <div className="flex flex-col items-center justify-center h-[118px] text-space-400 gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-agency-nasa" />
                    <p className="font-mono text-sm">Processing command...</p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs font-semibold text-space-400 uppercase tracking-wider mb-3">AI Suggestions</p>
                    <div className="flex flex-wrap gap-2">
                      {['Top 10 rockets by total successes', 'SpaceX vs Roscosmos success rate over time', 'Pie chart of USA vs China failures', 'Compare Falcon 9 and Soyuz success rate', 'Area chart of total launches by agency'].map((s, i) => (
                        <button 
                          key={i} 
                          onClick={() => setInput(s)}
                          className="text-xs glass-panel hover:bg-white/10 px-3 py-1.5 rounded-full hover:border-agency-nasa text-slate-300 transition-all text-left"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

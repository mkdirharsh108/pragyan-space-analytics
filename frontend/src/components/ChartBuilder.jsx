import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Settings, BarChart2, Camera, Sparkles, Loader2 } from 'lucide-react';
import ChartRenderer from './ChartRenderer';
import { downloadSnapshot } from '../utils/exportUtils';

export default function ChartBuilder({ allData, loading, initialConfig, query }) {
  // Sandbox State
  const [chartType, setChartType] = useState('');
  const [xAxis, setXAxis] = useState(''); 
  const [yAxis, setYAxis] = useState('');
  const [splitBy, setSplitBy] = useState('none');
  const [limit, setLimit] = useState('20');
  const [filters, setFilters] = useState([]);
  
  // AI Summary State
  const [aiSummary, setAiSummary] = useState(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [lastSummaryConfig, setLastSummaryConfig] = useState(null);
  const [latestData, setLatestData] = useState([]);
  
  useEffect(() => {
    if (initialConfig) {
      setTimeout(() => {
        if (initialConfig.chartType) setChartType(initialConfig.chartType);
        if (initialConfig.xAxis) setXAxis(initialConfig.xAxis);
        if (initialConfig.yAxis) setYAxis(initialConfig.yAxis);
        if (initialConfig.splitBy) setSplitBy(initialConfig.splitBy);
        if (initialConfig.filters) setFilters(initialConfig.filters);
      }, 0);
    }
  }, [initialConfig]);

  const generateInsight = async (dataToUse) => {
    setIsGeneratingSummary(true);
    setAiSummary(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8001'}/api/generate_summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query,
          chartData: dataToUse,
          config: { chartType, xAxis, yAxis, splitBy, filters }
        })
      });
      const data = await res.json();
      setAiSummary(data.summary);
    } catch (err) {
      console.error("Failed to fetch AI summary", err);
      setAiSummary("Failed to generate summary. Please check backend connection.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleDataComputed = useCallback((computedChartData) => {
    setLatestData(computedChartData);
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const currentConfigStr = JSON.stringify({ chartType, xAxis, yAxis, splitBy, limit, filters });
    
    if (computedChartData.length > 0 && currentConfigStr !== lastSummaryConfig) {
      setLastSummaryConfig(currentConfigStr);
      
      if (query) {
        // Auto-generate if query came from Space Command
        generateInsight(computedChartData);
      } else {
        // Clear previous summary if manual dropdown changed
        setAiSummary(null);
      }
    }
  }, [query, chartType, xAxis, yAxis, splitBy, limit, filters, lastSummaryConfig]);

  if (loading) return <div className="w-full text-center text-space-400 p-8">Loading Builder Engine...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
      
      <div className="glass-card p-6 border border-agency-nasa/30 shadow-[0_0_15px_rgba(59,130,246,0.1)] transition-all">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-6 h-6 text-agency-nasa" />
          <h2 className="text-xl font-display font-semibold text-white">Custom Chart Sandbox</h2>
        </div>
        
        {/* Sandbox Controls */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-2">
          <div>
            <label className="block text-xs font-medium text-space-400 mb-1 uppercase tracking-wider">Chart Type</label>
            <select value={chartType} onChange={e => setChartType(e.target.value)} className="w-full glass-panel border border-space-600 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-agency-nasa">
              <option value="" disabled>Select...</option>
              <optgroup label="Bar Charts">
                <option value="Bar">Bar Chart (Grouped)</option>
                <option value="StackedBar">Bar Chart (Stacked)</option>
                <option value="DynamicBar">Bar Chart (Dynamic/Sorted)</option>
              </optgroup>
              <optgroup label="Line & Area">
                <option value="Line">Line Chart</option>
                <option value="StepLine">Step Line Chart</option>
                <option value="Area">Area Chart (Overlaid)</option>
                <option value="StackedArea">Area Chart (Stacked)</option>
              </optgroup>
              <optgroup label="Scatter & Bubble">
                <option value="Scatter">Scatter Plot</option>
                <option value="Bubble">Bubble Chart</option>
                <option value="SingleBubbleTimeline">Timeline (Single Bubble)</option>
                <option value="BubbleTimeline">Timeline (Multi Bubble)</option>
              </optgroup>
              <optgroup label="Circular & Radial">
                <option value="Pie">Pie Chart</option>
                <option value="RadialBar">Radial Bar Chart</option>
                <option value="Gauge">Gauge Chart</option>
              </optgroup>
              <optgroup label="Custom & Experimental">
                <option value="Heatmap">Heatmap</option>
                <option value="Waffle">Waffle Chart</option>
                <option value="WaffleMatrix">Waffle Matrix</option>
                <option value="Monument">Monument Layout</option>
                <option value="Badges">Badges Grid</option>
                <option value="PosterBadges">Poster Badges</option>
              </optgroup>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-space-400 mb-1 uppercase tracking-wider">X-Axis</label>
            <select value={xAxis} onChange={e => setXAxis(e.target.value)} className="w-full glass-panel border border-space-600 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-agency-nasa">
              <option value="" disabled>Select...</option>
              <option value="year">Launch Year</option>
              <option value="dashboard_agency">Company / Agency (Grouped)</option>
              <option value="real_agency">Operating Agency (Raw)</option>
              <option value="rocket_type">Rocket Type</option>
              <option value="mission">Mission Name</option>
              <option value="state_code">Country (State Code)</option>
              <option value="is_success">Success Outcome (Boolean)</option>
              <option value="success_status">Detailed Status Code</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-space-400 mb-1 uppercase tracking-wider">Y-Axis (Metric)</label>
            <select value={yAxis} onChange={e => setYAxis(e.target.value)} className="w-full glass-panel border border-space-600 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-agency-nasa">
              <option value="" disabled>Select...</option>
              <option value="count">Total Volume</option>
              <option value="successes">Total Successes</option>
              <option value="failures">Total Failures</option>
              <option value="success_rate">Success Rate (%)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-emerald-400 mb-1 uppercase tracking-wider">Split By (Series)</label>
            <select value={splitBy} onChange={e => setSplitBy(e.target.value)} className="w-full glass-panel border border-emerald-500/50 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-emerald-400">
              <option value="none">None (Single Series)</option>
              <option value="dashboard_agency">Specific Company / Agency</option>
              <option value="real_agency">Operating Agency (Raw)</option>
              <option value="is_success">Success / Failure</option>
              <option value="success_status">Detailed Status Code</option>
              <option value="state_code">Country</option>
              <option value="rocket_type">Rocket Type</option>
              <option value="year">Launch Year</option>
              <option value="mission">Mission Name</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-space-400 mb-1 uppercase tracking-wider">Top Results</label>
            <select value={limit} onChange={e => setLimit(e.target.value)} disabled={xAxis === 'year'} className="w-full glass-panel border border-space-600 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-agency-nasa disabled:opacity-50">
              <option value="10">Top 10</option>
              <option value="20">Top 20</option>
              <option value="50">Top 50</option>
              <option value="all">Show All</option>
            </select>
          </div>
        </div>
      </div>

      <div className="glass-card p-6 min-h-[550px] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-agency-nasa" />
              Live Preview
            </h3>
            {filters.length > 0 && (
              <div className="flex gap-2">
                {filters.map((f, i) => (
                  <span key={i} className="px-2 py-1 bg-agency-nasa/20 text-agency-nasa text-xs rounded-full border border-agency-nasa/30">
                    {f.key}: {f.value}
                  </span>
                ))}
                <button onClick={() => setFilters([])} className="text-xs text-space-400 hover:text-white underline ml-2">Clear Filters</button>
              </div>
            )}
          </div>
          <button 
            onClick={() => downloadSnapshot('sandbox-chart-container', 'custom-space-chart')}
            className="flex items-center gap-2 px-4 py-2 glass-panel hover:bg-white/10 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Camera className="w-4 h-4" />
            Snapshot
          </button>
        </div>
        
        {/* Dynamic Layout Wrapper */}
        <div className="flex gap-6 w-full flex-row">
          {/* Single Chart for Sandbox */}
          <div id="sandbox-chart-container" className="flex-1 w-full h-[500px] bg-white/5 rounded-xl p-4 relative">
            {(!chartType || !xAxis || !yAxis) ? (
              <div className="flex-1 h-full w-full flex flex-col items-center justify-center text-space-400 border-2 border-dashed border-space-600/50 rounded-xl bg-black/20 gap-3">
                <BarChart2 className="w-8 h-8 opacity-50" />
                <p>Configure chart options above to generate preview</p>
              </div>
            ) : (
              <ChartRenderer 
                data={allData}
                config={{ chartType, xAxis, yAxis, splitBy, limit, filters }} 
                onDataComputed={handleDataComputed}
              />
            )}
          </div>
          
          {/* AI Summary Section */}
          <div className="w-[350px] shrink-0 p-5 rounded-xl glass-panel border border-[#FF00FF]/40 shadow-[0_0_20px_rgba(255,0,255,0.15)] bg-[#0B0C10]/95 backdrop-blur-2xl flex flex-col relative overflow-hidden self-start">
            
            <div className="flex items-center gap-3 mb-3 border-b border-[#FF00FF]/20 pb-3">
              {isGeneratingSummary ? (
                <Loader2 className="w-5 h-5 text-[#FF00FF] animate-spin" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#FF00FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              )}
              <h4 className="text-xs font-display font-bold text-[#FF00FF] uppercase tracking-wider">
                Space Command AI Analysis
              </h4>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 mt-2">
              {isGeneratingSummary ? (
                <div className="flex flex-col gap-3 w-full">
                  <div className="h-2 bg-[#FF00FF]/20 rounded w-3/4 animate-pulse"></div>
                  <div className="h-2 bg-[#FF00FF]/20 rounded w-1/2 animate-pulse"></div>
                  <div className="h-2 bg-[#FF00FF]/20 rounded w-5/6 animate-pulse"></div>
                </div>
              ) : aiSummary ? (
                <p className="text-sm font-sans text-slate-200 leading-relaxed font-medium">
                  {aiSummary}
                </p>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center pb-6">
                  <button 
                    onClick={() => generateInsight(latestData)}
                    className="px-6 py-2.5 glass-panel border border-[#FF00FF]/60 hover:bg-[#FF00FF]/20 hover:shadow-[0_0_15px_rgba(255,0,255,0.4)] text-white rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#FF00FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate Insight
                  </button>
                  <p className="text-xs text-[#FF00FF]/60 mt-4 px-4 font-sans leading-relaxed">
                    Generate orbital insights for the current chart configuration.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

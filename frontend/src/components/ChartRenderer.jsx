import { useMemo, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell, ScatterChart, Scatter, RadialBarChart, RadialBar, PieChart, Pie } from 'recharts';

const SERIES_COLORS = [
  '#00FFFF', // Neon Cyan
  '#FF00FF', // Neon Magenta
  '#39FF14', // Neon Green
  '#8A2BE2', // Electric Purple
  '#FFFF00', // Bright Yellow
  '#FF3366', // Electric Pink
  '#00FF99', // Spring Green
  '#9900FF', // Deep Purple
  '#FF9900', // Neon Orange
  '#0099FF'  // Bright Blue
];

const COUNTRY_MAP = {
  'US': 'United States',
  'SU': 'Soviet Union',
  'RU': 'Russia',
  'CN': 'China',
  'FR': 'France',
  'F': 'France',
  'IN': 'India',
  'J': 'Japan',
  'I': 'Italy',
  'UK': 'United Kingdom',
  'IL': 'Israel',
  'IR': 'Iran',
  'KP': 'North Korea',
  'KR': 'South Korea',
  'NZ': 'New Zealand',
  'BR': 'Brazil',
  'D': 'Germany',
  'AU': 'Australia',
  'I-ESA': 'ESA (Europe)',
  'I-ELDO': 'ELDO (Europe)',
  'CYM': 'Sea Launch (CYM)'
};

const CustomTooltip = ({ active, payload, label, yAxis }) => {
  if (active && payload && payload.length) {
    // Filter out zero values for counts to avoid clutter, but KEEP zero for success rates
    const filteredPayload = payload.filter(p => {
      if (p.value === null || p.value === undefined) return false;
      if (yAxis === 'success_rate') return true; 
      return p.value > 0;
    });
    const sortedPayload = [...filteredPayload].sort((a, b) => {
      if (a.name === 'Other') return 1;
      if (b.name === 'Other') return -1;
      return b.value - a.value;
    });

    return (
      <div className="bg-slate-900/95 backdrop-blur-xl border border-white/20 p-3 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.7)] min-w-[160px] sm:min-w-[200px] z-50">
        <p className="font-bold text-white text-xs leading-tight border-b border-white/10 pb-1.5 mb-2 text-center drop-shadow-md">
          {COUNTRY_MAP[label] || label}
        </p>
        <div className="flex flex-col gap-1.5 w-full">
          {sortedPayload.map((p, idx) => {
            const rawVal = p.value;
            const displayVal = typeof rawVal === 'number' && rawVal % 1 !== 0 ? rawVal.toFixed(1) : rawVal;
            const name = p.name === 'value' ? (yAxis.replace('_', ' ')) : (COUNTRY_MAP[p.name] || p.name);
            
            return (
              <div key={idx} className="flex justify-between items-center text-[10px] sm:text-[11px]">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: p.color, color: p.color }} />
                  <span className="text-slate-400 capitalize">{name}</span>
                </div>
                <span className="font-bold text-white ml-4 font-mono">{displayVal}{yAxis === 'success_rate' ? '%' : ''}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

const CustomBubble = (props) => {
  const { cx, cy, value, stroke } = props;
  if (!value) return null;
  const radius = Math.min(4 + (value * 3), 45);
  return (
    <circle 
      cx={cx} 
      cy={cy} 
      r={radius} 
      fill={stroke} 
      fillOpacity={0.4} 
      stroke={stroke} 
      strokeWidth={2} 
      style={{ filter: `drop-shadow(0 0 10px ${stroke})` }} 
    />
  );
};

export default function ChartRenderer({ data, config, title, onDataComputed }) {
  const { chartType, xAxis, yAxis, splitBy, limit, filters } = config;

  const { chartData, seriesKeys } = useMemo(() => {
    if (!data || data.length === 0) return { chartData: [], seriesKeys: [] };

    let filteredData = data;
    if (filters && filters.length > 0) {
      const filterGroups = {};
      filters.forEach(f => {
        if (!filterGroups[f.key]) filterGroups[f.key] = [];
        filterGroups[f.key].push(f.value.toLowerCase());
      });

      filteredData = data.filter(d => {
        return Object.entries(filterGroups).every(([key, values]) => {
          if (!d[key]) return false;
          return values.includes(d[key].toString().toLowerCase());
        });
      });
    }
    
    const grouped = {};
    const seriesSet = new Set();
    
    filteredData.forEach(d => {
      let key = d[xAxis] === null || d[xAxis] === undefined || d[xAxis] === 'Unknown' ? 'Unknown' : d[xAxis];
      if (xAxis === 'success_status') {
        if (key === 'O') key = 'Success';
        else if (key === 'F') key = 'Failure';
        else if (key === 'P') key = 'Partial Failure';
        else if (key === 'S') key = 'Suborbital Success';
      }
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(d);
    });
    
    let result = Object.keys(grouped).map(key => {
      const group = grouped[key];
      const dataPoint = { name: key };
      
      if (splitBy === 'none') {
        const count = group.length;
        const successes = group.filter(d => d.is_success === 1 || d.is_success === true || d.success_status === 'O').length;
        if (yAxis === 'count') dataPoint.value = count;
        if (yAxis === 'successes') dataPoint.value = successes;
        if (yAxis === 'failures') dataPoint.value = (count - successes) > 0 ? count - successes : null;
        if (yAxis === 'success_rate') dataPoint.value = count > 0 ? (successes === count ? 100 : parseFloat(((successes / count) * 100).toFixed(1))) : null;
        
        dataPoint.total_flights = count;
        dataPoint.failures = count - successes;
        
        const agencies = {};
        const states = {};
        group.forEach(d => {
          if (d.dashboard_agency) agencies[d.dashboard_agency] = (agencies[d.dashboard_agency] || 0) + 1;
          if (d.state_code) states[d.state_code] = (states[d.state_code] || 0) + 1;
        });
        
        const sortedAgencies = Object.keys(agencies).sort((a,b) => agencies[b] - agencies[a]);
        const sortedStates = Object.keys(states).sort((a,b) => states[b] - states[a]);
        dataPoint.primary_agency = sortedAgencies.length > 0 ? sortedAgencies[0] : null;
        dataPoint.primary_state = sortedStates.length > 0 ? sortedStates[0] : null;
        const years = group.map(d => parseInt(d.year)).filter(y => !isNaN(y));
        if (years.length > 0) {
          dataPoint.min_year = Math.min(...years);
          dataPoint.max_year = Math.max(...years);
        }
        
        seriesSet.add('value');
      } else {
        const subGrouped = {};
        group.forEach(d => {
          let sKey = d[splitBy] || 'Unknown';
          if (splitBy === 'success_status') {
            if (sKey === 'O') sKey = 'Success';
            else if (sKey === 'F') sKey = 'Failure';
            else if (sKey === 'P') sKey = 'Partial Failure';
            else if (sKey === 'S') sKey = 'Suborbital Success';
          }
          if (!subGrouped[sKey]) subGrouped[sKey] = [];
          subGrouped[sKey].push(d);
          seriesSet.add(sKey);
        });
        
        Object.keys(subGrouped).forEach(sKey => {
          const sGroup = subGrouped[sKey];
          const count = sGroup.length;
          const successes = sGroup.filter(d => d.is_success === 1 || d.is_success === true || d.success_status === 'O').length;
          
          if (yAxis === 'count') dataPoint[sKey] = count;
          if (yAxis === 'successes') dataPoint[sKey] = successes;
          if (yAxis === 'failures') dataPoint[sKey] = (count - successes) > 0 ? count - successes : null;
          if (yAxis === 'success_rate') dataPoint[sKey] = count > 0 ? (successes === count ? 100 : parseFloat(((successes / count) * 100).toFixed(1))) : null;
        });
      }
      return dataPoint;
    });

    let sKeysArray = Array.from(seriesSet);

    let maxSeriesCount = 12;
    if (limit && limit !== 'all') {
      maxSeriesCount = parseInt(limit, 10);
    } else if (limit === 'all') {
      maxSeriesCount = Infinity;
    }

    if (splitBy !== 'none' && sKeysArray.length > maxSeriesCount) {
      const keySums = sKeysArray.map(k => {
        let sum = 0;
        result.forEach(d => { if (d[k]) sum += d[k]; });
        return { key: k, sum };
      });
      keySums.sort((a, b) => b.sum - a.sum);
      
      const topCount = Math.max(1, maxSeriesCount - 1);
      const topKeys = keySums.slice(0, topCount).map(x => x.key);
      const otherKeys = keySums.slice(topCount).map(x => x.key);
      
      result.forEach(d => {
        let otherSum = 0;
        otherKeys.forEach(k => {
          if (d[k]) {
            otherSum += d[k];
            delete d[k];
          }
        });
        if (otherSum > 0) d['Other'] = otherSum;
      });
      
      sKeysArray = [...topKeys, 'Other'];
    }

    result.forEach(d => {
      let maxVal = 0;
      sKeysArray.forEach(k => {
        if (d[k] === undefined) {
          if (chartType === 'Scatter' || chartType === 'Monument' || chartType === 'StepLine' || chartType === 'DynamicBar' || yAxis === 'success_rate') {
            d[k] = null; // Do not plot phantom zeroes on Scatters or rates
          } else {
            d[k] = 0;
          }
        }
        if (d[k] > maxVal) maxVal = d[k];
      });
      d.max_value = maxVal;
    });

    if (xAxis === 'year') {
      result.sort((a, b) => parseInt(a.name) - parseInt(b.name));
    } else {
      result.sort((a, b) => {
        const sumA = sKeysArray.reduce((acc, k) => acc + (a[k] || 0), 0);
        const sumB = sKeysArray.reduce((acc, k) => acc + (b[k] || 0), 0);
        
        if (sumB === sumA && yAxis === 'success_rate') {
             return (b.total_flights || 0) - (a.total_flights || 0);
        }
        
        return sumB - sumA;
      });
      if (limit !== 'all') {
        result = result.slice(0, parseInt(limit));
      }
      
      // Force 'Other' to always be the last category on the X-Axis or Pie chart
      result.sort((a, b) => {
        if (a.name === 'Other') return 1;
        if (b.name === 'Other') return -1;
        return 0;
      });
    }

    return { chartData: result, seriesKeys: sKeysArray };
  }, [data, xAxis, yAxis, limit, splitBy, chartType, filters]);

  useEffect(() => {
    if (onDataComputed && chartData) {
      onDataComputed(chartData);
    }
  }, [chartData, onDataComputed]);



  const isStacked = chartType.includes('Stacked');

  const commonElements = (
    <>
      <defs>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
      <XAxis 
        dataKey="name" 
        stroke="rgba(255,255,255,0.1)" 
        tick={xAxis === 'rocket_type' ? false : {fill: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 500}} 
        label={xAxis === 'rocket_type' ? { value: 'LAUNCH VEHICLES', position: 'insideBottom', fill: 'rgba(255,255,255,0.5)', offset: -5, fontSize: 12, fontWeight: 600, letterSpacing: 2 } : undefined}
        angle={-45} 
        textAnchor="end" 
        height={60} 
        tickLine={false} 
      />
      <YAxis 
        stroke="rgba(255,255,255,0.1)" 
        tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 500}} 
        tickLine={false} 
        domain={yAxis === 'success_rate' && !isStacked ? [0, 100] : [0, 'auto']} 
      />
      <RechartsTooltip content={<CustomTooltip yAxis={yAxis} />} wrapperStyle={{ zIndex: 1000 }} cursor={{ fill: 'rgba(255,255,255,0.05)', stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
    </>
  );

  const generateSeries = (Type, isArea = false, isScatter = false, isBubble = false) => {
    return seriesKeys.map((key, idx) => {
      const colorIndex = idx % SERIES_COLORS.length;
      const color = SERIES_COLORS[colorIndex];
      if (isScatter) {
        return <Type key={key} name={key === 'value' ? yAxis : key} dataKey={key} fill={color} />;
      }
      if (isBubble) {
        return <Type key={key} type="monotone" name={key === 'value' ? yAxis : key} dataKey={key} stroke={color} strokeWidth={0} dot={<CustomBubble stroke={color} />} activeDot={{ r: 8, fill: color }} />;
      }
      if (isArea) {
        return <Type key={key} type="monotone" name={key === 'value' ? yAxis : key} dataKey={key} stroke={color} strokeWidth={2} fill={color} fillOpacity={0.2} stackId={isStacked ? "1" : undefined} />;
      }
      if (Type === Line) {
        return <Type key={key} type="monotone" name={key === 'value' ? yAxis : key} dataKey={key} stroke={color} strokeWidth={3} activeDot={{ r: 6, fill: color, stroke: '#fff', strokeWidth: 2 }} dot={false} />;
      }
      // For Bars
      return <Type key={key} name={key === 'value' ? yAxis : key} dataKey={key} fill={color} stroke="#111318" strokeWidth={2} fillOpacity={1} stackId={isStacked ? "1" : undefined} radius={isStacked ? [2,2,2,2] : [2,2,0,0]} maxBarSize={isStacked ? 60 : 60} />;
    });
  };

  const renderChartBody = () => {
    const commonProps = { data: chartData, margin: { top: 20, right: 30, left: 20, bottom: 20 } };
    switch (chartType) {
      case 'SingleBubbleTimeline': {
        // Calculate the "Rollout" (first appearance) year for each rocket in the dataset
        const rollouts = {};
        const missions = {}; // Map to store the actual satellite/mission names

        seriesKeys.forEach(k => {
          // Search raw data for all flights of this rocket
          const rocketFlights = (data || []).filter(d => d[splitBy] === k).sort((a, b) => parseInt(a.year) - parseInt(b.year));
          if (rocketFlights.length > 0) {
            const maiden = rocketFlights[0];
            const yearStr = maiden.year ? maiden.year.toString() : null;
            
            if (yearStr) {
              if (!rollouts[yearStr]) {
                rollouts[yearStr] = [];
                missions[yearStr] = [];
              }
              if (!rollouts[yearStr].includes(k)) {
                rollouts[yearStr].push(k);
                // Clean up the mission name to fit better in the bubble
                let missionName = maiden.mission || k;
                if (missionName.length > 15) missionName = missionName.split(' ')[0]; // truncate long names
                missions[yearStr].push(missionName);
              }
            }
          }
        });

        const rolloutYears = Object.keys(rollouts).map(y => ({ name: y })).sort((a, b) => parseInt(a.name) - parseInt(b.name));
        const count = rolloutYears.length;
        
        // Hardcode temporal boundaries to guarantee "2010 to current" spread regardless of data filters
        const minYear = 2010;
        const maxYear = new Date().getFullYear();
        
        return (
          <div className="w-full h-full flex flex-col p-4 min-h-[300px] relative">
            
            {count === 0 && (
               <div className="absolute inset-0 flex items-center justify-center text-white/40 text-sm font-mono tracking-widest uppercase">No data for selected period</div>
            )}
            
            {/* The Timeline Track Container (matches line bounds to ensure perfect alignment) */}
            <div className="absolute left-[40px] w-[calc(100%-80px)] top-0 bottom-0 pointer-events-none">
              
              {/* The Central Line */}
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1px] bg-white/20 shadow-[0_0_10px_rgba(255,255,255,0.1)]" />
              
              {/* Horizontal Spread Axis Ticks */}
              {Array.from({ length: maxYear - minYear + 1 }, (_, i) => {
                const year = minYear + i;
                const pct = (i / (maxYear - minYear)) * 100;
                return (
                  <div key={year} className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center" style={{ left: `${pct}%` }}>
                    <div className="w-px h-2 bg-white/30" />
                    <span className="absolute top-3 text-[9px] font-mono text-white/30">{year}</span>
                  </div>
                );
              })}

              {/* Timeline Items */}
              {rolloutYears.map((d, i) => {
                const rockets = rollouts[d.name];
                const missionNames = missions[d.name];
                const size = 68; // Large fixed size for easy readability of text
                const isAbove = i % 2 === 0;
                
                // Find color based on primary rollout rocket
                const primaryRocket = rockets[0];
                const sIdx = seriesKeys.indexOf(primaryRocket);
                const color = SERIES_COLORS[sIdx % SERIES_COLORS.length] || "rgba(0, 255, 255, 0.9)";
                
                // True temporal scale mapping (0% to 100%) locked between 2010 and maxYear
                const currentYear = parseInt(d.name);
                const leftPercent = ((currentYear - minYear) / (maxYear - minYear)) * 100;
                
                return (
                  <div key={i} className="absolute top-0 bottom-0 group cursor-crosshair pointer-events-auto z-10" style={{ left: `${leftPercent}%` }}>
                     
                     {/* The Stem */}
                     <div 
                       className={`absolute left-1/2 -translate-x-1/2 w-px bg-white/30 group-hover:bg-white/80 transition-colors z-0 ${isAbove ? 'bottom-[50%] origin-bottom' : 'top-[50%] origin-top'}`}
                       style={{ height: '40px' }}
                     />
                     
                     {/* The Bubble & Label Container */}
                     <div className={`absolute left-1/2 -translate-x-1/2 flex items-center justify-center z-20 hover:z-[60] ${isAbove ? 'bottom-[calc(50%+40px)]' : 'top-[calc(50%+40px)]'}`}>
                       
                       {/* The Bubble Element */}
                       <div 
                         className="rounded-full transition-all duration-500 group-hover:scale-110 backdrop-blur-md flex flex-col items-center justify-center text-center overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                         style={{ 
                           width: `${size}px`, height: `${size}px`, 
                           backgroundColor: `${color}E6`, 
                           boxShadow: `0 0 25px ${color}80, inset 0 0 15px rgba(255,255,255,0.5)`,
                           border: '1px solid rgba(255,255,255,0.7)'
                         }}
                       >
                         {/* Now displaying Mission/Satellite names! */}
                         <span className="text-white font-bold text-[9px] sm:text-[10px] leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] px-1.5 break-words text-center line-clamp-3">
                           {missionNames.join('\n')}
                         </span>
                       </div>
                       
                       {/* Year Label */}
                       <span className={`absolute ${isAbove ? '-bottom-6' : '-top-6'} text-[11px] sm:text-xs text-white/70 font-mono font-bold tracking-wider drop-shadow-md group-hover:text-white transition-colors`}>{d.name}</span>
                       
                       {/* Hover Tooltip */}
                       <div className={`absolute ${isAbove ? 'bottom-[115%]' : 'top-[115%]'} left-1/2 -translate-x-1/2 w-max opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-300 ${isAbove ? 'translate-y-2 group-hover:-translate-y-1' : '-translate-y-2 group-hover:translate-y-1'} z-50`}>
                         <div className="bg-slate-900/95 backdrop-blur-xl border border-white/20 p-4 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.8)] flex flex-col gap-2 min-w-[140px]">
                            <div className={`absolute ${isAbove ? '-bottom-2 border-r border-b' : '-top-2 border-l border-t'} left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900/95 border-white/20 rotate-45 z-[-1]`} />
                            
                            <p className="text-white font-bold text-sm leading-tight border-b border-white/10 pb-2 text-center drop-shadow-md">
                              {d.name} Rollout
                            </p>
                            
                            <div className="flex flex-col gap-1.5 mt-1">
                              {rockets.map((k, idx) => {
                                 const cColor = SERIES_COLORS[seriesKeys.indexOf(k) % SERIES_COLORS.length];
                                 return (
                                   <div key={k} className="flex justify-between items-center text-xs gap-6">
                                     <div className="flex items-center gap-2">
                                       <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cColor, boxShadow: `0 0 5px ${cColor}` }} />
                                       <span className="text-slate-200 font-bold tracking-wide">{k} <span className="text-white/40 text-[10px] ml-1">({missionNames[idx]})</span></span>
                                     </div>
                                   </div>
                                 );
                              })}
                            </div>
                         </div>
                       </div>
                     </div>
                  </div>
                );
              })}
            </div>
            
            {/* Contextual Legend (Fixed Wrapping) */}
            <div className="absolute bottom-4 left-10 text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 opacity-80 whitespace-nowrap">
              Maiden Flights / Rollout Timeline ({minYear} - {maxYear})
            </div>
          </div>
        );
      }
      case 'BubbleTimeline': {
        const xValues = chartData.map(d => d.name);
        
        // Find max value for sizing the bubbles
        let maxVal = 1;
        chartData.forEach(d => {
          seriesKeys.forEach(k => {
            if (d[k] > maxVal) maxVal = d[k];
          });
        });

        return (
          <div className="w-full h-full flex flex-col p-4 min-h-[300px] overflow-hidden relative">
            {/* Scrollable Container */}
            <div className="flex-1 w-full overflow-x-auto overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              <div className="flex flex-col gap-6 w-max min-w-full pb-4 px-2">
                
                {/* Timeline X-Axis Labels (Top) */}
                <div className="flex items-center gap-4 mb-2 sticky top-0 bg-slate-900/90 backdrop-blur-sm z-40 pt-2 pb-2">
                  <div className="w-24 sm:w-32 sticky left-0 z-50 bg-slate-900/90"></div>
                  <div className="flex items-center gap-2 flex-1">
                    {xValues.map((xVal) => (
                      <div key={`header-${xVal}`} className="w-8 flex justify-center text-[10px] sm:text-[11px] text-white/40 font-mono font-bold tracking-widest shrink-0">
                        {xVal}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rows (Series) */}
                {seriesKeys.map((cat, sIdx) => {
                  if (cat === 'Other' && seriesKeys.length > 1) return null; // Hide 'Other' if we want cleaner UI, but let's keep it for now.
                  const color = SERIES_COLORS[sIdx % SERIES_COLORS.length];
                  
                  return (
                    <div key={cat} className="flex items-center gap-4 group/row">
                      <div className="w-24 sm:w-32 text-right text-[10px] sm:text-[11px] text-slate-300 font-bold tracking-wider uppercase sticky left-0 z-30 bg-[#0F172A] py-1.5 pr-3 truncate border-r border-white/5 shadow-[5px_0_10px_rgba(0,0,0,0.5)]" title={cat}>
                        {cat}
                      </div>
                      <div className="flex items-center gap-2 flex-1 h-7 relative">
                        {/* Connecting Line */}
                        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1px] bg-white/5 pointer-events-none" />
                        
                        {chartData.map((d) => {
                          const val = d[cat] || 0;
                          
                          if (val === 0) {
                            return (
                              <div key={`${cat}-${d.name}`} className="w-8 h-7 flex items-center justify-center relative z-10 shrink-0">
                                <div className="w-1 h-1 rounded-full bg-white/[0.02]" />
                              </div>
                            );
                          }
                          
                          // Proportional bubble size: 8px to 24px
                          const size = 8 + (val / maxVal) * 16;
                          
                          return (
                            <div key={`${cat}-${d.name}`} className="w-8 h-7 flex items-center justify-center group relative cursor-crosshair z-10 hover:z-[60] shrink-0">
                              <div 
                                className="rounded-full transition-all duration-300 group-hover:scale-125 relative z-10 opacity-90 group-hover:opacity-100"
                                style={{ width: `${size}px`, height: `${size}px`, backgroundColor: color, boxShadow: `0 0 12px ${color}` }}
                              />
                              
                              {/* Hover Tooltip */}
                              <div className="absolute bottom-[140%] left-1/2 -translate-x-1/2 w-max opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:-translate-y-1 z-50">
                                 <div className="bg-slate-900/95 backdrop-blur-xl border border-white/20 p-3 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.7)] relative flex flex-col gap-1.5 min-w-[140px]">
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900/95 border-r border-b border-white/20 rotate-45 backdrop-blur-xl" />
                                    
                                    <p className="text-white font-bold text-xs leading-tight border-b border-white/10 pb-1.5 text-center relative z-10">
                                      {cat} <span className="text-slate-400 font-normal">| {d.name}</span>
                                    </p>
                                    
                                    <div className="flex justify-between items-center text-[11px] mt-1 relative z-10 gap-4">
                                      <span className="text-slate-400">Total</span>
                                      <span className="font-bold font-mono drop-shadow-md text-white">
                                        {val} {yAxis === 'count' ? 'Flights' : ''}
                                      </span>
                                    </div>
                                 </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      }
      case 'PosterBadges': {
        const rocketImg = "https://images.unsplash.com/photo-1517976487492-5750f3195933?q=80&w=400&auto=format&fit=crop";
        return (
          <div className="w-full h-full flex flex-col p-4 min-h-[300px]">
            <div className="grid grid-cols-3 sm:grid-cols-4 grid-rows-4 sm:grid-rows-3 gap-2 w-full h-full flex-1">
              {chartData.map((d, idx) => {
                const val = d[seriesKeys[0]] || d.value || 100;
                const hue = (idx * 55) % 360;
                
                const yearsText = d.min_year && d.max_year ? `${d.min_year} - ${d.max_year}` : '';
                const totalText = d.total_flights ? `${d.total_flights} Flights` : '';
                
                return (
                  <div key={idx} className="relative flex flex-col items-center justify-center w-full h-full group z-10 hover:z-[100] cursor-crosshair">
                    
                    {/* Visual Card Layer (Contains overflow so images don't leak) */}
                    <div className="absolute inset-0 rounded-lg overflow-hidden border border-white/10 shadow-md group-hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all duration-300 bg-slate-900">
                      <div 
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-125" 
                        style={{ backgroundImage: `url(${rocketImg})`, filter: `hue-rotate(${hue}deg) brightness(0.7)` }}
                      />
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent opacity-100 group-hover:opacity-40 transition-opacity duration-300" />
                      
                      <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-cyan-950/80 backdrop-blur-sm border border-cyan-400/80 flex items-center justify-center shadow-[0_0_8px_rgba(34,211,238,0.6)] z-10 group-hover:opacity-0 transition-opacity duration-300">
                        <span className="text-[8px] font-bold text-cyan-400">{val % 1 !== 0 ? val.toFixed(1) : val}</span>
                      </div>

                      <div className="absolute inset-0 flex items-end justify-center p-2 z-10 pointer-events-none group-hover:opacity-0 transition-opacity duration-300">
                        <p className="text-white text-[9px] sm:text-[10px] font-bold text-center leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{d.name}</p>
                      </div>
                    </div>

                    {/* External Floating Tooltip (Blooms out from center, unconstrained by overflow) */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 sm:w-48 opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-110 z-[110]">
                      <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/20 p-4 rounded-xl shadow-[0_30px_60px_rgba(0,0,0,0.9)] flex flex-col gap-2">
                        <p className="text-white font-bold text-xs sm:text-sm leading-tight border-b border-white/20 pb-2 text-center drop-shadow-md">{d.name}</p>
                        
                        <div className="flex flex-col gap-1.5 w-full mt-1">
                          {yearsText && (
                            <div className="flex justify-between items-center text-[10px] sm:text-[11px]">
                              <span className="text-slate-400">Active</span>
                              <span className="text-cyan-300 font-mono tracking-tighter">{yearsText}</span>
                            </div>
                          )}
                          
                          {totalText && (
                            <div className="flex justify-between items-center text-[10px] sm:text-[11px]">
                              <span className="text-slate-400">Flights</span>
                              <span className="text-white font-bold">{d.total_flights}</span>
                            </div>
                          )}
                          
                          {d.failures !== undefined && (
                            <div className="flex justify-between items-center text-[10px] sm:text-[11px]">
                              <span className="text-slate-400">Failures</span>
                              <span className={d.failures === 0 ? "text-cyan-400 font-bold" : "text-red-400 font-bold"}>{d.failures}</span>
                            </div>
                          )}
                          
                          {d.primary_agency && (
                            <div className="flex justify-between items-center text-[10px] sm:text-[11px] gap-2">
                              <span className="text-slate-400">Agency</span>
                              <span className="text-white font-medium line-clamp-1 max-w-[70%] text-right">{d.primary_agency}</span>
                            </div>
                          )}

                          {d.primary_state && (
                            <div className="flex justify-between items-center text-[10px] sm:text-[11px]">
                              <span className="text-slate-400">Origin</span>
                              <span className="text-white font-medium">{d.primary_state}</span>
                            </div>
                          )}
                          
                          <div className="flex justify-between items-center text-[10px] sm:text-[11px] mt-1 border-t border-white/10 pt-1.5">
                            <span className="text-slate-400">Reliability</span>
                            <span className="text-emerald-400 font-bold font-mono">{val % 1 !== 0 ? val.toFixed(1) : val}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }
      case 'Badges': {
        const maxVal = Math.max(...chartData.map(d => d[seriesKeys[0]] || d.value || 0), 1);
        return (
          <div className="w-full h-full flex flex-col p-6 overflow-hidden min-h-[300px] space-y-5">
            {chartData.map((d, idx) => {
              const val = d[seriesKeys[0]] || d.value || 0;
              const widthPct = yAxis === 'success_rate' ? val : (val / maxVal) * 100;
              const suffix = yAxis === 'success_rate' ? '%' : (yAxis === 'count' ? ' Flights' : '');
              return (
                <div key={idx} className="w-full flex flex-col gap-2 group">
                  <div className="flex justify-between items-end w-full">
                    <span className="text-white text-sm font-semibold tracking-wide group-hover:text-fuchsia-400 transition-colors">{d.name}</span>
                    <span className="text-cyan-400 font-mono text-xs font-bold drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">
                      {val % 1 !== 0 ? val.toFixed(1) : val}{suffix}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden relative shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400 relative shadow-[0_0_10px_rgba(34,211,238,0.5)] transition-all duration-1000 ease-out"
                      style={{ width: `${widthPct}%` }}
                    >
                      <div className="absolute top-0 right-0 w-4 h-full bg-white/40 blur-[2px]" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      }
      case 'Waffle': {
        const total = data.length;
        const successesData = data.filter(d => d.is_success === 1 || d.is_success === true || d.success_status === 'O');
        const failuresData = data.filter(d => !(d.is_success === 1 || d.is_success === true || d.success_status === 'O'));
        const successes = successesData.length;
        const failures = failuresData.length;
        
        // Map actual records to dots for tooltips
        const dots = new Array(total).fill(null);
        let placed = 0;
        let idx = total > 0 ? (13 % total) : 0; 
        while (placed < failures && total > 0) {
          if (dots[idx] === null) {
            dots[idx] = { status: 'failure', record: failuresData[placed] };
            placed++;
          }
          idx = (idx + 37) % total; 
        }
        
        let successIdx = 0;
        for (let i = 0; i < total; i++) {
          if (dots[i] === null) {
            dots[i] = { status: 'success', record: successesData[successIdx++] };
          }
        }
        
        const cols = Math.ceil(Math.sqrt(total)) || 8;
        
        return (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 min-h-[250px] relative pb-8">
            <div 
              className="grid gap-1.5 justify-center mx-auto mb-10"
              style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
            >
              {dots.map((dot, idx) => (
                <div 
                  key={idx} 
                  className="w-3 h-3 rounded-full flex-shrink-0 relative group"
                  style={{
                    backgroundColor: dot.status === 'success' ? 'rgba(6, 182, 212, 0.4)' : '#F44336',
                    boxShadow: dot.status === 'success' ? 'none' : '0 0 10px rgba(244,67,54,0.8)'
                  }}
                >
                  {dot.status === 'failure' && dot.record && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] bg-space-900 border border-space-600 rounded-lg p-2.5 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] pointer-events-none">
                      <div className="text-white font-medium text-xs mb-1 truncate">{dot.record.mission}</div>
                      <div className="text-space-400 text-[10px]">Rocket: {dot.record.rocket_type}</div>
                      <div className="text-rose-400 text-[10px]">Failed in {dot.record.year}</div>
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-space-900 border-b border-r border-space-600 rotate-45"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-x-3 px-2 text-[10px] leading-tight">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: 'rgba(6, 182, 212, 0.4)' }}></div>
                <span className="text-slate-300">Success ({successes})</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#F44336', boxShadow: '0 0 10px rgba(244,67,54,0.8)' }}></div>
                <span className="text-slate-300">Anomaly ({failures})</span>
              </div>
            </div>
          </div>
        );
      }
      case 'Gauge': {
        const total = data.length;
        const successes = data.filter(d => d.is_success === 1 || d.is_success === true || d.success_status === 'O').length;
        const rate = total > 0 ? (successes === total ? 100 : parseFloat(((successes / total) * 100).toFixed(1))) : 0;
        const pieData = [
          { name: 'Success', value: rate, fill: rate === 100 ? '#22d3ee' : '#0ea5e9' },
          { name: 'Failure', value: 100 - rate, fill: 'rgba(255,255,255,0.03)' }
        ];
        return (
          <div className="w-full h-full flex flex-col items-center justify-center min-h-[300px] pb-4 relative group overflow-hidden">
            
            {/* Holographic glowing background orb */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 bg-cyan-500/5 rounded-full blur-[40px] group-hover:bg-cyan-500/10 transition-all duration-700 pointer-events-none" />

            <div className="relative z-10 flex items-center justify-center group-hover:scale-105 transition-transform duration-700 ease-out">
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[75px] leading-none font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                  {rate % 1 !== 0 ? rate.toFixed(1) : rate}%
                </span>
                <span className="text-[11px] text-cyan-400 uppercase tracking-[0.3em] font-bold mt-2 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">
                  Operational
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">
                  {successes} / {total} Flights
                </span>
              </div>
              <PieChart width={300} height={300}>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={128}
                  outerRadius={130}
                  startAngle={225}
                  endAngle={-45}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={10}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} style={{ filter: index === 0 ? `drop-shadow(0 0 8px ${entry.fill})` : 'none' }} />
                  ))}
                </Pie>
              </PieChart>
            </div>
          </div>
        );
      }
      case 'WaffleMatrix': {
        // WaffleMatrix: "Volume of Perfection". Plots EVERY SINGLE FLIGHT as a tiny glowing LED square.
        let allFlights = [];
        chartData.forEach(d => {
          const successes = d.total_flights - (d.failures || 0);
          for(let i=0; i<successes; i++) allFlights.push({ success: true, name: d.name });
          for(let i=0; i<(d.failures||0); i++) allFlights.push({ success: false, name: d.name });
        });
        
        return (
          <div className="w-full h-full flex flex-col p-4 overflow-y-auto overflow-x-hidden min-h-[300px] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
             <div className="flex flex-wrap gap-1.5 justify-center content-start flex-1">
               {allFlights.map((flight, i) => (
                  <div 
                    key={i}
                    className={`w-3 h-3 sm:w-4 sm:h-4 rounded-[2px] shadow-sm transition-all duration-300 hover:scale-150 cursor-crosshair group relative z-10 hover:z-[60] ${flight.success ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'}`}
                  >
                     <div className="absolute bottom-[150%] left-1/2 -translate-x-1/2 w-32 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity bg-slate-900/95 backdrop-blur-xl border border-white/20 p-2 rounded shadow-xl text-center z-50">
                        <p className="text-[10px] font-bold text-white leading-tight">{flight.name}</p>
                        <p className={`text-[9px] uppercase tracking-wider font-bold mt-1 ${flight.success ? 'text-cyan-400' : 'text-red-400'}`}>{flight.success ? 'Flawless' : 'Anomaly'}</p>
                     </div>
                  </div>
               ))}
             </div>
             
             <div className="mt-8 flex justify-center gap-6 text-[10px] tracking-widest uppercase font-bold text-slate-400 border-t border-white/10 pt-4 max-w-sm mx-auto">
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-[2px] bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]"></div>
                 <span>Successful Mission</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-[2px] bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                 <span>Anomaly</span>
               </div>
             </div>
          </div>
        );
      }

      case 'Monument': {
        // Monument: "Days Without Incident". Zero Anomalies. Massive typographic display.
        const total = chartData.reduce((sum, d) => sum + (d.total_flights || 0), 0);
        const failures = chartData.reduce((sum, d) => sum + (d.failures || 0), 0);
        
        const validMinYears = chartData.map(d => d.min_year).filter(y => y !== undefined && !isNaN(y));
        const validMaxYears = chartData.map(d => d.max_year).filter(y => y !== undefined && !isNaN(y));
        
        let span = 0;
        if (validMinYears.length > 0 && validMaxYears.length > 0) {
          const globalMin = Math.min(...validMinYears);
          const globalMax = Math.max(...validMaxYears);
          span = (globalMax - globalMin) + 1;
        }
        
        const hasAnomalies = failures > 0;
        const colorBg = hasAnomalies ? 'from-red-900/20' : 'from-emerald-900/20';
        const colorLine = hasAnomalies ? 'via-red-500 shadow-[0_0_15px_rgba(239,68,68,1)]' : 'via-emerald-500 shadow-[0_0_15px_rgba(16,185,129,1)]';
        const colorText = hasAnomalies ? 'text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.6)]' : 'text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]';

        // Extract specific failure records
        const failureEvents = data ? data.filter(d => !(d.is_success === 1 || d.is_success === true || d.success_status === 'O')) : [];

        return (
           <div className="w-full h-full flex flex-col items-center justify-center min-h-[250px] sm:min-h-[300px] relative p-4 sm:p-6 overflow-hidden group">
             <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] ${colorBg} via-slate-950/0 to-transparent pointer-events-none`} />
             
             <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-sm mx-auto">
                <div className="relative cursor-crosshair flex flex-col items-center w-full">
                  <h2 className="text-[80px] sm:text-[100px] font-display font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500 drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)] leading-none text-center">
                    {failures}
                  </h2>
                  <div className={`h-[2px] w-full max-w-[200px] bg-gradient-to-r from-transparent ${colorLine} to-transparent my-3 opacity-80`} />
                  <h3 className={`text-base sm:text-lg font-bold uppercase tracking-[0.2em] ${colorText} text-center transition-colors duration-500`}>
                    {hasAnomalies ? 'Anomalies Detected' : 'Flawless Record'}
                  </h3>
                </div>
                
                <div className="flex gap-4 sm:gap-8 mt-4 p-3 sm:p-4 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 w-full justify-center shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                  <div className="flex flex-col items-center">
                    <span className="text-white font-mono font-bold text-lg">{total}</span>
                    <span className="text-slate-500 text-[9px] uppercase tracking-widest mt-1 text-center">Total<br/>Missions</span>
                  </div>
                  <div className="w-[1px] h-full bg-white/10" />
                  <div className="flex flex-col items-center">
                    <span className="text-white font-mono font-bold text-lg">{span}</span>
                    <span className="text-slate-500 text-[9px] uppercase tracking-widest mt-1 text-center">Years<br/>Op. Span</span>
                  </div>
                </div>
             </div>
             
             {hasAnomalies && failureEvents.length > 0 && (
               <div className="absolute inset-0 w-full h-full overflow-y-auto p-4 sm:p-6 scrollbar-thin scrollbar-thumb-red-500/50 scrollbar-track-transparent opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[60] bg-slate-950/95 backdrop-blur-xl border border-red-500/40 flex flex-col gap-3">
                 <div className="sticky top-0 bg-slate-950/95 pb-2 mb-1 z-10 border-b border-red-500/20">
                   <p className="text-red-400 font-bold uppercase text-[11px] tracking-widest text-center">Incident Log</p>
                 </div>
                 {failureEvents.map((ev, i) => (
                   <div key={i} className="flex justify-between items-center bg-black/60 border border-fuchsia-500/30 rounded-lg p-3 text-xs hover:bg-fuchsia-900/40 transition-colors">
                     <div className="flex flex-col gap-1 text-left">
                       <span className="text-white font-bold tracking-wider text-[13px]">{ev.rocket_type}</span>
                       <span className="text-red-400/80 uppercase truncate max-w-[200px]">{ev.mission || 'Payload Data Unavailable'}</span>
                     </div>
                     <div className="flex flex-col items-end gap-1">
                       <span className="text-slate-400 font-mono">{ev.year}</span>
                       <span className="text-red-500 font-bold uppercase text-[10px]">{ev.success_status === 'P' ? 'Partial' : 'Failure'}</span>
                     </div>
                   </div>
                 ))}
               </div>
             )}
           </div>
        );
      }
      
      case 'Heatmap': {
        const heatmapData = [];
        chartData.forEach(d => {
          seriesKeys.forEach((key) => {
            heatmapData.push({ x: d.name, y: key, value: d[key] || 0 });
          });
        });

        const CustomHeatmapTooltip = ({ active, payload }) => {
          if (active && payload && payload.length) {
            const row = payload[0].payload;
            return (
              <div className="bg-slate-900/95 backdrop-blur-xl border border-white/20 p-3 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.7)] min-w-[150px] z-50">
                <p className="font-bold text-white text-xs leading-tight border-b border-white/10 pb-1.5 mb-2 text-center drop-shadow-md">
                  {row.y} <span className="text-slate-400 font-normal">| {row.x}</span>
                </p>
                <div className="flex justify-between items-center text-[10px] sm:text-[11px]">
                  <span className="text-slate-400">Failures</span>
                  <span className="text-red-400 font-bold font-mono">{row.value}</span>
                </div>
              </div>
            );
          }
          return null;
        };

        return (
          <ScatterChart {...commonProps} margin={{ top: 20, right: 30, left: 40, bottom: 20 }}>
            <XAxis dataKey="x" type="category" stroke="rgba(255,255,255,0.1)" tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 11}} angle={-45} textAnchor="end" height={60} tickLine={false} />
            <YAxis dataKey="y" type="category" stroke="rgba(255,255,255,0.1)" tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 11}} tickLine={false} />
            <RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} content={<CustomHeatmapTooltip />} wrapperStyle={{ zIndex: 1000 }} />
            <Scatter data={heatmapData} shape={(props) => {
              const { cx, cy, payload } = props;
              const hasFailure = payload.value > 0;
              const fill = hasFailure ? '#F44336' : 'rgba(255,255,255,0.03)';
              const stroke = hasFailure ? '#F44336' : 'rgba(255,255,255,0.05)';
              const glow = hasFailure ? 'drop-shadow(0 0 10px rgba(244,67,54,0.8))' : 'none';
              return (
                <rect x={cx - 12} y={cy - 12} width={24} height={24} fill={fill} stroke={stroke} style={{ filter: glow, rx: 4, ry: 4, transition: 'all 0.3s ease' }} />
              );
            }} />
          </ScatterChart>
        );
      }
      case 'Line': return <LineChart {...commonProps}>{commonElements}{generateSeries(Line)}</LineChart>;
      case 'Bubble': return <LineChart {...commonProps}>{commonElements}{generateSeries(Line, false, false, true)}</LineChart>;
      case 'Area':
      case 'StackedArea': return <AreaChart {...commonProps}>{commonElements}{generateSeries(Area, true)}</AreaChart>;
      case 'StepLine':
        return (
          <AreaChart {...commonProps}>
            {commonElements}
            {seriesKeys.map((key, idx) => (
              <Area 
                key={key} 
                type="step" 
                dataKey={key} 
                stroke={SERIES_COLORS[idx % SERIES_COLORS.length]} 
                fill={SERIES_COLORS[idx % SERIES_COLORS.length]}
                fillOpacity={0.2}
                strokeWidth={2}
                dot={{ r: 2, fill: SERIES_COLORS[idx % SERIES_COLORS.length], strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                connectNulls={true}
              />
            ))}
          </AreaChart>
        );
      case 'Scatter':
        // Fake a scatter chart using LineChart without connecting lines for strict categorical axis support
        return (
          <LineChart {...commonProps}>
            {commonElements}
            {seriesKeys.map((key, idx) => (
              <Line 
                key={key} 
                type="monotone" 
                name={key === 'value' ? yAxis : key} 
                dataKey={key} 
                stroke={SERIES_COLORS[idx % SERIES_COLORS.length]} 
                strokeWidth={0} 
                dot={{ r: 5, fill: SERIES_COLORS[idx % SERIES_COLORS.length] }} 
                activeDot={{ r: 8 }} 
                connectNulls={true}
              />
            ))}
          </LineChart>
        );
      case 'Pie': {
        const pieDataKey = seriesKeys[0] || "value";
        // Filter out zero-value slices to prevent paddingAngle from accumulating empty gaps
        const pieData = chartData.filter(d => d[pieDataKey] && d[pieDataKey] > 0);
        
        return (
          <PieChart {...commonProps}>
            <RechartsTooltip 
              contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', borderColor: 'rgba(255,255,255,0.1)' }} 
              itemStyle={{ color: '#fff' }} 
              formatter={(value, name) => [value, COUNTRY_MAP[name] || name]}
            />
            <Legend 
              content={(props) => {
                const { payload } = props;
                return (
                  <ul className="flex flex-wrap justify-center gap-x-2 gap-y-1 mt-2 px-2 text-[10px] leading-tight">
                    {payload.map((entry, index) => {
                      const name = COUNTRY_MAP[entry.value] || entry.value;
                      return (
                        <li key={`item-${index}`} className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                          <span className="text-slate-300 truncate max-w-[80px]" title={name}>{name}</span>
                        </li>
                      );
                    })}
                  </ul>
                );
              }}
            />
            <Pie 
              data={pieData} 
              dataKey={pieDataKey} 
              nameKey="name" 
              cx="50%" 
              cy="45%" 
              outerRadius={85} 
              innerRadius={45}
              paddingAngle={2}
              stroke="none"
            >
              {pieData.map((entry, idx) => {
                // To keep color consistency with original data, map back to original index
                const origIdx = chartData.findIndex(d => d.name === entry.name);
                const colorIdx = origIdx >= 0 ? origIdx : idx;
                return <Cell key={`cell-${idx}`} fill={SERIES_COLORS[colorIdx % SERIES_COLORS.length]} />;
              })}
            </Pie>
          </PieChart>
        );
      }
      case 'DynamicBar': {
        const CustomDynamicBar = (props) => {
          const { x, y, width, height, payload } = props;
          if (!payload || !payload.max_value) return null;
          
          const activeKeys = seriesKeys.filter(k => payload[k] > 0);
          if (activeKeys.length === 0) return null;
          
          const ratio = height / payload.max_value;
          const actualBarWidth = Math.min(24, (width / activeKeys.length) * 0.7);
          const gap = 4;
          const totalBarsWidth = (activeKeys.length * actualBarWidth) + ((activeKeys.length - 1) * gap);
          const startX = x + (width - totalBarsWidth) / 2;
          
          return (
            <g>
              {activeKeys.map((k, idx) => {
                const val = payload[k];
                const barHeight = val * ratio;
                const barY = (y + height) - barHeight;
                const barX = startX + (idx * (actualBarWidth + gap));
                const colorIdx = seriesKeys.indexOf(k);
                const color = SERIES_COLORS[colorIdx % SERIES_COLORS.length];
                
                return (
                  <rect 
                    key={k} 
                    x={barX} 
                    y={barY} 
                    width={actualBarWidth} 
                    height={barHeight} 
                    fill={color} 
                    rx={2}
                    ry={2}
                  />
                );
              })}
            </g>
          );
        };
        
        const DynamicTooltip = ({ active, payload, label }) => {
          if (active && payload && payload.length) {
            const raw = payload[0].payload;
            const activeKeys = seriesKeys.filter(k => raw[k] > 0);
            return (
              <div className="bg-slate-900/95 backdrop-blur-xl border border-white/20 p-3 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.7)] min-w-[160px] sm:min-w-[200px] z-50">
                <p className="font-bold text-white text-xs leading-tight border-b border-white/10 pb-1.5 mb-2 text-center drop-shadow-md">
                  {COUNTRY_MAP[label] || label}
                </p>
                <div className="flex flex-col gap-1.5 w-full">
                  {activeKeys.sort((a,b) => raw[b] - raw[a]).map((k) => {
                    const colorIdx = seriesKeys.indexOf(k);
                    const color = SERIES_COLORS[colorIdx % SERIES_COLORS.length];
                    return (
                      <div key={k} className="flex justify-between items-center text-[10px] sm:text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: color, color: color }} />
                          <span className="text-slate-400 capitalize">{COUNTRY_MAP[k] || k}</span>
                        </div>
                        <span className="font-bold text-white ml-4 font-mono">{raw[k]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }
          return null;
        };

        return (
          <BarChart {...commonProps} barCategoryGap="10%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.1)" tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 500}} angle={-45} textAnchor="end" height={60} tickLine={false} />
            <YAxis stroke="rgba(255,255,255,0.1)" tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 11}} tickLine={false} tickFormatter={(val) => Number.isInteger(val) ? val : ''} />
            <RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} content={<DynamicTooltip />} wrapperStyle={{ zIndex: 1000 }} />
            <Bar dataKey="max_value" shape={<CustomDynamicBar />} />
          </BarChart>
        );
      }
      case 'Bar': return <BarChart {...commonProps} barGap={1} barCategoryGap="5%">{commonElements}{generateSeries(Bar)}</BarChart>;
      case 'StackedBar': return <BarChart {...commonProps} barCategoryGap="20%">{commonElements}{generateSeries(Bar)}</BarChart>;
      case 'RadialBar': {
        const radialData = chartData.map((entry, index) => ({
          ...entry,
          fill: SERIES_COLORS[index % SERIES_COLORS.length]
        }));
        
        const RadialTooltip = ({ active, payload }) => {
          if (active && payload && payload.length) {
            const data = payload[0].payload;
            const name = COUNTRY_MAP[data.name] || data.name;
            return (
              <div className="bg-slate-900/95 border border-white/10 rounded-xl p-4 shadow-2xl backdrop-blur-md min-w-[200px]">
                <div className="flex items-center gap-3 mb-2 pb-2 border-b border-white/5">
                   <div className="w-3.5 h-3.5 rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: data.fill, color: data.fill }} />
                   <span className="font-bold text-white text-base tracking-wide">{name}</span>
                </div>
                <div className="flex flex-col pl-6">
                   <div className="text-slate-200">
                     <span className="font-bold text-emerald-400 text-xl mr-1">{data.value}%</span> 
                     <span className="text-sm font-medium">Success Rate</span>
                   </div>
                   {data.total > 0 && (
                     <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-semibold">
                       ({data.successes} successful / {data.total} flights)
                     </div>
                   )}
                </div>
              </div>
            );
          }
          return null;
        };

        return (
          <RadialBarChart {...commonProps} cx="35%" cy="50%" innerRadius="25%" outerRadius="90%" barSize={20} data={radialData}>
            <RadialBar
              minAngle={15}
              background={{ fill: 'rgba(255,255,255,0.05)' }}
              clockWise
              dataKey={seriesKeys[0] || 'value'}
              cornerRadius={10}
            />
            <RechartsTooltip content={<RadialTooltip />} cursor={{ fill: 'transparent' }} />
            <Legend iconSize={12} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ right: 10, color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: '500' }} />
          </RadialBarChart>
        );
      }
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-white/[0.02] rounded-xl p-4 border border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.02)] relative z-10 hover:z-50 transition-all duration-300">
      {title && <h4 className="text-sm font-semibold text-white mb-4 text-center tracking-wide">{title}</h4>}
      <div className="flex-1 w-full min-h-[300px] relative flex flex-col">
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {['Gauge', 'Waffle', 'Badges', 'PosterBadges', 'BubbleTimeline', 'WaffleMatrix', 'Monument'].includes(chartType) ? (
            renderChartBody()
          ) : (
            <div style={{ 
              width: (['Pie', 'RadialBar', 'Scatter'].includes(chartType) || chartData.length > 5) ? '100%' : (chartData.length <= 2 ? '400px' : '700px'), 
              height: '100%', 
              maxWidth: '100%' 
            }}>
              <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                {renderChartBody()}
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

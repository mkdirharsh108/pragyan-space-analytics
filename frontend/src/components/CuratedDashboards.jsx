import { useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard } from 'lucide-react';
import ChartRenderer from './ChartRenderer';
import AISummaryWidget from './AISummaryWidget';

const PRESETS = [
  { 
    id: 2, title: 'The Golden Age', icon: '🔥', 
    description: 'The terrifying, golden age of spaceflight. Witness the explosion of launch cadence as the US and USSR threw everything they had into orbit. Characterized by incredibly rapid iteration and explosive testing.',
    filter: d => parseInt(d.year) >= 1957 && parseInt(d.year) <= 1969,
    charts: [
      { title: 'Cold War Output (Volume)', config: { chartType: 'StackedArea', xAxis: 'year', yAxis: 'count', splitBy: 'state_code', limit: 'all' } },
      { title: 'Catastrophes Timeline', config: { chartType: 'Scatter', xAxis: 'year', yAxis: 'failures', splitBy: 'state_code', limit: 'all' } },
      { title: 'The 60s Workhorses', config: { chartType: 'StackedBar', xAxis: 'rocket_type', yAxis: 'count', splitBy: 'none', limit: '10' } },
      { title: 'Payload Status Distribution', config: { chartType: 'Pie', xAxis: 'success_status', yAxis: 'count', splitBy: 'none', limit: 'all' } }
    ]
  },
  {
    id: 15, title: 'Post-Apollo Era', icon: '🕰️',
    description: 'After the Space Race ended, the US scaled back while the Soviet Union built an orbital industrial complex. Witness the era of Salyut, Mir, and the Space Shuttle.',
    filter: d => parseInt(d.year) >= 1975 && parseInt(d.year) <= 1990,
    charts: [
      { title: 'Soviet Dominance (Volume)', config: { chartType: 'StackedArea', xAxis: 'year', yAxis: 'count', splitBy: 'state_code', limit: 'all' } },
      { title: 'Cold War Output Comparison', config: { chartType: 'Pie', xAxis: 'state_code', yAxis: 'count', splitBy: 'none', limit: 'all' } },
      { title: 'Most Active Vehicles of the Era', config: { chartType: 'Bar', xAxis: 'rocket_type', yAxis: 'count', splitBy: 'none', limit: '10' } },
      { title: 'Catastrophes during the Lull', config: { chartType: 'Scatter', xAxis: 'year', yAxis: 'failures', splitBy: 'state_code', limit: 'all' } }
    ]
  },
  { 
    id: 6, title: 'Soviet Steel', icon: '🪆', 
    description: 'The R-7 Soyuz family is the most frequently launched, historically significant rocket architecture in human history. Behold the sheer brute-force scale of Russian engineering over half a century.',
    filter: d => d.rocket_type && (d.rocket_type.toLowerCase().includes('soyuz') || d.rocket_type.toLowerCase().includes('molniya') || d.rocket_type.toLowerCase().includes('vostok') || d.rocket_type.toLowerCase().includes('proton')),
    charts: [
      { title: 'Half a Century of Flight', config: { chartType: 'Area', xAxis: 'year', yAxis: 'count', splitBy: 'none', limit: 'all' } },
      { title: 'The Sub-variants', config: { chartType: 'StackedBar', xAxis: 'rocket_type', yAxis: 'count', splitBy: 'success_status', limit: '12' } },
      { title: 'Operations Timeline', config: { chartType: 'StackedArea', xAxis: 'year', yAxis: 'count', splitBy: 'rocket_type', limit: '5' } },
      { title: 'Failures by Variant', config: { chartType: 'Pie', xAxis: 'rocket_type', yAxis: 'failures', splitBy: 'none', limit: '10' } }
    ]
  },
  { 
    id: 11, title: 'The Heavyweights', icon: '🏋️', 
    description: 'The absolute limits of human engineering. Tracking the incredibly rare, terrifyingly powerful super heavy-lift launch vehicles capable of sending humanity to the Moon and beyond.',
    filter: d => d.rocket_type && (d.rocket_type.toLowerCase().includes('saturn') || d.rocket_type.toLowerCase().includes('falcon heavy') || d.rocket_type.toLowerCase().includes('starship') || d.rocket_type.toLowerCase().includes('sls') || d.rocket_type.toLowerCase().includes('energia') || d.rocket_type.toLowerCase().includes('n1') || d.rocket_type.toLowerCase().includes('delta iv heavy')),
    charts: [
      { title: 'Super-Heavy Flights over Time', config: { chartType: 'StackedBar', xAxis: 'year', yAxis: 'count', splitBy: 'rocket_type', limit: 'all' } },
      { title: 'Payload Volume', config: { chartType: 'Pie', xAxis: 'rocket_type', yAxis: 'count', splitBy: 'none', limit: 'all' } },
      { title: 'Heavy-Lifter Success Rates', config: { chartType: 'Bar', xAxis: 'rocket_type', yAxis: 'success_rate', splitBy: 'none', limit: 'all' } },
      { title: 'The Modern Era of Heavies', config: { chartType: 'Area', xAxis: 'year', yAxis: 'count', splitBy: 'dashboard_agency', limit: 'all' } }
    ]
  },
  { 
    id: 12, title: 'European Ascent', icon: '🇪🇺', 
    description: 'Europe\'s independent access to space. Tracing the legacy of the Ariane program, the dominating force of commercial satellite launches in the 90s and 2000s.',
    filter: d => d.dashboard_agency === 'Arianespace' || d.dashboard_agency === 'ESA',
    transform: data => data.map(d => {
      let fam = d.rocket_type || '';
      if (fam.includes('Ariane 1')) fam = 'Ariane 1';
      else if (fam.includes('Ariane 2')) fam = 'Ariane 2';
      else if (fam.includes('Ariane 3')) fam = 'Ariane 3';
      else if (fam.includes('Ariane 4')) fam = 'Ariane 4';
      else if (fam.includes('Ariane 5')) fam = 'Ariane 5';
      else if (fam.includes('Ariane 6')) fam = 'Ariane 6';
      else if (fam.includes('Vega')) fam = 'Vega';
      return { ...d, rocket_family: fam };
    }),
    charts: [
      { title: 'European Launch Volume', config: { chartType: 'StackedArea', xAxis: 'year', yAxis: 'count', splitBy: 'rocket_type', limit: '5' } },
      { title: 'Ariane vs Vega Deployments', config: { chartType: 'Pie', xAxis: 'rocket_family', yAxis: 'count', splitBy: 'none', limit: 'all' } },
      { title: 'Reliability over Time', config: { chartType: 'Line', xAxis: 'year', yAxis: 'success_rate', splitBy: 'none', limit: 'all' } },
      { title: 'Payload Status Distribution', config: { chartType: 'Bar', xAxis: 'success_status', yAxis: 'count', splitBy: 'none', limit: 'all' } }
    ]
  },
  {
    id: 16, title: "India's Workhorse", icon: '🚀',
    description: "The Polar Satellite Launch Vehicle (PSLV) is one of the most reliable medium-lift rockets in the world. Explore the incredible track record of India's workhorse and its variants.",
    filter: d => d.rocket_type && d.rocket_type.toUpperCase().includes('PSLV'),
    charts: [
      { title: 'PSLV Flight Heritage', config: { chartType: 'Area', xAxis: 'year', yAxis: 'count', splitBy: 'rocket_type', limit: 'all' } },
      { title: 'Total Flights by Variant', config: { chartType: 'Pie', xAxis: 'rocket_type', yAxis: 'count', splitBy: 'none', limit: 'all' } },
      { title: 'Success Rate', config: { chartType: 'Gauge', xAxis: 'none', yAxis: 'success_rate', splitBy: 'none', limit: 'all' } },
      { title: 'Launch Anomalies', config: { chartType: 'Waffle', xAxis: 'none', yAxis: 'failures', splitBy: 'none', limit: 'all' } }
    ]
  },
  { 
    id: 13, title: 'The ULA Monopoly', icon: '🏛️', 
    description: 'United Launch Alliance (ULA) was formed by Boeing and Lockheed Martin to secure US government launches. Track the dominance of the Atlas and Delta families before the commercial space boom.',
    filter: d => d.dashboard_agency === 'ULA' || d.dashboard_agency === 'Boeing' || d.dashboard_agency === 'Lockheed Martin',
    charts: [
      { title: 'Atlas vs Delta Utilization', config: { chartType: 'StackedBar', xAxis: 'year', yAxis: 'count', splitBy: 'rocket_type', limit: '15' } },
      { title: 'Total Payload Volume', config: { chartType: 'Pie', xAxis: 'rocket_type', yAxis: 'count', splitBy: 'none', limit: '10' } },
      { title: 'Missions Flown (Leaderboard)', config: { chartType: 'Badges', xAxis: 'rocket_type', yAxis: 'count', splitBy: 'none', limit: '6' } },
      { title: 'Fleet Operational Reliability', config: { chartType: 'Gauge', xAxis: 'none', yAxis: 'success_rate', splitBy: 'none', limit: 'all' } }
    ]
  },
  {
    id: 10, title: 'The Modern Cold War', icon: '⚔️',
    description: 'A direct, head-to-head comparison of the two modern superpowers dominating the 21st-century launch landscape. US commercial might vs Chinese state infrastructure.',
    filter: d => parseInt(d.year) >= 2000 && (d.state_code === 'US' || d.state_code === 'CN'),
    charts: [
      { title: 'The Modern Space Race (Volume)', config: { chartType: 'Area', xAxis: 'year', yAxis: 'count', splitBy: 'state_code', limit: 'all' } },
      { title: 'Output Trajectories', config: { chartType: 'StackedArea', xAxis: 'year', yAxis: 'count', splitBy: 'state_code', limit: '5' } },
      { title: 'Total Payload Volume 2000+', config: { chartType: 'Pie', xAxis: 'state_code', yAxis: 'count', splitBy: 'none', limit: 'all' } },
      { title: 'Top Rockets of the Superpowers', config: { chartType: 'StackedBar', xAxis: 'rocket_type', yAxis: 'count', splitBy: 'state_code', limit: '10' } }
    ]
  },
  {
    id: 17, title: 'Next-Gen ISRO', icon: '🚀',
    description: 'Tracing India\'s rapidly maturing space capabilities and the transition from the legacy PSLV to next-gen launch vehicles like the heavy-lift LVM3 and SSLV micro-launcher.',
    filter: d => d.state_code === 'IN' && parseInt(d.year) >= 2014,
    charts: [
      { title: 'Next-Gen Rollout', config: { chartType: 'StackedBar', xAxis: 'year', yAxis: 'count', splitBy: 'rocket_type', limit: 'all' } },
      { title: 'Vehicle Output Comparison', config: { chartType: 'Bar', xAxis: 'rocket_type', yAxis: 'count', splitBy: 'none', limit: 'all' } },
      { title: 'Anomalies in Development', config: { chartType: 'Pie', xAxis: 'rocket_type', yAxis: 'failures', splitBy: 'none', limit: 'all' } },
      { title: 'Overall Reliability', config: { chartType: 'Area', xAxis: 'year', yAxis: 'success_rate', splitBy: 'none', limit: 'all' } }
    ]
  },
  { 
    id: 5, title: 'The SpaceX Era', icon: '🐉', 
    description: 'Focusing entirely on the post-2015 landscape where the Falcon 9 broke the launch market. Observe how SpaceX established a new era of dominance in orbital mass.',
    filter: d => parseInt(d.year) >= 2015,
    charts: [
      { title: 'The SpaceX Spike (Volume)', config: { chartType: 'Area', xAxis: 'year', yAxis: 'count', splitBy: 'none', limit: 'all', filters: [{key: 'dashboard_agency', value: 'SpaceX'}] } },
      { title: 'Global Output (2015+)', config: { chartType: 'Pie', xAxis: 'dashboard_agency', yAxis: 'count', splitBy: 'none', limit: '10' } },
      { title: 'Most Active Vehicles of the Era', config: { chartType: 'Bar', xAxis: 'rocket_type', yAxis: 'count', splitBy: 'none', limit: '10' } },
      { title: 'The Global Success Rate', config: { chartType: 'RadialBar', xAxis: 'dashboard_agency', yAxis: 'success_rate', splitBy: 'none', limit: '5' } }
    ]
  },
  { 
    id: 14, title: 'The Electron Story', icon: '⚡', 
    description: 'The definitive story of the Electron rocket. How Rocket Lab emerged from New Zealand to become the undisputed leader of dedicated small-satellite launches.',
    filter: d => d.dashboard_agency === 'Rocket Lab',
    charts: [
      { title: 'Exponential Output', config: { chartType: 'Area', xAxis: 'year', yAxis: 'count', splitBy: 'none', limit: 'all' } },
      { title: 'Electron Success vs Failure', config: { chartType: 'Pie', xAxis: 'success_status', yAxis: 'count', splitBy: 'none', limit: 'all' } },
      { title: 'Learning Curve (Anomalies)', config: { chartType: 'Monument', xAxis: 'year', yAxis: 'failures', splitBy: 'none', limit: 'all' } },
      { title: 'Reliability Trend', config: { chartType: 'Line', xAxis: 'year', yAxis: 'success_rate', splitBy: 'none', limit: 'all' } }
    ]
  },
  { 
    id: 4, title: 'The Micro-Launchers', icon: '🛰️', 
    description: 'The explosive rise of micro-launchers. Watch how startups like Rocket Lab, Astra, and Firefly are attempting to democratize access to Low Earth Orbit with rapid, cheap, and expendable rockets.',
    filter: d => d.rocket_type && (d.rocket_type.toLowerCase().includes('electron') || d.rocket_type.toLowerCase().includes('launcherone') || d.rocket_type.toLowerCase().includes('astra') || d.rocket_type.toLowerCase().includes('firefly') || d.rocket_type.toLowerCase().includes('ss-520')),
    charts: [
      { title: 'The Swarm Growth', config: { chartType: 'StackedArea', xAxis: 'year', yAxis: 'count', splitBy: 'dashboard_agency', limit: '5' } },
      { title: 'Startup Vehicle Diversification', config: { chartType: 'StackedBar', xAxis: 'dashboard_agency', yAxis: 'count', splitBy: 'rocket_type', limit: 'all' } },
      { title: 'Total Flights Logged', config: { chartType: 'Pie', xAxis: 'dashboard_agency', yAxis: 'count', splitBy: 'none', limit: 'all' } },
      { title: 'Anomalies in Development', config: { chartType: 'DynamicBar', xAxis: 'year', yAxis: 'failures', splitBy: 'dashboard_agency', limit: 'all' } }
    ]
  },
  {
    id: 8, title: 'Graveyard Orbit', icon: '💥',
    description: 'Space is unforgiving. A dark, aesthetic look at catastrophic failures, launchpad explosions, and anomalies across the history of spaceflight.',
    filter: d => d.is_success === 0 || d.is_success === false || d.success_status === 'F' || d.success_status === 'P' || d.success_status === 'S',
    charts: [
      { title: 'A History of Failure (Volume)', config: { chartType: 'StackedBar', xAxis: 'year', yAxis: 'failures', splitBy: 'state_code', limit: 'all' } },
      { title: 'Vehicles with Highest Anomalies', config: { chartType: 'Bar', xAxis: 'rocket_type', yAxis: 'failures', splitBy: 'none', limit: '15' } },
      { title: 'Catastrophes by Agency', config: { chartType: 'Pie', xAxis: 'dashboard_agency', yAxis: 'failures', splitBy: 'none', limit: '10' } },
      { title: 'Detailed Status Codes Over Time', config: { chartType: 'StackedArea', xAxis: 'year', yAxis: 'count', splitBy: 'success_status', limit: 'all' } }
    ]
  }
];

export default function CuratedDashboards({ allData, loading }) {
  const [activePresetId, setActivePresetId] = useState(PRESETS[0].id); // Default to first preset

  if (loading) return <div className="w-full text-center text-slate-400 p-8">Loading Curated Dashboards...</div>;

  const activePreset = PRESETS.find(p => p.id === activePresetId);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex h-[800px] gap-6">
      
      {/* LEFT SIDEBAR */}
      <div className="glass-panel p-6 border border-white/10 w-80 flex-shrink-0 flex flex-col">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
          <LayoutDashboard className="w-6 h-6 text-emerald-400" />
          <h2 className="text-xl font-display font-semibold text-white">Curated Boards</h2>
        </div>

        {/* Dashboards Vertical List */}
        <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar flex-1 pr-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => setActivePresetId(preset.id)}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
                activePresetId === preset.id 
                  ? 'bg-white/20 text-white border border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.1)]' 
                  : 'bg-white/5 text-slate-300 border border-white/10 hover:border-white/30 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="text-xl">{preset.icon}</span>
              <span className="truncate">{preset.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT MAIN AREA */}
      <div id="curated-dashboard-container" className="glass-card p-8 flex-1 flex flex-col overflow-y-auto custom-scrollbar relative">
        <div className="mb-8 pb-4 border-b border-white/10 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{activePreset.icon}</span>
              <h3 className="text-2xl font-bold font-display text-white">
                {activePreset.title}
              </h3>
            </div>
            {activePreset.description && (
              <p className="text-slate-300 text-sm leading-relaxed max-w-4xl">
                {activePreset.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <AISummaryWidget title={activePreset.title} chartData={null} config={null} />
          </div>
        </div>
        
        {/* Multi-Chart Grid for Preset */}
        <div className={`grid grid-cols-1 ${activePreset.charts.length === 4 ? 'xl:grid-cols-3' : activePreset.charts.length > 1 ? 'xl:grid-cols-2 2xl:grid-cols-3' : ''} gap-6 w-full`}>
          {activePreset.charts.map((c, idx) => {
            let filteredData = activePreset.filter ? allData.filter(activePreset.filter) : allData;
            if (activePreset.transform) filteredData = activePreset.transform(filteredData);
            
            // Bento Box Layout Logic
            const isHero = activePreset.charts.length === 4 && idx === 0;
            const containerClass = isHero ? "xl:col-span-3 h-[500px]" : "h-[400px]";

            return (
              <div key={idx} className={`${containerClass} w-full`}>
                <ChartRenderer 
                  data={filteredData} 
                  config={c.config} 
                  title={c.title} 
                />
              </div>
            );
          })}
        </div>
      </div>

    </motion.div>
  );
}

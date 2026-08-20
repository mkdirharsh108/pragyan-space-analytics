import { useState } from 'react';
import { motion } from 'framer-motion';
import rocketSpecs from '../data/rocketSpecs.json';
import { Rocket } from 'lucide-react';

const MAX_HEIGHT = 130;
const MAX_THRUST = 75000;
const MAX_PAYLOAD = 160000;
const MAX_COST = 2500;

// Dynamic Data Max Limits
const MAX_FLIGHTS = 2000;
const MAX_SUCCESS = 100;
const MAX_LIFTED = 15000000;

export default function RocketGarage({ allData = [] }) {
  const [rocket1, setRocket1] = useState(null);
  const [rocket2, setRocket2] = useState(null);

  const getRocketStats = (rocket) => {
    if (!rocket) return { totalFlights: 0, successRate: 0, totalMassLifted: 0 };
    if (!allData || allData.length === 0) return { totalFlights: 0, successRate: 0, totalMassLifted: 0 };
    
    let matchStr = rocket.name.toLowerCase();
    if (matchStr === 'long march 5') matchStr = 'chang zheng 5';
    if (matchStr.includes('lvm3')) matchStr = 'lvm3';
    
    const flights = allData.filter(d => d.rocket_type && d.rocket_type.toLowerCase().includes(matchStr));
    const totalFlights = flights.length;
    const successes = flights.filter(d => d.is_success === 1).length;
    const successRate = totalFlights > 0 ? Math.round((successes / totalFlights) * 100) : 0;
    const totalMassLifted = totalFlights * (rocket.payload_leo_kg || 0);

    return { totalFlights, successRate, totalMassLifted };
  };

  const stats1 = getRocketStats(rocket1);
  const stats2 = getRocketStats(rocket2);

  const renderProgress = (val1, val2, max, label, unit, higherIsBetter = true) => {
    const pct1 = Math.min((val1 / max) * 100, 100);
    const pct2 = Math.min((val2 / max) * 100, 100);
    
    // Determine which is "winning"
    const r1Wins = higherIsBetter ? val1 > val2 : val1 < val2;
    const r2Wins = higherIsBetter ? val2 > val1 : val2 < val1;

    return (
      <div className="mb-6">
        <div className="flex justify-between text-xs font-semibold text-space-400 uppercase tracking-wider mb-2">
          <span>{val1.toLocaleString()} {unit}</span>
          <span>{label}</span>
          <span>{val2.toLocaleString()} {unit}</span>
        </div>
        <div className="flex gap-4 items-center">
          {/* Rocket 1 Bar (grows right to left) */}
          <div className="flex-1 bg-white/5 h-3 rounded-full overflow-hidden flex justify-end">
            <motion.div 
              initial={{ width: 0 }} 
              animate={{ width: `${pct1}%` }} 
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-full rounded-full ${r1Wins ? 'bg-agency-nasa' : 'bg-white/20'}`}
            />
          </div>
          <div className="w-1 h-3 bg-white/20 rounded-full" />
          {/* Rocket 2 Bar (grows left to right) */}
          <div className="flex-1 bg-white/5 h-3 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }} 
              animate={{ width: `${pct2}%` }} 
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-full rounded-full ${r2Wins ? 'bg-agency-spacex' : 'bg-white/20'}`}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="glass-card p-6 border border-agency-nasa/30">
      <div className="flex items-center gap-3 mb-8">
        <Rocket className="w-6 h-6 text-agency-nasa" />
        <h2 className="text-xl font-display font-semibold text-white">The Rocket Garage</h2>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Rocket 1 Selection */}
        <div className="flex-1">
          <select 
            value={rocket1?.id || ""}
            onChange={(e) => setRocket1(rocketSpecs.find(r => r.id === e.target.value) || null)}
            className="w-full glass-panel border border-space-600 rounded-lg p-3 text-white focus:outline-none focus:border-agency-nasa mb-4 font-display text-lg"
          >
            <option value="" disabled className="bg-slate-900 text-white">Select Vehicle 1...</option>
            {rocketSpecs.map(r => <option key={r.id} value={r.id} className="bg-slate-900 text-white">{r.name} ({r.agency})</option>)}
          </select>
          <p className="text-sm text-space-300 h-16">{rocket1 ? rocket1.description : "Select a vehicle to load its telemetry and historical data."}</p>
        </div>

        {/* Center VS */}
        <div className="flex items-center justify-center">
          <div className="w-12 h-12 rounded-full glass-panel flex items-center justify-center font-display font-bold text-slate-300">
            VS
          </div>
        </div>

        {/* Rocket 2 Selection */}
        <div className="flex-1">
          <select 
            value={rocket2?.id || ""}
            onChange={(e) => setRocket2(rocketSpecs.find(r => r.id === e.target.value) || null)}
            className="w-full glass-panel border border-space-600 rounded-lg p-3 text-white focus:outline-none focus:border-agency-spacex mb-4 font-display text-lg"
          >
            <option value="" disabled className="bg-slate-900 text-white">Select Vehicle 2...</option>
            {rocketSpecs.map(r => <option key={r.id} value={r.id} className="bg-slate-900 text-white">{r.name} ({r.agency})</option>)}
          </select>
          <p className="text-sm text-space-300 h-16 text-right">{rocket2 ? rocket2.description : "Select a second vehicle to compare specifications."}</p>
        </div>
      </div>

      <div className="mt-8 bg-black/20 rounded-xl p-8 border border-white/10">
        <h3 className="text-space-300 font-semibold mb-6 uppercase tracking-wider text-sm border-b border-white/10 pb-2">Hardware Specifications</h3>
        {renderProgress(rocket1?.height_m || 0, rocket2?.height_m || 0, MAX_HEIGHT, "Height", "m")}
        {renderProgress(rocket1?.payload_leo_kg || 0, rocket2?.payload_leo_kg || 0, MAX_PAYLOAD, "Payload to LEO", "kg")}
        {renderProgress(rocket1?.thrust_kn || 0, rocket2?.thrust_kn || 0, MAX_THRUST, "Thrust", "kN")}
        {renderProgress(rocket1?.cost_per_launch_m || 0, rocket2?.cost_per_launch_m || 0, MAX_COST, "Cost per Launch", "$M", false)}

        <h3 className="text-space-300 font-semibold mt-10 mb-6 uppercase tracking-wider text-sm border-b border-white/10 pb-2">Historical Flight Data</h3>
        {renderProgress(stats1.totalFlights, stats2.totalFlights, MAX_FLIGHTS, "Total Historical Flights", "launches")}
        {renderProgress(stats1.successRate, stats2.successRate, MAX_SUCCESS, "Mission Success Rate", "%")}
        {renderProgress(stats1.totalMassLifted, stats2.totalMassLifted, MAX_LIFTED, "Est. Total Mass Lifted", "kg")}
      </div>
    </div>
  );
}

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { motion } from 'framer-motion';

const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-space-900 border border-space-600 p-3 rounded-lg shadow-xl max-w-xs">
        <p className="font-semibold text-white mb-1" style={{ color: payload[0].fill }}>{data.name || data.agency}</p>
        <p className="text-space-400 text-sm mb-2">Total Volume: <span className="text-white font-medium">{data.value || data.total_launches}</span></p>
        {data.desc && <p className="text-xs text-slate-300 italic">"{data.desc}"</p>}
        {!data.desc && data.agency && <p className="text-xs text-slate-300 italic">"Historical orbital launch vehicle data for {data.agency}."</p>}
      </div>
    );
  }
  return null;
};

export default function AdvancedCharts({ launches, allData, loading, AGENCY_COLORS }) {
  if (loading) return <div className="w-full text-center text-space-400 p-8">Loading Suite...</div>;

  // 1. Agency Market Share
  const agencyData = launches;

  // 2. Global Success vs Failure
  const successCount = allData.filter(d => d.is_success === 1).length;
  const failureCount = allData.filter(d => d.is_success === 0).length;
  const successData = [
    { name: 'Success', value: successCount, color: '#10B981', desc: 'Missions that achieved their primary objective' },
    { name: 'Failure', value: failureCount, color: '#F43F5E', desc: 'Missions that suffered catastrophic anomalies' }
  ];

  // 3. Top Rocket Families
  const rocketMap = {};
  allData.forEach(d => {
    rocketMap[d.rocket_type] = (rocketMap[d.rocket_type] || 0) + 1;
  });
  const rocketData = Object.entries(rocketMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(entry => ({ name: entry[0], value: entry[1], color: '#8B5CF6', desc: `The ${entry[0]} rocket family has flown ${entry[1]} times.` }));

  // 4. Agency Radar Data (Compare capabilities)
  const radarData = launches.slice(0, 5).map(agency => ({
    subject: agency.agency,
    A: agency.total_launches,
    B: Math.round((agency.successful_launches / agency.total_launches) * 100) || 0,
    fullMark: 100,
  }));

  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  // Removed CustomPieTooltip
  return (
    <motion.div variants={{ show: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      <ChartCard title="Agency Market Share" variants={itemVariants}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={agencyData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="total_launches" nameKey="agency">
              {agencyData.map((entry, idx) => <Cell key={idx} fill={AGENCY_COLORS[entry.agency] || AGENCY_COLORS.Other} />)}
            </Pie>
            <Tooltip content={<CustomPieTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Mission Success Rate" variants={itemVariants}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={successData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value" nameKey="name">
              {successData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
            </Pie>
            <Tooltip content={<CustomPieTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Top 5 Rocket Types" variants={itemVariants}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={rocketData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value" nameKey="name">
              {rocketData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
            </Pie>
            <Tooltip content={<CustomPieTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Agency Capability Radar" variants={itemVariants}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius={60} data={radarData}>
            <PolarGrid stroke="#2A3052" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94A3B8', fontSize: 10 }} />
            <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
            <Radar name="Total Launches" dataKey="A" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.4} />
            <Tooltip contentStyle={{ backgroundColor: '#151829', borderColor: '#2A3052', color: '#fff', borderRadius: '8px' }} />
          </RadarChart>
        </ResponsiveContainer>
      </ChartCard>
    </motion.div>
  );
}

function ChartCard({ title, children, variants }) {
  return (
    <motion.div variants={variants} className="glass-card p-5 flex flex-col h-[280px]">
      <h3 className="text-sm font-display font-semibold text-white mb-2 text-center">{title}</h3>
      <div className="flex-1 w-full">{children}</div>
    </motion.div>
  );
}

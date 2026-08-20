import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronLeft, ChevronRight, Filter, ArrowUp, ArrowDown, Download } from 'lucide-react';

export default function DataTable({ agency, startYear, endYear, onRowClick }) {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // '' | 'Success' | 'Failure'
  const [sortCol, setSortCol] = useState('year');
  const [sortDir, setSortDir] = useState('desc');
  const [loading, setLoading] = useState(false);
  const limit = 15;

  useEffect(() => {
    const fetchRawData = async () => {
      setLoading(true);
      try {
        let url = `${import.meta.env.VITE_API_URL || 'http://localhost:8001'}/api/raw_data?page=${page}&limit=${limit}`;
        if (agency) url += `&agency=${agency}`;
        if (startYear) url += `&start_year=${startYear}`;
        if (endYear) url += `&end_year=${endYear}`;
        if (search) url += `&search=${search}`;
        if (statusFilter) url += `&status=${statusFilter}`;
        if (sortCol) url += `&sort_col=${sortCol}&sort_dir=${sortDir}`;
        
        const res = await fetch(url);
        const result = await res.json();
        setData(result.data);
        setTotal(result.total);
      } catch (error) {
        console.error("Error fetching raw data", error);
      } finally {
        setLoading(false);
      }
    };
    
    const timer = setTimeout(() => fetchRawData(), 300);
    return () => clearTimeout(timer);
  }, [page, agency, startYear, endYear, search, statusFilter, sortCol, sortDir]);

  const totalPages = Math.ceil(total / limit);

  // Grouped color map
  const getAgencyColor = (ag) => {
    const colors = { NASA: 'text-agency-nasa', SpaceX: 'text-agency-spacex', ISRO: 'text-agency-isro' };
    return colors[ag] || 'text-agency-other';
  };

  const handleSort = (colKey) => {
    if (sortCol === colKey) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(colKey);
      setSortDir('desc');
    }
    setPage(1);
  };

  const handleExportCSV = async () => {
    try {
      let url = `${import.meta.env.VITE_API_URL || 'http://localhost:8001'}/api/raw_data?page=1&limit=100000`;
      if (agency) url += `&agency=${agency}`;
      if (startYear) url += `&start_year=${startYear}`;
      if (endYear) url += `&end_year=${endYear}`;
      if (search) url += `&search=${search}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (sortCol) url += `&sort_col=${sortCol}&sort_dir=${sortDir}`;
      
      const res = await fetch(url);
      const result = await res.json();
      const exportData = result.data;
      
      if (exportData.length === 0) return;
      
      const headers = ['Year', 'Agency', 'Mission', 'Rocket Type', 'Status'];
      const csvRows = [headers.join(',')];
      
      for (const row of exportData) {
        const values = [
          row.year,
          `"${row.display_agency}"`,
          `"${row.mission ? row.mission.replace(/"/g, '""') : 'Classified'}"`,
          `"${row.rocket_type}"`,
          row.success_status
        ];
        csvRows.push(values.join(','));
      }
      
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const dlUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('href', dlUrl);
      a.setAttribute('download', `space_launches_export.csv`);
      a.click();
    } catch (error) {
      console.error("Error exporting CSV", error);
    }
  };

  const renderHeader = (label, colKey) => (
    <th 
      className="px-6 py-4 cursor-pointer hover:text-white transition-colors group select-none" 
      onClick={() => handleSort(colKey)}
    >
      <div className="flex items-center gap-2">
        {label}
        {sortCol === colKey ? (
          sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
        ) : (
          <ArrowDown className="w-3 h-3 opacity-0 group-hover:opacity-30 transition-opacity" />
        )}
      </div>
    </th>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card flex flex-col h-[700px] w-full"
    >
      <div className="p-6 border-b border-space-600/50 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-xl font-display font-semibold text-white">Raw Launch Data</h2>
          <p className="text-sm text-space-400">Total Records: {total.toLocaleString()}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          {/* Status Filter */}
          <div className="relative w-full sm:w-40">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-space-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-space-900 border border-space-600 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-agency-nasa transition-colors appearance-none"
            >
              <option value="">All Statuses</option>
              <option value="Success">Success</option>
              <option value="Failure">Failure</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-space-400" />
            <input 
              type="text" 
              placeholder="Search mission, agency..." 
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-space-900 border border-space-600 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-agency-nasa transition-colors"
            />
          </div>

          {/* Export CSV Button */}
          <button 
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-space-800 hover:bg-space-700 border border-space-600 hover:border-cyan-500/50 rounded-lg text-sm font-medium text-white transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center text-space-400">Loading data...</div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] text-space-400 tracking-widest uppercase bg-space-900/90 backdrop-blur-md sticky top-0 border-b border-space-600/50 z-10">
              <tr>
                {renderHeader("Year", "year")}
                {renderHeader("Company / Agency", "real_agency")}
                {renderHeader("Mission / Payload", "mission")}
                {renderHeader("Rocket Type", "rocket_type")}
                {renderHeader("Status", "success_status")}
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr 
                  key={idx} 
                  onClick={() => onRowClick && onRowClick(row)}
                  className="border-b border-space-600/30 hover:bg-[#111111] hover:shadow-[inset_4px_0_0_0_rgba(255,0,255,0.8)] transition-all duration-300 cursor-pointer group"
                >
                  <td className="px-6 py-4 font-mono text-sm text-cyan-400 group-hover:text-cyan-200 transition-colors">{row.year}</td>
                  <td className={`px-6 py-4 font-bold tracking-wide ${getAgencyColor(row.agency)}`}>{row.display_agency}</td>
                  <td className="px-6 py-4 text-slate-200 group-hover:text-white transition-colors">{row.mission || 'Classified'}</td>
                  <td className="px-6 py-4 font-mono text-xs text-space-300 group-hover:text-space-200">{row.rocket_type}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase shadow-sm ${
                      row.is_success === 1 
                        ? 'bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/50 shadow-[0_0_15px_rgba(57,255,20,0.4)]' 
                        : 'bg-[#FF003C]/10 text-[#FF003C] border border-[#FF003C]/50 shadow-[0_0_15px_rgba(255,0,60,0.4)]'
                    }`}>
                      {row.success_status}
                    </span>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-space-400">No records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="p-4 border-t border-space-600/50 flex justify-between items-center bg-space-800/50 rounded-b-xl z-20 relative">
        <span className="text-sm text-space-400">
          Showing {Math.min((page - 1) * limit + 1, total)} to {Math.min(page * limit, total)} of {total}
        </span>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg bg-space-700 hover:bg-space-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
          <span className="text-sm font-medium px-2 text-white">Page {page} of {totalPages || 1}</span>
          <button 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || totalPages === 0}
            className="p-2 rounded-lg bg-space-700 hover:bg-space-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

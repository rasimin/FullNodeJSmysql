import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  TrendingUp, Users, DollarSign, Package, Calendar, 
  Search, Filter, ChevronRight, ArrowUpRight, 
  ArrowDownRight, Building2, ExternalLink, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../components/Modal';
import { IMAGE_BASE_URL } from '../config';

const SalesReport = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [agentDetails, setAgentDetails] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = {};
      if (dateRange.start) params.startDate = dateRange.start;
      if (dateRange.end) params.endDate = dateRange.end;
      
      const r = await api.get('/reports/sales-agents', { params });
      setAgents(r.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const fetchAgentDetails = async (agent) => {
    setSelectedAgent(agent);
    setLoadingDetails(true);
    try {
      const params = {};
      if (dateRange.start) params.startDate = dateRange.start;
      if (dateRange.end) params.endDate = dateRange.end;
      
      const r = await api.get(`/reports/sales-agents/${agent.id}/details`, { params });
      setAgentDetails(r.data);
    } catch (e) {
      console.error(e);
    }
    setLoadingDetails(false);
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const formatIDR = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Sales Performance</h1>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-[0.2em] mt-1">Revenue, Units & Margin Analytics</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-gray-900 p-2 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
            <Calendar size={14} className="text-gray-400" />
            <input 
              type="date" 
              className="bg-transparent text-[10px] font-black uppercase text-gray-600 dark:text-gray-300 outline-none"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
            />
            <span className="text-gray-300 mx-1">—</span>
            <input 
              type="date" 
              className="bg-transparent text-[10px] font-black uppercase text-gray-600 dark:text-gray-300 outline-none"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
            />
          </div>
          <button 
            onClick={fetchReport}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
          >
            Filter Report
          </button>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-interactive p-6 bg-gradient-to-br from-blue-600 to-blue-700 text-white border-none">
          <div className="flex justify-between items-start mb-4">
             <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md"><Package size={24} /></div>
             <TrendingUp size={20} className="text-blue-200" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-100">Total Units Sold</p>
          <h3 className="text-4xl font-black mt-1">{agents.reduce((acc, a) => acc + a.unitsSold, 0)}</h3>
        </div>

        <div className="card-interactive p-6 bg-white dark:bg-gray-900 border-none shadow-xl">
          <div className="flex justify-between items-start mb-4">
             <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl"><DollarSign size={24} /></div>
             <ArrowUpRight size={20} className="text-emerald-500" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Sales Volume</p>
          <h3 className="text-2xl font-black mt-1 text-gray-900 dark:text-white">{formatIDR(agents.reduce((acc, a) => acc + a.totalRevenue, 0))}</h3>
        </div>

        <div className="card-interactive p-6 bg-white dark:bg-gray-900 border-none shadow-xl">
          <div className="flex justify-between items-start mb-4">
             <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-2xl"><TrendingUp size={24} /></div>
             <div className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-[10px] font-black text-purple-600 uppercase">Profit</div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Accumulated Margin</p>
          <h3 className="text-2xl font-black mt-1 text-gray-900 dark:text-white">{formatIDR(agents.reduce((acc, a) => acc + a.totalMargin, 0))}</h3>
        </div>
      </div>

      {/* Main Table */}
      <div className="card bg-white dark:bg-gray-900 p-0 overflow-hidden border-none shadow-2xl shadow-gray-200/50 dark:shadow-none">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
           <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Agent Leaderboard</h2>
           <button className="p-2 bg-gray-50 dark:bg-white/5 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"><Search size={16} /></button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
             <thead className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                <tr>
                   <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Sales Executive</th>
                   <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Units</th>
                   <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Sales Amount</th>
                   <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Net Margin</th>
                   <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Details</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {agents.map((agent, idx) => (
                  <tr key={agent.id} className="group hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all">
                    <td className="px-6 py-5">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center font-black text-xs text-gray-500 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="text-sm font-black text-gray-900 dark:text-white leading-none">{agent.name}</p>
                            <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-widest">Executive Level</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex justify-center">
                          <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-black">{agent.unitsSold} <span className="text-[8px] opacity-70">PCS</span></span>
                       </div>
                    </td>
                    <td className="px-6 py-5">
                       <p className="text-sm font-black text-gray-900 dark:text-white">{formatIDR(agent.totalRevenue)}</p>
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex items-center gap-2">
                          <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">{formatIDR(agent.totalMargin)}</p>
                          <div className="h-4 w-px bg-gray-100 dark:bg-gray-800" />
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Avg: {Math.round(agent.averageMargin / 1000000)}M</p>
                       </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                       <button 
                         onClick={() => fetchAgentDetails(agent)}
                         className="p-2 bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-blue-600 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-all active:scale-95 shadow-sm border border-transparent hover:border-blue-100 dark:hover:border-blue-900"
                        >
                          <ExternalLink size={16} />
                       </button>
                    </td>
                  </tr>
                ))}
             </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      <Modal isOpen={!!selectedAgent} onClose={() => setSelectedAgent(null)} title={`${selectedAgent?.name}'s Sales Details`} wide>
         <div className="min-h-[400px]">
            {loadingDetails ? (
              <div className="flex items-center justify-center h-64 text-gray-400 font-bold uppercase text-xs animate-pulse">Loading Inventory Details...</div>
            ) : (
              <div className="space-y-4">
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Total Sales</p>
                        <p className="text-sm font-black text-gray-900 dark:text-white mt-1">{formatIDR(selectedAgent?.totalRevenue)}</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Total Margin</p>
                        <p className="text-sm font-black text-emerald-500 mt-1">{formatIDR(selectedAgent?.totalMargin)}</p>
                    </div>
                 </div>

                 <div className="card border dark:border-gray-800 p-0 overflow-hidden">
                    <table className="w-full text-left">
                       <thead className="bg-gray-50 dark:bg-gray-800/50">
                          <tr>
                             <th className="px-4 py-3 text-[9px] font-black text-gray-400 uppercase">Unit Details</th>
                             <th className="px-4 py-3 text-[9px] font-black text-gray-400 uppercase">Date</th>
                             <th className="px-4 py-3 text-[9px] font-black text-gray-400 uppercase">Revenue</th>
                             <th className="px-4 py-3 text-[9px] font-black text-gray-400 uppercase">Margin</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-[11px]">
                          {agentDetails.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                               <td className="px-4 py-3">
                                  <p className="font-black text-gray-900 dark:text-white">{item.brand} {item.model}</p>
                                  <p className="text-[9px] text-gray-400 uppercase font-bold">{item.plate_number} • {item.year}</p>
                               </td>
                               <td className="px-4 py-3 font-bold text-gray-600 dark:text-gray-400">{item.sold_date}</td>
                               <td className="px-4 py-3 font-black text-gray-900 dark:text-white">{formatIDR(item.price)}</td>
                               <td className="px-4 py-3">
                                  <span className="font-black text-emerald-500">+{formatIDR(item.margin)}</span>
                               </td>
                            </tr>
                          ))}
                          {agentDetails.length === 0 && (
                            <tr>
                              <td colSpan="4" className="px-4 py-12 text-center text-gray-400 font-bold uppercase">No records found for this period</td>
                            </tr>
                          )}
                       </tbody>
                    </table>
                 </div>
              </div>
            )}
         </div>
      </Modal>
    </div>
  );
};

export default SalesReport;

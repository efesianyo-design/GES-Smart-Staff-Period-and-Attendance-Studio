import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Clock, 
  User, 
  Activity,
  ChevronDown,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileText
} from 'lucide-react';
import { AuditLog } from '../types';
import { storageEngine } from '../utils/storage';

interface AuditTrailHubProps {
  schoolCode: string;
}

export const AuditTrailHub: React.FC<AuditTrailHubProps> = ({ schoolCode }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'attendance' | 'academic' | 'domestic' | 'system'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'warning' | 'error'>('all');

  useEffect(() => {
    setLogs(storageEngine.getAuditLogs());
    
    // Listen for storage changes
    const handleStorage = () => {
      setLogs(storageEngine.getAuditLogs());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      (log.staffName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.staffId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.action || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.details || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
      case 'warning': return <AlertCircle className="w-3.5 h-3.5 text-amber-500" />;
      case 'error': return <XCircle className="w-3.5 h-3.5 text-rose-500" />;
      default: return <Activity className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getCategoryBadge = (category: string) => {
    const styles: Record<string, string> = {
      attendance: 'bg-blue-100 text-blue-700 border-blue-200',
      academic: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      domestic: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      system: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${styles[category] || styles.system}`}>
        {category}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full min-h-[600px]">
      {/* Header & Controls */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">Institutional Audit Trail</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none">
                GES Security Ledger • Campus: {schoolCode}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:flex-none">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search audit trail..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-900 transition shadow-xs"
              />
            </div>
            <button className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-xs">
              <FileText className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-xs">
            <Filter className="w-3 h-3 text-slate-400" />
            <select 
              value={categoryFilter} 
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="bg-transparent border-none text-[10px] font-black text-slate-700 focus:outline-none uppercase cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="attendance">Gate Attendance</option>
              <option value="academic">Academic / Periods</option>
              <option value="domestic">Domestic Ops</option>
              <option value="system">System Logs</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-xs">
            <Activity className="w-3 h-3 text-slate-400" />
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent border-none text-[10px] font-black text-slate-700 focus:outline-none uppercase cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="success">Successful</option>
              <option value="warning">Warnings</option>
              <option value="error">Failed / Error</option>
            </select>
          </div>

          <div className="ml-auto text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            {filteredLogs.length} Records found
          </div>
        </div>
      </div>

      {/* Audit List */}
      <div className="flex-1 overflow-y-auto">
        {filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-200">
              <Activity className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800">No matching audit records</h3>
              <p className="text-xs text-slate-500">Adjust filters or search term to see more logs.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-slate-50/80 transition group">
                <div className="flex items-start gap-4">
                  <div className={`mt-1 w-8 h-8 rounded-xl shrink-0 flex items-center justify-center shadow-xs border ${
                    log.status === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                    log.status === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-600' :
                    'bg-rose-50 border-rose-100 text-rose-600'
                  }`}>
                    {getStatusIcon(log.status)}
                  </div>
                  
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900 uppercase tracking-tight truncate">
                          {log.action.replace(/_/g, ' ')}
                        </span>
                        {getCategoryBadge(log.category)}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 whitespace-nowrap">
                        <Clock className="w-3 h-3" />
                        {log.dateTime}
                      </div>
                    </div>
                    
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      {log.details}
                    </p>
                    
                    <div className="flex items-center gap-4 pt-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase">
                        <User className="w-3 h-3" />
                        <span>{log.staffName}</span>
                        <span className="text-slate-300">•</span>
                        <span className="font-mono">{log.staffId}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Institutional Integrity Ledger</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Real-time Sync Active</span>
          <span className="text-slate-200">|</span>
          <span>Page 1 of 1</span>
        </div>
      </div>
    </div>
  );
};

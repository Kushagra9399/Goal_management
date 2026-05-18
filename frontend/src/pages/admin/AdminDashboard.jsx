import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { 
  BarChart3, 
  ShieldAlert, 
  FileSpreadsheet, 
  Lock, 
  Unlock, 
  Users, 
  Target, 
  Layers, 
  Search,
  Download,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area 
} from 'recharts';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('analytics');
  const [dashboardData, setDashboardData] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [allGoals, setAllGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      setDashboardData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await api.get('/admin/audit-logs');
      setAuditLogs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAllGoals = async () => {
    try {
      // Fetch all goals across team members.
      // We can query `/manager/team` first, then query goals for each member, or since we are Admin,
      // we can get the list of team members and query their goals. Let's do that!
      const teamRes = await api.get('/manager/team');
      const allG = [];
      for (const member of teamRes.data) {
        const goalsRes = await api.get(`/manager/team/${member.id}/goals`);
        // Add member name to each goal for UI presentation
        goalsRes.data.forEach(g => {
          g.employee_name = member.name;
          g.employee_email = member.email;
        });
        allG.push(...goalsRes.data);
      }
      setAllGoals(allG);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([
      fetchDashboardData(),
      fetchAuditLogs(),
      fetchAllGoals()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleUnlockGoal = async (goalId, title) => {
    if (!window.confirm(`Are you sure you want to unlock the goal: "${title}"? This reverts the status to Draft and enables editing.`)) return;
    setError('');
    setSuccess('');
    try {
      await api.put(`/admin/unlock/${goalId}`);
      setSuccess(`Goal "${title}" has been unlocked successfully!`);
      loadAll();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to unlock goal.');
    }
  };

  const handleDownload = async (format) => {
    setError('');
    setSuccess('');
    try {
      const endpoint = format === 'csv' ? '/reports/export/csv' : '/reports/export/excel';
      const response = await api.get(endpoint, { responseType: 'blob' });
      
      const blob = new Blob([response.data], { 
        type: format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `org_goals_report_${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      setSuccess(`${format.toUpperCase()} report exported successfully!`);
    } catch (err) {
      setError('Report export failed.');
    }
  };

  // Filtered lists
  const filteredGoals = allGoals.filter(goal => 
    goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    goal.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    goal.thrust_area.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLogs = auditLogs.filter(log => 
    log.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.entity_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const PIE_COLORS = ['#94a3b8', '#3b82f6', '#10b981', '#ef4444'];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 font-sans tracking-tight">Appraisal Governance & HR Portal</h1>
          <p className="text-sm text-slate-500 font-medium">System governance, org-wide metrics, audit logs, and reports.</p>
        </div>

        {/* Top Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-200/60 border border-slate-200 p-1 rounded-xl shadow-inner shrink-0">
          <button
            onClick={() => { setActiveTab('analytics'); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-4 py-2 font-bold text-xs rounded-lg transition-all cursor-pointer ${
              activeTab === 'analytics' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Analytics
          </button>
          <button
            onClick={() => { setActiveTab('governance'); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-4 py-2 font-bold text-xs rounded-lg transition-all cursor-pointer ${
              activeTab === 'governance' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            Governance
          </button>
          <button
            onClick={() => { setActiveTab('audit'); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-4 py-2 font-bold text-xs rounded-lg transition-all cursor-pointer ${
              activeTab === 'audit' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Audit Logs
          </button>
          <button
            onClick={() => { setActiveTab('reports'); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-4 py-2 font-bold text-xs rounded-lg transition-all cursor-pointer ${
              activeTab === 'reports' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export Center
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-start gap-3 shadow-sm animate-headShake">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="font-semibold">{error}</p>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl flex items-start gap-3 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <p className="font-semibold">{success}</p>
        </div>
      )}

      {loading ? (
        <div className="bg-white p-24 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Overview Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Employees</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-800">{dashboardData?.metrics?.employee_count}</span>
                <span className="text-xs text-slate-400 font-semibold">subordinates</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Pending Approvals</span>
              <span className="text-3xl font-extrabold text-blue-600">{dashboardData?.metrics?.pending_approvals}</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Org Completion Index</span>
              <span className="text-3xl font-extrabold text-emerald-600">{dashboardData?.metrics?.org_completion_rate}%</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Total System Users</span>
              <span className="text-3xl font-extrabold text-slate-800">{dashboardData?.metrics?.total_users}</span>
            </div>
          </div>

          {/* TAB 1: ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Quarterly Trends Area Chart */}
              <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 text-sm">Quarterly Performance Trends</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dashboardData?.quarterly_trends}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="quarter" stroke="#94a3b8" fontSize={11} fontWeight={600} />
                      <YAxis stroke="#94a3b8" fontSize={11} fontWeight={600} domain={[0, 100]} />
                      <Tooltip />
                      <Area type="monotone" dataKey="average_score" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" name="Avg Score (%)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Status Pie Chart */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 text-sm">Goal Alignment Status</h3>
                <div className="h-52 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dashboardData?.status_distribution?.filter(d => d.count > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="count"
                        nameKey="status"
                      >
                        {dashboardData?.status_distribution?.filter(d => d.count > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-500">
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-slate-400 inline-block"></span>Draft</div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-blue-500 inline-block"></span>Pending</div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span>Approved</div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-red-500 inline-block"></span>Rejected</div>
                </div>
              </div>

              {/* Department Summary / Thrust Area score comparison */}
              <div className="lg:col-span-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 text-sm">Aligned Alignment Index (by Thrust Area)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboardData?.department_summary}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="thrust_area" stroke="#94a3b8" fontSize={11} fontWeight={600} />
                      <YAxis stroke="#94a3b8" fontSize={11} fontWeight={600} />
                      <Tooltip />
                      <Bar dataKey="average_score" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Index Score (%)" maxBarSize={50} />
                      <Bar dataKey="goal_count" fill="#10b981" radius={[6, 6, 0, 0]} name="Goals Set" maxBarSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: GOVERNANCE & UNLOCK */}
          {activeTab === 'governance' && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                <Search className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search goals by Title, Employee name, or Thrust Area..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent focus:outline-none text-slate-700 text-sm"
                />
              </div>

              {/* Goal Governance Table */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                        <th className="p-4 pl-6">Employee</th>
                        <th className="p-4">Thrust Area / Quarter</th>
                        <th className="p-4">Goal Title</th>
                        <th className="p-4">Weightage / Target</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-center pr-6">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                      {filteredGoals.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="p-8 text-center text-slate-400 font-medium">
                            No goals match your search parameters.
                          </td>
                        </tr>
                      ) : (
                        filteredGoals.map((goal) => (
                          <tr key={goal.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 pl-6">
                              <span className="block font-bold text-slate-800">{goal.employee_name}</span>
                              <span className="block text-[10px] text-slate-400 font-semibold">{goal.employee_email}</span>
                            </td>
                            <td className="p-4">
                              <span className="block text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-extrabold border border-slate-200 uppercase tracking-wider w-max mb-1">
                                {goal.thrust_area}
                              </span>
                              <span className="block text-xs font-bold text-slate-500">{goal.quarter}</span>
                            </td>
                            <td className="p-4 font-semibold text-slate-800 max-w-xs truncate" title={goal.title}>
                              {goal.title}
                            </td>
                            <td className="p-4">
                              <span className="block font-black text-slate-800">{goal.weightage}%</span>
                              <span className="block text-xs font-medium text-slate-400">Target: {goal.target}</span>
                            </td>
                            <td className="p-4">
                              <span className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase border tracking-wider ${
                                goal.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                goal.status === 'Pending Approval' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                goal.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                'bg-slate-100 text-slate-500 border-slate-200'
                              }`}>
                                {goal.status}
                              </span>
                            </td>
                            <td className="p-4 text-center pr-6">
                              {goal.locked ? (
                                <button
                                  onClick={() => handleUnlockGoal(goal.id, goal.title)}
                                  className="flex items-center gap-1 px-3 py-1.5 mx-auto bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-700 font-bold text-xs rounded-xl transition-all border border-amber-200 cursor-pointer"
                                >
                                  <Unlock className="w-3.5 h-3.5" /> Unlock
                                </button>
                              ) : (
                                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Unlocked</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                <Search className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search logs by User, Action, or Entity type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent focus:outline-none text-slate-700 text-sm"
                />
              </div>

              {/* Audit Table */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                        <th className="p-4 pl-6">Timestamp</th>
                        <th className="p-4">Performed By</th>
                        <th className="p-4">Action Taken</th>
                        <th className="p-4">Entity Details</th>
                        <th className="p-4 pr-6">Modification Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                      {filteredLogs.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="p-8 text-center text-slate-400 font-medium">
                            No logs match your search.
                          </td>
                        </tr>
                      ) : (
                        filteredLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 pl-6 text-xs font-bold text-slate-400">
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td className="p-4">
                              <span className="block font-bold text-slate-800">{log.user_name}</span>
                              <span className="block text-[10px] text-slate-400 font-semibold">{log.user_role}</span>
                            </td>
                            <td className="p-4">
                              <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-extrabold uppercase border ${
                                log.action.includes('Approved') || log.action.includes('Success') ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                log.action.includes('Rejected') || log.action.includes('Deleted') ? 'bg-red-50 text-red-700 border-red-100' :
                                log.action.includes('Unlocked') ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                'bg-blue-50 text-blue-700 border-blue-100'
                              }`}>
                                {log.action}
                              </span>
                            </td>
                            <td className="p-4 font-semibold text-slate-500">
                              {log.entity_type} #{log.entity_id}
                            </td>
                            <td className="p-4 pr-6 text-xs space-y-0.5 max-w-sm truncate" title={log.new_value}>
                              {log.old_value && (
                                <p><strong className="text-slate-400">Before:</strong> {log.old_value}</p>
                              )}
                              {log.new_value && (
                                <p><strong className="text-slate-700">After:</strong> {log.new_value}</p>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: EXPORT CENTER */}
          {activeTab === 'reports' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* CSV Export Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 flex flex-col justify-between transition-all hover:shadow-md">
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                    <FileSpreadsheet className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-base">Export as CSV Sheet</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    Download a raw, delimited CSV sheet containing comprehensive details for all alignment areas, planned objectives, targets, actual entries, scores, and manager comments. Ideal for importing into other BI platforms.
                  </p>
                </div>
                <button
                  onClick={() => handleDownload('csv')}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold text-sm rounded-xl transition-all cursor-pointer shadow-md shadow-slate-900/10"
                >
                  <Download className="w-4 h-4" />
                  Download CSV
                </button>
              </div>

              {/* Excel Export Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 flex flex-col justify-between transition-all hover:shadow-md">
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-base">Export as Excel Spreadsheet</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    Download a fully styled multi-column Excel spreadsheet (XLSX). Ready for HR appraisal audits, offline alignment analysis, or distribution to corporate heads. Powered by pandas and openpyxl.
                  </p>
                </div>
                <button
                  onClick={() => handleDownload('excel')}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-500/10"
                >
                  <Download className="w-4 h-4" />
                  Download Excel (XLSX)
                </button>
              </div>

            </div>
          )}

        </>
      )}

    </div>
  );
};

export default AdminDashboard;

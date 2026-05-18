import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { 
  Target, 
  Plus, 
  Trash2, 
  Edit3, 
  Send, 
  Lock, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  TrendingUp, 
  FolderPlus,
  RefreshCw
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Quarter selector for achievements
  const [selectedQuarter, setSelectedQuarter] = useState('Q1');
  
  // Modal states
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [modalGoal, setModalGoal] = useState({
    thrust_area: 'Technology',
    title: '',
    description: '',
    uom: 'percentage',
    target: 100.0,
    weightage: 20,
    quarter: 'Q1'
  });
  const [editingGoalId, setEditingGoalId] = useState(null);

  // Achievement update state
  const [updatingAchGoalId, setUpdatingAchGoalId] = useState(null);
  const [achUpdateForm, setAchUpdateForm] = useState({
    actual_achievement: 0,
    progress_status: 'Not Started',
    employee_comment: ''
  });

  const thrustAreas = ['Technology', 'Operations', 'Sales', 'HR', 'Finance', 'Marketing'];
  const uomTypes = [
    { value: 'numeric', label: 'Numeric (Higher is Better)' },
    { value: 'percentage', label: 'Percentage (%)' },
    { value: 'timeline', label: 'Timeline (Lower is Better)' },
    { value: 'zero-based', label: 'Zero-Based (0 Failures is best)' }
  ];

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/goals');
      setGoals(res.data);
    } catch (err) {
      setError('Failed to fetch goals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const totalWeightage = goals.reduce((sum, goal) => sum + goal.weightage, 0);

  const handleOpenCreateModal = () => {
    setEditingGoalId(null);
    setModalGoal({
      thrust_area: 'Technology',
      title: '',
      description: '',
      uom: 'percentage',
      target: 100.0,
      weightage: 20,
      quarter: 'Q1'
    });
    setError('');
    setShowGoalModal(true);
  };

  const handleOpenEditModal = (goal) => {
    if (goal.locked) {
      setError('Locked goals cannot be edited.');
      return;
    }
    setEditingGoalId(goal.id);
    setModalGoal({
      thrust_area: goal.thrust_area,
      title: goal.title,
      description: goal.description || '',
      uom: goal.uom,
      target: goal.target,
      weightage: goal.weightage,
      quarter: goal.quarter
    });
    setError('');
    setShowGoalModal(true);
  };

  const handleGoalSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!modalGoal.title.trim()) {
      setError('Goal title is required.');
      return;
    }
    if (modalGoal.target < 0) {
      setError('Target value cannot be negative.');
      return;
    }
    if (modalGoal.weightage < 10) {
      setError('Minimum weightage per goal is 10%.');
      return;
    }
    if (goals.length >= 8 && !editingGoalId) {
      setError('Maximum goals per employee is 8.');
      return;
    }

    try {
      if (editingGoalId) {
        await api.put(`/goals/${editingGoalId}`, modalGoal);
        setSuccess('Goal updated successfully!');
      } else {
        await api.post('/goals', modalGoal);
        setSuccess('Goal created successfully!');
      }
      setShowGoalModal(false);
      fetchGoals();
    } catch (err) {
      setError(err.response?.data?.detail || 'Goal creation failed.');
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`/goals/${goalId}`);
      setSuccess('Goal deleted successfully!');
      fetchGoals();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete goal.');
    }
  };

  const handleSubmitAllGoals = async () => {
    setError('');
    setSuccess('');

    const draftGoals = goals.filter(g => g.status === 'Draft' || g.status === 'Rejected');
    if (draftGoals.length === 0) {
      setError('No draft or rejected goals to submit.');
      return;
    }

    if (totalWeightage !== 100) {
      setError(`Total weightage must be exactly 100%. Current sum: ${totalWeightage}%`);
      return;
    }

    try {
      await api.post('/goals/submit', { goal_ids: draftGoals.map(g => g.id) });
      setSuccess('Goals submitted to manager successfully!');
      fetchGoals();
    } catch (err) {
      setError(err.response?.data?.detail || 'Submission failed.');
    }
  };

  const handleOpenAchievementModal = (goal) => {
    const ach = goal.achievements?.find(a => a.quarter === selectedQuarter) || {
      actual_achievement: 0.0,
      progress_status: 'Not Started',
      employee_comment: ''
    };
    
    setUpdatingAchGoalId(goal.id);
    setAchUpdateForm({
      actual_achievement: ach.actual_achievement || 0.0,
      progress_status: ach.progress_status || 'Not Started',
      employee_comment: ach.employee_comment || ''
    });
  };

  const handleAchievementSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post(`/goals/achievements?goal_id=${updatingAchGoalId}&quarter=${selectedQuarter}`, achUpdateForm);
      setSuccess(`Quarterly achievement for ${selectedQuarter} updated successfully!`);
      setUpdatingAchGoalId(null);
      fetchGoals();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update achievement.');
    }
  };

  // Recharts metric generation
  const getStatusChartData = () => {
    const statuses = { Draft: 0, 'Pending Approval': 0, Approved: 0, Rejected: 0 };
    goals.forEach(g => {
      if (statuses[g.status] !== undefined) statuses[g.status]++;
    });
    return Object.keys(statuses).map(key => ({ name: key, value: statuses[key] }));
  };

  const chartData = getStatusChartData();
  const COLORS = ['#94a3b8', '#3b82f6', '#10b981', '#ef4444'];

  const getWeightedAverageScore = () => {
    let totalScore = 0;
    let approvedWeight = 0;
    goals.forEach(goal => {
      if (goal.status === 'Approved') {
        const ach = goal.achievements?.find(a => a.quarter === selectedQuarter);
        if (ach) {
          totalScore += ach.score * (goal.weightage / 100);
          approvedWeight += goal.weightage;
        }
      }
    });
    return approvedWeight > 0 ? ((totalScore / approvedWeight) * 100).toFixed(1) : '0.0';
  };

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Goals Portal</h1>
          <p className="text-sm text-slate-500">Create, manage, and submit your quarterly targets.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Quarter selection */}
          <select 
            value={selectedQuarter} 
            onChange={(e) => setSelectedQuarter(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 text-sm font-semibold text-slate-700 rounded-xl shadow-sm focus:outline-none focus:border-blue-500"
          >
            <option value="Q1">Quarter 1 (Q1)</option>
            <option value="Q2">Quarter 2 (Q2)</option>
            <option value="Q3">Quarter 3 (Q3)</option>
            <option value="Q4">Quarter 4 (Q4)</option>
          </select>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-blue-500/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Goal
          </button>

          <button
            onClick={handleSubmitAllGoals}
            disabled={totalWeightage !== 100}
            className={`flex items-center gap-2 px-4 py-2 font-bold text-sm rounded-xl transition-all shadow-md cursor-pointer ${
              totalWeightage === 100 
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/10'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
            Submit Portal
          </button>
        </div>
      </div>

      {/* Error / Success Notifications */}
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

      {/* Overview Analytics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Goals</span>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-extrabold text-slate-800">{goals.length}</span>
            <span className="text-xs text-slate-400 font-semibold mt-2">/ 8 maximum</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Weightage</span>
          <div className="flex items-center justify-between">
            <span className={`text-3xl font-extrabold ${totalWeightage === 100 ? 'text-emerald-600' : 'text-amber-500'}`}>
              {totalWeightage}%
            </span>
            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold border border-slate-200">
              Must be 100%
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2 mt-3 rounded-full overflow-hidden border border-slate-200">
            <div 
              style={{ width: `${Math.min(100, totalWeightage)}%` }} 
              className={`h-full transition-all duration-300 ${totalWeightage === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
            ></div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            {selectedQuarter} Performance Index
          </span>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-extrabold text-blue-600">{getWeightedAverageScore()}%</span>
            <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold border border-blue-100">
              Weighted Avg
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Portal Status</span>
          <div className="flex items-center gap-2">
            {goals.some(g => g.status === 'Draft' || g.status === 'Rejected') ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 mt-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                Action Required (Drafts)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 mt-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                All Submitted / Approved
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Goal List + Small Analytics Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Goal Card List (Left 2 Columns) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            My Goal Directory ({selectedQuarter})
          </h2>

          {loading ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : goals.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
              <FolderPlus className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-slate-600 font-bold">No goals created yet.</p>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Begin by creating employee goals using the "Add Goal" button above. Ensure your total weightage sums to 100%.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {goals.map((goal) => {
                const qAch = goal.achievements?.find(a => a.quarter === selectedQuarter) || {};
                const progressScore = qAch.score || 0.0;
                
                return (
                  <div key={goal.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
                    {/* Goal Card Header */}
                    <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-extrabold border border-slate-200 uppercase tracking-wider">
                            {goal.thrust_area}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-extrabold uppercase border tracking-wider ${
                            goal.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            goal.status === 'Pending Approval' ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse' :
                            goal.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-slate-100 text-slate-500 border-slate-200'
                          }`}>
                            {goal.status}
                          </span>
                          {goal.locked && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] bg-slate-900 text-slate-100 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                              <Lock className="w-2.5 h-2.5" /> Locked
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-slate-800 text-base mt-1">{goal.title}</h3>
                        <p className="text-xs text-slate-500 font-medium">{goal.description}</p>
                      </div>

                      {/* Weightage + Actions */}
                      <div className="text-right shrink-0 flex flex-col items-end gap-2">
                        <span className="text-xs font-bold text-slate-400">Weightage</span>
                        <span className="text-lg font-black text-slate-800 leading-none">{goal.weightage}%</span>
                        
                        {/* Goal edit/delete actions */}
                        {!goal.locked && (
                          <div className="flex items-center gap-1.5 mt-2">
                            <button
                              onClick={() => handleOpenEditModal(goal)}
                              className="p-1.5 hover:bg-slate-50 text-slate-500 hover:text-blue-600 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                              title="Edit Goal"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteGoal(goal.id)}
                              className="p-1.5 hover:bg-slate-50 text-slate-500 hover:text-red-600 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                              title="Delete Goal"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Goal Card Body: Achievements & Score Tracker */}
                    <div className="bg-slate-50/50 p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Goal Target</span>
                        <p className="text-sm font-bold text-slate-700 flex items-baseline gap-1">
                          {goal.target} 
                          <span className="text-xs font-medium text-slate-400">({goal.uom})</span>
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          {selectedQuarter} Progress Status
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                            qAch.progress_status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                            qAch.progress_status === 'On Track' ? 'bg-blue-100 text-blue-800' :
                            'bg-slate-100 text-slate-500'
                          }`}>
                            {qAch.progress_status || 'Not Started'}
                          </span>
                          <button
                            onClick={() => handleOpenAchievementModal(goal)}
                            className="text-[10px] font-bold text-blue-600 hover:underline hover:text-blue-500 cursor-pointer"
                          >
                            Update
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Computed Score</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-blue-700">{progressScore}%</span>
                          <div className="flex-1 bg-slate-200 h-1.5 rounded-full overflow-hidden w-20">
                            <div style={{ width: `${Math.min(100, progressScore)}%` }} className="h-full bg-blue-600"></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Comments section if reviews present */}
                    {(goal.review_comment || qAch.manager_comment) && (
                      <div className="p-4 bg-slate-100/50 border-t border-slate-100 text-xs text-slate-600 flex flex-col gap-2">
                        {goal.review_comment && (
                          <div className="flex items-start gap-1.5">
                            <span className="font-bold text-red-600 shrink-0">Review Comment:</span>
                            <span>{goal.review_comment}</span>
                          </div>
                        )}
                        {qAch.manager_comment && (
                          <div className="flex items-start gap-1.5">
                            <span className="font-bold text-blue-600 shrink-0">Manager Q-Feedback:</span>
                            <span>{qAch.manager_comment}</span>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Small Analytics Panel (Right 1 Column) */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Goal Status Distribution</h3>
            <div className="h-44 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.filter(d => d.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Chart Legend */}
            <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-500">
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-slate-400 inline-block"></span>Draft</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-blue-500 inline-block"></span>Pending</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span>Approved</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-red-500 inline-block"></span>Rejected</div>
            </div>
          </div>

          {/* Goal Setting Instructions */}
          <div className="bg-slate-900 text-slate-200 p-6 rounded-2xl shadow-sm border border-slate-800 space-y-3 relative overflow-hidden">
            <div className="absolute top-[-50px] right-[-50px] w-28 h-28 bg-blue-500/10 rounded-full blur-xl pointer-events-none"></div>
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-400" />
              Goal Governance Rules
            </h3>
            <ul className="text-xs space-y-2 text-slate-400 list-disc pl-4 leading-relaxed font-medium">
              <li>Goals must have a minimum weightage of <strong className="text-white">10%</strong>.</li>
              <li>Employees can create a maximum of <strong className="text-white">8 goals</strong>.</li>
              <li>Your total portal weightage must equal exactly <strong className="text-white">100%</strong> before submitting.</li>
              <li>Once approved, goals are <strong className="text-white">locked</strong>. Submit Q-achievements to calculate your index score.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* CREATE & EDIT GOAL MODAL */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-zoomIn">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-base">
                {editingGoalId ? 'Edit Employee Goal' : 'Add New Employee Goal'}
              </h3>
              <button 
                onClick={() => setShowGoalModal(false)}
                className="text-slate-400 hover:text-slate-600 font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGoalSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase block">Thrust Area</label>
                  <select
                    value={modalGoal.thrust_area}
                    onChange={(e) => setModalGoal({ ...modalGoal, thrust_area: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                  >
                    {thrustAreas.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase block">Target Quarter</label>
                  <select
                    value={modalGoal.quarter}
                    onChange={(e) => setModalGoal({ ...modalGoal, quarter: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                  >
                    {['Q1', 'Q2', 'Q3', 'Q4'].map(q => <option key={q} value={q}>{q}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase block">Goal Title</label>
                <input
                  type="text"
                  placeholder="e.g. Expand Cloud Infra Setup"
                  value={modalGoal.title}
                  onChange={(e) => setModalGoal({ ...modalGoal, title: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase block">Goal Description</label>
                <textarea
                  rows="3"
                  placeholder="Details of the goal objectives, milestones..."
                  value={modalGoal.description}
                  onChange={(e) => setModalGoal({ ...modalGoal, description: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                ></textarea>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase block">Unit of Measurement (UoM)</label>
                  <select
                    value={modalGoal.uom}
                    onChange={(e) => setModalGoal({ ...modalGoal, uom: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                  >
                    {uomTypes.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase block">Weightage (%)</label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={modalGoal.weightage}
                    onChange={(e) => setModalGoal({ ...modalGoal, weightage: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase block">Target Value</label>
                <input
                  type="number"
                  step="any"
                  value={modalGoal.target}
                  onChange={(e) => setModalGoal({ ...modalGoal, target: parseFloat(e.target.value) || 0.0 })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-sm rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-sm rounded-xl cursor-pointer shadow-md shadow-blue-500/10"
                >
                  {editingGoalId ? 'Save Changes' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE ACHIEVEMENT MODAL */}
      {updatingAchGoalId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-zoomIn">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-base">
                Update Quarterly Achievement ({selectedQuarter})
              </h3>
              <button 
                onClick={() => setUpdatingAchGoalId(null)}
                className="text-slate-400 hover:text-slate-600 font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAchievementSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase block">Actual Achievement Value</label>
                <input
                  type="number"
                  step="any"
                  value={achUpdateForm.actual_achievement}
                  onChange={(e) => setAchUpdateForm({ ...achUpdateForm, actual_achievement: parseFloat(e.target.value) || 0.0 })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase block">Progress Status</label>
                <select
                  value={achUpdateForm.progress_status}
                  onChange={(e) => setAchUpdateForm({ ...achUpdateForm, progress_status: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="Not Started">Not Started</option>
                  <option value="On Track">On Track</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase block">Remarks / Comment</label>
                <textarea
                  rows="3"
                  placeholder="Details of the achievement, obstacles, milestones hit..."
                  value={achUpdateForm.employee_comment}
                  onChange={(e) => setAchUpdateForm({ ...achUpdateForm, employee_comment: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                ></textarea>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setUpdatingAchGoalId(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-sm rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-sm rounded-xl cursor-pointer shadow-md shadow-blue-500/10"
                >
                  Submit Achievement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default EmployeeDashboard;

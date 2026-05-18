import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { 
  Users, 
  Target, 
  Check, 
  X, 
  MessageSquare, 
  Lock, 
  TrendingUp, 
  FileText, 
  AlertCircle, 
  CheckCircle2,
  Edit2
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const ManagerDashboard = () => {
  const [team, setTeam] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedQuarter, setSelectedQuarter] = useState('Q1');
  const [goals, setGoals] = useState([]);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [loadingGoals, setLoadingGoals] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Inline approval / rejection modal states
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [isApproving, setIsApproving] = useState(true); // true = Approve, false = Reject
  const [actionGoal, setActionGoal] = useState(null);
  const [actionForm, setActionForm] = useState({
    weightage: 0,
    target: 0.0,
    review_comment: ''
  });

  // Check-in state
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [actionAchievement, setActionAchievement] = useState(null);
  const [checkinComment, setCheckinComment] = useState('');

  const fetchTeam = async () => {
    setLoadingTeam(true);
    try {
      const res = await api.get('/manager/team');
      setTeam(res.data);
      if (res.data.length > 0 && !selectedMember) {
        setSelectedMember(res.data[0]);
      }
    } catch (err) {
      setError('Failed to fetch team members.');
    } finally {
      setLoadingTeam(false);
    }
  };

  const fetchMemberGoals = async (memberId) => {
    setLoadingGoals(true);
    try {
      const res = await api.get(`/manager/team/${memberId}/goals`);
      setGoals(res.data);
    } catch (err) {
      setError('Failed to fetch goals for selected member.');
    } finally {
      setLoadingGoals(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  useEffect(() => {
    if (selectedMember) {
      fetchMemberGoals(selectedMember.id);
    }
  }, [selectedMember]);

  const handleMemberSelect = (member) => {
    setSelectedMember(member);
    setSuccess('');
    setError('');
  };

  const handleOpenActionModal = (goal, approve = true) => {
    setActionGoal(goal);
    setIsApproving(approve);
    setActionForm({
      weightage: goal.weightage,
      target: goal.target,
      review_comment: goal.review_comment || ''
    });
    setError('');
    setShowApprovalModal(true);
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (isApproving) {
        await api.put(`/manager/approve/${actionGoal.id}`, actionForm);
        setSuccess(`Goal '${actionGoal.title}' has been approved and locked!`);
      } else {
        if (!actionForm.review_comment.trim()) {
          setError('Rejection comment is required.');
          return;
        }
        await api.put(`/manager/reject/${actionGoal.id}`, actionForm);
        setSuccess(`Goal '${actionGoal.title}' has been rejected with review comments.`);
      }
      setShowApprovalModal(false);
      fetchMemberGoals(selectedMember.id);
      fetchTeam(); // Refresh completion rates
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update goal status.');
    }
  };

  const handleOpenCheckinModal = (ach) => {
    setActionAchievement(ach);
    setCheckinComment(ach.manager_comment || '');
    setError('');
    setShowCheckinModal(true);
  };

  const handleCheckinSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await api.post(`/manager/check-in/${actionAchievement.id}`, { manager_comment: checkinComment });
      setSuccess('Quarterly check-in feedback saved successfully!');
      setShowCheckinModal(false);
      fetchMemberGoals(selectedMember.id);
      fetchTeam();
    } catch (err) {
      setError(err.response?.data?.detail || 'Check-in failed.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manager L1 Dashboard</h1>
          <p className="text-sm text-slate-500">Approve employee goals and conduct quarterly check-ins.</p>
        </div>
        <div className="flex items-center gap-3">
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

      {/* Main layout grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Side: Team List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-500" />
              Direct Subordinates
            </h2>
            <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-black">
              {team.length} Team
            </span>
          </div>

          {loadingTeam ? (
            <div className="p-8 flex justify-center">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : team.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No subordinate employees mapped to you yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {team.map((member) => (
                <button
                  key={member.id}
                  onClick={() => handleMemberSelect(member)}
                  className={`w-full p-4 flex items-center justify-between transition-colors text-left hover:bg-slate-50/50 cursor-pointer ${
                    selectedMember?.id === member.id ? 'bg-blue-50/50 border-r-3 border-blue-600' : ''
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="block text-sm font-bold text-slate-800">{member.name}</span>
                    <span className="block text-[10px] text-slate-400 font-semibold">{member.email}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-xs font-bold text-slate-400">Idx Completion</span>
                    <span className="text-sm font-black text-blue-600">{member.goal_completion_rate}%</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Selected Member Goals & Actions (2 Columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Goal Alignment & Check-ins: {selectedMember ? selectedMember.name : 'Loading...'}
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Aligned thrust area goals. Approve pending goals or perform quarterly appraisal check-ins.
            </p>
          </div>

          {loadingGoals ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : goals.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-slate-400 text-sm">
              <Target className="w-10 h-10 text-slate-200 mb-2" />
              This employee has not added any goals for {selectedQuarter} yet.
            </div>
          ) : (
            <div className="space-y-4">
              {goals.map((goal) => {
                const qAch = goal.achievements?.find(a => a.quarter === selectedQuarter) || {};
                const progressScore = qAch.score || 0.0;

                return (
                  <div key={goal.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-4">
                      <div>
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
                        <h3 className="font-bold text-slate-800 text-sm mt-2">{goal.title}</h3>
                        <p className="text-xs text-slate-500 font-medium">{goal.description}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-slate-400 block">Weightage</span>
                        <span className="text-base font-black text-slate-800">{goal.weightage}%</span>
                      </div>
                    </div>

                    {/* Middle stats */}
                    <div className="bg-slate-50/50 p-5 grid grid-cols-1 md:grid-cols-3 gap-5 border-b border-slate-100">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Planned Target</span>
                        <p className="text-xs font-bold text-slate-700">
                          {goal.target} <span className="text-[10px] text-slate-400 font-semibold">({goal.uom})</span>
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Actual Achievement</span>
                        <p className="text-xs font-bold text-slate-700">
                          {qAch.actual_achievement !== null ? qAch.actual_achievement : 'No update yet'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Computed Score</span>
                        <span className="text-sm font-extrabold text-blue-700">{progressScore}%</span>
                      </div>
                    </div>

                    {/* Approval or Check-in Actions */}
                    <div className="p-4 bg-slate-50/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Comments / Remarks details */}
                      <div className="text-xs text-slate-600 max-w-md space-y-1">
                        {qAch.employee_comment && (
                          <p><strong className="text-slate-800">Employee remarks:</strong> {qAch.employee_comment}</p>
                        )}
                        {qAch.manager_comment && (
                          <p><strong className="text-blue-600">Manager Q-Feedback:</strong> {qAch.manager_comment}</p>
                        )}
                      </div>

                      {/* Dynamic Action Buttons */}
                      <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                        {goal.status === 'Pending Approval' && (
                          <>
                            <button
                              onClick={() => handleOpenActionModal(goal, false)}
                              className="flex items-center gap-1 px-3 py-1.5 border border-red-200 hover:bg-red-50 text-red-600 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" /> Reject
                            </button>
                            <button
                              onClick={() => handleOpenActionModal(goal, true)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve & Lock
                            </button>
                          </>
                        )}

                        {goal.status === 'Approved' && qAch.id && (
                          <button
                            onClick={() => handleOpenCheckinModal(qAch)}
                            className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                            {qAch.manager_comment ? 'Edit Check-in' : 'Conduct Q-Check-in'}
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* GOAL APPROVAL / REJECTION DIALOG (WITH INLINE MODIFICATION SUPPORT!) */}
      {showApprovalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-zoomIn">
            <div className={`px-6 py-4 text-white flex items-center justify-between ${isApproving ? 'bg-blue-600' : 'bg-red-600'}`}>
              <h3 className="font-bold text-sm">
                {isApproving ? 'Approve & Lock Goal' : 'Reject Employee Goal'}
              </h3>
              <button onClick={() => setShowApprovalModal(false)} className="text-white hover:text-slate-200 font-semibold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleActionSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 space-y-1.5">
                <p><strong>Title:</strong> {actionGoal?.title}</p>
                <p><strong>UoM:</strong> {actionGoal?.uom} | <strong>Current Target:</strong> {actionGoal?.target}</p>
              </div>

              {isApproving && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase block">Modify Weightage (%)</label>
                    <input
                      type="number"
                      value={actionForm.weightage}
                      onChange={(e) => setActionForm({ ...actionForm, weightage: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase block">Modify Target</label>
                    <input
                      type="number"
                      step="any"
                      value={actionForm.target}
                      onChange={(e) => setActionForm({ ...actionForm, target: parseFloat(e.target.value) || 0.0 })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase block">
                  {isApproving ? 'Approval Remarks (Optional)' : 'Rejection Reason (Required)'}
                </label>
                <textarea
                  rows="3"
                  placeholder={isApproving ? 'Add manager remarks...' : 'Please specify why goals are being rejected...'}
                  value={actionForm.review_comment}
                  onChange={(e) => setActionForm({ ...actionForm, review_comment: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                ></textarea>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowApprovalModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-sm rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-white font-bold text-sm rounded-xl cursor-pointer shadow-md ${
                    isApproving 
                      ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/10' 
                      : 'bg-red-600 hover:bg-red-500 shadow-red-500/10'
                  }`}
                >
                  {isApproving ? 'Confirm Approval' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHECK-IN DIALOG */}
      {showCheckinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-zoomIn">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-base">Quarterly Check-in Feedback</h3>
              <button onClick={() => setShowCheckinModal(false)} className="text-slate-400 hover:text-slate-600 font-semibold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCheckinSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase block">Manager Comments</label>
                <textarea
                  rows="4"
                  placeholder="Review achievements, highlight accomplishments, and suggest next steps..."
                  value={checkinComment}
                  onChange={(e) => setCheckinComment(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                ></textarea>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCheckinModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-sm rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-sm rounded-xl cursor-pointer shadow-md shadow-blue-500/10"
                >
                  Save Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManagerDashboard;

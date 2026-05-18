import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Target, Check, X, AlertCircle, CheckCircle2, Lock } from 'lucide-react';

const ManagerApprovals = () => {
  const [pendingGoals, setPendingGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Inline modal state
  const [showModal, setShowModal] = useState(false);
  const [isApproving, setIsApproving] = useState(true);
  const [actionGoal, setActionGoal] = useState(null);
  const [actionForm, setActionForm] = useState({
    weightage: 0,
    target: 0.0,
    review_comment: ''
  });

  const fetchPendingGoals = async () => {
    setLoading(true);
    try {
      const teamRes = await api.get('/manager/team');
      const allPending = [];
      for (const member of teamRes.data) {
        const goalsRes = await api.get(`/manager/team/${member.id}/goals`);
        const pending = goalsRes.data.filter(g => g.status === 'Pending Approval');
        pending.forEach(g => {
          g.employee_name = member.name;
          g.employee_email = member.email;
        });
        allPending.push(...pending);
      }
      setPendingGoals(allPending);
    } catch (err) {
      setError('Failed to fetch pending approvals inbox.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingGoals();
  }, []);

  const handleOpenModal = (goal, approve = true) => {
    setActionGoal(goal);
    setIsApproving(approve);
    setActionForm({
      weightage: goal.weightage,
      target: goal.target,
      review_comment: ''
    });
    setError('');
    setShowModal(true);
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (isApproving) {
        await api.put(`/manager/approve/${actionGoal.id}`, actionForm);
        setSuccess(`Goal "${actionGoal.title}" has been approved!`);
      } else {
        if (!actionForm.review_comment.trim()) {
          setError('Rejection comment is required.');
          return;
        }
        await api.put(`/manager/reject/${actionGoal.id}`, actionForm);
        setSuccess(`Goal "${actionGoal.title}" has been rejected.`);
      }
      setShowModal(false);
      fetchPendingGoals();
    } catch (err) {
      setError(err.response?.data?.detail || 'Action failed.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Pending Approvals Inbox</h1>
        <p className="text-sm text-slate-500">Review and approve your direct subordinates' goal sets.</p>
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
        <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm flex justify-center">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : pendingGoals.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center flex flex-col items-center justify-center text-slate-400">
          <Target className="w-12 h-12 text-slate-200 mb-3" />
          <p className="font-bold text-slate-700">Inbox fully cleared!</p>
          <p className="text-xs text-slate-400 mt-1">No employee goal sets are currently pending approval.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {pendingGoals.map((goal) => (
            <div key={goal.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:shadow-md">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-extrabold border border-slate-200 uppercase tracking-wider">
                    {goal.thrust_area}
                  </span>
                  <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-extrabold uppercase border border-blue-200 tracking-wider">
                    Pending
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 text-base">{goal.title}</h3>
                <p className="text-xs text-slate-500 font-medium">{goal.description}</p>
                <div className="text-xs text-slate-400 font-bold">
                  Proposed by: <strong className="text-slate-700">{goal.employee_name}</strong> ({goal.employee_email})
                </div>
              </div>

              <div className="flex flex-row md:flex-col items-start md:items-end justify-between md:justify-center gap-4 shrink-0 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                <div className="text-left md:text-right">
                  <span className="text-xs font-bold text-slate-400 block">Proposed Weightage / Target</span>
                  <span className="text-lg font-black text-slate-800">{goal.weightage}% </span>
                  <span className="text-xs font-medium text-slate-400"> (Target: {goal.target} {goal.uom})</span>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => handleOpenModal(goal, false)}
                    className="flex items-center gap-1 px-3.5 py-2 border border-red-200 hover:bg-red-50 text-red-600 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                  <button
                    onClick={() => handleOpenModal(goal, true)}
                    className="flex items-center gap-1 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" /> Approve & Lock
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* APPROVE / REJECT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-zoomIn">
            <div className={`px-6 py-4 text-white flex items-center justify-between ${isApproving ? 'bg-blue-600' : 'bg-red-600'}`}>
              <h3 className="font-bold text-sm">
                {isApproving ? 'Approve Goal Set' : 'Reject Goal Set'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-white hover:text-slate-200 font-semibold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleActionSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 space-y-1">
                <p><strong>Goal:</strong> {actionGoal?.title}</p>
                <p><strong>Proposed weight:</strong> {actionGoal?.weightage}% | <strong>Proposed target:</strong> {actionGoal?.target}</p>
              </div>

              {isApproving && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase block">Approve Weight (%)</label>
                    <input
                      type="number"
                      value={actionForm.weightage}
                      onChange={(e) => setActionForm({ ...actionForm, weightage: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase block">Approve Target</label>
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
                  {isApproving ? 'Approval Comments (Optional)' : 'Specify Rejection Reason (Required)'}
                </label>
                <textarea
                  rows="3"
                  placeholder={isApproving ? 'Add reviews/comments...' : 'Please specify why this goal is rejected...'}
                  value={actionForm.review_comment}
                  onChange={(e) => setActionForm({ ...actionForm, review_comment: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                ></textarea>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
                  {isApproving ? 'Confirm Approve' : 'Confirm Reject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManagerApprovals;

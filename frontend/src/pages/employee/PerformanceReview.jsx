import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Target, TrendingUp, BarChart3, Lock, MessageSquare } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const PerformanceReview = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const res = await api.get('/goals');
        setGoals(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchGoals();
  }, []);

  const getQuarterScore = (q) => {
    let score = 0;
    let weight = 0;
    goals.forEach(g => {
      if (g.status === 'Approved') {
        const ach = g.achievements?.find(a => a.quarter === q);
        if (ach) {
          score += ach.score * (g.weightage / 100);
          weight += g.weightage;
        }
      }
    });
    return weight > 0 ? parseFloat(((score / weight) * 100).toFixed(1)) : 0.0;
  };

  const trendData = [
    { quarter: 'Q1', score: getQuarterScore('Q1') },
    { quarter: 'Q2', score: getQuarterScore('Q2') },
    { quarter: 'Q3', score: getQuarterScore('Q3') },
    { quarter: 'Q4', score: getQuarterScore('Q4') }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Performance Appraisal</h1>
        <p className="text-sm text-slate-500">Track your index performance scores across Q1 - Q4.</p>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm flex justify-center">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Trend Chart (2 Columns) */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Annual Index Score Progression
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="quarter" stroke="#94a3b8" fontSize={11} fontWeight={600} />
                  <YAxis stroke="#94a3b8" fontSize={11} fontWeight={600} domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 8 }} name="Alignment Index Score (%)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quarterly Score Summary cards */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
            <h3 className="font-bold text-slate-800 text-sm">Index Score Cards</h3>
            <div className="grid grid-cols-2 gap-3">
              {trendData.map((data) => (
                <div key={data.quarter} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">{data.quarter} Score</span>
                  <span className="text-xl font-extrabold text-blue-700">{data.score}%</span>
                </div>
              ))}
            </div>
            <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl text-[11px] text-blue-800 font-medium">
              Scores are computed dynamically using UoM logic based on your plans and submitted entries.
            </div>
          </div>

          {/* Detailed tabular overview of achievements */}
          <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">Full Annual Appraisal Summary</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                    <th className="p-4 pl-6">Goal Title</th>
                    <th className="p-4">Weightage</th>
                    <th className="p-4">Q1 Score</th>
                    <th className="p-4">Q2 Score</th>
                    <th className="p-4">Q3 Score</th>
                    <th className="p-4">Q4 Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                  {goals.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-slate-400 font-medium">
                        No goals added yet.
                      </td>
                    </tr>
                  ) : (
                    goals.map((g) => (
                      <tr key={g.id} className="hover:bg-slate-50/50">
                        <td className="p-4 pl-6 font-semibold text-slate-800">{g.title}</td>
                        <td className="p-4 font-black text-slate-800">{g.weightage}%</td>
                        {['Q1', 'Q2', 'Q3', 'Q4'].map((q) => {
                          const ach = g.achievements?.find(a => a.quarter === q);
                          return (
                            <td key={q} className="p-4">
                              <span className="font-bold text-slate-700">{ach ? `${ach.score}%` : '0%'}</span>
                              <span className="block text-[10px] text-slate-400 font-semibold">{ach?.progress_status || 'Not Started'}</span>
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default PerformanceReview;

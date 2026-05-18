import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Calendar, User, Bell } from 'lucide-react';

const Navbar = () => {
  const { user } = useAuth();
  
  const formatDate = () => {
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-40">
      <div>
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">
          Welcome back, {user?.name.split(' ')[0]}!
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          Manage and track goals seamlessly.
        </p>
      </div>

      <div className="flex items-center gap-6">
        {/* Date badge */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600 shadow-sm">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          {formatDate()}
        </div>

        {/* Action badge */}
        <div className="relative p-2 rounded-full hover:bg-slate-50 cursor-pointer border border-slate-200 transition-colors">
          <Bell className="w-4 h-4 text-slate-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white"></span>
        </div>

        {/* Profile indicator */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-sm border border-blue-200 shadow-inner">
            {user?.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="hidden md:block leading-none text-left">
            <span className="block text-sm font-semibold text-slate-700">{user?.name}</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{user?.role}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

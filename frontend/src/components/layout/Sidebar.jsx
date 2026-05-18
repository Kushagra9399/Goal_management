import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Target, 
  Users, 
  ShieldAlert, 
  LogOut, 
  Layers, 
  TrendingUp, 
  BarChart3, 
  FileSpreadsheet
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();

  const getLinks = () => {
    switch (user?.role) {
      case 'employee':
        return [
          { to: '/employee', label: 'My Goals', icon: Target },
          { to: '/employee/performance', label: 'Quarterly Check-ins', icon: TrendingUp },
        ];
      case 'manager':
        return [
          { to: '/manager', label: 'My Team', icon: Users },
          { to: '/manager/approvals', label: 'Pending Approvals', icon: Layers },
        ];
      case 'admin':
        return [
          { to: '/admin', label: 'Org Dashboard', icon: BarChart3 },
          { to: '/admin/audit', label: 'Audit Logs', icon: ShieldAlert },
          { to: '/admin/reports', label: 'Export Center', icon: FileSpreadsheet },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col min-h-screen border-r border-slate-800 shadow-xl">
      {/* Brand logo */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
          <Target className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-white text-base leading-none">AtomQuest</h1>
          <span className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase">Goal Portal</span>
        </div>
      </div>

      {/* User summary badge */}
      <div className="p-4 mx-4 mt-6 rounded-xl bg-slate-800/50 border border-slate-800 flex flex-col gap-1">
        <p className="text-xs text-slate-400 font-medium">Logged in as</p>
        <p className="text-sm font-bold text-white truncate">{user?.name}</p>
        <span className="self-start text-[10px] px-2 py-0.5 mt-1 rounded bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20 uppercase tracking-wider">
          {user?.role}
        </span>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {link.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout button */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 border border-transparent hover:border-red-500/10"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

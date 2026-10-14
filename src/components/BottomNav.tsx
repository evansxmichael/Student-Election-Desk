import React from 'react';
import { useElection } from '../context/ElectionContext';
import type { TabType } from '../types';
import { Users, BarChart3, UserPlus, QrCode } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, stats, userRole } = useElection();

  const tabs: { id: TabType; label: string; icon: React.FC<any>; badge?: string | number }[] = [
    { id: 'voters', label: 'Voter Desk', icon: Users, badge: stats.total },
    { id: 'stats', label: 'Analytics', icon: BarChart3, badge: `${stats.turnoutRate}%` },
    { id: 'add', label: 'Spot Add', icon: UserPlus },
    ...(userRole === 'admin' ? [{ id: 'tools' as TabType, label: 'Settings', icon: QrCode }] : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200 pb-[env(safe-area-inset-bottom)] no-print shadow-sm">
      <div className={`max-w-md mx-auto grid px-2 py-2 ${userRole === 'admin' ? 'grid-cols-4' : 'grid-cols-3'}`}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all touch-scale ${
                isActive
                  ? 'text-blue-600 font-extrabold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {tab.badge !== undefined && (
                  <span
                    className={`absolute -top-1.5 -right-3.5 text-[9px] font-mono px-1 py-0.2 rounded-full leading-tight font-extrabold ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight truncate max-w-full font-semibold">
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-8 h-[2.5px] bg-blue-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

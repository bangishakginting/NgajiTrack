import React, { useState, useEffect } from 'react';
import { User } from '../types/user';
import { LogOut, BookOpen, Database } from 'lucide-react';
import { subscribeGasConnection, GasConnectionState, isLiveApiActive } from '../services/api';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onOpenQuickCatat?: () => void;
  onToggleMobileMenu?: () => void;
  activeMenu?: string;
  onSelectMenu?: (menu: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogout,
  onOpenQuickCatat,
  onToggleMobileMenu,
  onSelectMenu
}) => {
  const [gasState, setGasState] = useState<GasConnectionState>(() => ({
    activeUrl: '',
    isConfigured: isLiveApiActive(),
    isConnected: false,
    isFallback: true,
  }));

  useEffect(() => {
    const unsub = subscribeGasConnection((state) => {
      setGasState(state);
    });
    return () => unsub();
  }, []);

  const roleBadge = {
    admin: { label: 'Admin', color: 'bg-rose-50 text-rose-700 border-rose-200' },
    naqib: { label: 'Naqib', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    anggota: { label: 'Anggota', color: 'bg-blue-50 text-blue-700 border-blue-200' }
  }[user?.role || 'anggota'];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3 transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Brand */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Buka Menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 tracking-tight text-lg">NGajiTrack</span>
                <span className="hidden sm:inline-block text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                  v1.0
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-slate-500 leading-none">
                Catat, Monitor, dan Tingkatkan Tilawah Al-Qur'an
              </p>
            </div>
          </div>
        </div>

        {/* Right: Actions & User Info */}
        <div className="flex items-center gap-3">
          {/* Google Sheets Status Badge */}
          <button
            type="button"
            onClick={() => onSelectMenu?.('settings')}
            title={
              gasState.isConnected
                ? "Terhubung langsung ke Google Sheets via Google Apps Script Web App. Klik untuk buka Pengaturan."
                : "Mode Simulasi Aktif. Klik untuk memasukkan atau mengetes URL Web App Google Sheets Anda."
            }
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
              gasState.isConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Database className={`w-3.5 h-3.5 ${gasState.isConnected ? 'text-emerald-600' : 'text-amber-600'}`} />
            <span>{gasState.isConnected ? 'Google Sheets Live' : 'Google Sheets (Simulasi)'}</span>
            <span className={`w-1.5 h-1.5 rounded-full ${gasState.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          </button>

          {/* Quick Catat button for anggota */}
          {user?.role === 'anggota' && onOpenQuickCatat && (
            <button
              type="button"
              onClick={onOpenQuickCatat}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-xs transition-colors"
            >
              <span>+ Catat Aktivitas</span>
            </button>
          )}

          {/* User profile dropdown / preview */}
          {user && (
            <div className="flex items-center gap-3 pl-2 sm:border-l sm:border-slate-200">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-slate-900 line-clamp-1">{user.nama}</div>
                <div className="flex items-center justify-end gap-1.5 mt-0.5">
                  <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded border ${roleBadge.color}`}>
                    {roleBadge.label}
                  </span>
                  <span className="text-[10px] text-slate-400">@{user.username}</span>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs border border-emerald-200">
                {user.nama ? user.nama.charAt(0).toUpperCase() : 'U'}
              </div>

              <button
                type="button"
                onClick={onLogout}
                title="Keluar (Logout)"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

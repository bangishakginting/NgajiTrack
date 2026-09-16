import React from 'react';
import { UserRole } from '../types/user';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  BookMarked,
  FileSpreadsheet,
  Settings,
  LogOut,
  PlusCircle,
  History,
  User as UserIcon,
  HelpCircle
} from 'lucide-react';

interface SidebarProps {
  role: UserRole;
  activeMenu: string;
  onSelectMenu: (menu: string) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  role,
  activeMenu,
  onSelectMenu,
  onLogout
}) => {
  const getNavItems = () => {
    if (role === 'admin') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'naqib', label: 'Data Naqib', icon: UserCheck },
        { id: 'anggota', label: 'Data Anggota', icon: Users },
        { id: 'aktivitas', label: 'Aktivitas Setoran', icon: BookMarked },
        { id: 'laporan', label: 'Laporan', icon: FileSpreadsheet },
        { id: 'settings', label: 'Settings & GAS Guide', icon: Settings },
      ];
    }
    if (role === 'naqib') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'anggota', label: 'Anggota Saya', icon: Users },
        { id: 'aktivitas', label: 'Aktivitas Setoran', icon: BookMarked },
        { id: 'laporan', label: 'Laporan Setoran', icon: FileSpreadsheet },
      ];
    }
    // anggota
    return [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'catat', label: 'Catat Aktivitas', icon: PlusCircle },
      { id: 'riwayat', label: 'Riwayat Setoran', icon: History },
      { id: 'profil', label: 'Profil Saya', icon: UserIcon },
    ];
  };

  const navItems = getNavItems();

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 bg-white border-r border-slate-200/80 p-4 h-[calc(100vh-61px)] sticky top-[61px] justify-between">
      {/* Menu items */}
      <div className="space-y-1">
        <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Menu Utama ({role})
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeMenu === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              type="button"
              onClick={() => onSelectMenu(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Footer in Sidebar */}
      <div className="pt-4 border-t border-slate-100 space-y-1">
        <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100 text-xs text-emerald-800">
          <div className="font-semibold flex items-center gap-1.5 mb-1">
            <BookMarked className="w-3.5 h-3.5 text-emerald-600" />
            <span>Al-Qur'anul Karim</span>
          </div>
          <p className="text-[11px] text-emerald-700/90 leading-tight">
            "Sebaik-baik kalian adalah orang yang belajar Al-Qur'an dan mengajarkannya."
          </p>
        </div>

        <button
          type="button"
          id="btn-sidebar-logout"
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
        >
          <LogOut className="w-4 h-4 text-rose-500" />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
};

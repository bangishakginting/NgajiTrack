import React from 'react';
import { UserRole } from '../types/user';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  BookMarked,
  FileSpreadsheet,
  Settings,
  PlusCircle,
  History,
  User as UserIcon,
  LogOut,
  X
} from 'lucide-react';

interface MobileNavProps {
  role: UserRole;
  activeMenu: string;
  onSelectMenu: (menu: string) => void;
  onLogout: () => void;
  isDrawerOpen: boolean;
  onCloseDrawer: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  role,
  activeMenu,
  onSelectMenu,
  onLogout,
  isDrawerOpen,
  onCloseDrawer
}) => {
  const getNavItems = () => {
    if (role === 'admin') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'naqib', label: 'Naqib', icon: UserCheck },
        { id: 'anggota', label: 'Anggota', icon: Users },
        { id: 'aktivitas', label: 'Aktivitas', icon: BookMarked },
        { id: 'laporan', label: 'Laporan', icon: FileSpreadsheet },
        { id: 'settings', label: 'Settings', icon: Settings },
      ];
    }
    if (role === 'naqib') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'anggota', label: 'Anggota', icon: Users },
        { id: 'aktivitas', label: 'Aktivitas', icon: BookMarked },
        { id: 'laporan', label: 'Laporan', icon: FileSpreadsheet },
      ];
    }
    // anggota
    return [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'catat', label: 'Catat', icon: PlusCircle },
      { id: 'riwayat', label: 'Riwayat', icon: History },
      { id: 'profil', label: 'Profil', icon: UserIcon },
    ];
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Mobile Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseDrawer}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-white shadow-xl flex flex-col justify-between p-4 z-10 border-r border-slate-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <span className="font-bold text-slate-900 text-lg">NGajiTrack</span>
                <button
                  type="button"
                  onClick={onCloseDrawer}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeMenu === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelectMenu(item.id);
                        onCloseDrawer();
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-emerald-600 text-white font-semibold'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  onCloseDrawer();
                  onLogout();
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="w-5 h-5" />
                <span>Keluar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 shadow-lg">
        <div className="flex items-center justify-around">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectMenu(item.id)}
                className={`flex flex-col items-center justify-center min-w-[60px] py-1.5 px-2 rounded-lg text-[10px] font-medium transition-colors ${
                  isActive ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div
                  className={`p-1 rounded-md mb-0.5 ${
                    isActive ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="truncate max-w-[64px]">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

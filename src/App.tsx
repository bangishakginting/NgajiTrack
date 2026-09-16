import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types/user';
import { authService } from './services/auth';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { Modal } from './components/Modal';
import { FormInputAktivitas } from './components/FormInputAktivitas';

// Pages
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { NaqibDashboard } from './pages/NaqibDashboard';
import { AnggotaDashboard } from './pages/AnggotaDashboard';
import { NaqibPage } from './pages/Naqib';
import { AnggotaPage } from './pages/Anggota';
import { AktivitasPage } from './pages/Aktivitas';
import { RiwayatPage } from './pages/Riwayat';
import { ProfilPage } from './pages/Profil';
import { LaporanPage } from './pages/Laporan';
import { SettingsPage } from './pages/SettingsPage';
import { DetailAnggota } from './pages/DetailAnggota';

export default function App() {
  const [user, setUser] = useState<User | null>(() => authService.getUser());
  const [activeMenu, setActiveMenu] = useState<string>('dashboard');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isCatatModalOpen, setIsCatatModalOpen] = useState<boolean>(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
  const [catatSuccessNotification, setCatatSuccessNotification] = useState<string | null>(null);

  // Sync auth on load
  useEffect(() => {
    const savedUser = authService.getUser();
    if (savedUser) setUser(savedUser);
  }, []);

  const handleLoginSuccess = (loggedInUser: User) => {
    authService.setUser(loggedInUser);
    setUser(loggedInUser);
    setActiveMenu('dashboard');
    setSelectedMemberId(null);
  };

  const handleLogout = () => {
    authService.clearUser();
    setUser(null);
    setActiveMenu('dashboard');
    setSelectedMemberId(null);
  };

  const handleSelectMenu = (menu: string) => {
    if (menu === 'catat') {
      setIsCatatModalOpen(true);
      return;
    }
    if (menu === 'logout') {
      handleLogout();
      return;
    }
    setSelectedMemberId(null);
    setActiveMenu(menu);
  };

  const handleActivitySaved = () => {
    setIsCatatModalOpen(false);
    setCatatSuccessNotification("Alhamdulillah, setoran tilawah berhasil disimpan!");
    setTimeout(() => {
      setCatatSuccessNotification(null);
    }, 4000);
  };

  // If user is not logged in, render the login page
  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Render content depending on active menu and role
  const renderContent = () => {
    // If viewing member details
    if (selectedMemberId) {
      return (
        <DetailAnggota
          anggotaId={selectedMemberId}
          onBack={() => setSelectedMemberId(null)}
        />
      );
    }

    // Role-specific screens
    if (user.role === 'admin') {
      switch (activeMenu) {
        case 'dashboard':
          return <AdminDashboard />;
        case 'naqib':
          return <NaqibPage />;
        case 'anggota':
          return (
            <AnggotaPage
              role="admin"
              onViewDetail={(id) => setSelectedMemberId(id)}
            />
          );
        case 'aktivitas':
          return <AktivitasPage role="admin" onOpenCatat={() => setIsCatatModalOpen(true)} />;
        case 'laporan':
          return <LaporanPage role="admin" />;
        case 'settings':
          return <SettingsPage />;
        default:
          return <AdminDashboard />;
      }
    }

    if (user.role === 'naqib') {
      switch (activeMenu) {
        case 'dashboard':
          return (
            <NaqibDashboard
              onViewMemberDetail={(id) => setSelectedMemberId(id)}
            />
          );
        case 'anggota':
          return (
            <AnggotaPage
              role="naqib"
              onViewDetail={(id) => setSelectedMemberId(id)}
            />
          );
        case 'aktivitas':
          return <AktivitasPage role="naqib" onOpenCatat={() => setIsCatatModalOpen(true)} />;
        case 'laporan':
          return <LaporanPage role="naqib" />;
        default:
          return (
            <NaqibDashboard
              onViewMemberDetail={(id) => setSelectedMemberId(id)}
            />
          );
      }
    }

    // anggota
    switch (activeMenu) {
      case 'dashboard':
        return (
          <AnggotaDashboard
            onOpenCatat={() => setIsCatatModalOpen(true)}
          />
        );
      case 'riwayat':
        return (
          <RiwayatPage
            onOpenCatat={() => setIsCatatModalOpen(true)}
          />
        );
      case 'profil':
        return <ProfilPage user={user} />;
      default:
        return (
          <AnggotaDashboard
            onOpenCatat={() => setIsCatatModalOpen(true)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased text-slate-800">
      {/* Top Navbar */}
      <Navbar
        user={user}
        onLogout={handleLogout}
        onOpenQuickCatat={user.role === 'anggota' ? () => setIsCatatModalOpen(true) : undefined}
        onToggleMobileMenu={() => setIsMobileDrawerOpen(true)}
        activeMenu={activeMenu}
        onSelectMenu={handleSelectMenu}
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar */}
        <Sidebar
          role={user.role}
          activeMenu={activeMenu}
          onSelectMenu={handleSelectMenu}
          onLogout={handleLogout}
        />

        {/* Mobile Navigation & Drawer */}
        <MobileNav
          role={user.role}
          activeMenu={activeMenu}
          onSelectMenu={handleSelectMenu}
          onLogout={handleLogout}
          isDrawerOpen={isMobileDrawerOpen}
          onCloseDrawer={() => setIsMobileDrawerOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-full">
          {/* Global Success Notification Toast */}
          {catatSuccessNotification && (
            <div className="mb-5 p-3.5 bg-emerald-600 text-white text-xs font-semibold rounded-xl shadow-md flex items-center justify-between">
              <span>{catatSuccessNotification}</span>
              <button
                type="button"
                onClick={() => setCatatSuccessNotification(null)}
                className="text-white/80 hover:text-white font-bold ml-3"
              >
                &times;
              </button>
            </div>
          )}

          {renderContent()}
        </main>
      </div>

      {/* "+ Catat Aktivitas" Modal Form */}
      <Modal
        id="modal-catat-aktivitas"
        isOpen={isCatatModalOpen}
        onClose={() => setIsCatatModalOpen(false)}
        title="Catat Aktivitas Tilawah Al-Qur'an"
        maxWidth="md"
      >
        <FormInputAktivitas
          onSuccess={handleActivitySaved}
          onCancel={() => setIsCatatModalOpen(false)}
        />
      </Modal>
    </div>
  );
}

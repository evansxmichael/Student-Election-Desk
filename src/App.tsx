import React from 'react';
import { ElectionProvider, useElection } from './context/ElectionContext';
import { LoginPage } from './components/LoginPage';
import { Header } from './components/Header';
import { VoterList } from './components/VoterList';
import { StatsView } from './components/StatsView';
import { AddStudentModal } from './components/AddStudentModal';
import { ToolsView } from './components/ToolsView';
import { BottomNav } from './components/BottomNav';
import { PrintRegister } from './components/PrintRegister';

const MainContent: React.FC = () => {
  const { activeTab, setActiveTab, isAuthenticated, userRole } = useElection();

  React.useEffect(() => {
    if (activeTab === 'tools' && userRole !== 'admin') {
      setActiveTab('voters');
    }
  }, [activeTab, userRole, setActiveTab]);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      <Header />
      <main className="flex-1 bg-[#f8fafc]">
        {activeTab === 'voters' && <VoterList />}
        {activeTab === 'stats' && <StatsView />}
        {activeTab === 'add' && <AddStudentModal />}
        {activeTab === 'tools' && userRole === 'admin' && <ToolsView />}
      </main>
      <BottomNav />
      <PrintRegister />
    </div>
  );
};

export default function App() {
  return (
    <ElectionProvider>
      <MainContent />
    </ElectionProvider>
  );
}

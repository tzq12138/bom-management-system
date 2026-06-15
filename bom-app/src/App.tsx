import { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { NewProjectModal } from './components/NewProjectModal';
import { Activity } from './pages/Activity';
import { BOMDetail } from './pages/BOMDetail';
import { Dashboard } from './pages/Dashboard';
import { Help } from './pages/Help';
import { Login } from './pages/Login';
import { Materials } from './pages/Materials';
import { Modules } from './pages/Modules';
import { Projects } from './pages/Projects';
import { Settings } from './pages/Settings';
import { ROLE_PERMISSIONS, type PageRoute, type User } from './types';
import { restoreSession } from './services/storage';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<PageRoute>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      setCurrentUser(await restoreSession());
      setIsLoading(false);
    }

    void loadSession();
  }, []);

  useEffect(() => {
    if (!currentUser && !isLoading) {
      setCurrentPage('login');
    }
  }, [currentUser, isLoading]);

  const handleNavigate = (page: PageRoute) => {
    setCurrentPage(page);
    setSelectedProjectId(null);
  };

  const handleNavigateToProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentPage('projects');
  };

  const handleNewProjectCreated = (projectId: string) => {
    setShowNewProjectModal(false);
    setSelectedProjectId(projectId);
    setCurrentPage('projects');
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentPage('login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-primary">Loading...</div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLoginSuccess={handleLogin} />;
  }

  const permissions = ROLE_PERMISSIONS[currentUser.role];

  if (currentPage === 'settings') {
    return <Settings onLogout={handleLogout} onBack={() => handleNavigate('dashboard')} />;
  }

  if (currentPage === 'help') {
    return <Help onBack={() => handleNavigate('dashboard')} />;
  }

  const renderPage = () => {
    if (selectedProjectId) {
      return (
        <BOMDetail
          projectId={selectedProjectId}
          onBack={() => setSelectedProjectId(null)}
          canEdit={permissions.canEdit}
          canApprove={permissions.canApprove}
        />
      );
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigateToProject={handleNavigateToProject} onNavigate={handleNavigate} />;
      case 'projects':
        return (
          <Projects
            onNavigateToProject={handleNavigateToProject}
            onNewProject={() => setShowNewProjectModal(true)}
            canCreate={permissions.canCreate}
            canDelete={permissions.canDelete}
          />
        );
      case 'modules':
        return <Modules canEdit={permissions.canEdit} canDelete={permissions.canDelete} />;
      case 'materials':
        return (
          <Materials
            canCreate={permissions.canCreate}
            canEdit={permissions.canEdit}
            canDelete={permissions.canDelete}
          />
        );
      case 'activity':
        return <Activity />;
      default:
        return <Dashboard onNavigateToProject={handleNavigateToProject} onNavigate={handleNavigate} />;
    }
  };

  const getPageTitle = () => {
    if (selectedProjectId) return null;

    switch (currentPage) {
      case 'dashboard':
        return 'BOM Catalyst';
      case 'projects':
      case 'materials':
      case 'activity':
        return null;
      default:
        return 'BOM Catalyst';
    }
  };

  return (
    <div className="bg-surface text-on-surface antialiased overflow-hidden w-full h-screen flex font-body">
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onNewProject={() => setShowNewProjectModal(true)}
      />

      <div className="ml-0 md:ml-64 flex-1 flex flex-col h-full overflow-hidden relative">
        {!selectedProjectId && (
          <Topbar
            title={getPageTitle() || undefined}
            onNavigate={handleNavigate}
          />
        )}

        <main className={`flex-1 overflow-y-auto ${selectedProjectId ? '' : 'pt-24 px-8 pb-12'}`}>
          {renderPage()}
        </main>
      </div>

      <NewProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        onCreated={handleNewProjectCreated}
      />
    </div>
  );
}

export default App;

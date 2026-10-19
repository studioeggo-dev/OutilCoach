import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { WorkspaceThemeProvider } from './context/WorkspaceThemeContext';
import { AuthScreen } from './components/AuthScreen';
import { Sidebar, NavigationTab } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardHome } from './components/DashboardHome';
import { SettingsPage } from './components/SettingsPage';
import { ClientsPage } from './components/ClientsPage';
import { ModulesCatalogPage } from './components/ModulesCatalogPage';
import { CatalogPage } from './components/CatalogPage';
import { DiagnosticWorkflowPage } from './components/DiagnosticWorkflowPage';
import { ClientPortalView } from './components/ClientPortalView';
import { Loader2 } from 'lucide-react';
import { LudiClientProfil, Genre } from './services/ludiDiagnostic';

export default function App() {
  const { user, workspace, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [diagnosticClient, setDiagnosticClient] = useState<Partial<LudiClientProfil> | null>(null);
  
  // Client portal view state
  const [clientPortalActive, setClientPortalActive] = useState(false);
  const [activeClientParams, setActiveClientParams] = useState<{
    token?: string;
    workspaceId?: string;
  } | null>(null);

  // Check URL query parameters for direct client access (e.g. /?token=xxx&ws=yyy)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const urlWs = params.get('ws');

    if (urlToken && urlWs) {
      setActiveClientParams({ token: urlToken, workspaceId: urlWs });
      setClientPortalActive(true);
    } else if (params.get('client_view') === 'true') {
      setClientPortalActive(true);
    }
  }, []);

  // Show full loading state while Firebase auth initializes
  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-stone-900 text-white flex items-center justify-center font-bold tracking-tight text-xl shadow-xs">
          T
        </div>
        <div className="flex items-center gap-2 text-stone-500 text-xs font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-stone-700" />
          <span>Initialisation sécurisée de THRYVE...</span>
        </div>
      </div>
    );
  }

  // 1. Client Diagnostic Portal View (Public by Token or Simulated by Coach)
  if (clientPortalActive) {
    return (
      <WorkspaceThemeProvider currentWorkspace={workspace}>
        <ClientPortalView 
          token={activeClientParams?.token}
          workspaceId={activeClientParams?.workspaceId || workspace?.id}
          onBackToDashboard={user ? () => {
            setClientPortalActive(false);
            setActiveClientParams(null);
            // Clean URL query params if returning to coach dashboard
            if (window.history.pushState) {
              window.history.pushState({}, document.title, window.location.pathname);
            }
          } : undefined}
        />
      </WorkspaceThemeProvider>
    );
  }

  // 2. Unauthenticated Coach Protection:
  // Strict gate: If not logged in and not accessing a client link, render AuthScreen
  // No private coach routes or data are exposed
  if (!user) {
    return (
      <AuthScreen 
        onPreviewClient={() => {
          setActiveClientParams(null);
          setClientPortalActive(true);
        }}
      />
    );
  }

  // 3. Authenticated Coach Workspace with dynamic Workspace Theme
  return (
    <WorkspaceThemeProvider currentWorkspace={workspace}>
      <div className="min-h-screen bg-stone-50 flex flex-col lg:flex-row antialiased">
        {/* Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            if (tab === 'client_preview') {
              setActiveClientParams(null);
              setClientPortalActive(true);
            } else {
              setCurrentTab(tab);
            }
          }}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header 
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
            onPreviewClient={() => {
              setActiveClientParams(null);
              setClientPortalActive(true);
            }}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            {currentTab === 'dashboard' && (
              <DashboardHome 
                onNavigate={(tab) => setCurrentTab(tab)}
                onPreviewClient={() => {
                  setActiveClientParams(null);
                  setClientPortalActive(true);
                }}
              />
            )}

            {currentTab === 'diagnostic' && (
              <DiagnosticWorkflowPage 
                onGoToClients={() => {
                  setDiagnosticClient(null);
                  setCurrentTab('clients');
                }} 
                initialClient={diagnosticClient}
              />
            )}

            {currentTab === 'clients' && (
              <ClientsPage 
                onPreviewClientAssignment={(assignmentId, workspaceId, token) => {
                  setActiveClientParams({ token, workspaceId });
                  setClientPortalActive(true);
                }}
                onStartDiagnosticForClient={(client) => {
                  setDiagnosticClient({
                    id: client.id,
                    nom: client.lastName,
                    prenom: client.firstName,
                    email: client.email,
                    telephone: client.phone || '',
                    adresse: client.adresse || '',
                    codePostal: client.codePostal || '',
                    ville: client.ville || '',
                    genre: (client.genre as Genre) || '',
                    age: client.age || '',
                    couleurs: client.couleurs || [],
                    styles: client.styles || [],
                    creeLe: client.createdAt
                  });
                  setCurrentTab('diagnostic');
                }}
              />
            )}

            {currentTab === 'catalog' && (
              <CatalogPage />
            )}

            {currentTab === 'modules' && (
              <ModulesCatalogPage />
            )}

            {currentTab === 'settings' && (
              <SettingsPage 
                onPreviewClient={() => {
                  setActiveClientParams(null);
                  setClientPortalActive(true);
                }}
              />
            )}
          </main>
        </div>
      </div>
    </WorkspaceThemeProvider>
  );
}

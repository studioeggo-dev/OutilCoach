import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Workspace, WorkspaceBranding } from '../types';

interface WorkspaceThemeContextType {
  workspace: Workspace | null;
  brand: WorkspaceBranding;
  isCustomized: boolean;
  updateWorkspaceBrand: (brandUpdate: Partial<WorkspaceBranding>) => Promise<void>;
  setExplicitWorkspace: (workspace: Workspace | null) => void;
  cssVariables: Record<string, string>;
}

// Default THRYVE platform branding (Neutral, Premium, Human SaaS)
export const DEFAULT_THRYVE_BRAND: WorkspaceBranding = {
  displayName: 'Espace Coaching THRYVE',
  tagline: 'Grow beyond limits',
  primaryColor: '#0F766E', // Forest / deep teal
  secondaryColor: '#F0FDFA', // Soft tinted surface
  accentColor: '#D97706', // Warm amber
  clientWelcomeMessage: 'Bienvenue sur votre portail d\'accompagnement et de diagnostic.'
};

const WorkspaceThemeContext = createContext<WorkspaceThemeContextType | undefined>(undefined);

export const WorkspaceThemeProvider: React.FC<{
  currentWorkspace: Workspace | null;
  onSaveWorkspaceBrand?: (newBrand: WorkspaceBranding) => Promise<void>;
  children: React.ReactNode;
}> = ({ currentWorkspace, onSaveWorkspaceBrand, children }) => {
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(currentWorkspace);

  useEffect(() => {
    setActiveWorkspace(currentWorkspace);
  }, [currentWorkspace]);

  const brand = activeWorkspace?.brand || DEFAULT_THRYVE_BRAND;

  // Compute dynamic CSS variables for theme injection
  const cssVariables = useMemo(() => {
    return {
      '--brand-primary': brand.primaryColor,
      '--brand-secondary': brand.secondaryColor,
      '--brand-accent': brand.accentColor || '#D97706',
    };
  }, [brand]);

  // Apply to document root for global CSS access
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--brand-primary', brand.primaryColor);
    root.style.setProperty('--brand-secondary', brand.secondaryColor);
    root.style.setProperty('--brand-accent', brand.accentColor || '#D97706');
  }, [brand]);

  const updateWorkspaceBrand = async (brandUpdate: Partial<WorkspaceBranding>) => {
    if (!activeWorkspace) return;
    const updatedBrand: WorkspaceBranding = {
      ...activeWorkspace.brand,
      ...brandUpdate
    };
    const updatedWorkspace: Workspace = {
      ...activeWorkspace,
      brand: updatedBrand,
      updatedAt: new Date().toISOString()
    };
    setActiveWorkspace(updatedWorkspace);

    if (onSaveWorkspaceBrand) {
      await onSaveWorkspaceBrand(updatedBrand);
    }
  };

  const isCustomized = Boolean(
    activeWorkspace?.brand && 
    (activeWorkspace.brand.primaryColor !== DEFAULT_THRYVE_BRAND.primaryColor ||
     activeWorkspace.brand.displayName !== DEFAULT_THRYVE_BRAND.displayName ||
     activeWorkspace.brand.logoUrl)
  );

  return (
    <WorkspaceThemeContext.Provider
      value={{
        workspace: activeWorkspace,
        brand,
        isCustomized,
        updateWorkspaceBrand,
        setExplicitWorkspace: setActiveWorkspace,
        cssVariables
      }}
    >
      <div style={cssVariables as React.CSSProperties} className="contents">
        {children}
      </div>
    </WorkspaceThemeContext.Provider>
  );
};

export function useWorkspaceTheme(): WorkspaceThemeContextType {
  const context = useContext(WorkspaceThemeContext);
  if (!context) {
    throw new Error('useWorkspaceTheme must be used within a WorkspaceThemeProvider');
  }
  return context;
}

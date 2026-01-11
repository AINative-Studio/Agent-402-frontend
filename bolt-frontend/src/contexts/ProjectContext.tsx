import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Project } from '../lib/types';

interface ProjectContextType {
  currentProject: Project | null;
  projects: Project[];
  setCurrentProject: (project: Project | null) => void;
  setProjects: (projects: Project[]) => void;
  isLoading: boolean;
}

const ProjectContext = createContext<ProjectContextType | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Restore selected project from localStorage on mount
  useEffect(() => {
    const savedProjectId = localStorage.getItem('selectedProjectId');
    if (savedProjectId && projects.length > 0) {
      const project = projects.find(p => p.project_id === savedProjectId);
      if (project) {
        setCurrentProject(project);
      }
    }
    setIsLoading(false);
  }, [projects]);

  // Save selected project to localStorage when it changes
  useEffect(() => {
    if (currentProject) {
      localStorage.setItem('selectedProjectId', currentProject.project_id);
    } else {
      localStorage.removeItem('selectedProjectId');
    }
  }, [currentProject]);

  return (
    <ProjectContext.Provider
      value={{
        currentProject,
        projects,
        setCurrentProject,
        setProjects,
        isLoading,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjectContext() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjectContext must be used within ProjectProvider');
  }
  return context;
}

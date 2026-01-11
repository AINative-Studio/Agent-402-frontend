import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Project } from '../lib/types';
import { apiClient } from '../lib/apiClient';

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

  // Fetch projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await apiClient.get('/projects');
        const projectsList: Project[] = response.data.items || response.data || [];
        setProjects(projectsList);

        // Try to restore saved project
        const savedProjectId = localStorage.getItem('selectedProjectId');
        if (savedProjectId && projectsList.length > 0) {
          const savedProject = projectsList.find(p => p.project_id === savedProjectId);
          if (savedProject) {
            setCurrentProject(savedProject);
            localStorage.setItem('projectId', savedProject.project_id);
          } else {
            // Saved project not found, use first available
            setCurrentProject(projectsList[0]);
            localStorage.setItem('projectId', projectsList[0].project_id);
            localStorage.setItem('selectedProjectId', projectsList[0].project_id);
          }
        } else if (projectsList.length > 0) {
          // No saved project, use first available
          setCurrentProject(projectsList[0]);
          localStorage.setItem('projectId', projectsList[0].project_id);
          localStorage.setItem('selectedProjectId', projectsList[0].project_id);
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Save selected project to localStorage when it changes
  useEffect(() => {
    if (currentProject) {
      localStorage.setItem('selectedProjectId', currentProject.project_id);
      localStorage.setItem('projectId', currentProject.project_id);
    } else {
      localStorage.removeItem('selectedProjectId');
      localStorage.removeItem('projectId');
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

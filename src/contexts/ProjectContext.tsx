import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Project } from '../lib/types';
import { apiClient } from '../lib/apiClient';
import { useAuthContext } from './AuthContext';

interface ProjectContextType {
    currentProject: Project | null;
    projects: Project[];
    setCurrentProject: (project: Project | null) => void;
    setProjects: (projects: Project[]) => void;
    isLoading: boolean;
    refetch: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
    const { isAuthenticated, token } = useAuthContext();
    const [currentProject, setCurrentProject] = useState<Project | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchProjects = async () => {
        if (!isAuthenticated || !token) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const response = await apiClient.get('/projects');
            // Backend returns { projects: [...], total: N }
            const rawProjects = response.data.projects || response.data.items || [];
            // Map backend format to frontend Project type
            const projectsList: Project[] = rawProjects.map((p: Record<string, unknown>) => ({
                project_id: (p.id as string) || (p.project_id as string) || '',
                name: (p.name as string) || '',
                description: p.description as string | undefined,
                tier: ((p.tier as string) || 'free').toLowerCase() as 'free' | 'pro' | 'enterprise',
                created_at: (p.created_at as string) || new Date().toISOString(),
                updated_at: (p.updated_at as string) || new Date().toISOString(),
            }));
            setProjects(projectsList);

            // Try to restore saved project
            const savedProjectId = localStorage.getItem('selectedProjectId');
            if (savedProjectId && projectsList.length > 0) {
                const savedProject = projectsList.find(p => p.project_id === savedProjectId);
                if (savedProject) {
                    setCurrentProject(savedProject);
                    localStorage.setItem('projectId', savedProject.project_id ?? savedProject.id ?? '');
                } else {
                    // Saved project not found, use first available
                    setCurrentProject(projectsList[0]);
                    localStorage.setItem('projectId', projectsList[0].project_id ?? projectsList[0].id ?? '');
                    localStorage.setItem('selectedProjectId', projectsList[0].project_id ?? projectsList[0].id ?? '');
                }
            } else if (projectsList.length > 0) {
                // No saved project, use first available
                setCurrentProject(projectsList[0]);
                localStorage.setItem('projectId', projectsList[0].project_id ?? projectsList[0].id ?? '');
                localStorage.setItem('selectedProjectId', projectsList[0].project_id ?? projectsList[0].id ?? '');
            }
        } catch (error) {
            console.error('Failed to fetch projects:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch projects when authenticated
    useEffect(() => {
        if (isAuthenticated && token) {
            fetchProjects();
        }
    }, [isAuthenticated, token]);

    // Save selected project to localStorage when it changes
    useEffect(() => {
        if (currentProject) {
            const projectId = currentProject.project_id ?? currentProject.id ?? '';
            localStorage.setItem('selectedProjectId', projectId);
            localStorage.setItem('projectId', projectId);
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
                refetch: fetchProjects,
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

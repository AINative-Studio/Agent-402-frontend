import { useState } from 'react';
import { ChevronDown, FolderOpen, Check } from 'lucide-react';
import { useProjectContext } from '../contexts/ProjectContext';
import type { Project } from '../lib/types';

export function ProjectSelector() {
  const { currentProject, projects, setCurrentProject } = useProjectContext();
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (project: Project) => {
    setCurrentProject(project);
    setIsOpen(false);
  };

  if (projects.length === 0) {
    return (
      <div className="px-3 py-2 text-[var(--muted)] text-sm">
        No projects available
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-[var(--surface-2)] hover:bg-[var(--surface)] rounded-lg text-[var(--text)] transition-colors border border-[var(--border)]"
      >
        <div className="flex items-center gap-2 truncate">
          <FolderOpen className="w-4 h-4 text-[var(--primary)] flex-shrink-0" />
          <span className="truncate text-sm">
            {currentProject?.name || 'Select Project'}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--surface)] rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto border border-[var(--border)]">
            {projects.map((project) => (
              <button
                key={project.project_id}
                onClick={() => handleSelect(project)}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-[var(--surface-2)] text-[var(--text)] text-left transition-colors first:rounded-t-lg last:rounded-b-lg"
              >
                <span className="truncate text-sm">{project.name}</span>
                {currentProject?.project_id === project.project_id && (
                  <Check className="w-4 h-4 text-[var(--success)] flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

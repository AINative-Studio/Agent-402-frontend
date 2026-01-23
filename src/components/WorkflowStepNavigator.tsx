import { useEffect } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, Clock, AlertCircle, Loader } from 'lucide-react';
import type { WorkflowStep, StepStatus, WorkflowStepInfo } from '../lib/types';

interface WorkflowStepNavigatorProps {
  currentStep: WorkflowStep;
  onStepChange: (step: WorkflowStep) => void;
  stepStatuses: Record<WorkflowStep, StepStatus>;
  className?: string;
}

const WORKFLOW_STEPS: WorkflowStepInfo[] = [
  {
    step: 'analysis',
    label: 'Analysis',
    description: 'Market analysis and investment recommendations',
    agentRole: 'Financial Analyst',
    order: 1,
  },
  {
    step: 'compliance',
    label: 'Compliance',
    description: 'KYC/KYT checks and regulatory compliance',
    agentRole: 'Compliance Officer',
    order: 2,
  },
  {
    step: 'transaction',
    label: 'Transaction',
    description: 'Transaction execution and confirmation',
    agentRole: 'Transaction Executor',
    order: 3,
  },
];

const getStatusIcon = (status: StepStatus) => {
  switch (status) {
    case 'complete':
      return <CheckCircle className="w-5 h-5 text-[var(--success)]" />;
    case 'active':
      return <Loader className="w-5 h-5 text-[var(--primary)] animate-spin" />;
    case 'error':
      return <AlertCircle className="w-5 h-5 text-[var(--error)]" />;
    case 'pending':
    default:
      return <Clock className="w-5 h-5 text-[var(--muted)]" />;
  }
};

const getStatusColor = (status: StepStatus): string => {
  switch (status) {
    case 'complete':
      return 'border-[var(--success)] bg-[var(--success)]/10';
    case 'active':
      return 'border-[var(--primary)] bg-[var(--primary)]/10';
    case 'error':
      return 'border-[var(--error)] bg-[var(--error)]/10';
    case 'pending':
    default:
      return 'border-[var(--border)] bg-[var(--surface-2)]';
  }
};

export function WorkflowStepNavigator({
  currentStep,
  onStepChange,
  stepStatuses,
  className = '',
}: WorkflowStepNavigatorProps) {
  const currentIndex = WORKFLOW_STEPS.findIndex((s) => s.step === currentStep);
  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex < WORKFLOW_STEPS.length - 1;

  const completedSteps = WORKFLOW_STEPS.filter(
    (step) => stepStatuses[step.step] === 'complete'
  ).length;
  const progressPercentage = (completedSteps / WORKFLOW_STEPS.length) * 100;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && canGoBack) {
        e.preventDefault();
        onStepChange(WORKFLOW_STEPS[currentIndex - 1].step);
      } else if (e.key === 'ArrowRight' && canGoForward) {
        e.preventDefault();
        onStepChange(WORKFLOW_STEPS[currentIndex + 1].step);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, canGoBack, canGoForward, onStepChange]);

  const handlePrevious = () => {
    if (canGoBack) {
      onStepChange(WORKFLOW_STEPS[currentIndex - 1].step);
    }
  };

  const handleNext = () => {
    if (canGoForward) {
      onStepChange(WORKFLOW_STEPS[currentIndex + 1].step);
    }
  };

  return (
    <div className={`bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold mb-1">Workflow Progress</h2>
          <p className="text-sm text-[var(--muted)]">
            Step {currentIndex + 1} of {WORKFLOW_STEPS.length} - {Math.round(progressPercentage)}% Complete
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrevious}
            disabled={!canGoBack}
            className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-2)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous step"
            title="Previous step (Left Arrow)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            disabled={!canGoForward}
            className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-2)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Next step"
            title="Next step (Right Arrow)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--primary)] transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Step Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {WORKFLOW_STEPS.map((step) => {
          const isActive = step.step === currentStep;
          const status = stepStatuses[step.step];

          return (
            <button
              key={step.step}
              onClick={() => onStepChange(step.step)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                isActive
                  ? 'border-[var(--primary)] bg-[var(--primary)]/5 shadow-lg'
                  : getStatusColor(status)
              } hover:shadow-md`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getStatusIcon(status)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-[var(--muted)]">
                      Step {step.order}
                    </span>
                    {isActive && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--primary)] text-white">
                        Current
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{step.label}</h3>
                  <p className="text-xs text-[var(--muted)] mb-2 line-clamp-2">
                    {step.description}
                  </p>
                  <p className="text-xs font-medium text-[var(--primary)]">{step.agentRole}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Mobile Step Indicators */}
      <div className="md:hidden flex justify-center gap-2 mt-4">
        {WORKFLOW_STEPS.map((step) => (
          <button
            key={step.step}
            onClick={() => onStepChange(step.step)}
            className={`w-3 h-3 rounded-full transition-all ${
              step.step === currentStep
                ? 'bg-[var(--primary)] w-8'
                : stepStatuses[step.step] === 'complete'
                ? 'bg-[var(--success)]'
                : 'bg-[var(--border)]'
            }`}
            aria-label={`Go to ${step.label} step`}
          />
        ))}
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="mt-4 pt-4 border-t border-[var(--border)]">
        <p className="text-xs text-[var(--muted)] text-center">
          Use <kbd className="px-2 py-1 bg-[var(--surface-2)] rounded border border-[var(--border)] font-mono">←</kbd>{' '}
          and <kbd className="px-2 py-1 bg-[var(--surface-2)] rounded border border-[var(--border)] font-mono">→</kbd>{' '}
          arrow keys to navigate
        </p>
      </div>
    </div>
  );
}

export { WORKFLOW_STEPS };

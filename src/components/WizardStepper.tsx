import React from 'react';

interface WizardStepperProps {
  steps: string[];
  step: number;
  className?: string;
}

const WizardStepper: React.FC<WizardStepperProps> = ({ steps, step, className }) => {
  const safeSteps = Array.isArray(steps) ? steps : [];
  const safeStep = Number.isFinite(step) ? Math.max(0, Math.min(step, safeSteps.length - 1)) : 0;
  const progress = safeSteps.length > 0 ? ((safeStep + 1) / safeSteps.length) * 100 : 0;

  return (
    <div className={className ?? ''}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{safeSteps[safeStep] ?? ''}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Passo {safeStep + 1} de {safeSteps.length}
        </p>
      </div>
      <div className="mt-2 h-2 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-pink-500 to-purple-500" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
};

export default WizardStepper;

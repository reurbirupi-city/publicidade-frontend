import React, { useState, useEffect } from 'react';
import { useTutorial, TutorialStep } from '../contexts/TutorialContext';

interface TutorialCardProps {
  step: TutorialStep;
  index: number;
  total: number;
  onDismiss: () => void;
  onDismissAll: () => void;
}

const colorClasses = {
  yellow: {
    bg: 'bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/40 dark:to-yellow-800/40',
    border: 'border-yellow-300 dark:border-yellow-600',
    shadow: 'shadow-yellow-200/50 dark:shadow-yellow-900/30',
    accent: 'bg-yellow-400 dark:bg-yellow-600',
    text: 'text-yellow-900 dark:text-yellow-100',
    icon: 'bg-yellow-300 dark:bg-yellow-700'
  },
  pink: {
    bg: 'bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-900/40 dark:to-pink-800/40',
    border: 'border-pink-300 dark:border-pink-600',
    shadow: 'shadow-pink-200/50 dark:shadow-pink-900/30',
    accent: 'bg-pink-400 dark:bg-pink-600',
    text: 'text-pink-900 dark:text-pink-100',
    icon: 'bg-pink-300 dark:bg-pink-700'
  },
  blue: {
    bg: 'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40',
    border: 'border-blue-300 dark:border-blue-600',
    shadow: 'shadow-blue-200/50 dark:shadow-blue-900/30',
    accent: 'bg-blue-400 dark:bg-blue-600',
    text: 'text-blue-900 dark:text-blue-100',
    icon: 'bg-blue-300 dark:bg-blue-700'
  },
  green: {
    bg: 'bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/40 dark:to-green-800/40',
    border: 'border-green-300 dark:border-green-600',
    shadow: 'shadow-green-200/50 dark:shadow-green-900/30',
    accent: 'bg-green-400 dark:bg-green-600',
    text: 'text-green-900 dark:text-green-100',
    icon: 'bg-green-300 dark:bg-green-700'
  },
  purple: {
    bg: 'bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/40 dark:to-purple-800/40',
    border: 'border-purple-300 dark:border-purple-600',
    shadow: 'shadow-purple-200/50 dark:shadow-purple-900/30',
    accent: 'bg-purple-400 dark:bg-purple-600',
    text: 'text-purple-900 dark:text-purple-100',
    icon: 'bg-purple-300 dark:bg-purple-700'
  },
  orange: {
    bg: 'bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/40 dark:to-orange-800/40',
    border: 'border-orange-300 dark:border-orange-600',
    shadow: 'shadow-orange-200/50 dark:shadow-orange-900/30',
    accent: 'bg-orange-400 dark:bg-orange-600',
    text: 'text-orange-900 dark:text-orange-100',
    icon: 'bg-orange-300 dark:bg-orange-700'
  }
};

const TutorialCard: React.FC<TutorialCardProps> = ({ step, index, total, onDismiss, onDismissAll }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const colors = colorClasses[step.color];

  useEffect(() => {
    // Delay para animação de entrada escalonada
    const timer = setTimeout(() => setIsVisible(true), index * 150);
    return () => clearTimeout(timer);
  }, [index]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(onDismiss, 300);
  };

  const handleDismissAll = () => {
    setIsExiting(true);
    setTimeout(onDismissAll, 300);
  };

  // Rotações sutis para efeito post-it
  const rotations = ['-rotate-1', 'rotate-1', '-rotate-2', 'rotate-2', 'rotate-0'];
  const rotation = rotations[index % rotations.length];

  return (
    <div
      className={`
        transform transition-all duration-500 ease-out
        ${isVisible && !isExiting ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'}
        ${rotation}
        hover:rotate-0 hover:scale-105 hover:z-50
      `}
      style={{
        transitionDelay: isExiting ? '0ms' : `${index * 100}ms`
      }}
    >
      <div
        className={`
          relative w-72 p-5 rounded-lg border-2
          ${colors.bg} ${colors.border}
          shadow-lg ${colors.shadow}
          backdrop-blur-sm
          cursor-default
          transition-shadow duration-300
          hover:shadow-xl
        `}
        style={{
          // Efeito de papel dobrado
          clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%)'
        }}
      >
        {/* Dobra do canto */}
        <div
          className={`absolute top-0 right-0 w-5 h-5 ${colors.accent} opacity-60`}
          style={{
            clipPath: 'polygon(100% 0, 0 100%, 100% 100%)',
            transform: 'translate(0, 0)'
          }}
        />

        {/* Pin/Tack decorativo */}
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
          <div className="w-4 h-4 bg-red-500 rounded-full shadow-md border-2 border-red-600 dark:border-red-400">
            <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 bg-red-300 rounded-full opacity-70" />
          </div>
        </div>

        {/* Contador */}
        <div className={`absolute top-2 right-6 text-xs font-medium ${colors.text} opacity-60`}>
          {index + 1}/{total}
        </div>

        {/* Ícone */}
        <div className={`w-12 h-12 ${colors.icon} rounded-xl flex items-center justify-center text-2xl mb-3 shadow-sm`}>
          {step.icon}
        </div>

        {/* Título */}
        <h3 className={`font-bold text-lg mb-2 ${colors.text} leading-tight`}>
          {step.title}
        </h3>

        {/* Descrição */}
        <p className={`text-sm ${colors.text} opacity-80 leading-relaxed mb-4`}>
          {step.description}
        </p>

        {/* Ações */}
        <div className="flex items-center justify-between pt-2 border-t border-current/10">
          <button
            onClick={handleDismiss}
            className={`
              text-sm font-medium ${colors.text} 
              hover:opacity-100 opacity-70
              transition-all duration-200
              flex items-center gap-1
            `}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Entendi
          </button>
          
          {total > 1 && (
            <button
              onClick={handleDismissAll}
              className={`
                text-xs ${colors.text}
                hover:opacity-100 opacity-50
                transition-all duration-200
              `}
            >
              Dispensar todos
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface TutorialOverlayProps {
  page: string;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ page }) => {
  const { getStepsForPage, dismissStep, tutorialEnabled, viewedSteps } = useTutorial();
  const [steps, setSteps] = useState<TutorialStep[]>([]);

  useEffect(() => {
    if (tutorialEnabled) {
      const pageSteps = getStepsForPage(page);
      setSteps(pageSteps);
    }
  }, [page, tutorialEnabled, viewedSteps]);

  if (!tutorialEnabled || steps.length === 0) {
    return null;
  }

  const handleDismiss = (stepId: string) => {
    dismissStep(stepId);
    setSteps(prev => prev.filter(s => s.id !== stepId));
  };

  const handleDismissAll = () => {
    steps.forEach(step => dismissStep(step.id));
    setSteps([]);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col-reverse gap-4 max-h-[80vh] overflow-y-auto pr-2">
      {steps.map((step, index) => (
        <TutorialCard
          key={step.id}
          step={step}
          index={index}
          total={steps.length}
          onDismiss={() => handleDismiss(step.id)}
          onDismissAll={handleDismissAll}
        />
      ))}
    </div>
  );
};

// Botão para configurações de tutorial
export const TutorialSettingsButton: React.FC = () => {
  const { tutorialEnabled, toggleTutorialEnabled, showAllTutorials, viewedSteps } = useTutorial();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title="Configurações de Tutorial"
      >
        <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-50">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="text-xl">💡</span>
              Dicas de Uso
            </h4>

            <div className="space-y-3">
              {/* Toggle para habilitar/desabilitar */}
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Mostrar dicas
                </span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={tutorialEnabled}
                    onChange={(e) => toggleTutorialEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </div>
              </label>

              {/* Contador de dicas vistas */}
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {viewedSteps.length} dicas visualizadas
              </div>

              {/* Botão para ver todas novamente */}
              <button
                onClick={() => {
                  showAllTutorials();
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Ver todas as dicas novamente
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TutorialOverlay;

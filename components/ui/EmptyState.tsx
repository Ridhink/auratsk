"use client";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ icon = "📋", title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in-scale">
      <div className="text-6xl mb-4 animate-bounce-in">{icon}</div>
      <h3 className="text-xl font-semibold text-white mb-2 animate-slide-in-left">{title}</h3>
      <p className="text-gray-400 max-w-md mb-6 animate-slide-in-right">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/30 hover:-translate-y-0.5 active:translate-y-0"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}


import React from 'react';

const LoadingOverlay: React.FC<{ message?: string }> = ({ message = 'Carregando...' }) => {
  return (
    <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center">
      <div className="bg-white/95 rounded-lg p-6 flex flex-col items-center gap-4 shadow-lg">
        <div className="w-12 h-12 border-4 border-t-brand-blue border-gray-200 rounded-full animate-spin"></div>
        <div className="text-sm text-brand-navy font-medium">{message}</div>
      </div>
    </div>
  );
};

export default LoadingOverlay;

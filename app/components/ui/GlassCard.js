import React from 'react';

const GlassCard = ({ children, className = '', hoverEffect = false }) => {
  return (
    <div 
      className={`
        backdrop-blur-lg rounded-2xl transition-all duration-300
        bg-white/70 border border-gray-200 shadow-sm
        dark:bg-white/5 dark:border-white/10 dark:shadow-[0_4px_30px_rgba(0,0,0,0.1)]
        ${hoverEffect ? 'hover:bg-white/90 hover:shadow-xl hover:-translate-y-1 dark:hover:bg-white/10 dark:hover:border-white/20 dark:hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default GlassCard;

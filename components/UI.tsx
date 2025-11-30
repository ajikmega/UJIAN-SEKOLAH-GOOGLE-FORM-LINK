import React from 'react';

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'danger' | 'success' | 'outline' | 'ghost'; size?: 'sm' | 'md' | 'lg' }> = ({ className = '', variant = 'primary', size = 'md', ...props }) => {
  const base = "rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98] flex items-center justify-center gap-2";
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg"
  };

  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md border border-transparent",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 hover:border-red-300",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm",
    outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900"
  };
  
  return <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props} />;
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = '', ...props }) => (
  <input 
    className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors bg-white ${className}`} 
    {...props} 
  />
);

export const Card: React.FC<{ children: React.ReactNode; title?: string; className?: string; action?: React.ReactNode }> = ({ children, title, className = '', action }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-200/60 overflow-hidden ${className}`}>
    {title && (
      <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
        <h3 className="font-bold text-gray-800 text-lg">{title}</h3>
        {action && <div>{action}</div>}
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode }> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/40 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full relative animate-scale-up overflow-hidden border border-gray-100">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-full transition-colors z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
        <div className="p-6 md:p-8">
          {children}
        </div>
      </div>
    </div>
  );
};
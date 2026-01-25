import React from 'react';

interface CorePageProps {
  children: React.ReactNode;
  className?: string;
}

export const CorePage = ({ children, className = "" }: CorePageProps) => {
  return (
    <div className={`min-h-screen w-full bg-base-300 text-base-content font-sans overflow-y-auto flex flex-col p-6 ${className}`}>
      {children}
    </div>
  );
};
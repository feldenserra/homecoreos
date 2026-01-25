import React from 'react';

interface CoreItemProps {
  children: React.ReactNode;
  grow?: boolean;    
  shrink?: boolean;  
  fixed?: boolean;   
  className?: string;
}

export const CoreItem = ({
  children,
  grow = false,
  shrink = true,
  fixed = false,
  className = ""
}: CoreItemProps) => {
  
  let flexClass = 'flex-initial'; 
  
  if (grow) flexClass = 'flex-1 min-w-0'; 
  if (fixed) flexClass = 'flex-none';
  if (!shrink && !grow && !fixed) flexClass = 'flex-none';

  return (
    <div className={`${flexClass} ${className}`}>
      {children}
    </div>
  );
};
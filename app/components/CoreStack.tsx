import React from 'react';

interface CoreStackProps {
  children: React.ReactNode;
  row?: boolean;         
  reverse?: boolean;     
  spacing?: 0 | 1 | 2 | 3 | 4 | 6 | 8 | 10; 
  className?: string;
  align?: 'start' | 'center' | 'end' | 'baseline' | 'stretch'; 
  justify?: 'start' | 'center' | 'end' | 'between' | 'around'; 
  wrap?: boolean; 
  fullWidth?: boolean;   
  moreClasses?: string;
}

export const CoreStack = ({
  children,
  row = false,
  reverse = false,
  spacing = 4,
  className = "",
  align = 'stretch',
  justify = 'start',
  wrap = false,
  fullWidth = true,
  moreClasses = "",
}: CoreStackProps) => {
  
  const directionClass = row 
    ? (reverse ? 'flex-row-reverse' : 'flex-row') 
    : (reverse ? 'flex-col-reverse' : 'flex-col');
    
  const gapClass = `gap-${spacing}`;
  
  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    baseline: 'items-baseline',
    stretch: 'items-stretch'
  };

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around'
  };

  const wrapClass = wrap ? 'flex-wrap' : 'flex-nowrap';
  const widthClass = fullWidth ? 'w-full' : 'w-auto';

  return (
    <div className={`flex ${moreClasses} ${directionClass} ${gapClass} ${alignClasses[align]} ${justifyClasses[justify]} ${wrapClass} ${widthClass} ${className}`}>
      {children}
    </div>
  );
};
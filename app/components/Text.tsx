
'use client';

import React from 'react';

interface TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p';
  children: React.ReactNode;
  className?: string;
}

export default function Text({ variant = 'p', children, className = '' }: TextProps) {
  const Component = variant;
  return (
    <Component className={`${className}`}>
      {children}
    </Component>
  );
}
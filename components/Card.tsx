import React from 'react';

interface CardProps {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ title, children, action, className = '' }) => {
  return (
    <div className={`bg-surface border border-border rounded-2xl shadow-lg ${className}`}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4 border-b border-border pb-4">
            <h2 className="text-xl font-bold text-text-primary font-display">{title}</h2>
            {action && <div>{action}</div>}
        </div>
        {children}
      </div>
    </div>
  );
};

export default Card;

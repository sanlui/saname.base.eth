
import React from 'react';

interface CardProps {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ title, children, action }) => {
  return (
    <div className="bg-base-light-dark border border-slate-700 rounded-lg shadow-lg overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-3">
            <h2 className="text-xl font-bold text-base-text">{title}</h2>
            {action && <div>{action}</div>}
        </div>
        {children}
      </div>
    </div>
  );
};

export default Card;

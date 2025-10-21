
import React from 'react';

interface CardProps {
  title: string;
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ title, children }) => {
  return (
    <div className="bg-base-light-dark border border-slate-700 rounded-lg shadow-lg overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-bold text-base-text mb-4 border-b border-slate-700 pb-3">{title}</h2>
        {children}
      </div>
    </div>
  );
};

export default Card;

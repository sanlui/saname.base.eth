

import React from 'react';

const FeatureCard = ({ icon, title, children }: { icon: React.ReactNode, title: string, children: React.ReactNode }) => (
  <div className="bg-surface border border-border rounded-xl p-6 text-center transform transition-transform duration-300 hover:-translate-y-1">
    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 mb-4 border border-primary/20">
      {icon}
    </div>
    <h3 className="text-lg font-bold text-text-primary mb-2 font-display">{title}</h3>
    <p className="text-text-secondary text-sm">{children}</p>
  </div>
);

const Features: React.FC = () => {
  return (
    <section className="py-16 md:py-24">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="animate-fade-in" style={{animationDelay: '0.4s'}}>
            <FeatureCard
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                   <title>Rocket icon</title>
                   <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                   <path d="M4 13a8 8 0 0 1 7 7a6 6 0 0 0 3 -5a9 9 0 0 0 6 -8a3 3 0 0 0 -3 -3a9 9 0 0 0 -8 6a6 6 0 0 0 -5 3"></path>
                   <path d="M7 14a6 6 0 0 0 -3 6a6 6 0 0 0 6 -3"></path>
                   <path d="M15 9m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path>
                </svg>
              }
              title="Efficient Deployment"
              children="Deploy your token in minutes. Our streamlined process removes complex steps, leveraging the speed of the Base network."
            />
        </div>
        <div className="animate-fade-in" style={{animationDelay: '0.5s'}}>
            <FeatureCard
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <title>Key icon</title>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                </svg>
              }
              title="Full Ownership"
              children="You control your token. We don't hold your keys or your contracts. Your creation, your rules."
            />
        </div>
        <div className="animate-fade-in" style={{animationDelay: '0.6s'}}>
            <FeatureCard
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <title>Price tag icon</title>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V5c0-1.1.9-2 2-2z" />
                </svg>
              }
              title="Low-Cost Creation"
              children="Built on Base for minimal gas fees. A single, transparent fee to deploy your token. No surprises."
            />
        </div>
      </div>
    </section>
  );
};

export default Features;

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
            {/* FIX: Pass text content as an explicit `children` prop to resolve TypeScript error. */}
            <FeatureCard
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><title>Rocket icon</title><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
              title="Instant Deployment"
              children="Launch your token in seconds. No waiting, no complex steps. Just pure speed on the Base network."
            />
        </div>
        <div className="animate-fade-in" style={{animationDelay: '0.5s'}}>
            {/* FIX: Pass text content as an explicit `children` prop to resolve TypeScript error. */}
            <FeatureCard
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><title>Key icon</title><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H5v-2H3v-2H1v-4a6 6 0 016-6h4a6 6 0 016 6z" /></svg>}
              title="Full Ownership"
              children="You control your token. We don't hold your keys or your contracts. Your creation, your rules."
            />
        </div>
        <div className="animate-fade-in" style={{animationDelay: '0.6s'}}>
            {/* FIX: Pass text content as an explicit `children` prop to resolve TypeScript error. */}
            <FeatureCard
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><title>Price tag icon</title><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>}
              title="Low-Cost Creation"
              children="Built on Base for minimal gas fees. A single, transparent fee to deploy your token. No surprises."
            />
        </div>
      </div>
    </section>
  );
};

export default Features;

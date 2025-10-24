import React from 'react';

const DeployIcon = () => (
    <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <title>Deployment Icon</title>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
    </div>
);

const OwnershipIcon = () => (
    <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <title>Ownership Icon</title>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
    </div>
);

const CostIcon = () => (
    <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <title>Low Cost Icon</title>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 6v-1h4v1m-4 0a3 3 0 00-3 3v1h4v-1a3 3 0 00-1-2.618M12 6a3 3 0 00-3 3v1" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 11a8 8 0 0116 0v1a8 8 0 01-16 0v-1z" />
        </svg>
    </div>
);

const features = [
    { 
        icon: <DeployIcon />, 
        title: "Instant Deployment", 
        description: "Deploy your tokens in minutes. Our streamlined process removes complex steps, leveraging the speed of the Base network." 
    },
    { 
        icon: <OwnershipIcon />, 
        title: "Full Ownership", 
        description: "You control your token. We don't hold your keys or your contracts. Your creation, your rules." 
    },
    { 
        icon: <CostIcon />, 
        title: "Low-Cost & Secure", 
        description: "Built on Base for minimal gas fees. Deploy your secure, audited token with a simple and transparent one-time fee." 
    }
];

const Features: React.FC = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 my-20 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
        {features.map(feature => (
            <div key={feature.title} className="bg-surface/70 border border-border rounded-2xl p-8 text-center flex flex-col items-center transition-all duration-300 hover:border-primary/50 hover:bg-surface transform hover:-translate-y-2">
                {feature.icon}
                <h3 className="text-xl font-bold text-text-primary mt-6 mb-2">{feature.title}</h3>
                <p className="text-text-secondary">{feature.description}</p>
            </div>
        ))}
    </div>
);

export default Features;
